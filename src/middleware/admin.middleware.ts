import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { config } from "../config/env";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const checkAdminExists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    // Check if any admin exists in the system
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      // No admin exists — allow first user creation as admin
      // The first user created will automatically get admin role
      return next();
    }

    // Admin exists — require valid admin token for this action
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, config.jwtSecret);

    // Check if the token belongs to an admin
    const requestingUser = await User.findById(decoded.id);
    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ message: "Only Admin has permissions." });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Hard admin gate for admin-panel-only data (all orders, all carts).
// Unlike checkAdminExists this NEVER falls through: no valid admin token, no access.
// The role is re-read from the database because the claim inside the token can be
// stale (a user demoted after their token was issued would still carry role:"admin").
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, config.jwtSecret);

    // Public-site customers live in the PublicUser collection, so their id never
    // resolves here — their tokens are rejected by this lookup alone.
    const requestingUser = await User.findById(decoded.id);

    if (!requestingUser || requestingUser.role !== "admin") {
      return res.status(403).json({ message: "Only Admin has permissions." });
    }

    req.user = {
      id: String(requestingUser._id),
      email: requestingUser.email,
      name: requestingUser.username,
      role: requestingUser.role,
    };

    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
