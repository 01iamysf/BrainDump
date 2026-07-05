# BrainDump — Digital Notebook

BrainDump is a modern, offline-first digital notebook web application built to recreate the realistic feel of a physical copybook, diary, or sketchbook directly inside the browser.

---
 
## Key Features

- **Realistic Notepad Workspace**: Styled A4 pages with left-edge spiral rings, soft shadows, and warm cream paper texturing to mimic real copy paper.
- **Dynamic Paper Templates**: Support for ruled lines, dot grids, full grid patterns, and plain sheets.
- **Stylus & Handwriting Canvas**: Smooth, high-performance drawing layer built with `PointerEvents` and `perfect-freehand` for pressure-sensitive ink strokes.
- **Text & Mixed Content Overlay**: Type notes directly on the page lines or place floating, draggable sticky notes.
- **Offline-First Storage**: Powered locally in the browser by **IndexedDB** using **Dexie.js** so notes are accessible without an internet connection.
- **Secure Backend Sync**: Syncs local drafts to a Node.js + Express API backed by PostgreSQL and Prisma ORM.
- **3D Page Turn Animation**: Natural page-curl flip transitions when swiping horizontally or clicking pagination controls.

---

## Tech Stack

### Frontend
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Local DB**: Dexie.js (IndexedDB)
- **Drawing**: HTML5 Canvas + `perfect-freehand`

### Backend
- **Server**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (managed via Prisma ORM)
- **Authentication**: JWT (Access & Cookie-based Refresh Token Rotation)
- **Security**: Helmet, CORS with credentials, express-rate-limit, Zod schemas, and Argon2 password hashing.
