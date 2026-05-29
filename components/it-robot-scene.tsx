'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

const SCENE_URL = '/3d/robot.splinecode'

export default function ITRobotScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  function handleLoad(spline: any) {
    // Spline caches domRect once at init from canvas.getBoundingClientRect().
    // The canvas covers only the right portion of the viewport, so eye tracking
    // maps to canvas edges, not the full screen. Override with full viewport so
    // mte() normalizes against window dimensions instead.
    spline.domRect = new DOMRect(0, 0, window.innerWidth, window.innerHeight)
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const canvas = containerRef.current?.querySelector('canvas')
      if (!canvas) return
      // Spline listens on the canvas element by default, so mouse events outside
      // the canvas bounds never reach it. Relay all window events to the canvas.
      canvas.dispatchEvent(
        new MouseEvent('mousemove', { clientX: e.clientX, clientY: e.clientY, bubbles: false })
      )
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-visible">
      <Spline
        scene={SCENE_URL}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        onLoad={handleLoad}
      />
    </div>
  )
}
