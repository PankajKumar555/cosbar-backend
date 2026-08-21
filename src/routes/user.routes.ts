import { Router } from "express";
import {
  createUser,
  getAllUsers,
  loginUser,
  updateUser,
  deleteUser,
  signupUser,
  loginPublicUser,
  forgotPassword,
} from "../controllers/user.controller";
import { checkAdminExists } from "../middleware/admin.middleware";

const router = Router();

router.post("/public/signup", signupUser);
router.post("/public/login", loginPublicUser);
router.post("/public/forgot-password", forgotPassword);

router.post("/signup", checkAdminExists, createUser);
router.post("/login", loginUser);
router.get("/allUsers", checkAdminExists, getAllUsers);
router.put("/userId/:id", checkAdminExists, updateUser);
router.delete("/userId/:id", checkAdminExists, deleteUser);

export default router;
