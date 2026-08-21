import mongoose, { Document, Model, Schema } from "mongoose";

interface IProduct extends Document {
  productName: string;
  subHeading: string;
  productId: number;
  price?: number;
  category: string;
  productType?: string;
  categoryId: number;
  view: number;
  rating: number;
  verifiedRating?: number;
  keyPoints: string[];
  benefits: string[];
  weights: string[];
  productHighlights: string[];
  images: string[];
}

const productSchema = new Schema<IProduct>(
  {
    productName: { type: String, required: true },
    subHeading: { type: String, required: true },
    productId: { type: Number, required: true, unique: true },
    price: { type: Number },
    productType: { type: String },
    category: { type: String, required: true },
    categoryId: { type: Number, required: true },
    view: { type: Number, required: true },
    rating: { type: Number, required: true },
    verifiedRating: { type: Number },
    keyPoints: { type: [String], required: true },
    benefits: { type: [String], required: true },
    weights: { type: [Number], required: true },
    productHighlights: { type: [String], required: true },
    images: { type: [String], required: true },
  },
  { timestamps: true },
);

// Indexes for faster queries
productSchema.index({ categoryId: 1 });
productSchema.index({ productName: "text", category: "text" });

export const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema,
);
