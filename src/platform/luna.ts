// Ponte com o barramento Luna do webOS. Adaptado de luna() em simbasjungles/free-my-tv
// (web/tv.js, MIT — THIRD_PARTY_NOTICES.md). Fora da TV (navegador do PC) toda chamada responde null.

interface PalmBridge {
  onservicecallback: (message: string) => void;
  call(uri: string, params: string): void;
  cancel(): void;
}

interface PalmWindow extends Window {
  PalmServiceBridge?: new () => PalmBridge;
  PalmSystem?: { platformBack?: () => void };
}

const palm = window as PalmWindow;

export const isWebOS = typeof palm.PalmServiceBridge !== 'undefined';

// A bridge é coletada pelo GC se ninguém a segura até a resposta chegar.
const pending: PalmBridge[] = [];

export type LunaResult = Record<string, unknown> & { returnValue?: boolean };

/** Uma chamada Luna; resolve null em falha, erro do serviço ou timeout. */
export function luna(uri: string, params: object = {}, timeoutMs = 8000): Promise<LunaResult | null> {
  const Bridge = palm.PalmServiceBridge;
  if (!Bridge) return Promise.resolve(null);
  return new Promise((resolve) => {
    const bridge = new Bridge();
    pending.push(bridge);
    let finished = false;
    const finish = (result: LunaResult | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      pending.splice(pending.indexOf(bridge), 1);
      resolve(result);
    };
    const timer = setTimeout(() => {
      bridge.cancel();
      finish(null);
    }, timeoutMs);
    bridge.onservicecallback = (message) => {
      let result: LunaResult | null = null;
      try {
        result = JSON.parse(message) as LunaResult;
      } catch (e) {
        // resposta malformada = falha
      }
      finish(result && result.returnValue !== false ? result : null);
    };
    bridge.call(uri, JSON.stringify(params));
  });
}

/** Voltar na tela raiz: devolve o controle ao webOS (fecha/minimiza o app). */
export function exitApp(): void {
  if (palm.PalmSystem && palm.PalmSystem.platformBack) palm.PalmSystem.platformBack();
  else window.close();
}
