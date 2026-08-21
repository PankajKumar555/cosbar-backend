import { Router } from "express";
import {
  getAdminOrderById,
  getAllOrders,
  getOrderById,
  getOrderStats,
  getOrders,
  payOrder,
  placeOrder,
  updateOrderStatus,
} from "../controllers/order.controller";
import { authenticateUser } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

// Admin routes must be registered before the storefront "/:id" route below,
// otherwise "/orders/admin" is captured by "/:id" and parsed as an order id.
// Likewise "/admin/stats" has to precede "/admin/:id".
router.get("/admin", requireAdmin, getAllOrders);
router.get("/admin/stats", requireAdmin, getOrderStats);
router.get("/admin/:id", requireAdmin, getAdminOrderById);
router.patch("/admin/:id/status", requireAdmin, updateOrderStatus);

// Storefront routes: scoped to the authenticated customer.
router.post("/", authenticateUser, placeOrder);
router.post("/:id/pay", authenticateUser, payOrder);
router.get("/", authenticateUser, getOrders);
router.get("/:id", authenticateUser, getOrderById);

export default router;
