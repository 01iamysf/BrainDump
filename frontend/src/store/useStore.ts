import { create } from 'zustand';

interface AppState {
  currentNotebookId: string | null;
  currentFolderId: string | null;
  currentPageId: string | null;
  activeTool: 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'shapes' | 'text';
  penColor: string;
  penWidth: number;
  searchQuery: string;
  filterTag: string | null;
  sidebarOpen: boolean;
  darkMode: boolean;
  
  setCurrentNotebookId: (id: string | null) => void;
  setCurrentFolderId: (id: string | null) => void;
  setCurrentPageId: (id: string | null) => void;
  setActiveTool: (tool: 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'shapes' | 'text') => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setSearchQuery: (query: string) => void;
  setFilterTag: (tag: string | null) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  currentNotebookId: 'notebook-personal',
  currentFolderId: null,
  currentPageId: 'page-project-plan',
  activeTool: 'pen',
  penColor: '#222222',
  penWidth: 2,
  searchQuery: '',
  filterTag: null,
  sidebarOpen: true,
  darkMode: false,

  setCurrentNotebookId: (id) => set({ currentNotebookId: id, currentFolderId: null }),
  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  setCurrentPageId: (id) => set({ currentPageId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleDarkMode: () => set((state) => {
    const nextMode = !state.darkMode;
    if (nextMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { darkMode: nextMode };
  }),
}));
