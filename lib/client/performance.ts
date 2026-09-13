export function gamePerf(event: string, milliseconds: number) {
  if (process.env.NODE_ENV !== "production") console.debug(`[Judgement latency] ${event}: ${milliseconds.toFixed(1)}ms`);
}
