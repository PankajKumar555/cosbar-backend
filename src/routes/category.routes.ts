import { Router } from "express";
import {
  createCategories,
  deleteCategories,
  getCategories,
  getCategoryById,
  updateCategories,
} from "../controllers/category.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import upload from "../middleware/multer.middleware";
import { setEntityType } from "../middleware/setEntityType";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post(
  "/",
  authenticateUser,
  setEntityType("categories"),
  upload.single("image"),
  createCategories
);
router.put(
  "/categoryId/:id",
  authenticateUser,
  setEntityType("categories"),
  upload.single("image"),
  updateCategories
);
router.delete("/categoryId/:id", authenticateUser, deleteCategories);

export default router;
