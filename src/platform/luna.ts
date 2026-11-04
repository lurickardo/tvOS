// Ponte com o barramento Luna do webOS. Adaptado de luna() em simbasjungles/free-my-tv
// (web/tv.js, MIT — THIRD_PARTY_NOTICES.md). Fora da TV (navegador do PC) toda chamada responde null.

interface PalmBridge {
  onservicecallback: (message: string) => void;
  call(uri: string, params: string): void;
  cancel(): void;
}

interface PalmWindow extends Window {
  PalmServiceBridge?: new () => PalmBridge;
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
    bridge.onservicecallback = (message) => finish(parse(message));
    bridge.call(uri, JSON.stringify(params));
  });
}

function parse(message: string): LunaResult | null {
  let result: LunaResult | null = null;
  try {
    result = JSON.parse(message) as LunaResult;
  } catch (e) {
    // resposta malformada = falha
  }
  return result && result.returnValue !== false ? result : null;
}

/** Assinatura Luna (subscribe: true): `on` a cada resposta, null em erro. Devolve a função que cancela. */
export function lunaSubscribe(uri: string, params: object, on: (result: LunaResult | null) => void): () => void {
  const Bridge = palm.PalmServiceBridge;
  if (!Bridge) { on(null); return () => undefined; }
  const bridge = new Bridge();
  pending.push(bridge);
  bridge.onservicecallback = (message) => on(parse(message));
  bridge.call(uri, JSON.stringify({ ...params, subscribe: true }));
  return () => {
    bridge.cancel();
    pending.splice(pending.indexOf(bridge), 1);
  };
}
