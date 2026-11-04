import { appForProviders, launchApp } from '../apps/apps';
import { toast } from '../../ui/toast';
import { fetchDetail, Title } from './tmdb';

/** OK num título: abre o app instalado que o serve no Brasil (deep link direto fica fora do escopo). */
export function openTitle(title: Title): void {
  let handled = false;
  fetchDetail(title, (detail) => {
    if (handled) return;
    handled = true;
    const app = appForProviders(detail.providers.map((p) => p.id));
    if (app) { toast(`Abrindo ${app.title} — procure por ${title.name}`); launchApp(app.id, app.title); }
    else if (detail.providers.length) toast(`${title.name} está no ${detail.providers[0].name}, que não está instalado`);
    else toast(`${title.name} não está em streaming no Brasil`);
  }).catch(() => toast('Sem conexão para ver onde assistir'));
}
