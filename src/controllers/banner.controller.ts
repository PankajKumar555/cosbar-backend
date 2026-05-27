import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Banner } from "../models/Banner";

export const getBanners = async (_req: Request, res: Response) => {
  const banners = await Banner.find();
  res.json(banners);
};

export const createBanners = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required." });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/banners/${
      req.file.filename
    }`;

    const newBanner = new Banner({
      ...req.body,
      image: imageUrl,
    });

    const saved = await newBanner.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateBanners = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { bannerId, bannerName } = req.body;
    if (!bannerId) {
      return res
        .status(400)
        .json({ success: false, message: "banner ID is required" });
    }

    const existingBanner = await Banner.findOne({ bannerId });

    if (!existingBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const updateData: any = {
      bannerId,
    };

    if (bannerName) {
      updateData.bannerName = bannerName;
    }

    if (req.file) {
      const oldImagePath = existingBanner.image?.split("/uploads/banners/")[1];
      if (oldImagePath) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/banners",
          oldImagePath
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const newImageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/banners/${req.file.filename}`;
      updateData.image = newImageUrl;
    }

    const updatedBanner = await Banner.findOneAndUpdate(
      { bannerId: bannerId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res.status(200).json({ success: true, data: updatedBanner });
  } catch (error) {
    console.error("Error updating Banner:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteBanners = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id: bannerId } = req.params;
    if (!bannerId) {
      return res
        .status(400)
        .json({ success: false, message: "Banner ID is required" });
    }
    const banner = await Banner.findOne({ bannerId });

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    const imageUrl = banner.image;
    if (imageUrl) {
      const imageFileName = imageUrl?.split("/uploads/Banners/")[1];
      if (imageFileName) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/Banners",
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

    const deleteBanner = await Banner.deleteOne({ bannerId: bannerId });

    if (!deleteBanner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting Banner:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
