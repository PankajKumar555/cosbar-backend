import { Request, Response } from "express";
import { Review } from "../models/Review";
import { Product } from "../models/Product";
import path from "path";
import fs from "fs";

export const getAllReviews = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const reviews = await Review.find().lean().populate("product").exec();

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId is required." });
    }

    const product = await Product.findOne({ productId: productId });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required." });
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/reviews/${
      req.file.filename
    }`;

    const newReview = new Review({
      ...req.body,
      product: product._id,
      image: imageUrl,
    });

    const saved = await newReview.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const reviewId = req.params.id;
    const { ...restFields } = req.body;

    if (!reviewId) {
      return res
        .status(400)
        .json({ success: false, message: "Review ID is required" });
    }
    const updateData: any = {
      ...restFields,
    };
    const existingReview = await Review.findOne({ _id: reviewId });

    if (!existingReview) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    if (req.file) {
      const oldImagePath = existingReview.image?.split("/uploads/reviews/")[1];
      if (oldImagePath) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/reviews",
          oldImagePath
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const newImageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/reviews/${req.file.filename}`;
      updateData.image = newImageUrl;
    }

    const updatedReview = await Review.findOneAndUpdate(
      { _id: reviewId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedReview) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res.status(200).json({ success: true, data: updatedReview });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteReview = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const reviewId = req.params.id;

    if (!reviewId) {
      return res
        .status(400)
        .json({ success: false, message: "Review ID is required" });
    }
    const review = await Review.findOne({ _id: reviewId });

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }
    const imageUrl = review.image;
    if (imageUrl) {
      const imageFileName = imageUrl?.split("/uploads/reviews/")[1];
      if (imageFileName) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/reviews",
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

    const deleteReview = await Review.deleteOne({ _id: reviewId });

    if (!deleteReview) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
