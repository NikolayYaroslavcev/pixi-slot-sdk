/** Keys that press Spin, as on most slot sites. */
const spinKeys = new Set(['Space', 'Enter']);

/**
 * Calls `press` when Space or Enter goes down, unless `blocked()` says the keys belong to
 * something else now, e.g. an open popup. A held key repeats: one press is one Spin, not a new
 * round every few frames.
 */
export function listenForSpinKeys(press: () => void, blocked: () => boolean): void {
  window.addEventListener('keydown', (event) => {
    if (!spinKeys.has(event.code) || event.repeat || blocked()) {
      return;
    }
    event.preventDefault();
    press();
  });
}
