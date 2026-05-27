import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware";
import upload from "../middleware/multer.middleware";
import { setEntityType } from "../middleware/setEntityType";
import {
  createBanners,
  deleteBanners,
  getBanners,
  updateBanners,
} from "../controllers/banner.controller";

const router = Router();

router.get("/", getBanners);
router.post(
  "/",
  authenticateUser,
  setEntityType("banners"),
  upload.single("image"),
  createBanners
);
router.put(
  "/bannerId/:id",
  authenticateUser,
  setEntityType("banners"),
  upload.single("image"),
  updateBanners
);
router.delete("/bannerId/:id", authenticateUser, deleteBanners);

export default router;
