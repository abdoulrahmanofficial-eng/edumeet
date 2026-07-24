export interface Point {
  x: number
  y: number
}

export type ToolType =
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'arrow'
  | 'text'
  | 'laser'

export interface DrawingAction {
  id: string
  type: Exclude<ToolType, 'eraser' | 'laser'>
  points: Point[]
  color: string
  size: number
  fill: boolean
  text?: string
  userId: string
  timestamp: number
}

export const COLORS = [
  '#1a1a1a',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#92400e',
] as const

export const BRUSH_SIZES = [3, 6, 12, 24] as const

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y)
}

export function midpoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = Number.parseInt(clean.substring(0, 2), 16)
  const g = Number.parseInt(clean.substring(2, 4), 16)
  const b = Number.parseInt(clean.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  return ((...args: unknown[]) => {
    const now = Date.now()
    const remaining = delay - (now - last)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      fn(...args)
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn(...args)
      }, remaining)
    }
  }) as T
}

export function drawPenStroke(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (action.points.length < 2) return
  ctx.save()
  ctx.strokeStyle = action.color
  ctx.lineWidth = action.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(action.points[0].x, action.points[0].y)
  if (action.points.length === 2) {
    ctx.lineTo(action.points[1].x, action.points[1].y)
  } else {
    for (let i = 1; i < action.points.length - 1; i++) {
      const mid = midpoint(action.points[i], action.points[i + 1])
      ctx.quadraticCurveTo(action.points[i].x, action.points[i].y, mid.x, mid.y)
    }
    ctx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawHighlighterStroke(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (action.points.length < 2) return
  ctx.save()
  ctx.strokeStyle = hexToRgba(action.color, 0.25)
  ctx.lineWidth = action.size * 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.25
  ctx.beginPath()
  ctx.moveTo(action.points[0].x, action.points[0].y)
  if (action.points.length === 2) {
    ctx.lineTo(action.points[1].x, action.points[1].y)
  } else {
    for (let i = 1; i < action.points.length - 1; i++) {
      const mid = midpoint(action.points[i], action.points[i + 1])
      ctx.quadraticCurveTo(action.points[i].x, action.points[i].y, mid.x, mid.y)
    }
    ctx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawLineShape(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (action.points.length < 2) return
  ctx.save()
  ctx.strokeStyle = action.color
  ctx.lineWidth = action.size
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(action.points[0].x, action.points[0].y)
  ctx.lineTo(action.points[action.points.length - 1].x, action.points[action.points.length - 1].y)
  ctx.stroke()
  ctx.restore()
}

export function drawRectShape(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (action.points.length < 2) return
  const p1 = action.points[0]
  const p2 = action.points[action.points.length - 1]
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const w = Math.abs(p2.x - p1.x)
  const h = Math.abs(p2.y - p1.y)
  ctx.save()
  if (action.fill) {
    ctx.fillStyle = hexToRgba(action.color, 0.2)
    ctx.fillRect(x, y, w, h)
  }
  ctx.strokeStyle = action.color
  ctx.lineWidth = action.size
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

export function drawCircleShape(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (action.points.length < 2) return
  const p1 = action.points[0]
  const p2 = action.points[action.points.length - 1]
  const cx = (p1.x + p2.x) / 2
  const cy = (p1.y + p2.y) / 2
  const rx = Math.abs(p2.x - p1.x) / 2
  const ry = Math.abs(p2.y - p1.y) / 2
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2)
  if (action.fill) {
    ctx.fillStyle = hexToRgba(action.color, 0.2)
    ctx.fill()
  }
  ctx.strokeStyle = action.color
  ctx.lineWidth = action.size
  ctx.stroke()
  ctx.restore()
}

export function drawArrowShape(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (action.points.length < 2) return
  const from = action.points[0]
  const to = action.points[action.points.length - 1]
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const headLen = Math.max(12, action.size * 4)
  const headAngle = Math.PI / 6

  ctx.save()
  ctx.strokeStyle = action.color
  ctx.lineWidth = action.size
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - headAngle),
    to.y - headLen * Math.sin(angle - headAngle),
  )
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + headAngle),
    to.y - headLen * Math.sin(angle + headAngle),
  )
  ctx.closePath()
  ctx.fillStyle = action.color
  ctx.fill()
  ctx.restore()
}

