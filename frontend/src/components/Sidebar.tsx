import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useStore } from '../store/useStore';
import { 
  FileText, Star, Archive, Trash2, Folder, Tag, Plus, Settings, RefreshCw, Menu, ChevronDown, ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    currentNotebookId, 
    setCurrentNotebookId, 
    currentFolderId, 
    setCurrentFolderId, 
    setCurrentPageId,
    sidebarOpen, 
    toggleSidebar,
    searchQuery,
    setSearchQuery
  } = useStore();

  const [expandedNotebooks, setExpandedNotebooks] = useState<Record<string, boolean>>({
    'notebook-personal': true
  });

  // Fetch notebooks, folders, pages, tags
  const notebooks = useLiveQuery(() => db.notebooks.toArray()) || [];
  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  const pages = useLiveQuery(() => db.pages.toArray()) || [];
  const tags = useLiveQuery(() => db.tags.toArray()) || [];

  // Count active pages per notebook/section
  const allNotesCount = pages.filter(p => !p.isTrash && !p.isArchived).length;
  const pinnedCount = pages.filter(p => p.isPinned && !p.isTrash).length;
  const archiveCount = pages.filter(p => p.isArchived && !p.isTrash).length;
  const trashCount = pages.filter(p => p.isTrash).length;

  const getNotebookPageCount = (notebookId: string) => {
    return pages.filter(p => p.notebookId === notebookId && !p.isTrash && !p.isArchived).length;
  };

  const getFolderPageCount = (folderId: string) => {
    return pages.filter(p => p.folderId === folderId && !p.isTrash && !p.isArchived).length;
  };

  const toggleNotebookExpand = (id: string) => {
    setExpandedNotebooks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Create new note
  const handleNewNote = async () => {
    if (!currentNotebookId) return;
    const pageId = `page-${Date.now()}`;
    await db.pages.add({
      id: pageId,
      title: 'Untitled Note',
      notebookId: currentNotebookId,
      folderId: currentFolderId || undefined,
      template: 'plain',
      pageSize: 'A4',
      orientation: 'portrait',
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
    setCurrentPageId(pageId);
  };

  // Create new notebook
  const handleNewNotebook = async () => {
    const name = prompt('Enter notebook name:');
    if (!name) return;
    const id = `notebook-${Date.now()}`;
    await db.notebooks.add({
      id,
      name,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    setCurrentNotebookId(id);
  };

  // Create new folder
  const handleNewFolder = async (notebookId: string) => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    const id = `folder-${Date.now()}`;
    await db.folders.add({
      id,
      name,
      notebookId,
      createdAt: new Date()
    });
  };

  // Create new tag
  const handleNewTag = async () => {
    const name = prompt('Enter tag name:');
    if (!name) return;
    const cleanTag = name.trim().toLowerCase().replace('#', '');
    if (!cleanTag) return;
    const id = `tag-${cleanTag}`;
    const exists = await db.tags.get(id);
    if (!exists) {
      await db.tags.add({ id, name: cleanTag });
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="w-12 border-r border-brand-border dark:border-brand-border-dark flex flex-col items-center py-4 bg-brand-bg dark:bg-brand-bg-dark shrink-0">
        <button onClick={toggleSidebar} className="p-2 hover:bg-brand-accent/20 dark:hover:bg-brand-accent-dark/20 rounded">
          <Menu size={20} className="text-brand-text dark:text-brand-text-dark" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-brand-border dark:border-brand-border-dark flex flex-col h-full bg-brand-bg dark:bg-brand-bg-dark shrink-0 select-none">
      {/* Title Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border dark:border-brand-border-dark">
        <h1 className="font-kalam text-2xl font-bold tracking-tight text-brand-text dark:text-brand-text-dark">BrainDump</h1>
        <button onClick={toggleSidebar} className="p-1 hover:bg-brand-accent/20 dark:hover:bg-brand-accent-dark/20 rounded">
          <Menu size={18} className="text-brand-secondary dark:text-brand-secondary-dark" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded border border-brand-border dark:border-brand-border-dark bg-brand-paper dark:bg-brand-paper-dark text-brand-text dark:text-brand-text-dark focus:outline-none focus:border-brand-accent"
          />
        </div>

        {/* New Note Button */}
        <button 
          onClick={handleNewNote}
          className="w-full py-2 bg-brand-text dark:bg-brand-text-dark text-brand-paper dark:text-brand-paper-dark rounded font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow"
        >
          <Plus size={16} />
          New Note
        </button>

        {/* Standard Folders */}
        <ul className="space-y-1 text-sm font-medium text-brand-text dark:text-brand-text-dark">
          <li>
            <button 
              onClick={() => { setCurrentNotebookId(null); setCurrentFolderId(null); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded hover:bg-brand-accent/10 ${!currentNotebookId ? 'bg-brand-accent/20' : ''}`}
            >
              <span className="flex items-center gap-2.5"><FileText size={16} className="text-brand-secondary" /> All Notes</span>
              <span className="text-xs text-brand-secondary">{allNotesCount}</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-brand-accent/10">
              <span className="flex items-center gap-2.5"><Star size={16} className="text-brand-secondary" /> Pinned</span>
              <span className="text-xs text-brand-secondary">{pinnedCount}</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-brand-accent/10">
              <span className="flex items-center gap-2.5"><Archive size={16} className="text-brand-secondary" /> Archive</span>
              <span className="text-xs text-brand-secondary">{archiveCount}</span>
            </button>
          </li>
          <li>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-brand-accent/10">
              <span className="flex items-center gap-2.5"><Trash2 size={16} className="text-brand-secondary" /> Trash</span>
              <span className="text-xs text-brand-secondary">{trashCount}</span>
            </button>
          </li>
        </ul>

        {/* Notebooks Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold uppercase tracking-wider text-brand-secondary dark:text-brand-secondary-dark">
            <span>Notebooks</span>
            <button onClick={handleNewNotebook} className="hover:text-brand-text dark:hover:text-brand-text-dark p-0.5 rounded">
              <Plus size={14} />
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {notebooks.map(nb => {
              const isSelected = currentNotebookId === nb.id;
              const isExpanded = !!expandedNotebooks[nb.id!];
              const notebookFolders = folders.filter(f => f.notebookId === nb.id);

              return (
                <li key={nb.id} className="space-y-1">
                  <div className={`flex items-center justify-between rounded hover:bg-brand-accent/10 ${isSelected ? 'bg-brand-accent/20 font-semibold' : ''}`}>
                    <button 
                      onClick={() => setCurrentNotebookId(nb.id!)}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-brand-text dark:text-brand-text-dark"
                    >
                      <Folder size={16} className="text-brand-secondary shrink-0" />
                      <span className="truncate">{nb.name}</span>
                    </button>
                    <div className="flex items-center pr-2">
                      <span className="text-xs text-brand-secondary mr-2">{getNotebookPageCount(nb.id!)}</span>
                      {notebookFolders.length > 0 && (
                        <button onClick={() => toggleNotebookExpand(nb.id!)} className="text-brand-secondary hover:text-brand-text">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && notebookFolders.length > 0 && (
                    <ul className="pl-6 space-y-0.5">
                      {notebookFolders.map(folder => (
                        <li key={folder.id}>
                          <button
                            onClick={() => { setCurrentNotebookId(nb.id!); setCurrentFolderId(folder.id!); }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded hover:bg-brand-accent/10 text-xs ${currentFolderId === folder.id ? 'bg-brand-accent/15 font-semibold text-brand-text' : 'text-brand-secondary dark:text-brand-secondary-dark'}`}
                          >
                            <span className="truncate">/ {folder.name}</span>
                            <span>{getFolderPageCount(folder.id!)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {isExpanded && (
                    <div className="pl-6 py-0.5">
                      <button 
                        onClick={() => handleNewFolder(nb.id!)}
                        className="text-xs text-brand-secondary hover:text-brand-text flex items-center gap-1 py-1"
                      >
                        <Plus size={12} /> New Folder
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2 text-xs font-bold uppercase tracking-wider text-brand-secondary dark:text-brand-secondary-dark">
            <span>Tags</span>
            <button onClick={handleNewTag} className="hover:text-brand-text dark:hover:text-brand-text-dark p-0.5 rounded">
              <Plus size={14} />
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {tags.map(t => (
              <li key={t.id}>
                <button className="w-full flex items-center justify-between px-3 py-1.5 rounded hover:bg-brand-accent/10 text-brand-text dark:text-brand-text-dark">
                  <span className="flex items-center gap-2 text-brand-secondary"><Tag size={14} /> #{t.name}</span>
                  <span className="text-xs text-brand-secondary">
                    {pages.filter(p => p.tags.includes(t.name) && !p.isTrash).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-brand-border dark:border-brand-border-dark flex items-center justify-between text-brand-secondary dark:text-brand-secondary-dark">
        <button className="hover:text-brand-text dark:hover:text-brand-text-dark p-1.5 rounded">
          <Settings size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs">Synced</span>
          <RefreshCw size={14} className="animate-spin text-brand-success" />
        </div>
      </div>
    </div>
  );
};
