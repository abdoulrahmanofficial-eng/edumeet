import { useWhiteboardContext, WhiteboardProvider } from './hooks/useWhiteboard'
import { WhiteboardToolbar } from './components/WhiteboardToolbar'
import { WhiteboardCanvas } from './components/WhiteboardCanvas'
import { CanvasControls } from './components/CanvasControls'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function WhiteboardContent() {
  const { isLoading, error, zoom, canUndo, canRedo, zoomIn, zoomOut, fitToScreen, undo, redo } =
    useWhiteboardContext()

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-danger-600 font-medium text-lg">Failed to load whiteboard</p>
          <p className="text-text-secondary text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm font-medium">Loading whiteboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <WhiteboardToolbar />
      <div className="relative flex-1">
        <WhiteboardCanvas />
        <CanvasControls
          zoom={zoom}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFitToScreen={fitToScreen}
          onUndo={undo}
          onRedo={redo}
        />
      </div>
    </div>
  )
}

export default function WhiteboardPage() {
  return (
    <ErrorBoundary>
      <div className="h-[calc(100vh-64px)] bg-surface-secondary">
        <WhiteboardProvider>
          <WhiteboardContent />
        </WhiteboardProvider>
      </div>
    </ErrorBoundary>
  )
}
