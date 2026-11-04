/*
 * Serviço do tvOS no barramento Luna: métricas do sistema lidas de /proc para o painel do app.
 * Node 8.12 no webOS TV 6: ES2017 no máximo (sem ?. ??), só módulos nativos + webos-service (do sistema).
 * Molde: webos/service/service.js de simbasjungles/free-my-tv (MIT — THIRD_PARTY_NOTICES.md).
 * Métodos em allowlist: só `stats`, sem parâmetros vindos do app.
 */
'use strict';
const fs = require('fs');
const Service = require('webos-service');

const service = new Service(require('./package.json').name);

function readCpu() {
  // Primeira linha de /proc/stat: "cpu user nice system idle iowait irq softirq steal ..."
  const fields = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0].trim().split(/\s+/).slice(1).map(Number);
  const idle = fields[3] + (fields[4] || 0);
  const total = fields.reduce((a, b) => a + b, 0);
  return { idle, total };
}

function readMem() {
  const info = {};
  fs.readFileSync('/proc/meminfo', 'utf8').split('\n').forEach((line) => {
    const m = /^(\w+):\s+(\d+)/.exec(line);
    if (m) info[m[1]] = Number(m[2]);
  });
  const total = info.MemTotal;
  const available = info.MemAvailable !== undefined ? info.MemAvailable : info.MemFree + (info.Cached || 0);
  return { memTotalKb: total, memUsedKb: total - available };
}

service.register('stats', (message) => {
  let first;
  try {
    first = readCpu();
  } catch (e) {
    message.respond({ returnValue: false, errorText: 'Sem acesso a /proc/stat' });
    return;
  }
  // Duas amostras com 250 ms de intervalo: CPU % sem guardar estado entre chamadas.
  setTimeout(() => {
    try {
      const second = readCpu();
      const total = second.total - first.total;
      const busy = total - (second.idle - first.idle);
      const mem = readMem();
      message.respond({
        returnValue: true,
        cpuPercent: total > 0 ? (busy / total) * 100 : 0,
        memUsedKb: mem.memUsedKb,
        memTotalKb: mem.memTotalKb,
      });
    } catch (e) {
      message.respond({ returnValue: false, errorText: 'Sem acesso a /proc' });
    }
  }, 250);
});
