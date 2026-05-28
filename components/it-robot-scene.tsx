'use client'

import { Suspense, lazy } from 'react'

const Spline = lazy(() => import('@splinetool/react-spline'))

const SCENE_URL = 'https://prod.spline.design/C5kofxMJPqbr9xgFSK2Z2yct/scene.splinecode'

function RobotSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full border-2 border-sky-400/30 border-t-sky-400 animate-spin" />
    </div>
  )
}

export default function ITRobotScene() {
  return (
    <div className="h-65 sm:h-75 lg:h-82.5 2xl:h-125 w-full relative overflow-hidden rounded-2xl">
      {/* Ambient glow — dark mode only */}
      <div className="absolute inset-0 rounded-2xl bg-sky-500/5 dark:bg-sky-400/10 blur-2xl opacity-0 dark:opacity-100 pointer-events-none z-10" />
      {/* Border ring */}
      <div className="absolute inset-0 rounded-2xl border border-sky-500/10 dark:border-cyan-400/15 pointer-events-none z-10" />
      <Suspense fallback={<RobotSkeleton />}>
        <Spline
          scene={SCENE_URL}
          className="w-full h-full"
        />
      </Suspense>
    </div>
  )
}
