import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Gif } from "../models/Gif";

export const getAllGifs = async (req: Request, res: Response): Promise<any> => {
  try {
    const gifs = await Gif.find().lean();

    return res.status(200).json(gifs);
  } catch (error) {
    console.error("Error fetching gifs:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createGif = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required." });
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/gifs/${
      req.file.filename
    }`;

    const newGif = new Gif({
      ...req.body,
      image: imageUrl,
    });

    const saved = await newGif.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating gifs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateGif = async (req: Request, res: Response): Promise<any> => {
  try {
    const gifId = req.params.id;
    const { ...restFields } = req.body;

    if (!gifId) {
      return res
        .status(400)
        .json({ success: false, message: "Gif ID is required" });
    }
    const updateData: any = {
      ...restFields,
    };
    const existingGif = await Gif.findOne({ _id: gifId });

    if (!existingGif) {
      return res
        .status(404)
        .json({ success: false, message: "Gif Image not found" });
    }
    if (req.file) {
      const oldImagePath = existingGif.image?.split("/uploads/gifs/")[1];
      if (oldImagePath) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/gifs",
          oldImagePath
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const newImageUrl = `${req.protocol}://${req.get("host")}/uploads/gifs/${
        req.file.filename
      }`;
      updateData.image = newImageUrl;
    }

    const updatedGif = await Gif.findOneAndUpdate(
      { _id: gifId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedGif) {
      return res.status(404).json({ success: false, message: "Gif not found" });
    }

    res.status(200).json({ success: true, data: updatedGif });
  } catch (error) {
    console.error("Error updating Gif:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteGif = async (req: Request, res: Response): Promise<any> => {
  try {
    const gifId = req.params.id;

    if (!gifId) {
      return res
        .status(400)
        .json({ success: false, message: "Gif ID is required" });
    }
    const gif = await Gif.findOne({ _id: gifId });

    if (!gif) {
      return res.status(404).json({ success: false, message: "Gif not found" });
    }
    const imageUrl = gif.image;
    if (imageUrl) {
      const imageFileName = imageUrl?.split("/uploads/gifs/")[1];
      if (imageFileName) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/gifs",
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

    const deleteGif = await Gif.deleteOne({ _id: gifId });

    if (!deleteGif) {
      return res.status(404).json({ success: false, message: "Gif not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Gif deleted successfully" });
  } catch (error) {
    console.error("Error deleting gif:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
