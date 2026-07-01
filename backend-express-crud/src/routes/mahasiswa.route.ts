import { Router } from 'express';
import { getMahasiswa, createMahasiswa, updateMahasiswa, deleteMahasiswa } from '../controllers/mahasiswa.controller';
import upload from '../middlewares/upload.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Melindungi semua endpoint mahasiswa di bawah ini
router.use(authMiddleware as any);

router.get('/', getMahasiswa);
router.post('/', upload.single('foto'), createMahasiswa);
router.put('/:id', upload.single('foto'), updateMahasiswa);
router.delete('/:id', deleteMahasiswa);

export default router;
