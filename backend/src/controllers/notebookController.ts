import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { z } from 'zod';

const notebookSchema = z.object({
  title: z.string().min(1),
  cover: z.string().optional(),
  type: z.string().optional()
});

export async function getNotebooks(req: AuthRequest, res: Response) {
  try {
    const notebooks = await prisma.notebook.findMany({
      where: { userId: req.userId },
      include: { _count: { select: { notes: true } } }
    });
    return res.json(notebooks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createNotebook(req: AuthRequest, res: Response) {
  try {
    const { title, cover, type } = notebookSchema.parse(req.body);
    const notebook = await prisma.notebook.create({
      data: {
        title,
        cover,
        type: type || 'notebook',
        userId: req.userId!
      }
    });
    return res.status(201).json(notebook);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function getNotebookById(req: AuthRequest, res: Response) {
  try {
    const notebook = await prisma.notebook.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
      include: { notes: true }
    });

    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    return res.json(notebook);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateNotebook(req: AuthRequest, res: Response) {
  try {
    const { title, cover, type } = notebookSchema.parse(req.body);
    const notebook = await prisma.notebook.findFirst({
      where: { id: req.params.id as string, userId: req.userId }
    });

    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    const updated = await prisma.notebook.update({
      where: { id: req.params.id as string },
      data: { title, cover, type }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
}

export async function deleteNotebook(req: AuthRequest, res: Response) {
  try {
    const notebook = await prisma.notebook.findFirst({
      where: { id: req.params.id as string, userId: req.userId }
    });

    if (!notebook) {
      return res.status(404).json({ error: 'Notebook not found' });
    }

    await prisma.notebook.delete({
      where: { id: req.params.id as string }
    });

    return res.json({ message: 'Notebook deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
