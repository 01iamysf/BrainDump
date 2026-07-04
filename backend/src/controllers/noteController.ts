import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { z } from 'zod';

const noteSchema = z.object({
  notebookId: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  pageData: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional()
});

const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    notebookId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional()
  }).optional()
});

export async function createNote(req: AuthRequest, res: Response) {
  try {
    const data = noteSchema.parse(req.body);

    // Verify notebook belongs to user
    const notebook = await prisma.notebook.findFirst({
      where: { id: data.notebookId, userId: req.userId }
    });

    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found or access denied' });
    }

    const note = await prisma.note.create({
      data: {
        notebookId: data.notebookId,
        title: data.title || 'Untitled Note',
        content: data.content || '',
        pageData: data.pageData || JSON.stringify([]),
        tags: data.tags || [],
        isPinned: data.isPinned || false,
        isFavorite: data.isFavorite || false
      }
    });

    return res.status(201).json(note);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getNoteById(req: AuthRequest, res: Response) {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: req.params.id as string,
        notebook: { userId: req.userId }
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    return res.json(note);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateNote(req: AuthRequest, res: Response) {
  try {
    const data = noteSchema.partial().parse(req.body);

    const note = await prisma.note.findFirst({
      where: {
        id: req.params.id as string,
        notebook: { userId: req.userId }
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const updated = await prisma.note.update({
      where: { id: req.params.id as string },
      data: {
        title: data.title,
        content: data.content,
        pageData: data.pageData,
        tags: data.tags,
        isPinned: data.isPinned,
        isFavorite: data.isFavorite
      }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function deleteNote(req: AuthRequest, res: Response) {
  try {
    const note = await prisma.note.findFirst({
      where: {
        id: req.params.id as string,
        notebook: { userId: req.userId }
      }
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await prisma.note.delete({
      where: { id: req.params.id as string }
    });

    return res.json({ message: 'Note deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// POST /api/search with filters
export async function searchNotes(req: AuthRequest, res: Response) {
  try {
    const { query, filters } = searchSchema.parse(req.body);

    const whereClause: any = {
      notebook: { userId: req.userId }
    };

    if (filters?.notebookId) {
      whereClause.notebookId = filters.notebookId;
    }

    if (filters?.tags && filters.tags.length > 0) {
      whereClause.tags = { hasSome: filters.tags };
    }

    if (filters?.dateFrom || filters?.dateTo) {
      whereClause.createdAt = {};
      if (filters.dateFrom) {
        whereClause.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        whereClause.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } }
      ];
    }

    const notes = await prisma.note.findMany({
      where: whereClause,
      include: { notebook: { select: { title: true } } }
    });

    return res.json(notes);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}
