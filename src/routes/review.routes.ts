import { Router } from "express";
import {
  createReview,
  deleteReview,
  getAllReviews,
  updateReview,
} from "../controllers/review.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { setEntityType } from "../middleware/setEntityType";
import upload from "../middleware/multer.middleware";

const router = Router();

router.get("/", getAllReviews);

router.post(
  "/",
  authenticateUser,
  setEntityType("reviews"),
  upload.single("image"),
  createReview
);

router.put(
  "/reviewId/:id",
  authenticateUser,
  setEntityType("reviews"),
  upload.single("image"),
  updateReview
);

router.delete("/reviewId/:id", authenticateUser, deleteReview);

export default router;
