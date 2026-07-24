import { useCallback, useRef } from 'react'
import type { DrawingAction, Point } from '../utils/drawing'
import { renderAction, drawGrid } from '../utils/drawing'

interface RenderOptions {
  zoom: number
  pan: Point
  showGrid: boolean
}

export function useCanvasDrawing() {
  const dprRef = useRef(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)

  const getCanvas = useCallback((canvas: HTMLCanvasElement): CanvasRenderingContext2D | null => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    return ctx
  }, [])

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    },
    [],
  )

  const clearCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = getCanvas(canvas)
      if (!ctx) return
      const dpr = dprRef.current
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    },
    [getCanvas],
  )

  const renderFrame = useCallback(
    (
      canvas: HTMLCanvasElement,
      actions: DrawingAction[],
      currentAction: DrawingAction | null,
      options: RenderOptions,
    ) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.translate(options.pan.x, options.pan.y)
      ctx.scale(options.zoom, options.zoom)

      if (options.showGrid) {
        drawGrid(ctx, canvas.width / dpr, canvas.height / dpr, options.zoom, options.pan)
      }

      for (const action of actions) {
        renderAction(ctx, action)
      }

      if (currentAction) {
        renderAction(ctx, currentAction)
      }

      ctx.restore()
    },
    [],
  )

  return {
    getCanvas,
    setupCanvas,
    clearCanvas,
    renderFrame,
  }
}
