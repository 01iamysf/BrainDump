import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Page } from '../db/db';
import { useStore } from '../store/useStore';
import { Edit3 } from 'lucide-react';

const COLORS = [
  '#222222', '#6B7280', '#D1D5DB', '#DC2626', '#EAB308', '#16A34A', 
  '#2563EB', '#4F46E5', '#9333EA', '#EC4899', '#F59E0B'
];

export const PropertiesPanel: React.FC = () => {
  const { 
    currentPageId, 
    activeTool, 
    setActiveTool, 
    penColor, 
    setPenColor, 
    penWidth, 
    setPenWidth 
  } = useStore();

  const activePage = useLiveQuery(
    () => (currentPageId ? db.pages.get(currentPageId) : undefined),
    [currentPageId]
  );

  const updatePage = async (updates: Partial<Page>) => {
    if (currentPageId) {
      await db.pages.update(currentPageId, updates);
    }
  };

  const handleTemplateChange = (template: Page['template']) => {
    updatePage({ template });
  };

  const handleSizeChange = (pageSize: Page['pageSize']) => {
    updatePage({ pageSize });
  };

  const handleOrientationChange = (orientation: Page['orientation']) => {
    updatePage({ orientation });
  };

  if (!activePage) {
    return (
      <div className="w-80 border-l border-brand-border dark:border-brand-border-dark p-4 bg-brand-bg dark:bg-brand-bg-dark flex flex-col justify-center items-center text-brand-secondary">
        <p className="text-sm">Select a note to view properties</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-brand-border dark:border-brand-border-dark p-5 bg-brand-bg dark:bg-brand-bg-dark overflow-y-auto space-y-6 select-none shrink-0">
      {/* Category Tabs */}
      <div className="flex border-b border-brand-border dark:border-brand-border-dark pb-2 text-xs font-bold gap-4 text-brand-secondary dark:text-brand-secondary-dark">
        <button className="text-brand-text dark:text-brand-text-dark border-b-2 border-brand-text dark:border-brand-text-dark pb-2">PAPER</button>
        <button className="hover:text-brand-text pb-2">BOOKS</button>
        <button className="hover:text-brand-text pb-2">TEMPLATES</button>
      </div>

      {/* Paper Template Selector */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold tracking-wider text-brand-secondary uppercase">Paper Template</h3>
        <div className="grid grid-cols-3 gap-2">
          {(['plain', 'ruled', 'dotted', 'grid', 'cornell', 'checklist'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTemplateChange(t)}
              className={`flex flex-col items-center justify-between p-2 rounded border bg-brand-paper dark:bg-brand-paper-dark transition ${
                activePage.template === t 
                  ? 'border-brand-text dark:border-brand-text-dark shadow-sm' 
                  : 'border-brand-border dark:border-brand-border-dark hover:bg-brand-accent/5'
              }`}
            >
              <div className={`w-12 h-14 border border-brand-border dark:border-brand-border-dark rounded-sm mb-1 ${
                t === 'ruled' ? 'paper-ruled' :
                t === 'grid' ? 'paper-grid' :
                t === 'dotted' ? 'paper-dotted' : 'bg-brand-paper'
              }`} />
              <span className="text-[10px] capitalize font-medium text-brand-text dark:text-brand-text-dark">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Page Size & Layout */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold tracking-wider text-brand-secondary uppercase">Page Size</h3>
        <div className="flex gap-2">
          {(['A4', 'A5', 'Letter', 'A3'] as const).map((size) => (
            <button
              key={size}
              onClick={() => handleSizeChange(size)}
              className={`flex-1 py-1 text-xs font-semibold border rounded transition ${
                activePage.pageSize === size
                  ? 'bg-brand-text dark:bg-brand-text-dark text-brand-paper dark:text-brand-paper-dark border-brand-text'
                  : 'bg-brand-paper dark:bg-brand-paper-dark border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:bg-brand-accent/5'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-2">
          {(['portrait', 'landscape'] as const).map((orient) => (
            <button
              key={orient}
              onClick={() => handleOrientationChange(orient)}
              className={`flex-1 py-1.5 text-xs font-semibold border rounded transition capitalize ${
                activePage.orientation === orient
                  ? 'bg-brand-text dark:bg-brand-text-dark text-brand-paper dark:text-brand-paper-dark border-brand-text'
                  : 'bg-brand-paper dark:bg-brand-paper-dark border-brand-border dark:border-brand-border-dark text-brand-text dark:text-brand-text-dark hover:bg-brand-accent/5'
              }`}
            >
              {orient}
            </button>
          ))}
        </div>
      </div>

      {/* Pen Style */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold tracking-wider text-brand-secondary uppercase">Pen Style</h3>
        <div className="flex gap-2">
          {(['pen', 'pencil', 'highlighter', 'eraser'] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`flex-1 py-2 flex flex-col items-center justify-center border rounded transition ${
                activeTool === tool
                  ? 'border-brand-text dark:border-brand-text-dark bg-brand-accent/20'
                  : 'border-brand-border dark:border-brand-border-dark hover:bg-brand-accent/5'
              }`}
            >
              <Edit3 size={16} className={activeTool === tool ? 'text-brand-text' : 'text-brand-secondary'} />
              <span className="text-[9px] capitalize mt-1 text-brand-text dark:text-brand-text-dark">{tool}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-brand-secondary">
          <span>THICKNESS</span>
          <span>{penWidth.toFixed(1)} mm</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="12"
          step="0.5"
          value={penWidth}
          onChange={(e) => setPenWidth(parseFloat(e.target.value))}
          className="w-full accent-brand-text"
        />
      </div>

      {/* Color Palette */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold tracking-wider text-brand-secondary uppercase">Colors</h3>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setPenColor(c)}
              className={`w-6 h-6 rounded-full border transition shrink-0 ${
                penColor === c ? 'ring-2 ring-brand-text scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <button className="w-6 h-6 rounded-full border border-dashed border-brand-secondary flex items-center justify-center text-brand-secondary hover:text-brand-text">
            +
          </button>
        </div>
      </div>
    </div>
  );
};
