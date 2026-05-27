import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "TLR2bdJBqp6VZCiRzeLscqzdPUyKjmRQLV7zPj35aDpZmMAtTmB9cPPmd8BNtkc1cHo0HRBi2GuNhj2pwvf9";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const checkAdminExists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const vishalUser = await User.findOne({ email: "vishal@salontym.com" });

    if (!vishalUser) {
      const { email } = req.body;

      if (email !== "vishal@salontym.com") {
        return res.status(403).json({
          message: "Only Admin can be created as first user",
        });
      }
      return next();
    }

    // Case 2:
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (decoded?.email !== "vishal@salontym.com") {
      return res.status(403).json({ message: "Only Admin have permissions." });
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
