import { Router } from 'express';
import { getAllProdi } from '../controllers/prodi.controller';

const router = Router();

router.get('/', getAllProdi);

export default router;
