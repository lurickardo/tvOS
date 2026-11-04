/*
 * Ferramenta root do tvOS, roda NA TV com /usr/bin/node (0.12: só ES5). ADR 0007.
 *   apply   — uma vez: tvOS vira a home, debloat persistente (settings, preload) e hook de boot.
 *             Na primeira vez guarda os valores originais em orig.json (o restore volta a eles).
 *   boot    — a cada boot frio (hook do Homebrew): hosts sem anúncio/telemetria, para daemons e abre o tvOS.
 *   status  — o que está aplicado + memória, swap, carga e maiores processos.
 *   restore — desfaz tudo e devolve a home da LG (reboot recomendado depois).
 *   elevate — eleva o service do tvOS (toda instalação desfaz; o boot refaz).
 * Nunca escreve em rootfs nem usa chattr: só settings Luna, /var e bind mount de arquivo em /tmp.
 */
'use strict';
var fs = require('fs');
var exec = require('child_process').exec;

var DIR = '/var/lib/webosbrew/tvos';
var ORIG = DIR + '/orig.json';
var HOOK = '/var/lib/webosbrew/init.d/50-tvos';
var BLOCK_UPDATES = '/var/luna/preferences/webosbrew_block_updates';
var APP = 'com.lurickardo.tvos';
var LG_HOME = 'com.webos.app.fullhome';
// Preload zero (ADR 0009): nenhum app fica pré-carregado na RAM nem volta por CRIU a cada ligar. Só
// isEnabled não basta: app com isPinUp (Netflix) é relançado mesmo assim, e maxPreloadApp limita o resto.
var PRELOAD_KEY = 'com.webos.service.preloadmanager.supportAppList';
var MAX_PRELOAD_KEY = 'com.webos.service.preloadmanager.maxPreloadApp';
// Parados a cada boot: telemetria/ACR, voz e espelhamento/DLNA (não usados). Núcleo do sistema, Ginga,
// ThinQ/IoT e teclado virtual (busca) nunca entram aqui.
var JOBS = ['rdxd', 'uploadd', 'contentminer', 'nudge', 'voiceconductor', 'voiceinput', 'miracast', 'dmr'];
var EULA_OFF = ['acrOnAllowed', 'acrAdAllowed', 'customAdAllowed', 'chpAllowed', 'voiceAllowed', 'voice2Allowed', 'additionalDataAllowed'];
var OPTION_OFF = ['webOSPromotionVideo', 'channelplus'];
var MARK = '# tvOS blocklist';
var ELEVATE = '/media/developer/apps/usr/palm/services/org.webosbrew.hbchannel.service/elevate-service';

function log(message) { console.log(new Date().toTimeString().slice(0, 8) + ' ' + message); }

// stdin fora do ssh: sem isso o luna-send não imprime a resposta.
function run(cmd, cb) {
  exec('(' + cmd + ') </dev/null', { timeout: 20000 }, function (err, out) { cb(err, String(out || '')); });
}

function luna(uri, params, cb) {
  run('luna-send -n 1 -w 8000 ' + uri + " '" + JSON.stringify(params) + "'", function (err, out) {
    var result = null;
    try { result = JSON.parse(out); } catch (e) { /* sem resposta */ }
    cb(result && result.returnValue !== false ? result : null);
  });
}

function series(steps, done) {
  var i = 0;
  (function next() { if (i < steps.length) steps[i++](next); else if (done) done(); })();
}

function getSettings(category, keys, cb) {
  var params = { keys: keys };
  if (category) params.category = category;
  luna('luna://com.webos.settingsservice/getSystemSettings', params, function (r) { cb(r ? r.settings : null); });
}

function setSettings(category, settings, label) {
  return function (next) {
    var params = { settings: settings };
    if (category) params.category = category;
    luna('luna://com.webos.settingsservice/setSystemSettings', params, function (r) { log(label + (r ? ' ok' : ' FALHOU')); next(); });
  };
}

function getConfig(key, cb) {
  luna('luna://com.webos.service.config/getConfigs', { configNames: [key] }, function (r) {
    cb(r && r.configs ? r.configs[key] : undefined);
  });
}

function setConfig(key, value, label) {
  return function (next) {
    if (value === undefined || value === null) { log(label + ' sem valor'); next(); return; }
    var configs = {};
    configs[key] = value;
    luna('luna://com.webos.service.config/setConfigs', { configs: configs }, function (r) { log(label + (r ? ' ok' : ' FALHOU')); next(); });
  };
}

function readOrig() {
  try { return JSON.parse(fs.readFileSync(ORIG, 'utf8')); } catch (e) { return null; }
}

