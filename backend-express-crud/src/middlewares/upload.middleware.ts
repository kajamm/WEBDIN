// [Pertemuan 12 - Bagian 4: Middleware Upload Foto]
// Multer membaca request multipart/form-data. File TIDAK disimpan sebagai
// binary di database — database hanya menyimpan nama file/path-nya saja.
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/mahasiswa");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `mhs-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("File harus berupa JPG, PNG, atau WEBP"));
  }

  cb(null, true);
};

export const uploadFotoMahasiswa = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // maksimal 2 MB
  },
});
