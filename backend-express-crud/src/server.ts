import app from './app';
import { initDb } from './config/database';

const PORT = process.env.PORT || 5000;

// Initialize database (run migrations/seeding) before launching the server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
