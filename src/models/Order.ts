import mongoose, { Document, Model, Schema, Types } from "mongoose";

export const PAYMENT_METHODS = [
  "razorpay",
  "card",
  "upi",
  "netbanking",
  "cash",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus = "created" | "confirmed" | "completed" | "cancelled";

export interface IOrderItem {
  productId: number;
  categoryId: number;
  quantity: number;
  unitPrice: number;
  title: string;
  category: string;
  image?: string;
  subtotal: number;
}

export interface IOrderShipping {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface IOrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  providerReference?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  email: string;
  items: IOrderItem[];
  shipping: IOrderShipping;
  payment: IOrderPayment;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  note?: string;
  rawCart?: unknown;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Number, required: true },
    categoryId: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String },
    subtotal: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    shipping: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: PAYMENT_METHODS,
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        required: true,
      },
      transactionId: { type: String },
      providerReference: { type: String },
    },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR", required: true },
    status: {
      type: String,
      enum: ["created", "confirmed", "completed", "cancelled"],
      default: "created",
      required: true,
    },
    note: { type: String },
    rawCart: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Order: Model<IOrder> = mongoose.model<IOrder>(
  "Order",
  orderSchema,
);
