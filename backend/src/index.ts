import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import cardRoutes from './routes/card.routes';
import attachmentRoutes from './routes/attachment.routes';
import lookupRoutes from './routes/lookup.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api', attachmentRoutes);
app.use('/api', lookupRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BNCC Proker Kanban API Server' });
});

const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      next();
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
