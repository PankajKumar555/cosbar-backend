import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGif extends Document {
  name: string;
  categoryName: string;
  categoryId: number;
  productName: string;
  productId: number;
  image?: string;
}

const gifSchema: Schema<IGif> = new Schema(
  {
    name: { type: String, required: true },
    categoryName: { type: String, required: true },
    categoryId: { type: Number, required: true },
    productName: { type: String, required: true },
    productId: { type: Number, required: true },
    image: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Gif: Model<IGif> = mongoose.model<IGif>("Gif", gifSchema);
