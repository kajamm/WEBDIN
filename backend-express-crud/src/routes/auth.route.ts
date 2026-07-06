// [Pertemuan 13 - Bagian 9: Route Auth]
import { Router } from "express";
import { register, login, logout } from "../controllers/auth.controller";
import { requestPasswordReset } from "../controllers/user.controller";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// [Pertemuan 15 - Bagian 7] bonus/opsional: forgot password via email
router.post("/forgot-password", requestPasswordReset);

export default router;
