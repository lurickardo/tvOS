/*
 * Serviço do tvOS no barramento Luna: métricas de /proc e as ações de sistema que a página não pode
 * fazer (desinstalar app, fechar o webOS da LG).
 * Elevado pelo Homebrew Channel (ADR 0007: `npm run tv:root -- elevate`, refeito a cada boot).
 * Node 0.12.2 no webOS TV 4.x: só ES5 (sem const/let, arrow, template string, Buffer.from) e módulos
 * nativos + webos-service (do sistema). Molde: webos/service/service.js de simbasjungles/free-my-tv
 * (MIT — THIRD_PARTY_NOTICES.md). Métodos em allowlist; todo parâmetro vindo da página é validado
 * contra lista ou formato fixo antes de virar chamada Luna.
 */
'use strict';
var fs = require('fs');
var Service = require('webos-service');

var service = new Service(require('./package.json').name);

function readCpu() {
  // Primeira linha de /proc/stat: "cpu user nice system idle iowait irq softirq steal ..."
  var fields = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0].trim().split(/\s+/).slice(1).map(Number);
  var idle = fields[3] + (fields[4] || 0);
  var total = fields.reduce(function (a, b) { return a + b; }, 0);
  return { idle: idle, total: total };
}

function readMem() {
  var info = {};
  fs.readFileSync('/proc/meminfo', 'utf8').split('\n').forEach(function (line) {
    var m = /^(\w+):\s+(\d+)/.exec(line);
    if (m) info[m[1]] = Number(m[2]);
  });
  var total = info.MemTotal;
  var available = info.MemAvailable !== undefined ? info.MemAvailable : info.MemFree + (info.Cached || 0);
  return { memTotalKb: total, memUsedKb: total - available };
}

var timers = {};

// Assinatura (subscribe: true) = um processo vivo respondendo a cada `interval` ms; sem ela, cada
// chamada subia um Node novo na TV (medido: PID novo a cada poll de 10 s). Sem subscribe: uma resposta.
service.register('stats', function (message) {
  var prev;
  try {
    prev = readCpu();
  } catch (e) {
    message.respond({ returnValue: false, errorText: 'Sem acesso a /proc/stat' });
    return;
  }
  // CPU % = diferença entre a amostra anterior e a atual (a primeira vem 250 ms depois).
  var tick = function () {
    try {
      var cur = readCpu();
      var total = cur.total - prev.total;
      var busy = total - (cur.idle - prev.idle);
      var mem = readMem();
      prev = cur;
      message.respond({
        returnValue: true,
        cpuPercent: total > 0 ? (busy / total) * 100 : 0,
        memUsedKb: mem.memUsedKb,
        memTotalKb: mem.memTotalKb
      });
    } catch (e) {
      message.respond({ returnValue: false, errorText: 'Sem acesso a /proc' });
    }
  };
  setTimeout(tick, 250);
  if (!message.isSubscription) return;
  // Único parâmetro aceito, limitado a 2–60 s.
  var every = Math.min(60000, Math.max(2000, Number(message.payload && message.payload.interval) || 10000));
  timers[message.uniqueToken] = setInterval(tick, every);
}, function (message) {
  clearInterval(timers[message.uniqueToken]);
  delete timers[message.uniqueToken];
});

function call(uri, params, cb) {
  service.call(uri, params, function (m) { cb(m.payload || {}); });
}

function reply(message) {
  return function (r) { message.respond(r.returnValue === false ? { returnValue: false, errorText: r.errorText || 'Falhou' } : { returnValue: true }); };
}

// Desinstalar: só app de loja; sistema, Homebrew e o próprio tvOS ficam de fora.
var APP_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{1,120}$/;
var PROTECTED = /^(com\.webos\.|com\.palm\.|com\.lge\.|com\.lurickardo\.|org\.webosbrew\.)/;

service.register('uninstall', function (message) {
  var id = String((message.payload || {}).id || '');
  if (!APP_ID.test(id) || PROTECTED.test(id)) { message.respond({ returnValue: false, errorText: 'App protegido' }); return; }
  call('luna://com.webos.appInstallService/remove', { id: id }, reply(message));
});

// O webOS da LG é aberto como app pelo tvOS; ao voltar, sai da memória (~66 MB).
service.register('closeLgHome', function (message) {
  call('luna://com.webos.applicationManager/closeByAppId', { id: 'com.webos.app.fullhome' }, reply(message));
});
