export function createTimer({ seconds, onTick, onDone }) {
  let left = Number.parseInt(seconds, 10) || 0;
  let interval = null;

  return {
    start() {
      this.stop();
      onTick?.(left);
      interval = setInterval(() => {
        left -= 1;
        onTick?.(left);
        if (left <= 0) {
          this.stop();
          onDone?.();
        }
      }, 1000);
    },
    stop() {
      clearInterval(interval);
      interval = null;
    },
    getLeft() {
      return left;
    }
  };
}
