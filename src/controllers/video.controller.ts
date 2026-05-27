import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { Video } from "../models/Video";
import { Product } from "../models/Product";

export const getVideo = async (_req: Request, res: Response): Promise<any> => {
  try {
    const videos = await Video.find().lean().populate("product").exec();
    return res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createVideo = async (
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
        .json({ success: false, message: "video file is required." });
    }

    const videoUrl = `${req.protocol}://${req.get("host")}/uploads/videos/${
      req.file.filename
    }`;

    const newVideo = new Video({
      ...req.body,
      product: product._id,
      video: videoUrl,
    });

    const saved = await newVideo.save();

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Error creating video:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateVideo = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { videoName, videoId, views } = req.body;
    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: "Video ID is required" });
    }
    const updateData: any = {
      videoName,
      views,
    };
    const existingVideo = await Video.findOne({ videoId });

    if (!existingVideo) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }
    if (req.file) {
      const oldVideoPath = existingVideo.video?.split("/uploads/videos/")[1];
      if (oldVideoPath) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/videos",
          oldVideoPath
        );
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      const newVideoUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/videos/${req.file.filename}`;
      updateData.video = newVideoUrl;
    }

    const updatedVideo = await Video.findOneAndUpdate(
      { videoId: videoId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedVideo) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    res.status(200).json({ success: true, data: updatedVideo });
  } catch (error) {
    console.error("Error updating video:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteVideo = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { id: videoId } = req.params;
    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: "Video ID is required" });
    }
    const video = await Video.findOne({ videoId });

    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }
    const videoUrl = video.video;
    if (videoUrl) {
      const videoFileName = videoUrl?.split("/uploads/videos/")[1];
      if (videoFileName) {
        const fullPath = path.join(
          __dirname,
          "../../uploads/videos",
          videoFileName
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

    const deleteVideo = await Video.deleteOne({ videoId: videoId });

    if (!deleteVideo) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
