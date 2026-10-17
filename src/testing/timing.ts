export function fastestMs(action: () => void, runs = 7): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    action();
    best = Math.min(best, performance.now() - start);
  }
  return best;
}
