export const CHAT_EASE = [0.4, 0, 0.2, 1] as const;

export const chatFadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, delay, ease: CHAT_EASE },
});

export const chatFadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.18, delay, ease: CHAT_EASE },
});

export const chatSlidePanel = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
  transition: { duration: 0.2, ease: CHAT_EASE },
};