export function drawTextAction(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  if (!action.text || action.points.length === 0) return
  ctx.save()
  const fontSize = Math.max(14, action.size * 5)
  ctx.font = `${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`
  ctx.fillStyle = action.color
  ctx.textBaseline = 'top'
  const lines = action.text.split('\n')
  const lineHeight = fontSize * 1.4
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], action.points[0].x, action.points[0].y + i * lineHeight)
  }
  ctx.restore()
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  zoom: number,
  pan: { x: number; y: number },
): void {
  const gridSize = 50
  ctx.save()
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1 / zoom

  const startX = -pan.x / zoom
  const startY = -pan.y / zoom
  const endX = startX + canvasW / zoom
  const endY = startY + canvasH / zoom

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
  ctx.lineWidth = 2 / zoom
  const majorGrid = gridSize * 5
  const firstMajorX = Math.floor(startX / majorGrid) * majorGrid
  const firstMajorY = Math.floor(startY / majorGrid) * majorGrid
  ctx.beginPath()
  for (let x = firstMajorX; x <= endX; x += majorGrid) {
    ctx.moveTo(Math.round(x) + 0.5, startY)
    ctx.lineTo(Math.round(x) + 0.5, endY)
  }
  for (let y = firstMajorY; y <= endY; y += majorGrid) {
    ctx.moveTo(startX, Math.round(y) + 0.5)
    ctx.lineTo(endX, Math.round(y) + 0.5)
  }
  ctx.stroke()

  ctx.restore()
}

export function renderAction(ctx: CanvasRenderingContext2D, action: DrawingAction): void {
  switch (action.type) {
    case 'pen':
      drawPenStroke(ctx, action)
      break
    case 'highlighter':
      drawHighlighterStroke(ctx, action)
      break
    case 'line':
      drawLineShape(ctx, action)
      break
    case 'rectangle':
      drawRectShape(ctx, action)
      break
    case 'circle':
      drawCircleShape(ctx, action)
      break
    case 'arrow':
      drawArrowShape(ctx, action)
      break
    case 'text':
      drawTextAction(ctx, action)
      break
  }
}

export function isPointNearAction(point: Point, action: DrawingAction, threshold: number): boolean {
  for (const p of action.points) {
    if (distance(point, p) < threshold) return true
  }
  if (action.type === 'rectangle' && action.points.length >= 2) {
    const p1 = action.points[0]
    const p2 = action.points[action.points.length - 1]
    const x = Math.min(p1.x, p2.x) - threshold
    const y = Math.min(p1.y, p2.y) - threshold
    const w = Math.abs(p2.x - p1.x) + threshold * 2
    const h = Math.abs(p2.y - p1.y) + threshold * 2
    if (
      point.x >= x &&
      point.x <= x + w &&
      point.y >= y &&
      point.y <= y + h &&
      (point.x < x + threshold ||
        point.x > x + w - threshold ||
        point.y < y + threshold ||
        point.y > y + h - threshold)
    )
      return true
  }
  if (action.type === 'circle' && action.points.length >= 2) {
    const p1 = action.points[0]
    const p2 = action.points[action.points.length - 1]
    const cx = (p1.x + p2.x) / 2
    const cy = (p1.y + p2.y) / 2
    const rx = Math.abs(p2.x - p1.x) / 2
    const ry = Math.abs(p2.y - p1.y) / 2
    const d = distance(point, { x: cx, y: cy })
    const avgR = (rx + ry) / 2
    if (Math.abs(d - avgR) < threshold) return true
  }
  if (action.type === 'text' && action.text && action.points.length > 0) {
    const pos = action.points[0]
    const fontSize = Math.max(14, action.size * 5)
    const lines = action.text.split('\n')
    const lineHeight = fontSize * 1.4
    const maxWidth = Math.max(...lines.map((l) => l.length)) * fontSize * 0.6
    if (
      point.x >= pos.x - threshold &&
      point.x <= pos.x + maxWidth + threshold &&
      point.y >= pos.y - threshold &&
      point.y <= pos.y + lines.length * lineHeight + threshold
    )
      return true
  }
  return false
}

export function getEraserActions(
  actions: DrawingAction[],
  eraserPoints: Point[],
  threshold: number,
): string[] {
  const hitIds = new Set<string>()
  for (const ep of eraserPoints) {
    for (const action of actions) {
      if (!hitIds.has(action.id) && isPointNearAction(ep, action, threshold)) {
        hitIds.add(action.id)
      }
    }
  }
  return Array.from(hitIds)
}

export async function exportCanvasAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'whiteboard.png',
): Promise<void> {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
