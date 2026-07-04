import React from 'react';
import { useStore } from '../store/useStore';
import { 
  PenTool, Edit, Highlighter, Eraser, Square, Type, FileText, Undo2, Redo2, MoreHorizontal 
} from 'lucide-react';

interface ToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onAddStickyNote?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onUndo, 
  onRedo, 
  onAddStickyNote,
  canUndo = false, 
  canRedo = false 
}) => {
  const { activeTool, setActiveTool } = useStore();

  const tools = [
    { id: 'pen', label: 'Pen', icon: PenTool },
    { id: 'pencil', label: 'Pencil', icon: Edit },
    { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'shapes', label: 'Shapes', icon: Square },
    { id: 'text', label: 'Text', icon: Type },
  ] as const;

  return (
    <div className="flex items-center gap-1 bg-brand-paper dark:bg-brand-paper-dark border border-brand-border dark:border-brand-border-dark px-3 py-1.5 rounded-lg shadow-sm w-fit mx-auto my-3 select-none">
      {tools.map((t) => {
        const Icon = t.icon;
        const isSelected = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`p-2 rounded flex flex-col items-center gap-0.5 min-w-[48px] hover:bg-brand-accent/10 transition cursor-pointer ${
              isSelected ? 'bg-brand-accent/20 text-brand-text font-bold' : 'text-brand-secondary dark:text-brand-secondary-dark'
            }`}
            title={t.label}
          >
            <Icon size={16} />
            <span className="text-[9px]">{t.label}</span>
          </button>
        );
      })}

      <div className="h-6 w-px bg-brand-border dark:bg-brand-border-dark mx-1" />

      {/* Action Buttons */}
      <button 
        onClick={onAddStickyNote}
        className="p-2 rounded flex flex-col items-center gap-0.5 min-w-[48px] hover:bg-brand-accent/10 text-brand-secondary dark:text-brand-secondary-dark cursor-pointer"
        title="Add Sticky Note"
      >
        <FileText size={16} />
        <span className="text-[9px]">Sticky Note</span>
      </button>

      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`p-2 rounded flex flex-col items-center gap-0.5 min-w-[44px] cursor-pointer ${
          canUndo ? 'text-brand-text hover:bg-brand-accent/10' : 'text-brand-border dark:text-brand-border-dark cursor-not-allowed'
        }`}
        title="Undo"
      >
        <Undo2 size={16} />
        <span className="text-[9px]">Undo</span>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`p-2 rounded flex flex-col items-center gap-0.5 min-w-[44px] cursor-pointer ${
          canRedo ? 'text-brand-text hover:bg-brand-accent/10' : 'text-brand-border dark:text-brand-border-dark cursor-not-allowed'
        }`}
        title="Redo"
      >
        <Redo2 size={16} />
        <span className="text-[9px]">Redo</span>
      </button>

      <button className="p-2 rounded text-brand-secondary hover:bg-brand-accent/10 cursor-pointer">
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
};
