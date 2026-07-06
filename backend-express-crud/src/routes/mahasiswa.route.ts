// Route ini menggabungkan 3 pertemuan sekaligus:
// - [Pertemuan 12 - Bagian 8] upload foto pakai uploadFotoMahasiswa
// - [Pertemuan 13 - Bagian 8] semua endpoint jadi protected route (authMiddleware)
// - [Pertemuan 14 - Bagian 4] dibatasi per role (allowRoles) sesuai matriks:
//     GET    -> admin, operator, viewer
//     POST   -> admin, operator
//     PUT    -> admin, operator
//     DELETE -> admin saja
import { Router } from "express";
import {
  getAllMahasiswa,
  createMahasiswa,
  updateMahasiswa,
  deleteMahasiswa,
} from "../controllers/mahasiswa.controller";
import { uploadFotoMahasiswa } from "../middlewares/upload.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { allowRoles } from "../middlewares/role.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  allowRoles("admin", "operator", "viewer"),
  getAllMahasiswa
);

router.post(
  "/",
  authMiddleware,
  allowRoles("admin", "operator"),
  uploadFotoMahasiswa.single("foto"),
  createMahasiswa
);

router.put(
  "/:id",
  authMiddleware,
  allowRoles("admin", "operator"),
  uploadFotoMahasiswa.single("foto"),
  updateMahasiswa
);

router.delete(
  "/:id",
  authMiddleware,
  allowRoles("admin"),
  deleteMahasiswa
);

export default router;
