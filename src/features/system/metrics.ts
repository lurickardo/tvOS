import { lunaSubscribe } from '../../platform/luna';

const SERVICE = 'luna://com.lurickardo.tvos.service/stats';

/** CPU em % e memória em KB, como o serviço (service/index.js) lê de /proc. */
export interface SystemStats {
  cpuPercent: number;
  memUsedKb: number;
  memTotalKb: number;
}

function isStats(r: Record<string, unknown> | null): r is Record<string, unknown> & SystemStats {
  return !!r && typeof r.cpuPercent === 'number' && typeof r.memUsedKb === 'number' && typeof r.memTotalKb === 'number';
}

/** Assina as métricas a cada `intervalMs` (um processo do serviço vivo); null = indisponível (PC, serviço fora, /proc negado). Devolve a função que para. */
export function watchStats(onStats: (stats: SystemStats | null) => void, intervalMs = 2000): () => void {
  return lunaSubscribe(SERVICE, { interval: intervalMs }, (r) => onStats(isStats(r) ? r : null));
}
