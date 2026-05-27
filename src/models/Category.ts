import mongoose, { Document, Model } from "mongoose";

interface ICategory extends Document {
  categoryName: string;
  categoryId: number;
  image: string;
}

const categorySchema = new mongoose.Schema<ICategory>({
  categoryName: { type: String, required: true },
  categoryId: { type: Number || String, required: true, unique: true },
  image: { type: String, required: true },
});

export const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema
);
