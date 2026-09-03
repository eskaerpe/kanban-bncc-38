import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import boardRoutes from './routes/board.routes';
import cardRoutes from './routes/card.routes';
import lookupRoutes from './routes/lookup.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api', lookupRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BNCC Proker Kanban API Server' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
