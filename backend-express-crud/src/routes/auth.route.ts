import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', (req, res) => {
  // Logout hanya mengembalikan response sukses karena JWT bersifat stateless.
  return res.status(200).json({
    success: true,
    message: 'Logout berhasil'
  });
});

export default router;
