import express from 'express';
import cors from 'cors';
import path from 'path';
import mahasiswaRoutes from './routes/mahasiswa.route';
import prodiRoutes from './routes/prodi.route';

const app = express();

// Configure CORS to accept requests from our Next.js frontend (ports 3000 and 3001)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

// Express built-in body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/prodi', prodiRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend Express.js CRUD Mahasiswa berjalan' });
});

export default app;
