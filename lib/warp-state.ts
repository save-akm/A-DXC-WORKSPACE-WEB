/**
 * Warp State — Mutable bridge between GSAP ScrollTrigger (DOM) and R3F (Canvas)
 *
 * Why a plain object instead of Zustand/useState?
 * → React state causes re-renders. This value is read 60× per second inside
 *   useFrame — a mutable ref avoids React overhead entirely.
 *
 * GSAP ScrollTrigger writes → R3F useFrame reads → zero re-renders.
 */
export const warpState = {
  /** 0 = Hero visible (idle), 1 = App Hub fully revealed */
  progress: 0,
};
