// O design é um palco fixo de 1920×1080 (tvos-design-system). Escala para caber na janela do app
// (1280×720 pelo appinfo, ou qualquer tamanho no PC) mantendo a proporção e centralizando.
const STAGE_W = 1920;
const STAGE_H = 1080;

export function fitStage(stage: HTMLElement): void {
  const fit = () => {
    const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    const x = (window.innerWidth - STAGE_W * scale) / 2;
    const y = (window.innerHeight - STAGE_H * scale) / 2;
    stage.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  };
  fit();
  window.addEventListener('resize', fit);
}
