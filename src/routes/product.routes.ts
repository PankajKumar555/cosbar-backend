import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getProductsByCategory,
  updateProduct,
} from "../controllers/product.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { setEntityType } from "../middleware/setEntityType";
import upload from "../middleware/multer.middleware";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/category/:categoryId", getProductsByCategory);
router.post(
  "/",
  authenticateUser,
  setEntityType("products"),
  upload.array("images", 10),
  createProduct,
);
router.put(
  "/productId/:id",
  authenticateUser,
  setEntityType("products"),
  upload.array("images", 10),
  updateProduct,
);
router.delete("/productId/:id", authenticateUser, deleteProduct);

export default router;
