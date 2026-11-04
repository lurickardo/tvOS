// Cadastra a TV do .env (TV_IP) como dispositivo "tv" no ares e busca a chave SSH do Developer Mode.
// A passphrase é pedida pelo próprio ares-novacom, no seu terminal: nunca passa por arquivo nem argumento.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const ip = (process.env.TV_IP || '').trim();
if (!/^(\d{1,3})(\.\d{1,3}){3}$/.test(ip)) {
  console.error('TV_IP ausente ou inválido no .env (ex.: TV_IP=192.168.0.50). Veja .env.example.');
  process.exit(1);
}

const ares = (cmd, args, opts = {}) =>
  execFileSync(process.execPath, [`node_modules/@webos-tools/cli/bin/${cmd}.js`, ...args], { stdio: 'inherit', ...opts });

const device = { host: ip, port: '9922', username: 'prisoner' };
const list = execFileSync(process.execPath, ['node_modules/@webos-tools/cli/bin/ares-setup-device.js', '-l'], { encoding: 'utf8' });
if (/^\s*tv\s/m.test(list)) ares('ares-setup-device', ['-m', 'tv', '-i', JSON.stringify(device)]);
else ares('ares-setup-device', ['-a', 'tv', '-i', JSON.stringify({ ...device, default: true })]);

console.log('\nDigite a passphrase mostrada no app Developer Mode da TV (Key Server precisa estar ON):');
ares('ares-novacom', ['-d', 'tv', '--getkey']);
ares('ares-device', ['-i', '-d', 'tv']);
console.log('\nPronto. Agora desligue o Key Server na TV e rode: npm run tv:install');
