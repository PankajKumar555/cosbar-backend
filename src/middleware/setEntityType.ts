import { Request, Response, NextFunction } from "express";

const validEntityTypes = [
  "categories",
  "products",
  "banners",
  "videos",
  "reviews",
  "gifs",
];

export const setEntityType = (entityType: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!validEntityTypes.includes(entityType)) {
      res.status(400).json({ success: false, message: "Invalid entity type" });
      return;
    }

    (req as any).entityType = entityType;
    next();
  };
};
