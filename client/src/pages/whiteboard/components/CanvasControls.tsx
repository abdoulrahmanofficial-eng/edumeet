import { cn } from '@/utils/cn'
import {
  HiMagnifyingGlassPlus,
  HiMagnifyingGlassMinus,
  HiArrowsPointingIn,
  HiArrowUturnLeft,
  HiArrowUturnRight,
} from 'react-icons/hi2'

interface CanvasControlsProps {
  zoom: number
  canUndo: boolean
  canRedo: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onUndo: () => void
  onRedo: () => void
}

export function CanvasControls({
  zoom,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onUndo,
  onRedo,
}: CanvasControlsProps) {
  const btnClass =
    'p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/80 active:bg-white/60 transition-all disabled:opacity-30 disabled:pointer-events-none backdrop-blur-sm'

  return (
    <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-xl border border-border/60 shadow-lg p-1">
      <button type="button" className={btnClass} onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <HiArrowUturnLeft className="w-4 h-4" />
      </button>
      <button type="button" className={btnClass} onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        <HiArrowUturnRight className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border mx-0.5" />

      <button type="button" className={btnClass} onClick={onZoomOut} title="Zoom out">
        <HiMagnifyingGlassMinus className="w-4 h-4" />
      </button>

      <span className="text-xs font-medium text-text-secondary tabular-nums min-w-[44px] text-center select-none">
        {Math.round(zoom * 100)}%
      </span>

      <button type="button" className={btnClass} onClick={onZoomIn} title="Zoom in">
        <HiMagnifyingGlassPlus className="w-4 h-4" />
      </button>

      <button type="button" className={btnClass} onClick={onFitToScreen} title="Fit to screen">
        <HiArrowsPointingIn className="w-4 h-4" />
      </button>
    </div>
  )
}
