// Cadastra a TV rootada do .env (TV_IP) como dispositivo "tv-root" no ares: SSH root na porta 22 com a
// chave ~/.ssh/tvos_root_key (ADR 0007; o Developer Mode não existe mais). Idempotente.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const ip = (process.env.TV_IP || '').trim();
if (!/^(\d{1,3})(\.\d{1,3}){3}$/.test(ip)) {
  console.error('TV_IP ausente ou inválido no .env (ex.: TV_IP=192.168.0.50). Veja .env.example.');
  process.exit(1);
}

const bin = (cmd) => `node_modules/@webos-tools/cli/bin/${cmd}.js`;
const run = (cmd, args) => execFileSync(process.execPath, [bin(cmd), ...args], { encoding: 'utf8', stdio: 'pipe' });

// privatekey = nome do arquivo em ~/.ssh (o ares não aceita caminho absoluto).
const device = { host: ip, port: '22', username: 'root', privatekey: 'tvos_root_key', default: true };
const exists = /^\s*tv-root\s/m.test(run('ares-setup-device', ['-l']));
run('ares-setup-device', exists ? ['-m', 'tv-root', '-i', JSON.stringify(device)] : ['-a', 'tv-root', '-i', JSON.stringify(device)]);
console.log(`Dispositivo "tv-root" → root@${ip}:22`);

try {
  console.log('\nConectado:\n' + run('ares-device', ['-i', '-d', 'tv-root']).replace(/^\[Info\].*\n/m, ''));
  console.log('Pronto. Rode: npm run tv:install');
} catch (e) {
  console.error('\nA TV não respondeu. Confira se está ligada (SSH cai em standby), o TV_IP e a chave ~/.ssh/tvos_root_key.');
  process.exit(1);
}
