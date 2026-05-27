import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import { setEntityType } from "../middleware/setEntityType";
import upload from "../middleware/multer.middleware";
import {
  createGif,
  deleteGif,
  getAllGifs,
  updateGif,
} from "../controllers/gif.controller";

const router = Router();

router.get("/", getAllGifs);

router.post(
  "/",
  authenticateUser,
  setEntityType("gifs"),
  upload.single("image"),
  createGif
);

router.put(
  "/gifId/:id",
  authenticateUser,
  setEntityType("gifs"),
  upload.single("image"),
  updateGif
);

router.delete("/gifId/:id", authenticateUser, deleteGif);

export default router;
