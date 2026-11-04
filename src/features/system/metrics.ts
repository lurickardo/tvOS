import { luna } from '../../platform/luna';

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

/** Pede as métricas a cada `intervalMs`; null = indisponível (PC, serviço fora, /proc negado). Devolve a função que para. */
export function watchStats(onStats: (stats: SystemStats | null) => void, intervalMs = 2000): () => void {
  let stopped = false;
  let timer = 0;
  const poll = () => {
    luna(SERVICE, {}, 3000).then((r) => {
      if (stopped) return;
      onStats(isStats(r) ? r : null);
      timer = window.setTimeout(poll, intervalMs);
    });
  };
  poll();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}
