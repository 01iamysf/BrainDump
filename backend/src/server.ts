import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { register, login, refresh, logout } from './controllers/authController';
import { 
  getNotebooks, createNotebook, getNotebookById, updateNotebook, deleteNotebook 
} from './controllers/notebookController';
import { 
  createNote, getNoteById, updateNote, deleteNote, searchNotes 
} from './controllers/noteController';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rate Limiting (Brute-force protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Authentication Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/auth/refresh', refresh);
app.post('/api/auth/logout', logout);

// Notebook Routes (Protected)
app.get('/api/notebooks', authenticateToken as any, getNotebooks as any);
app.post('/api/notebooks', authenticateToken as any, createNotebook as any);
app.get('/api/notebooks/:id', authenticateToken as any, getNotebookById as any);
app.put('/api/notebooks/:id', authenticateToken as any, updateNotebook as any);
app.delete('/api/notebooks/:id', authenticateToken as any, deleteNotebook as any);

// Note/Page Routes (Protected)
app.post('/api/notes', authenticateToken as any, createNote as any);
app.get('/api/notes/:id', authenticateToken as any, getNoteById as any);
app.put('/api/notes/:id', authenticateToken as any, updateNote as any);
app.delete('/api/notes/:id', authenticateToken as any, deleteNote as any);

// Search Route (Protected)
app.post('/api/search', authenticateToken as any, searchNotes as any);

// Server start
app.listen(PORT, () => {
  console.log(`BrainDump Secure Backend running on port ${PORT}`);
});
