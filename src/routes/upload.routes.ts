import { Router } from "express";
import upload from "../middleware/multer.middleware";
import { uploadImage } from "../controllers/upload.controller";

const router = Router();

router.post("/upload", upload.single("image"), uploadImage);

export default router;
