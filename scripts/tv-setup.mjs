// Cadastra a TV do .env (TV_IP) como dispositivo "tv" no ares e garante a chave SSH do Developer Mode.
// Idempotente: se a conexão já funciona, não pede a chave de novo (o Key Server pode ficar OFF).
// A passphrase é pedida pelo próprio ares-novacom, no seu terminal: nunca passa por arquivo nem argumento.
// Não imprime a lista do ares-setup-device: ela mostra a passphrase guardada.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const ip = (process.env.TV_IP || '').trim();
if (!/^(\d{1,3})(\.\d{1,3}){3}$/.test(ip)) {
  console.error('TV_IP ausente ou inválido no .env (ex.: TV_IP=192.168.0.50). Veja .env.example.');
  process.exit(1);
}

const bin = (cmd) => `node_modules/@webos-tools/cli/bin/${cmd}.js`;
const run = (cmd, args, stdio = 'pipe') =>
  execFileSync(process.execPath, [bin(cmd), ...args], { encoding: 'utf8', stdio });
const tryRun = (cmd, args, stdio) => {
  try {
    return run(cmd, args, stdio);
  } catch (e) {
    return null;
  }
};

const device = { host: ip, port: '9922', username: 'prisoner' };
const exists = /^\s*tv\s/m.test(run('ares-setup-device', ['-l']));
run('ares-setup-device', exists ? ['-m', 'tv', '-i', JSON.stringify(device)] : ['-a', 'tv', '-i', JSON.stringify({ ...device, default: true })]);
console.log(`Dispositivo "tv" → ${ip}:9922`);

let info = tryRun('ares-device', ['-i', '-d', 'tv']);
if (!info) {
  console.log('\nSem chave válida. No app Developer Mode da TV, ligue o Key Server e digite a passphrase mostrada lá:');
  if (tryRun('ares-novacom', ['-d', 'tv', '--getkey'], 'inherit') === null) {
    console.error('\nNão foi possível pegar a chave. Confira: TV ligada e na mesma rede, TV_IP certo, Key Server ON, passphrase atual.');
    process.exit(1);
  }
  info = tryRun('ares-device', ['-i', '-d', 'tv']);
}
if (!info) {
  console.error('\nA TV não respondeu. Confira se está ligada, se o TV_IP está certo e se o Developer Mode não expirou.');
  process.exit(1);
}

console.log('\nConectado:\n' + info.replace(/^\[Info\].*\n/m, ''));
console.log('Pronto. Deixe o Key Server OFF e rode: npm run tv:install');
