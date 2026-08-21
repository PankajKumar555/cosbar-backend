import { Request, Response } from "express";
import { Product } from "../models/Product";
import fs from "fs";
import path from "path";

// GET all products
export const getProducts = async (
  _req: Request,
  res: Response,
): Promise<any> => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ productId: Number(id) });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProductsByCategory = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ categoryId: Number(categoryId) });

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for this category" });
    }

    res.json(products);
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one image is required." });
    }

    const imageUrls = files.map((file) => {
      const entityType = (req as any).entityType || "products";
      return `${req.protocol}://${req.get("host")}/uploads/${entityType}/${file.filename}`;
    });

    const parseArray = (field: any): string[] => {
      if (Array.isArray(field)) return field;
      if (typeof field === "string") return [field];
      return [];
    };

    const {
      productName,
      productId,
      subHeading,
      price,
      category,
      categoryId,
      view,
      rating,
      verifiedRating,
      keyPoints,
      benefits,
      weights,
      productType,
      productHighlights,
    } = req.body;

    const newProduct = new Product({
      productId,
      productName,
      subHeading,
      price,
      category,
      categoryId,
      view,
      rating,
      verifiedRating,
      productType,
      keyPoints: parseArray(keyPoints),
      benefits: parseArray(benefits),
      weights: parseArray(weights),
      productHighlights: parseArray(productHighlights),
      images: imageUrls,
    });

    const saved = await newProduct.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { productId, imageUrls = [], ...restFields } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findOne({ productId });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const existingImages = product.images || [];

    // Delete removed images from disk
    const removedImages = existingImages.filter(
      (img) => !imageUrls.includes(img),
    );
    removedImages.forEach((url: string) => {
      const filename = url.split("/uploads/products/")[1];
      if (filename) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/products",
          filename,
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });

    let updatedImages = [...imageUrls];

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        const newImageUrl = `${req.protocol}://${req.get("host")}/uploads/products/${file.filename}`;
        updatedImages.push(newImageUrl);
      });
    }

    const allowedFields = [
      "productName",
      "subHeading",
      "price",
      "category",
      "categoryId",
      "view",
      "rating",
      "verifiedRating",
      "keyPoints",
      "benefits",
      "weights",
      "productHighlights",
      "productType",
    ];

    const updateData: any = { images: updatedImages };

    allowedFields.forEach((field) => {
      if (restFields[field] !== undefined) {
        updateData[field] = restFields[field];
      }
    });

    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      { $set: updateData },
      { new: true },
    );

    return res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required" });
    }

    const product = await Product.findOne({ productId });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Clean up image files
    const imageUrls = product.images || [];
    imageUrls.forEach((url: string) => {
      const imageFileName = url?.split("/uploads/products/")[1];
      if (imageFileName) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/products",
          imageFileName,
        );
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (error) {
            console.error(
              `Failed to delete image file: ${imageFileName}`,
              error,
            );
          }
        }
      }
    });

    await Product.deleteOne({ productId });

    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting Product:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
