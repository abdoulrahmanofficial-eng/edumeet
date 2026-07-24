import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { ref, push, set, onChildAdded } from 'firebase/database'
import { db } from '@/firebase/config'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import type { DrawingAction, Point, ToolType } from '../utils/drawing'
import {
  BRUSH_SIZES,
  generateId,
  exportCanvasAsPNG,
  getEraserActions,
  renderAction,
} from '../utils/drawing'

interface WhiteboardContextValue {
  tool: ToolType
  setTool: (tool: ToolType) => void
  color: string
  setColor: (color: string) => void
  recentColors: string[]
  brushSizeIndex: number
  setBrushSizeIndex: (index: number) => void
  fill: boolean
  setFill: (fill: boolean) => void
  showGrid: boolean
  setShowGrid: (show: boolean) => void
  zoom: number
  pan: Point
  canUndo: boolean
  canRedo: boolean
  actionsCount: number
  isDrawing: boolean
  isLoading: boolean
  error: string | null
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  undo: () => void
  redo: () => void
  clearAll: () => void
  exportAsPNG: () => void
  zoomIn: () => void
  zoomOut: () => void
  fitToScreen: () => void
  textInput: Point | null
  commitText: (text: string) => void
  cancelText: () => void
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void
  onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void
}

const WhiteboardContext = createContext<WhiteboardContextValue | null>(null)

export function useWhiteboardContext(): WhiteboardContextValue {
  const ctx = useContext(WhiteboardContext)
  if (!ctx) throw new Error('useWhiteboardContext must be used within WhiteboardProvider')
  return ctx
}

