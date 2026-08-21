import { Request, Response } from "express";
import { Product } from "../models/Product";

export const searchProducts = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { search } = req.query;
    if (!search || typeof search !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Search key is required." });
    }

    // Search across product name and category
    const query = {
      $or: [
        { productName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { productType: { $regex: search, $options: "i" } },
      ],
    };

    const products = await Product.find(query).limit(20).lean();

    res
      .status(200)
      .json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
