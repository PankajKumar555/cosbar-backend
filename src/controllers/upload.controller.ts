import { Request, Response } from "express";
import fs from "fs";
import path from "path";

export const uploadImage = async (
  req: Request,
  res: Response
): Promise<any> => {
  // Get the entity type (categories, products, banners, etc.) from the request body or params
  const { entityType } = req.body; // Assuming you're sending `entityType` in the request body
  console.log("Entity Type:", entityType);
  // If no entityType is provided, return an error
  if (!entityType) {
    return res
      .status(400)
      .json({ success: false, message: "Entity type is required" });
  }

  // Ensure the entity type is a valid one (optional but recommended)
  const validEntityTypes = ["categories", "products", "banners"]; // Define valid entity types here
  if (!validEntityTypes.includes(entityType)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid entity type" });
  }

  // Check if a file was uploaded
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  // Construct the folder path dynamically
  const folderPath = `uploads/${entityType}`;

  // Construct the URL to the uploaded image
  const imageUrl = `${req.protocol}://${req.get("host")}/${folderPath}/${
    req.file.filename
  }`;

  // Optionally, you can verify the file type here to ensure it's an image or a specific format

  try {
    // Send success response with the image URL
    res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    console.error("Error while uploading image:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
