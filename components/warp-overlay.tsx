'use client';

/**
 * WarpOverlay — DOM layers for the warp transition visual effects.
 *
 * Two layers controlled by GSAP ScrollTrigger timeline:
 *   1. #warp-glow  → radial indigo glow that builds during approach phase
 *   2. #warp-flash → full-screen white/indigo flash at peak warp
 *
 * Both start at opacity 0 and are pointer-events-none so they never
 * block user interaction.
 */
export function WarpOverlay() {
  return (
    <>
      {/* Radial glow — builds from center during warp approach */}
      <div
        id="warp-glow"
        className="fixed inset-0 z-30 pointer-events-none opacity-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(129,140,248,0.5) 0%, rgba(99,102,241,0.2) 35%, transparent 70%)',
        }}
      />

      {/* Full-screen flash — peaks at warp climax then fades */}
      <div
        id="warp-flash"
        className="fixed inset-0 z-30 pointer-events-none opacity-0 bg-indigo-500/20 dark:bg-indigo-600/40"
      />
    </>
  );
}
