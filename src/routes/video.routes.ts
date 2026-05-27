import { Router } from "express";

import { authenticateUser } from "../middleware/auth.middleware";
import upload from "../middleware/multer.middleware";
import { setEntityType } from "../middleware/setEntityType";
import {
  createVideo,
  deleteVideo,
  getVideo,
  updateVideo,
} from "../controllers/video.controller";

const router = Router();

router.get("/", getVideo);
router.post(
  "/",
  authenticateUser,
  setEntityType("videos"),
  upload.single("video"),
  createVideo
);
router.put(
  "/videoId/:id",
  authenticateUser,
  setEntityType("videos"),
  upload.single("video"),
  updateVideo
);
router.delete("/videoId/:id", authenticateUser, deleteVideo);

export default router;
