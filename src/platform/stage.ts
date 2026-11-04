// Palco fluido: altura lógica de 1080 e largura que acompanha a janela (mínimo 1600, para telas mais
// "altas" que 16:10). O palco é escalado para preencher a janela inteira, sem faixas. Valores lógicos
// em CSS: --H (altura), --mx (margem lateral: o conteúdo fica num quadro de até 1768 de largura,
// centralizado).
const DESIGN_H = 1080;
const MIN_W = 1600;
const FRAME_W = 1768;
const MARGIN = 76;

export function fitStage(stage: HTMLElement): void {
  const fit = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = vw / vh >= MIN_W / DESIGN_H ? vh / DESIGN_H : vw / MIN_W;
    const width = vw / scale;
    const height = vh / scale;
    const style = stage.style;
    style.width = `${width}px`;
    style.height = `${height}px`;
    style.transform = `scale(${scale})`;
    style.setProperty('--H', `${height}px`);
    style.setProperty('--mx', `${Math.max(MARGIN, (width - FRAME_W) / 2)}px`);
  };
  fit();
  window.addEventListener('resize', fit);
}
