import { Request, Response } from "express";
import { Category } from "../models/Category";
import fs from "fs";
import path from "path";

export const getCategories = async (_req: Request, res: Response) => {
  const categories = await Category.find();
  res.json(categories);
};

export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ categoryId: Number(id) });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createCategories = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required." });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/categories/${
      req.file.filename
    }`;

    const newCategory = new Category({
      ...req.body,
      image: imageUrl,
    });

    const saved = await newCategory.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCategories = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { categoryName, categoryId } = req.body;
    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "Category ID is required" });
    }
    const updateData: any = {
      categoryName,
    };
    const existingCategory = await Category.findOne({ categoryId });

    if (!existingCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    if (req.file) {
      const oldImagePath = existingCategory.image?.split(
        "/uploads/categories/"
      )[1];
      if (oldImagePath) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/categories",
          oldImagePath
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const newImageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/categories/${req.file.filename}`;
      updateData.image = newImageUrl;
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { categoryId: categoryId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteCategories = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id: categoryId } = req.params;
    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "Category ID is required" });
    }
    const category = await Category.findOne({ categoryId });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    const imageUrl = category.image;
    if (imageUrl) {
      const imageFileName = imageUrl?.split("/uploads/categories/")[1];
      if (imageFileName) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/categories",
          imageFileName
        );
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (error) {
            console.log("Error deleting file:", error);
          }
        }
      }
    }

    const deleteCategory = await Category.deleteOne({ categoryId: categoryId });

    if (!deleteCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
