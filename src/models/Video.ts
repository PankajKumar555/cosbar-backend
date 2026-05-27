import mongoose, { Document, Model } from "mongoose";

interface IVideo extends Document {
  categoryName: string;
  categoryId: number;
  productName: string;
  product: mongoose.Schema.Types.ObjectId;
  videoName: string;
  videoId: number;
  views: number;
  video: string;
}

const videoSchema = new mongoose.Schema<IVideo>({
  categoryName: { type: String, required: true },
  categoryId: { type: Number || String, required: true },
  productName: { type: String, required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  videoName: { type: String, required: true },
  videoId: { type: Number || String, required: true, unique: true },
  views: { type: Number || String, required: true, unique: true },
  video: { type: String, required: true },
});

export const Video: Model<IVideo> = mongoose.model<IVideo>(
  "Video",
  videoSchema
);
