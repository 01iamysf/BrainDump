import Dexie, { type Table } from 'dexie';

export interface Notebook {
  id?: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id?: string;
  name: string;
  notebookId: string; // References Notebook.id
  createdAt: Date;
}

export interface Page {
  id?: string;
  title: string;
  notebookId: string;
  folderId?: string; // Optional folder reference
  template: 'plain' | 'ruled' | 'dotted' | 'grid' | 'cornell' | 'checklist' | 'engineering';
  pageSize: 'A4' | 'A5' | 'Letter' | 'A3';
  orientation: 'portrait' | 'landscape';
  drawingData?: string; // JSON string of drawing coordinates/canvas strokes
  typedContent?: string; // HTML or Markdown content
  tags: string[];
  isFavorite: number; // 0 or 1 for indexing
  isPinned: number;   // 0 or 1 for indexing
  isArchived: number; // 0 or 1 for indexing
  isTrash: number;    // 0 or 1 for indexing
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id?: string;
  name: string;
}

class BrainDumpDexie extends Dexie {
  notebooks!: Table<Notebook>;
  folders!: Table<Folder>;
  pages!: Table<Page>;
  tags!: Table<Tag>;

  constructor() {
    super('BrainDumpDB');
    this.version(1).stores({
      notebooks: 'id, name, createdAt, updatedAt',
      folders: 'id, name, notebookId, createdAt',
      pages: 'id, title, notebookId, folderId, template, isFavorite, isPinned, isArchived, isTrash, createdAt, updatedAt',
      tags: 'id, name'
    });
  }
}

export const db = new BrainDumpDexie();

// Seed initial data if DB is empty
export async function seedInitialData() {
  const notebookCount = await db.notebooks.count();
  if (notebookCount === 0) {
    const personalId = 'notebook-personal';
    const workId = 'notebook-work';

    await db.notebooks.bulkAdd([
      { id: personalId, name: 'Personal', createdAt: new Date(), updatedAt: new Date() },
      { id: workId, name: 'Work', createdAt: new Date(), updatedAt: new Date() }
    ]);

    await db.folders.bulkAdd([
      { id: 'folder-projects', name: 'Projects', notebookId: personalId, createdAt: new Date() }
    ]);

    await db.pages.add({
      id: 'page-project-plan',
      title: 'Project Plan',
      notebookId: personalId,
      folderId: 'folder-projects',
      template: 'plain',
      pageSize: 'A4',
      orientation: 'portrait',
      tags: ['project', 'ideas'],
      isFavorite: 1,
      isPinned: 1,
      isArchived: 0,
      isTrash: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      typedContent: '',
      drawingData: JSON.stringify([])
    });

    await db.tags.bulkAdd([
      { id: 'tag-project', name: 'project' },
      { id: 'tag-ideas', name: 'ideas' }
    ]);
  }
}
