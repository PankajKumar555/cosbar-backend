import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ICartItem {
  productId: number;
  categoryId: number;
  quantity: number;
  price: number;
  title: string;
  category: string;
  image?: string;
  subtotal: number;
}

export interface ICart extends Document {
  user?: Types.ObjectId;
  guestId?: string;
  items: ICartItem[];
  currency: string;
  totalAmount: number;
  note?: string;
  active: boolean;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Number, required: true },
    categoryId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String },
    subtotal: { type: Number, required: true },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    guestId: { type: String },
    items: { type: [cartItemSchema], required: true },
    currency: { type: String, default: "INR", required: true },
    totalAmount: { type: Number, required: true },
    note: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Cart: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);
