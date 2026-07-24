import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useWhiteboardContext } from '../hooks/useWhiteboard'
import { ColorPicker } from './ColorPicker'
import { BRUSH_SIZES } from '../utils/drawing'
import {
  HiPencil,
  HiPaintBrush,
  HiBackspace,
  HiMinus,
  HiSquaresPlus,
  HiCircleStack,
  HiArrowTrendingUp,
  HiDocumentText,
  HiCursorArrowRays,
  HiArrowUturnLeft,
  HiArrowUturnRight,
  HiTrash,
  HiDocumentArrowDown,
  HiSquares2X2,
  HiSquare2Stack,
} from 'react-icons/hi2'

const TOOLS = [
  { id: 'pen' as const, icon: HiPencil, label: 'Pen', shortcut: '1' },
  { id: 'highlighter' as const, icon: HiPaintBrush, label: 'Highlighter', shortcut: '2' },
  { id: 'eraser' as const, icon: HiBackspace, label: 'Eraser', shortcut: '3' },
  { id: 'line' as const, icon: HiMinus, label: 'Line', shortcut: '4' },
  { id: 'rectangle' as const, icon: HiSquaresPlus, label: 'Rectangle', shortcut: '5' },
  { id: 'circle' as const, icon: HiCircleStack, label: 'Circle', shortcut: '6' },
  { id: 'arrow' as const, icon: HiArrowTrendingUp, label: 'Arrow', shortcut: '7' },
  { id: 'text' as const, icon: HiDocumentText, label: 'Text', shortcut: '8' },
  { id: 'laser' as const, icon: HiCursorArrowRays, label: 'Laser', shortcut: '9' },
] as const

const SIZE_LABELS = ['Thin', 'Medium', 'Thick', 'X-Thick']

export function WhiteboardToolbar() {
  const {
    tool,
    setTool,
    color,
    setColor,
    recentColors,
    brushSizeIndex,
    setBrushSizeIndex,
    fill,
    setFill,
    showGrid,
    setShowGrid,
    canUndo,
    canRedo,
    undo,
    redo,
    clearAll,
    exportAsPNG,
  } = useWhiteboardContext()

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const toolBtnClass = (isActive: boolean) =>
    cn(
      'p-2 rounded-lg transition-all duration-150',
      isActive
        ? 'bg-primary-100 text-primary-700 shadow-sm ring-1 ring-primary-300'
        : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
    )

  const iconSize = 'w-5 h-5'

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white/80 backdrop-blur-md border-b border-border/60 shadow-sm overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-0.5 mr-1">
        {TOOLS.map((t) => {
          const Icon = t.icon
          return (
            <div key={t.id} className="relative group">
              <button
                type="button"
                className={toolBtnClass(tool === t.id)}
                onClick={() => setTool(t.id)}
                title={`${t.label} (${t.shortcut})`}
              >
                <Icon className={iconSize} />
              </button>
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {t.label} <kbd className="ml-0.5 text-gray-400">{t.shortcut}</kbd>
              </span>
            </div>
          )
        })}
      </div>

      <div className="w-px h-7 bg-border mx-1" />

      <div className="relative">
        <button
          type="button"
          className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors flex items-center gap-1.5"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Color"
        >
          <span
            className="w-5 h-5 rounded-md border-2 border-border"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-medium text-text-secondary hidden sm:inline">Color</span>
        </button>

        {showColorPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-border/60 p-3 min-w-[180px]">
              <ColorPicker color={color} recentColors={recentColors} onChange={setColor} />
            </div>
          </>
        )}
      </div>

      <div className="w-px h-7 bg-border mx-1" />

      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="relative group">
            <button
              type="button"
              className={cn(
                'p-1.5 rounded-lg transition-all flex items-center justify-center',
                brushSizeIndex === idx + 1
                  ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
              )}
              onClick={() => setBrushSizeIndex(idx + 1)}
              title={SIZE_LABELS[idx]}
            >
              <span
                className="rounded-full bg-current"
                style={{
                  width: `${4 + idx * 3}px`,
                  height: `${4 + idx * 3}px`,
                }}
              />
            </button>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              {SIZE_LABELS[idx]}
            </span>
          </div>
        ))}
      </div>

      <div className="w-px h-7 bg-border mx-1" />

      <button
        type="button"
        className={cn(
          'p-2 rounded-lg transition-all',
          fill
            ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
        )}
        onClick={() => setFill(!fill)}
        title="Fill shapes (F)"
      >
        <HiSquare2Stack className={iconSize} />
      </button>

      <button
        type="button"
        className={cn(
          'p-2 rounded-lg transition-all',
          showGrid
            ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary',
        )}
        onClick={() => setShowGrid(!showGrid)}
        title="Grid (G)"
      >
        <HiSquares2X2 className={iconSize} />
      </button>

      <div className="w-px h-7 bg-border mx-1" />

      <button
        type="button"
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-all disabled:opacity-30 disabled:pointer-events-none"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <HiArrowUturnLeft className={iconSize} />
      </button>
      <button
        type="button"
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-all disabled:opacity-30 disabled:pointer-events-none"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <HiArrowUturnRight className={iconSize} />
      </button>

      <div className="w-px h-7 bg-border mx-1" />

      <div className="relative">
        {confirmClear ? (
          <div className="flex items-center gap-1 bg-danger-50 rounded-lg p-1">
            <span className="text-xs font-medium text-danger-600 px-1 whitespace-nowrap">Clear all?</span>
            <button
              type="button"
              className="px-2 py-1 text-xs font-medium bg-danger-500 text-white rounded-md hover:bg-danger-600 transition-colors"
              onClick={() => {
                clearAll()
                setConfirmClear(false)
              }}
            >
              Yes
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs font-medium text-text-secondary hover:text-text-primary rounded-md hover:bg-surface-tertiary transition-colors"
              onClick={() => setConfirmClear(false)}
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="p-2 rounded-lg text-text-secondary hover:text-danger-600 hover:bg-danger-50 transition-all"
            onClick={() => setConfirmClear(true)}
            title="Clear all"
          >
            <HiTrash className={iconSize} />
          </button>
        )}
      </div>

      <button
        type="button"
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-all"
        onClick={exportAsPNG}
        title="Export as PNG"
      >
        <HiDocumentArrowDown className={iconSize} />
      </button>
    </div>
  )
}
