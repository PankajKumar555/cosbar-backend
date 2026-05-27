import mongoose, { Document, Model } from "mongoose";

interface IBanner extends Document {
  category: string;
  categoryId: number;
  productName: string;
  productId: number;
  bannerName: string;
  bannerId: number;
  image: string;
}

const bannerSchema = new mongoose.Schema<IBanner>({
  category: { type: String, required: true },
  categoryId: { type: Number || String, required: true },
  productName: { type: String, required: true },
  productId: { type: Number || String, required: true },
  bannerName: { type: String, required: true },
  bannerId: { type: Number || String, required: true, unique: true },
  image: { type: String, required: true },
});

export const Banner: Model<IBanner> = mongoose.model<IBanner>(
  "Banner",
  bannerSchema
);