/** Guarda o estado de fábrica uma única vez: rodar apply de novo nunca sobrescreve o original. */
function saveOrig(done) {
  var saved = readOrig();
  if (saved && 'maxPreload' in saved) { done(); return; }
  if (saved) { // orig.json de antes do ADR 0009: só acrescenta o maxPreloadApp de fábrica
    getConfig(MAX_PRELOAD_KEY, function (n) { saved.maxPreload = n === undefined ? null : n; fs.writeFileSync(ORIG, JSON.stringify(saved, null, 1)); done(); });
    return;
  }
  var orig = { blockUpdatesCreated: !fs.existsSync(BLOCK_UPDATES) };
  series([
    function (next) { getSettings('general', ['defaultApps', 'homeAutoLaunch'], function (s) { orig.general = s; next(); }); },
    function (next) { getSettings('option', OPTION_OFF, function (s) { orig.option = s; next(); }); },
    function (next) { getSettings('', ['eulaStatus'], function (s) { orig.eula = s; next(); }); },
    function (next) { getConfig(PRELOAD_KEY, function (list) { orig.preload = list; next(); }); },
    function (next) { getConfig(MAX_PRELOAD_KEY, function (n) { orig.maxPreload = n === undefined ? null : n; next(); }); },
  ], function () {
    // A home original nunca é o tvOS (apply já rodou antes sem orig.json): volta a fullhome no restore.
    if (orig.general && orig.general.defaultApps) orig.general.defaultApps.home = LG_HOME;
    fs.writeFileSync(ORIG, JSON.stringify(orig, null, 1));
    log('originais salvos em ' + ORIG);
    done();
  });
}

function apply() {
  saveOrig(function () {
    var orig = readOrig() || {};
    var eula = {};
    var current = (orig.eula && orig.eula.eulaStatus) || {};
    Object.keys(current).forEach(function (k) { eula[k] = EULA_OFF.indexOf(k) >= 0 ? false : current[k]; });
    var option = {};
    OPTION_OFF.forEach(function (k) { option[k] = 'off'; });
    var preload = (orig.preload || []).map(function (app) {
      var copy = JSON.parse(JSON.stringify(app));
      copy.isEnabled = false;
      if (copy.isPinUp) copy.isPinUp = false;
      return copy;
    });
    series([
      setSettings('general', { defaultApps: { home: APP }, homeAutoLaunch: 'on' }, 'tvOS como home'),
      setSettings('option', option, 'promoções e LG Channels off'),
      Object.keys(eula).length ? setSettings('', { eulaStatus: eula }, 'consentimentos de ACR/anúncio/voz off') : function (next) { next(); },
      setConfig(PRELOAD_KEY, orig.preload ? preload : null, 'preload zero'),
      setConfig(MAX_PRELOAD_KEY, 0, 'maxPreloadApp 0'),
      function (next) {
        fs.writeFileSync(BLOCK_UPDATES, '');
        fs.writeFileSync(HOOK, '#!/bin/sh\n# tvOS (ADR 0007): em segundo plano para nunca segurar o boot.\n'
          + '/usr/bin/node ' + DIR + '/tvos-root.js boot > /tmp/tvos-root.log 2>&1 &\nexit 0\n');
        fs.chmodSync(HOOK, 493); // 0755
        log('updates bloqueados e hook de boot instalado');
        next();
      },
    ], function () { boot(true); });
  });
}

function mountHosts(next) {
  var block;
  try { block = fs.readFileSync(DIR + '/hosts.block', 'utf8'); } catch (e) { log('hosts.block ausente'); next(); return; }
  var hosts = fs.readFileSync('/etc/hosts', 'utf8');
  if (hosts.indexOf(MARK) >= 0) { log('hosts já bloqueado'); next(); return; }
  fs.writeFileSync('/tmp/tvos-hosts', hosts + '\n' + MARK + '\n' + block);
  run('mount --bind /tmp/tvos-hosts /etc/hosts', function (err) { log('hosts ' + (err ? 'FALHOU' : 'bloqueado')); next(); });
}

function stopJobs(next) {
  run('initctl list', function (err, out) {
    var running = JOBS.filter(function (job) { return out.indexOf('\n' + job + ' start/') >= 0 || out.indexOf(job + ' start/') === 0; });
    if (!running.length) { log('daemons já parados'); next(); return; }
    run(running.map(function (job) { return 'initctl stop ' + job; }).join('; '), function () { log('parados: ' + running.join(' ')); next(); });
  });
}

// O que a LG abre sozinha no boot; app que a pessoa já abriu (ex.: Netflix) fica.
var BOOT_APPS = /^com\.webos\.app\.(livetv|hdmi\d|fullhome|home|inputcommon)$/;

