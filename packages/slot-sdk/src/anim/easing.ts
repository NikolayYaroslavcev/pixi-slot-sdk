/** Maps animation progress 0..1 to eased progress, usually also 0..1. */
export type Easing = (progress: number) => number;

export const linear: Easing = (progress) => progress;

export const easeInQuad: Easing = (progress) => progress * progress;

export const easeOutQuad: Easing = (progress) => 1 - (1 - progress) ** 2;

export const easeInOutQuad: Easing = (progress) =>
  progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;

export const easeOutCubic: Easing = (progress) => 1 - (1 - progress) ** 3;

/** Overshoots the end a little and settles back: a pop for something that appears. */
export const easeOutBack: Easing = (progress) => {
  const overshoot = 1.70158;
  const shifted = progress - 1;
  return 1 + (overshoot + 1) * shifted ** 3 + overshoot * shifted ** 2;
};
