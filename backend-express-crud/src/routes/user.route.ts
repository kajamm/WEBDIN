import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser, resetPassword } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { roleMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Melindungi seluruh endpoint user di bawah ini agar hanya dapat diakses oleh role admin
router.use(authMiddleware as any);
router.use(roleMiddleware(['admin']) as any);

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/reset-password', resetPassword);

export default router;
