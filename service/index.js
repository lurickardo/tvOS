/*
 * Serviço do tvOS no barramento Luna: métricas do sistema lidas de /proc para o painel do app.
 * Node 0.12.2 no webOS TV 4.x: só ES5 (sem const/let, arrow, template string, Buffer.from) e módulos
 * nativos + webos-service (do sistema). Molde: webos/service/service.js de simbasjungles/free-my-tv
 * (MIT — THIRD_PARTY_NOTICES.md). Métodos em allowlist: só `stats`, com `interval` (número limitado) como único parâmetro.
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
