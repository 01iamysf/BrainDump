import React, { useRef, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { getStroke } from 'perfect-freehand';
import { Toolbar } from './Toolbar';
import { jsPDF } from 'jspdf';
import { Share2, Maximize2, Moon, Sun, Plus, Minus, Download } from 'lucide-react';

interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
  tool: string;
}

interface StickyNoteData {
  id: string;
  text: string;
  x: number;
  y: number;
}

export const Workspace: React.FC = () => {
  const { 
    currentPageId, 
    setCurrentPageId,
    activeTool, 
    penColor, 
    penWidth,
    darkMode,
    toggleDarkMode
  } = useStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);
  
  const [typedText, setTypedText] = useState('');
  const [title, setTitle] = useState('Untitled Note');
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);

  // Page Flip Animation State
  const [flipClass, setFlipClass] = useState<'page-flip-left' | 'page-flip-right' | ''>('');
  
  // Touch/Swipe Gesture Tracking
  const swipeStartX = useRef<number | null>(null);

  // Fetch active page from DB
  const activePage = useLiveQuery(
    () => (currentPageId ? db.pages.get(currentPageId) : undefined),
    [currentPageId]
  );

  // Fetch all pages in the current notebook & folder context
  const siblingPages = useLiveQuery(async () => {
    if (!activePage) return [];
    const allPages = await db.pages.where('notebookId').equals(activePage.notebookId).toArray();
    return allPages
      .filter(p => p.folderId === activePage.folderId && !p.isTrash)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }, [activePage?.notebookId, activePage?.folderId, activePage?.isTrash]) || [];

  const currentPageIndex = siblingPages.findIndex(p => p.id === currentPageId);

  // Switch pages with 3D Page Turn Animation
  const handleNavigatePage = (direction: 'next' | 'prev') => {
    if (siblingPages.length === 0 || currentPageIndex === -1 || !activePage) return;

    if (direction === 'next') {
      setFlipClass('page-flip-left');
      setTimeout(async () => {
        if (currentPageIndex < siblingPages.length - 1) {
          setCurrentPageId(siblingPages[currentPageIndex + 1].id!);
        } else {
          // If at the end, create a new blank notebook page
          const newPageId = `page-${Date.now()}`;
          await db.pages.add({
            id: newPageId,
            title: 'Untitled Note',
            notebookId: activePage.notebookId,
            folderId: activePage.folderId,
            template: activePage.template,
            pageSize: activePage.pageSize,
            orientation: activePage.orientation,
            tags: [],
            isFavorite: 0,
            isPinned: 0,
            isArchived: 0,
            isTrash: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            typedContent: '',
            drawingData: JSON.stringify([])
          });
          setCurrentPageId(newPageId);
        }
        setFlipClass('');
      }, 500);
    } else if (direction === 'prev' && currentPageIndex > 0) {
      setFlipClass('page-flip-right');
      setTimeout(() => {
        setCurrentPageId(siblingPages[currentPageIndex - 1].id!);
        setFlipClass('');
      }, 500);
    }
  };

  // Detect swipe gestures on the page container (ignored when drawing)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter' || activeTool === 'eraser') {
      return;
    }
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - swipeStartX.current;
    swipeStartX.current = null;

    if (Math.abs(deltaX) > 70) {
      if (deltaX < 0) {
        handleNavigatePage('next'); // Swipe left -> Next page
      } else {
        handleNavigatePage('prev'); // Swipe right -> Previous page
      }
    }
  };

  // Sync state from DB on page change
  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title);
      setTypedText(activePage.typedContent || '');
      try {
        const loadedStrokes = JSON.parse(activePage.drawingData || '[]');
        setStrokes(loadedStrokes);
        setUndoStack([]);
        setRedoStack([]);
      } catch (e) {
        setStrokes([]);
      }
      setStickyNotes([
        { id: 'sticky-1', text: 'Keep Writing,\nKeep Growing. ♡', x: 420, y: 550 }
      ]);
    }
  }, [activePage?.id]);

  // Debounced auto-save to IndexedDB
  useEffect(() => {
    if (!currentPageId || !activePage) return;
    const timer = setTimeout(async () => {
      await db.pages.update(currentPageId, {
        title,
        typedContent: typedText,
        drawingData: JSON.stringify(strokes),
        updatedAt: new Date()
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, typedText, strokes, currentPageId]);

  // Draw strokes to Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    // Draw active stroke
    if (isDrawing && currentPoints.length > 0) {
      drawStroke(ctx, {
        points: currentPoints,
        color: penColor,
        width: penWidth,
        tool: activeTool
      });
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;

    if (stroke.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = stroke.width * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }

    // perfect-freehand rendering
    const pointsData = stroke.points.map(p => [p.x, p.y, p.pressure]);
    const outlinePoints = getStroke(pointsData, {
      size: stroke.width,
      thinning: stroke.tool === 'pencil' ? 0.3 : 0.6,
      smoothing: 0.5,
      streamline: 0.5,
      simulatePressure: true
    });

    if (outlinePoints.length < 3) return;

    ctx.fillStyle = stroke.color;
    if (stroke.tool === 'highlighter') {
      ctx.fillStyle = stroke.color + '55'; // Alpha for highlighter transparency
    }

    ctx.beginPath();
    ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
    for (let i = 1; i < outlinePoints.length; i++) {
      ctx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  };

  // Redraw when strokes change
  useEffect(() => {
    drawCanvas();
  }, [strokes, isDrawing, currentPoints, penColor, penWidth]);

  // Pointer Event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'text') return;
    setIsDrawing(true);
    const rect = canvasRef.current!.getBoundingClientRect();
    const point: StrokePoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    };
    setCurrentPoints([point]);
    setUndoStack(prev => [...prev, strokes]);
    setRedoStack([]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const point: StrokePoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    };
    setCurrentPoints(prev => [...prev, point]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.length > 0) {
      setStrokes(prev => [...prev, {
        points: currentPoints,
        color: penColor,
        width: penWidth,
        tool: activeTool
      }]);
    }
    setCurrentPoints([]);
  };

  // Undo/Redo actions
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, strokes]);
    setStrokes(previous);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, strokes]);
    setStrokes(next);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Add new Sticky Note
  const handleAddStickyNote = () => {
    const text = prompt('Enter sticky note text:', 'New Sticky Note');
    if (!text) return;
    setStickyNotes(prev => [
      ...prev,
      {
        id: `sticky-${Date.now()}`,
        text,
        x: Math.random() * 200 + 100,
        y: Math.random() * 200 + 100
      }
    ]);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: activePage?.orientation === 'landscape' ? 'landscape' : 'portrait',
      unit: 'pt',
      format: activePage?.pageSize.toLowerCase() || 'a4'
    });

    doc.setFont('Inter', 'normal');
    doc.setFontSize(22);
    doc.text(title, 40, 50);

    doc.setFontSize(12);
    doc.text(typedText, 40, 90);

    const canvas = canvasRef.current;
    if (canvas) {
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_braindump.pdf`);
  };

  // Drag handles for Sticky Note
  const handleStickyDrag = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const targetSticky = stickyNotes.find(s => s.id === id);
    if (!targetSticky) return;
    const origX = targetSticky.x;
    const origY = targetSticky.y;

    const handleMouseMove = (moveEvt: MouseEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      setStickyNotes(prev => prev.map(s => s.id === id ? { ...s, x: origX + dx, y: origY + dy } : s));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const getPaperBgClass = () => {
    if (!activePage) return 'bg-brand-paper';
    switch (activePage.template) {
      case 'ruled': return 'paper-ruled bg-brand-paper dark:bg-brand-paper-dark';
      case 'grid': return 'paper-grid bg-brand-paper dark:bg-brand-paper-dark';
      case 'dotted': return 'paper-dotted bg-brand-paper dark:bg-brand-paper-dark';
      default: return 'bg-brand-paper dark:bg-brand-paper-dark';
    }
  };

  const getPageAspectStyle = () => {
    const isLandscape = activePage?.orientation === 'landscape';
    if (isLandscape) {
      return { width: '842px', height: '595px' };
    }
    return { width: '595px', height: '842px' };
  };

  const wordCount = typedText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = typedText.length;

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg dark:bg-brand-bg-dark overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border dark:border-brand-border-dark select-none">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-bold text-lg text-brand-text dark:text-brand-text-dark bg-transparent border-b border-transparent hover:border-brand-accent focus:border-brand-text focus:outline-none py-0.5"
          />
          <span className="text-xs text-brand-secondary">Personal &gt; Projects</span>
        </div>
        <div className="flex items-center gap-4 text-brand-secondary dark:text-brand-secondary-dark">
          <span className="text-xs text-brand-success flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 bg-brand-success rounded-full" /> Saved recently
          </span>
          <button onClick={handleExportPDF} className="hover:text-brand-text dark:hover:text-brand-text-dark p-1.5 rounded flex items-center gap-1 text-xs font-semibold cursor-pointer">
            <Download size={16} /> Export PDF
          </button>
          <button className="hover:text-brand-text p-1.5 rounded">
            <Share2 size={16} />
          </button>
          <button onClick={toggleDarkMode} className="hover:text-brand-text p-1.5 rounded">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="hover:text-brand-text p-1.5 rounded">
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Floating Toolbar */}
      <Toolbar 
        onUndo={handleUndo} 
        onRedo={handleRedo} 
        onAddStickyNote={handleAddStickyNote}
        canUndo={undoStack.length > 0} 
        canRedo={redoStack.length > 0} 
      />

      {/* Notebook Sheet Canvas Area */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-[#F3EFE9] dark:bg-[#151412] page-container-perspective">
        <div 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`notebook-page rounded-r border-l-[16px] border-brand-border dark:border-brand-border-dark flex relative ${getPaperBgClass()} ${flipClass}`}
          style={getPageAspectStyle()}
        >
          {/* Notebook Metal Rings (Left Edge) */}
          <div className="absolute top-0 bottom-0 -left-[24px] w-6 flex flex-col justify-around py-4 z-20 pointer-events-none select-none">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-8 h-3 bg-gradient-to-r from-gray-400 via-gray-200 to-gray-500 rounded-full border border-gray-600 shadow-sm transform -rotate-6" />
            ))}
          </div>

          {/* Typing Overlay / Textarea */}
          <textarea
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder="Start typing your thoughts here..."
            className="absolute inset-0 w-full h-full p-10 bg-transparent text-brand-text dark:text-brand-text-dark font-sans resize-none border-none outline-none focus:ring-0 leading-7 overflow-hidden z-10"
            style={{ 
              lineHeight: '28px',
              fontFamily: activePage?.template === 'cornell' ? 'var(--font-kalam)' : 'var(--font-sans)',
              paddingLeft: '3rem'
            }}
          />

          {/* Handwriting Canvas drawing layer */}
          <canvas
            ref={canvasRef}
            width={getPageAspectStyle().width === '842px' ? 842 : 595}
            height={getPageAspectStyle().height === '595px' ? 595 : 842}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-0 w-full h-full z-15 touch-none"
          />

          {/* Draggable Sticky Notes */}
          {stickyNotes.map((sticky) => (
            <div
              key={sticky.id}
              onMouseDown={(e) => handleStickyDrag(sticky.id, e)}
              className="absolute z-30 p-4 w-40 bg-[#FFF9C4] text-brand-text border border-brand-accent/50 shadow-md transform rotate-1 cursor-grab active:cursor-grabbing font-caveat text-lg leading-relaxed select-none"
              style={{ left: `${sticky.x}px`, top: `${sticky.y}px` }}
            >
              {/* Tape strip overlay */}
              <div className="absolute -top-3 left-10 w-20 h-5 bg-brand-accent/40 rotate-1 shadow-sm opacity-80" />
              <textarea
                value={sticky.text}
                onChange={(e) => {
                  const updatedText = e.target.value;
                  setStickyNotes(prev => prev.map(s => s.id === sticky.id ? { ...s, text: updatedText } : s));
                }}
                className="w-full h-full bg-transparent resize-none border-none outline-none focus:ring-0 text-center font-caveat text-xl"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Status Bar */}
      <div className="px-6 py-2.5 border-t border-brand-border dark:border-brand-border-dark flex items-center justify-between text-xs text-brand-secondary dark:text-brand-secondary-dark select-none">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase">{activePage?.pageSize} • {activePage?.template} • 100%</span>
          <span className="w-px h-3 bg-brand-border dark:border-brand-border-dark" />
          <span>Page {currentPageIndex !== -1 ? currentPageIndex + 1 : 1} / {Math.max(siblingPages.length, 1)}</span>
          <div className="flex gap-1">
            <button 
              onClick={() => handleNavigatePage('prev')}
              disabled={currentPageIndex <= 0}
              className="p-0.5 border border-brand-border rounded hover:bg-brand-accent/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Minus size={12} />
            </button>
            <button 
              onClick={() => handleNavigatePage('next')}
              className="p-0.5 border border-brand-border rounded hover:bg-brand-accent/10 cursor-pointer"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Word Count: {wordCount}</span>
          <span className="w-px h-3 bg-brand-border dark:border-brand-border-dark" />
          <span>Characters: {charCount}</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-brand-success rounded-full" /> Auto Save</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-brand-success rounded-full" /> Synced</span>
        </div>
      </div>
    </div>
  );
};