export function WhiteboardProvider({ children }: { children: React.ReactNode }) {
  const { meetingId } = useParams<{ meetingId: string }>()
  const { user } = useAuth()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const actionsRef = useRef<DrawingAction[]>([])
  const currentActionRef = useRef<DrawingAction | null>(null)
  const undoStackRef = useRef<DrawingAction[][]>([])
  const redoStackRef = useRef<DrawingAction[][]>([])
  const isDrawingRef = useRef(false)
  const isPanningRef = useRef(false)
  const panStartRef = useRef<Point>({ x: 0, y: 0 })
  const panOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const lastPointRef = useRef<Point | null>(null)
  const eraserPointsRef = useRef<Point[]>([])
  const locallyPushedRef = useRef<Set<string>>(new Set())
  const laserPointsRef = useRef<{ point: Point; time: number }[]>([])
  const zoomRef = useRef(1)
  const panRef = useRef<Point>({ x: 0, y: 0 })
  const toolRef = useRef<ToolType>('pen')
  const colorRef = useRef('#1a1a1a')
  const brushSizeRef = useRef(2)
  const fillRef = useRef(false)
  const showGridRef = useRef(false)
  const actionsSubscribed = useRef(false)
  const userIdRef = useRef<string>('')
  const meetingIdRef = useRef<string>('')
  const rafRef = useRef<number | null>(null)

  const [tool, setToolState] = useState<ToolType>('pen')
  const [color, setColorState] = useState('#1a1a1a')
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [brushSizeIndex, setBrushSizeIndex] = useState(2)
  const [fill, setFillState] = useState(false)
  const [showGrid, setShowGridState] = useState(false)
  const [zoom, setZoomState] = useState(1)
  const [pan, setPanState] = useState<Point>({ x: 0, y: 0 })
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [actionsCount, setActionsCount] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [textInput, setTextInput] = useState<Point | null>(null)

  useEffect(() => {
    userIdRef.current = user?.uid || ''
  }, [user])

  useEffect(() => {
    meetingIdRef.current = meetingId || ''
  }, [meetingId])

  const scheduleRender = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w === 0 || h === 0) return
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.translate(panRef.current.x, panRef.current.y)
      ctx.scale(zoomRef.current, zoomRef.current)
      if (showGridRef.current) {
        const gridSize = 50
        ctx.save()
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1 / zoomRef.current
        const startX = -panRef.current.x / zoomRef.current
        const startY = -panRef.current.y / zoomRef.current
        const endX = startX + w / zoomRef.current
        const endY = startY + h / zoomRef.current
        const firstX = Math.floor(startX / gridSize) * gridSize
        const firstY = Math.floor(startY / gridSize) * gridSize
        ctx.beginPath()
        for (let x = firstX; x <= endX; x += gridSize) {
          ctx.moveTo(Math.round(x) + 0.5, startY)
          ctx.lineTo(Math.round(x) + 0.5, endY)
        }
        for (let y = firstY; y <= endY; y += gridSize) {
          ctx.moveTo(startX, Math.round(y) + 0.5)
          ctx.lineTo(endX, Math.round(y) + 0.5)
        }
        ctx.stroke()
        ctx.strokeStyle = '#d1d5db'
        ctx.lineWidth = 2 / zoomRef.current
        const majorGrid = gridSize * 5
        const firstMX = Math.floor(startX / majorGrid) * majorGrid
        const firstMY = Math.floor(startY / majorGrid) * majorGrid
        ctx.beginPath()
        for (let x = firstMX; x <= endX; x += majorGrid) {
          ctx.moveTo(Math.round(x) + 0.5, startY)
          ctx.lineTo(Math.round(x) + 0.5, endY)
        }
        for (let y = firstMY; y <= endY; y += majorGrid) {
          ctx.moveTo(startX, Math.round(y) + 0.5)
          ctx.lineTo(endX, Math.round(y) + 0.5)
        }
        ctx.stroke()
        ctx.restore()
      }
      for (const action of actionsRef.current) {
        renderAction(ctx, action)
      }
      if (currentActionRef.current) {
        renderAction(ctx, currentActionRef.current)
      }
      if (toolRef.current === 'laser') {
        const now = Date.now()
        laserPointsRef.current = laserPointsRef.current.filter((lp) => now - lp.time < 300)
        for (const lp of laserPointsRef.current) {
          const age = now - lp.time
          const opacity = Math.max(0, 1 - age / 300)
          ctx.save()
          ctx.fillStyle = `rgba(255, 50, 50, ${opacity})`
          ctx.shadowColor = 'rgba(255, 50, 50, 0.6)'
          ctx.shadowBlur = 10 / zoomRef.current
          ctx.beginPath()
          ctx.arc(lp.point.x, lp.point.y, Math.max(3, 6 / zoomRef.current), 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
        if (laserPointsRef.current.length > 0) {
          scheduleRender()
        }
      }
      ctx.restore()
    })
  }, [])

  const renderOnNextFrame = useCallback(() => {
    scheduleRender()
  }, [scheduleRender])

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    panRef.current = pan
  }, [pan])

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      return {
        x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
        y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
      }
    },
    [],
  )

  const setTool = useCallback((t: ToolType) => {
    toolRef.current = t
    setToolState(t)
  }, [])

  const setColor = useCallback((c: string) => {
    colorRef.current = c
    setColorState(c)
    setRecentColors((prev) => {
      const filtered = prev.filter((pc) => pc !== c)
      return [c, ...filtered].slice(0, 8)
    })
  }, [])

  const setBrushSizeIndexFn = useCallback((idx: number) => {
    brushSizeRef.current = idx
    setBrushSizeIndex(idx)
  }, [])

  const setFill = useCallback((f: boolean) => {
    fillRef.current = f
    setFillState(f)
  }, [])

  const setShowGrid = useCallback((s: boolean) => {
    showGridRef.current = s
    setShowGridState(s)
    renderOnNextFrame()
  }, [renderOnNextFrame])

  const zoomIn = useCallback(() => {
    const newZoom = Math.min(5, zoomRef.current * 1.2)
    zoomRef.current = newZoom
    setZoomState(newZoom)
    renderOnNextFrame()
  }, [renderOnNextFrame])

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(0.1, zoomRef.current * 0.8)
    zoomRef.current = newZoom
    setZoomState(newZoom)
    renderOnNextFrame()
  }, [renderOnNextFrame])

  const fitToScreen = useCallback(() => {
    zoomRef.current = 1
    panRef.current = { x: 0, y: 0 }
    setZoomState(1)
    setPanState({ x: 0, y: 0 })
    renderOnNextFrame()
  }, [renderOnNextFrame])

  const pushUndo = useCallback(() => {
    if (actionsRef.current.length === 0) return
    undoStackRef.current = [...undoStackRef.current, [...actionsRef.current]]
    if (undoStackRef.current.length > 50) {
      undoStackRef.current = undoStackRef.current.slice(-50)
    }
    redoStackRef.current = []
    setCanUndo(true)
    setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    redoStackRef.current = [...redoStackRef.current, [...actionsRef.current]]
    const prev = undoStackRef.current[undoStackRef.current.length - 1]
    undoStackRef.current = undoStackRef.current.slice(0, -1)
    actionsRef.current = prev
    setActionsCount(prev.length)
    setCanUndo(undoStackRef.current.length > 0)
    setCanRedo(true)
    renderOnNextFrame()
  }, [renderOnNextFrame])

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    undoStackRef.current = [...undoStackRef.current, [...actionsRef.current]]
    const next = redoStackRef.current[redoStackRef.current.length - 1]
    redoStackRef.current = redoStackRef.current.slice(0, -1)
    actionsRef.current = next
    setActionsCount(next.length)
    setCanUndo(true)
    setCanRedo(redoStackRef.current.length > 0)
    renderOnNextFrame()
  }, [renderOnNextFrame])

  const commitAction = useCallback(() => {
    const action = currentActionRef.current
    if (!action) return
    if (action.type === 'pen' && action.points.length < 2) {
      currentActionRef.current = null
      return
    }
    if (
      (action.type === 'line' || action.type === 'rectangle' || action.type === 'circle' || action.type === 'arrow') &&
      action.points.length < 2
    ) {
      currentActionRef.current = null
      return
    }
    pushUndo()
    const committed: DrawingAction = { ...action, userId: userIdRef.current, timestamp: Date.now() }
    actionsRef.current = [...actionsRef.current, committed]
    setActionsCount(actionsRef.current.length)
    currentActionRef.current = null
    locallyPushedRef.current.add(committed.id)
    const mId = meetingIdRef.current
    if (mId && userIdRef.current) {
      const actionsRef_fb = ref(db, `whiteboards/${mId}/actions`)
      const newRef = push(actionsRef_fb)
      set(newRef, committed).catch(() => {
        toast.error('Failed to sync to server')
      })
    }
    renderOnNextFrame()
  }, [pushUndo, renderOnNextFrame])

  const startAction = useCallback(
    (point: Point, toolType: ToolType) => {
      if (toolType === 'eraser') {
        eraserPointsRef.current = [point]
        isDrawingRef.current = true
        setIsDrawing(true)
        return
      }
      isDrawingRef.current = true
      setIsDrawing(true)
      const action: DrawingAction = {
        id: generateId(),
        type: toolType as DrawingAction['type'],
        points: [point],
        color: colorRef.current,
        size: BRUSH_SIZES[brushSizeRef.current - 1] || BRUSH_SIZES[0],
        fill: fillRef.current,
        userId: userIdRef.current,
        timestamp: Date.now(),
      }
      currentActionRef.current = action
    },
    [],
  )

  const continueAction = useCallback(
    (point: Point) => {
      const toolType = toolRef.current
      if (toolType === 'eraser') {
        if (!isDrawingRef.current) return
        eraserPointsRef.current.push(point)
        const threshold = BRUSH_SIZES[brushSizeRef.current - 1] * 2
        const idsToRemove = getEraserActions(actionsRef.current, [point], threshold)
        if (idsToRemove.length > 0) {
          pushUndo()
          actionsRef.current = actionsRef.current.filter((a) => !idsToRemove.includes(a.id))
          setActionsCount(actionsRef.current.length)
        }
        renderOnNextFrame()
        return
      }
      if (toolType === 'laser') {
        laserPointsRef.current.push({ point, time: Date.now() })
        renderOnNextFrame()
        return
      }
      if (!currentActionRef.current) return
      if (toolType === 'pen' || toolType === 'highlighter') {
        const last = currentActionRef.current.points[currentActionRef.current.points.length - 1]
        if (last && distance(last, point) < 2) return
      }
      currentActionRef.current = {
        ...currentActionRef.current,
        points: [...currentActionRef.current.points, point],
      }
      renderOnNextFrame()
    },
    [pushUndo, renderOnNextFrame],
  )

  const endAction = useCallback(() => {
    if (toolRef.current === 'eraser') {
      eraserPointsRef.current = []
      isDrawingRef.current = false
      setIsDrawing(false)
      return
    }
    if (currentActionRef.current) {
      commitAction()
    }
    isDrawingRef.current = false
    setIsDrawing(false)
    lastPointRef.current = null
  }, [commitAction])

  const clearAll = useCallback(() => {
    if (actionsRef.current.length === 0) return
    pushUndo()
    actionsRef.current = []
    redoStackRef.current = []
    setActionsCount(0)
    setCanRedo(false)
    renderOnNextFrame()
    toast.success('Whiteboard cleared')
  }, [pushUndo, renderOnNextFrame])

  const exportAsPNGFn = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    exportCanvasAsPNG(canvas, `whiteboard-${meetingIdRef.current || 'export'}.png`)
    toast.success('Exported as PNG')
  }, [])

  const commitText = useCallback((text: string) => {
    if (!text.trim()) {
      setTextInput(null)
      return
    }
    const pos = textInput
    if (!pos) return
    pushUndo()
    const action: DrawingAction = {
      id: generateId(),
      type: 'text',
      points: [pos],
      color: colorRef.current,
      size: BRUSH_SIZES[brushSizeRef.current - 1] || BRUSH_SIZES[0],
      fill: false,
      text: text.trim(),
      userId: userIdRef.current,
      timestamp: Date.now(),
    }
    actionsRef.current = [...actionsRef.current, action]
    setActionsCount(actionsRef.current.length)
    locallyPushedRef.current.add(action.id)
    const mId = meetingIdRef.current
    if (mId && userIdRef.current) {
      const actionsRef_fb = ref(db, `whiteboards/${mId}/actions`)
      const newRef = push(actionsRef_fb)
      set(newRef, action).catch(() => toast.error('Failed to sync text'))
    }
    setTextInput(null)
    renderOnNextFrame()
  }, [textInput, pushUndo, renderOnNextFrame])

  const cancelText = useCallback(() => {
    setTextInput(null)
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanningRef.current = true
        panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y }
        return
      }
      if (e.button !== 0) return
      if (toolRef.current === 'text') {
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          setTextInput({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }
        return
      }
      const point = getCanvasPoint(e.clientX, e.clientY)
      startAction(point, toolRef.current)
    },
    [getCanvasPoint, startAction],
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current) {
        panRef.current = { x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y }
        setPanState(panRef.current)
        renderOnNextFrame()
        return
      }
      if (toolRef.current === 'laser') {
        const point = getCanvasPoint(e.clientX, e.clientY)
        laserPointsRef.current.push({ point, time: Date.now() })
        renderOnNextFrame()
        return
      }
      if (!isDrawingRef.current) return
      const point = getCanvasPoint(e.clientX, e.clientY)
      continueAction(point)
    },
    [getCanvasPoint, continueAction, renderOnNextFrame],
  )

  const onMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanningRef.current) {
        isPanningRef.current = false
        setPanState(panRef.current)
        return
      }
      if (!isDrawingRef.current) return
      endAction()
    },
    [endAction],
  )

  const onMouseLeave = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false
      setPanState(panRef.current)
    }
    if (isDrawingRef.current) {
      endAction()
    }
  }, [endAction])

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(5, Math.max(0.1, zoomRef.current * zoomFactor))
      const newPan = {
        x: mouseX - (mouseX - panRef.current.x) * (newZoom / zoomRef.current),
        y: mouseY - (mouseY - panRef.current.y) * (newZoom / zoomRef.current),
      }
      zoomRef.current = newZoom
      panRef.current = newPan
      setZoomState(newZoom)
      setPanState(newPan)
      renderOnNextFrame()
    },
    [renderOnNextFrame],
  )

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchZoomRef = useRef<number>(1)
  const touchPanRef = useRef<Point>({ x: 0, y: 0 })
  const pinchStartDist = useRef<number>(0)
  const pinchStartZoom = useRef<number>(1)

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        pinchStartDist.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        pinchStartZoom.current = zoomRef.current
        touchPanRef.current = { ...panRef.current }
        touchStartRef.current = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        }
        return
      }
      if (e.touches.length === 1) {
        if (toolRef.current === 'text') {
          const canvas = canvasRef.current
          if (canvas) {
            const rect = canvas.getBoundingClientRect()
            const touch = e.touches[0]
            setTextInput({ x: touch.clientX - rect.left, y: touch.clientY - rect.top })
          }
          return
        }
        const touch = e.touches[0]
        const point = getCanvasPoint(touch.clientX, touch.clientY)
        startAction(point, toolRef.current)
      }
    },
    [getCanvasPoint, startAction],
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const scale = currentDist / pinchStartDist.current
        const newZoom = Math.min(5, Math.max(0.1, pinchStartZoom.current * scale))
        const midX = (t1.clientX + t2.clientX) / 2
        const midY = (t1.clientY + t2.clientY) / 2
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          const mx = midX - rect.left
          const my = midY - rect.top
          panRef.current = {
            x: mx - (mx - touchPanRef.current.x) * (newZoom / pinchStartZoom.current),
            y: my - (my - touchPanRef.current.y) * (newZoom / pinchStartZoom.current),
          }
        }
        zoomRef.current = newZoom
        setZoomState(newZoom)
        setPanState(panRef.current)
        renderOnNextFrame()
        return
      }
      if (e.touches.length === 1 && isDrawingRef.current) {
        const touch = e.touches[0]
        const point = getCanvasPoint(touch.clientX, touch.clientY)
        continueAction(point)
      }
    },
    [getCanvasPoint, continueAction, renderOnNextFrame],
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length === 0) {
        if (isDrawingRef.current) {
          endAction()
        }
      }
    },
    [endAction],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === '1') setTool('pen')
      else if (e.key === '2') setTool('highlighter')
      else if (e.key === '3') setTool('eraser')
      else if (e.key === '4') setTool('line')
      else if (e.key === '5') setTool('rectangle')
      else if (e.key === '6') setTool('circle')
      else if (e.key === '7') setTool('arrow')
      else if (e.key === '8') setTool('text')
      else if (e.key === '9') setTool('laser')
      else if (e.key === '=' || e.key === '+') zoomIn()
      else if (e.key === '-') zoomOut()
      else if (e.key === '0') fitToScreen()
      else if (e.key === 'g' && !e.ctrlKey && !e.metaKey) setShowGrid(!showGridRef.current)
      else if (e.key === 'f' && !e.ctrlKey && !e.metaKey) setFill(!fillRef.current)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, setTool, zoomIn, zoomOut, fitToScreen, setShowGrid, setFill])

  useEffect(() => {
    if (!meetingId || !user) return
    const actionsRef_fb = ref(db, `whiteboards/${meetingId}/actions`)
    let initialReceived = false
    const unsub = onChildAdded(
      actionsRef_fb,
      (snapshot) => {
        const data = snapshot.val() as DrawingAction | null
        if (data && data.id && !locallyPushedRef.current.has(data.id)) {
          actionsRef.current = [...actionsRef.current, data]
          setActionsCount(actionsRef.current.length)
          renderOnNextFrame()
        }
        if (!initialReceived) {
          initialReceived = true
          setIsLoading(false)
        }
      },
      (err) => {
        setError(err.message)
        setIsLoading(false)
      },
    )
    const timer = setTimeout(() => {
      if (!initialReceived) setIsLoading(false)
    }, 5000)
    return () => {
      unsub()
      clearTimeout(timer)
    }
  }, [meetingId, user, renderOnNextFrame])

  useEffect(() => {
    renderOnNextFrame()
  }, [tool, color, brushSizeIndex, fill, renderOnNextFrame])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(5, Math.max(0.1, zoomRef.current * zoomFactor))
      const newPan = {
        x: mouseX - (mouseX - panRef.current.x) * (newZoom / zoomRef.current),
        y: mouseY - (mouseY - panRef.current.y) * (newZoom / zoomRef.current),
      }
      zoomRef.current = newZoom
      panRef.current = newPan
      setZoomState(newZoom)
      setPanState(newPan)
      renderOnNextFrame()
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [renderOnNextFrame])

  const value: WhiteboardContextValue = {
    tool,
    setTool,
    color,
    setColor,
    recentColors,
    brushSizeIndex,
    setBrushSizeIndex: setBrushSizeIndexFn,
    fill,
    setFill,
    showGrid,
    setShowGrid,
    zoom,
    pan,
    canUndo,
    canRedo,
    actionsCount,
    isDrawing,
    isLoading,
    error,
    canvasRef,
    containerRef,
    undo,
    redo,
    clearAll,
    exportAsPNG: exportAsPNGFn,
    zoomIn,
    zoomOut,
    fitToScreen,
    textInput,
    commitText,
    cancelText,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  }

  return <WhiteboardContext.Provider value={value}>{children}</WhiteboardContext.Provider>
}

function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}
