/** Conta quadros por requestAnimationFrame e entrega o FPS a cada segundo. Devolve a função que para. */
export function watchFps(onFps: (fps: number) => void): () => void {
  let frames = 0;
  let start = performance.now();
  let id = requestAnimationFrame(function tick(now) {
    frames++;
    if (now - start >= 1000) {
      onFps(Math.round((frames * 1000) / (now - start)));
      frames = 0;
      start = now;
    }
    id = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(id);
}
