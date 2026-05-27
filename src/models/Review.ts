import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  name: string;
  heading: string;
  content: string;
  image?: string;
  rating: number;
  product: mongoose.Schema.Types.ObjectId;
  recommended: boolean;
}

const reviewSchema: Schema<IReview> = new Schema({
  name: {
    type: String,
    required: true,
  },
  heading: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
});

export const Review: Model<IReview> = mongoose.model<IReview>(
  "Review",
  reviewSchema
);
