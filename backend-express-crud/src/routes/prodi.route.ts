// [Pertemuan 12 - Bagian 5: Route Prodi]
import { Router } from "express";
import { getAllProdi } from "../controllers/prodi.controller";

const router = Router();

router.get("/", getAllProdi);

export default router;