/** Boot frio: a LG abre a TV ao vivo/última entrada; troca pelo tvOS. */
function front(next) {
  luna('luna://com.webos.applicationManager/getForegroundAppInfo', {}, function (r) {
    if (r && r.appId && !BOOT_APPS.test(r.appId)) { log('em frente: ' + r.appId); next(); return; }
    luna('luna://com.webos.applicationManager/launch', { id: APP }, function (ok) { log('abre tvOS ' + (ok ? 'ok' : 'FALHOU')); next(); });
  });
}

/** O service do tvOS faz ajustes, só áudio, Bluetooth etc.: precisa ser elevado (toda instalação desfaz). */
function elevate(next) {
  run(ELEVATE + ' com.lurickardo.tvos.service', function (err) { log('service elevado ' + (err ? 'FALHOU' : 'ok')); if (next) next(); });
}

// Barra da home antiga da LG: sobe no boot (snapshot), fica ~30 MB residente e não é usada — o webOS
// da LG abre como app (fullhome) pelo tvOS. Morta, não volta sozinha (medido).
function killLgBar(next) {
  run('kill $(pidof com.webos.app.home) 2>/dev/null', function () { log('barra da LG fora da memória'); next(); });
}

function boot(skipFront) {
  series([mountHosts, stopJobs, elevate, killLgBar].concat(skipFront ? [] : [front]), function () { log('boot pronto'); });
}

function status() {
  var orig = readOrig();
  log('orig.json: ' + (orig ? 'sim' : 'não') + ' · hook: ' + (fs.existsSync(HOOK) ? 'sim' : 'não')
    + ' · updates bloqueados: ' + (fs.existsSync(BLOCK_UPDATES) ? 'sim' : 'não'));
  series([
    function (next) { getSettings('general', ['defaultApps', 'homeAutoLaunch'], function (s) { log('general: ' + JSON.stringify(s)); next(); }); },
    function (next) {
      getConfig(PRELOAD_KEY, function (list) {
        log('preload ligado: ' + (list || []).filter(function (a) { return a.isEnabled || a.isPinUp; }).map(function (a) { return a.id; }).join(' '));
        getConfig(MAX_PRELOAD_KEY, function (n) { log('maxPreloadApp: ' + n); next(); });
      });
    },
    function (next) {
      run("grep -c '^0.0.0.0' /etc/hosts; initctl list | grep -E '^(" + JOBS.join('|') + ") '; uptime; free"
        + "; awk '/^Name/{n=$2} /^VmRSS/{r=$2} /^VmSwap/{print r, $2, n}' /proc/[0-9]*/status 2>/dev/null | sort -rn | head -12", function (err, out) {
        console.log('hosts bloqueados / daemons / carga / memória / top RSS(KB) swap(KB):\n' + out);
        next();
      });
    },
    function (next) { luna('luna://com.webos.applicationManager/getForegroundAppInfo', {}, function (r) { log('em frente: ' + (r ? r.appId : '?')); next(); }); },
  ]);
}

function restore() {
  var orig = readOrig();
  if (!orig) { log('sem orig.json: nada a desfazer'); return; }
  var eula = orig.eula && orig.eula.eulaStatus;
  series([
    setSettings('general', orig.general || { defaultApps: { home: LG_HOME }, homeAutoLaunch: 'on' }, 'home da LG de volta'),
    orig.option ? setSettings('option', orig.option, 'opções originais') : function (next) { next(); },
    eula ? setSettings('', { eulaStatus: eula }, 'consentimentos originais') : function (next) { next(); },
    setConfig(PRELOAD_KEY, orig.preload, 'preload original'),
    setConfig(MAX_PRELOAD_KEY, orig.maxPreload, 'maxPreloadApp original'),
    function (next) {
      try { fs.unlinkSync(HOOK); } catch (e) { /* já removido */ }
      if (orig.blockUpdatesCreated) { try { fs.unlinkSync(BLOCK_UPDATES); } catch (e) { /* já removido */ } }
      run(JOBS.map(function (job) { return 'initctl start ' + job; }).join('; '), function () { next(); });
    },
  ], function () {
    fs.unlinkSync(ORIG);
    log('restaurado; reinicie a TV (reboot) para soltar o hosts e recarregar o preload');
  });
}

var commands = { apply: apply, boot: function () { boot(false); }, status: status, restore: restore, elevate: function () { elevate(); } };
var command = commands[process.argv[2]];
if (command) command();
else console.log('uso: node tvos-root.js apply|boot|status|restore|elevate');
