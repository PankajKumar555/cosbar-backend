import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const entityType = (req as any).entityType || "default";
    if (!entityType) {
      return cb(new Error("Missing entity type"), "null");
    }
    const uploadPath = path.join(__dirname, `../../uploads/${entityType}`);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB
  const fileSize = parseInt(req.headers["content-length"] || "0", 10);

  if (file.mimetype.startsWith("image/")) {
    if (fileSize > maxImageSize) {
      return cb(new Error("Image size must be ≤ 10MB"), false);
    }
    return cb(null, true);
  }

  if (file.mimetype.startsWith("video/")) {
    if (fileSize > maxVideoSize) {
      return cb(new Error("Video size must be ≤ 50MB"), false);
    }
    return cb(null, true);
  }

  return cb(new Error("Only image and video files are allowed!"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});
export default upload;
