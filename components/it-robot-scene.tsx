'use client'

import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

const SCENE_URL = '/3d/robot.splinecode'

export default function ITRobotScene() {
  return (
    <div className="w-full h-80 sm:h-96 lg:h-[min(520px,65vh)] xl:h-[min(600px,70vh)] 2xl:h-175 relative overflow-visible">
      <Spline
        scene={SCENE_URL}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
