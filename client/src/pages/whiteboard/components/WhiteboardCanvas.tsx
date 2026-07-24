import { useEffect, useRef, useState, useCallback } from 'react'
import { useWhiteboardContext } from '../hooks/useWhiteboard'

export function WhiteboardCanvas() {
  const {
    canvasRef,
    containerRef,
    tool,
    textInput,
    commitText,
    cancelText,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  } = useWhiteboardContext()

  const [textValue, setTextValue] = useState('')
  const textInputRef = useRef<HTMLTextAreaElement | null>(null)
  const containerSizeRef = useRef({ w: 0, h: 0 })

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        commitText(textValue)
        setTextValue('')
      }
      if (e.key === 'Escape') {
        cancelText()
        setTextValue('')
      }
    },
    [textValue, commitText, cancelText],
  )

  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [textInput])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        containerSizeRef.current = { w: width, h: height }
        const canvas = canvasRef.current
        if (canvas) {
          const dpr = window.devicePixelRatio || 1
          const newW = Math.floor(width * dpr)
          const newH = Math.floor(height * dpr)
          if (canvas.width !== newW || canvas.height !== newH) {
            canvas.width = newW
            canvas.height = newH
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
          }
        }
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [canvasRef, containerRef])

  const savedTouchMoveRef = useRef(onTouchMove)
  savedTouchMoveRef.current = onTouchMove

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handler = (e: TouchEvent) => {
      e.preventDefault()
      const synthEvent = {
        touches: Array.from(e.touches).map((t) => ({
          clientX: t.clientX,
          clientY: t.clientY,
        })),
        preventDefault: () => e.preventDefault(),
      } as unknown as React.TouchEvent<HTMLCanvasElement>
      savedTouchMoveRef.current(synthEvent)
    }

    canvas.addEventListener('touchmove', handler, { passive: false })
    return () => canvas.removeEventListener('touchmove', handler)
  }, [canvasRef])

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-white"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />

      {textInput && tool === 'text' && (
        <div
          className="absolute z-30"
          style={{
            left: textInput.x,
            top: textInput.y,
          }}
        >
          <textarea
            ref={textInputRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleTextKeyDown}
            onBlur={() => {
              commitText(textValue)
              setTextValue('')
            }}
            className="min-w-[120px] min-h-[28px] bg-transparent border-0 outline-none resize-none text-sm leading-5 font-sans"
            style={{
              caretColor: '#6366f1',
            }}
            rows={1}
            placeholder="Type here..."
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
