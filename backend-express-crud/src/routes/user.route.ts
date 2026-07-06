// [Pertemuan 15 - Bagian 6: Route User Khusus Admin]
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/role.middleware";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPasswordByAdmin,
} from "../controllers/user.controller";

const router = Router();

router.use(authMiddleware);
router.use(allowRoles("admin"));

router.get("/", getAllUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/reset-password", resetPasswordByAdmin);

export default router;
