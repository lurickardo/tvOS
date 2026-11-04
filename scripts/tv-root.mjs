// Ferramenta root do tvOS (ADR 0007): copia root/ para a TV e roda root/tvos-root.js lá.
// Uso: npm run tv:root -- apply|status|restore|elevate. TV_IP vem do .env; chave em TV_KEY ou ~/.ssh/tvos_root_key.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';

if (existsSync('.env')) process.loadEnvFile('.env');
const ip = (process.env.TV_IP || '').trim();
const key = (process.env.TV_KEY || '').trim() || `${homedir()}/.ssh/tvos_root_key`;
const command = process.argv[2] || 'status';
const dir = '/var/lib/webosbrew/tvos';

if (!ip) { console.error('Defina TV_IP no .env.'); process.exit(1); }
if (!['apply', 'status', 'restore', 'elevate'].includes(command)) { console.error('Uso: npm run tv:root -- apply|status|restore|elevate'); process.exit(1); }

const opts = ['-i', key, '-o', 'IdentitiesOnly=yes', '-o', 'ConnectTimeout=8', '-o', 'StrictHostKeyChecking=accept-new', '-o', 'LogLevel=ERROR'];
const host = `root@${ip}`;
const run = (bin, args) => execFileSync(bin, args, { stdio: 'inherit' });

run('ssh', [...opts, host, `mkdir -p ${dir}`]);
run('scp', ['-q', ...opts, 'root/tvos-root.js', 'root/hosts.block', `${host}:${dir}/`]);
run('ssh', [...opts, host, `/usr/bin/node ${dir}/tvos-root.js ${command}`]);
