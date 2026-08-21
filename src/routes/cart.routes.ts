import { Router } from "express";

import { authenticateUser, optionalAuth } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  clearCart,
  deleteCartById,
  getAdminCartById,
  getAllCarts,
  getCart,
  getCartStats,
  saveCart,
  validateCart,
} from "../controllers/cart.controller";

const router = Router();

// Admin routes first, and "/admin/stats" before "/admin/:id", so neither is
// swallowed by the parameterised route.
router.get("/admin", requireAdmin, getAllCarts);
router.get("/admin/stats", requireAdmin, getCartStats);
router.get("/admin/:id", requireAdmin, getAdminCartById);
router.delete("/admin/:id", requireAdmin, deleteCartById);

// Storefront routes: resolve a single cart from the token or a guestId.
router.get("/", optionalAuth, getCart);
router.post("/", optionalAuth, saveCart);
router.post("/validate", authenticateUser, validateCart);
router.delete("/", optionalAuth, clearCart);

export default router;
