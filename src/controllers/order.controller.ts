import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { Types } from "mongoose";
import { Cart } from "../models/Cart";
import {
  Order,
  OrderStatus,
  PAYMENT_METHODS,
  PaymentMethod,
  PaymentStatus,
} from "../models/Order";
import { Product } from "../models/Product";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { config } from "../config/env";
import { resolveCustomers } from "../utils/customer";

interface OrderItemPayload {
  productId: number;
  categoryId: number;
  quantity: number;
}

interface OrderRequestBody {
  cartId?: string;
  cart?: {
    items: OrderItemPayload[];
    currency?: string;
    totalAmount?: number;
  };
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod: PaymentMethod;
  note?: string;
}

const generateReference = (): string => {
  return `REF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Checkout clients use a few different spellings for the same method.
const paymentMethodAliases: Record<string, PaymentMethod> = {
  credit_card: "card",
  creditcard: "card",
  debit_card: "card",
  debitcard: "card",
  cod: "cash",
  cash_on_delivery: "cash",
  cashondelivery: "cash",
  net_banking: "netbanking",
  bank: "netbanking",
  gpay: "upi",
  phonepe: "upi",
  paytm: "upi",
};

const normalizePaymentMethod = (value: unknown): PaymentMethod | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliased = paymentMethodAliases[normalized] ?? normalized;

  return PAYMENT_METHODS.includes(aliased as PaymentMethod)
    ? (aliased as PaymentMethod)
    : null;
};

const invalidPaymentMethodMessage = (value: unknown): string =>
  `Unsupported paymentMethod "${String(value)}". Allowed values: ${PAYMENT_METHODS.join(", ")}.`;

const validateCartItems = async (
  items: OrderItemPayload[],
): Promise<{
  items: OrderItemPayload[];
  validatedItems: any[];
  totalAmount: number;
}> => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("The order must contain at least one cart item.");
  }

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    productId: { $in: productIds },
  }).lean();
  const productMap = new Map(
    products.map((product) => [product.productId, product]),
  );

  const validatedItems = items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`Product not found for ID ${item.productId}.`);
    }

    if (product.categoryId !== item.categoryId) {
      throw new Error(
        `Invalid category for product ${item.productId}. Expected ${product.categoryId} but got ${item.categoryId}.`,
      );
    }

    if (!item.quantity || item.quantity < 1) {
      throw new Error(
        `Quantity must be at least 1 for product ${item.productId}.`,
      );
    }

    if (typeof product.price !== "number") {
      throw new Error(`Product ${item.productId} does not have valid pricing.`);
    }

    return {
      productId: item.productId,
      categoryId: item.categoryId,
      quantity: item.quantity,
      unitPrice: product.price,
      title: product.productName,
      category: product.category,
      image: product.images?.[0] ?? "",
      subtotal: product.price * item.quantity,
    };
  });

  const totalAmount = validatedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  return { items, validatedItems, totalAmount };
};

const createPaymentResult = (
  method: PaymentMethod,
): {
  status: PaymentStatus;
  transactionId?: string;
  providerReference?: string;
} => {
  if (method === "cash") {
    return { status: "pending" };
  }

  const prefixes: Record<Exclude<PaymentMethod, "cash">, string> = {
    razorpay: "RAZ",
    card: "CARD",
    upi: "UPI",
    netbanking: "NB",
  };

  return {
    status: "paid",
    transactionId: generateReference(),
    providerReference: `${prefixes[method]}-${generateReference()}`,
  };
};

const sendOrderEmail = async (order: any): Promise<boolean> => {
  const messageText =
    `Order confirmed: ${order._id}\n\n` +
    `Customer: ${order.shipping.name} <${order.shipping.email}>\n` +
    `Phone: ${order.shipping.phone}\n` +
    `Address: ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}\n\n` +
    `Payment method: ${order.payment.method}\n` +
    `Payment status: ${order.payment.status}\n` +
    `Order total: ${order.currency} ${order.totalAmount.toFixed(2)}\n\n` +
    `Items:\n` +
    order.items
      .map(
        (item: any) =>
          `- ${item.title} (${item.category}) x${item.quantity} @ ${order.currency} ${item.unitPrice.toFixed(2)} = ${order.currency} ${item.subtotal.toFixed(2)}`,
      )
      .join("\n") +
    `\n\nThank you for your purchase!`;

  const htmlBody = `<h2>Order confirmed</h2>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Customer:</strong> ${order.shipping.name} &lt;${order.shipping.email}&gt;</p>
    <p><strong>Payment method:</strong> ${order.payment.method}</p>
    <p><strong>Payment status:</strong> ${order.payment.status}</p>
    <p><strong>Total amount:</strong> ${order.currency} ${order.totalAmount.toFixed(2)}</p>
    <h3>Items</h3>
    <ul>${order.items
      .map(
        (item: any) =>
          `<li>${item.title} (${item.category}) x${item.quantity} — ${order.currency} ${item.subtotal.toFixed(2)}</li>`,
      )
      .join("")}</ul>
    <p><strong>Shipping address:</strong> ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state} ${order.shipping.postalCode}</p>`;

  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.warn(
      "Email configuration missing. Order email will be printed to console.",
    );
    console.log(messageText);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  await transporter.sendMail({
    from: config.emailFrom,
    to: order.shipping.email,
    subject: `Your order ${order._id} is confirmed`,
    text: messageText,
    html: htmlBody,
  });

  return true;
};

export const placeOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;
    if (!userId || !userEmail) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const body = req.body;

    // Support both payload shapes:
    // Shape A (frontend): { items, shippingAddress, customerInfo, paymentMethod }
    // Shape B (original): { cart: { items }, shipping, paymentMethod, cartId }
    const rawItems: any[] = body.items ?? body.cart?.items;
    const paymentMethod = normalizePaymentMethod(body.paymentMethod);

    // Build unified shipping from either shape
    let shipping: OrderRequestBody["shipping"];
    if (body.shippingAddress && body.customerInfo) {
      const { firstName, lastName, email, phone } = body.customerInfo;
      const { street, city, state, zipCode } = body.shippingAddress;
      shipping = {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        address: street,
        city,
        state,
        postalCode: zipCode,
      };
    } else {
      shipping = body.shipping;
    }

    if (!shipping || !shipping.name || !shipping.email || !shipping.address) {
      res
        .status(400)
        .json({ message: "Complete shipping details are required." });
      return;
    }

    if (!body.paymentMethod) {
      res.status(400).json({ message: "paymentMethod is required." });
      return;
    }

    if (!paymentMethod) {
      res
        .status(400)
        .json({ message: invalidPaymentMethodMessage(body.paymentMethod) });
      return;
    }

    const note = body.note;
    const orderCurrency = body.cart?.currency ?? body.currency ?? "INR";

    let validatedItems: any[] = [];
    let totalAmount: number;
    let finalCart: any = null;

    if (body.cartId) {
      finalCart = await Cart.findOne({
        _id: new Types.ObjectId(body.cartId),
        user: new Types.ObjectId(userId),
      }).lean();
      if (!finalCart) {
        res.status(404).json({ message: "Cart not found." });
        return;
      }
      validatedItems = finalCart.items;
      totalAmount = finalCart.totalAmount;
    } else if (rawItems?.length) {
      const validatedResult = await validateCartItems(rawItems);
      validatedItems = validatedResult.validatedItems;
      totalAmount = validatedResult.totalAmount;
    } else {
      res.status(400).json({ message: "Cart or cartId is required." });
      return;
    }

    const payment = createPaymentResult(paymentMethod);
    const orderStatus: OrderStatus =
      paymentMethod === "cash" ? "created" : "completed";

    const order = new Order({
      user: new Types.ObjectId(userId),
      email: userEmail,
      items: validatedItems,
      shipping,
      payment: {
        method: paymentMethod,
        status: payment.status,
        transactionId: payment.transactionId,
        providerReference: payment.providerReference,
      },
      totalAmount,
      currency: orderCurrency,
      status: orderStatus,
      note,
      rawCart: body.cartId ? finalCart : body.cart,
    });

    await order.save();

    if (body.cartId) {
      await Cart.deleteOne({ _id: new Types.ObjectId(body.cartId) });
    }

    const emailSent = await sendOrderEmail(order);

    res.status(201).json({
      success: true,
      message: "Order successfully submitted.",
      orderId: order._id,
      payment: order.payment,
      emailSent,
    });
  } catch (error) {
    console.error("Order placement failed:", error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const payOrder = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const { id } = req.params;
    const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);

    if (!req.body?.paymentMethod) {
      res.status(400).json({ message: "paymentMethod is required." });
      return;
    }

    if (!paymentMethod) {
      res
        .status(400)
        .json({ message: invalidPaymentMethodMessage(req.body.paymentMethod) });
      return;
    }

    const order = await Order.findOne({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
    });

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    if (order.payment.status === "paid") {
      res.status(400).json({ message: "Order is already paid." });
      return;
    }

    const paymentResult = createPaymentResult(paymentMethod);
    order.payment.method = paymentMethod;
    order.payment.status = paymentResult.status;
    order.payment.transactionId = paymentResult.transactionId;
    order.payment.providerReference = paymentResult.providerReference;
    order.status = paymentResult.status === "paid" ? "completed" : order.status;

    await order.save();
    const emailSent = await sendOrderEmail(order);

    res.status(200).json({
      success: true,
      message: "Payment processed successfully.",
      payment: order.payment,
      emailSent,
    });
  } catch (error) {
    console.error("Order payment failed:", error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const orders = await Order.find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get orders failed:", error);
    res.status(500).json({ message: "Unable to retrieve orders." });
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const { id } = req.params;
    const order = await Order.findOne({
      _id: new Types.ObjectId(id),
      user: new Types.ObjectId(userId),
    }).lean();

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order by id failed:", error);
    res.status(500).json({ message: "Unable to retrieve order." });
  }
};

/* -------------------------------------------------------------------------- */
/* Admin endpoints                                                            */
/*                                                                            */
/* Mounted behind requireAdmin. These deliberately do NOT filter by req.user   */
/* the way the handlers above do, because the admin panel needs every          */
/* customer's orders rather than only the caller's own.                        */
/* -------------------------------------------------------------------------- */

const ORDER_STATUSES: OrderStatus[] = [
  "created",
  "confirmed",
  "completed",
  "cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];

// placeOrder marks prepaid orders "completed" straight away, so cancelling out of
// "completed" has to stay reachable for refunds and returns.
const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllOrders = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const status = req.query.status as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    const query: any = {};

    if (status) {
      if (!ORDER_STATUSES.includes(status as OrderStatus)) {
        res.status(400).json({
          message: `Invalid status "${status}". Allowed values: ${ORDER_STATUSES.join(", ")}.`,
        });
        return;
      }
      query.status = status;
    }

    if (paymentStatus) {
      if (!PAYMENT_STATUSES.includes(paymentStatus as PaymentStatus)) {
        res.status(400).json({
          message: `Invalid paymentStatus "${paymentStatus}". Allowed values: ${PAYMENT_STATUSES.join(", ")}.`,
        });
        return;
      }
      query["payment.status"] = paymentStatus;
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      const or: any[] = [
        { email: pattern },
        { "shipping.name": pattern },
        { "shipping.email": pattern },
        { "shipping.phone": pattern },
        { "shipping.city": pattern },
      ];

      // Let admins paste an order id straight into the search box.
      if (Types.ObjectId.isValid(search)) {
        or.push({ _id: new Types.ObjectId(search) });
      }

      query.$or = or;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const customers = await resolveCustomers(orders.map((order) => order.user));

    const enrichedOrders = orders.map((order) => ({
      ...order,
      customer: customers.get(String(order.user)) ?? null,
      itemCount: order.items?.length ?? 0,
    }));

    res.status(200).json({
      success: true,
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Admin get all orders failed:", error);
    res.status(500).json({ message: "Unable to retrieve orders." });
  }
};

export const getAdminOrderById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order id." });
      return;
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const customers = await resolveCustomers([order.user]);

    res.status(200).json({
      success: true,
      order: {
        ...order,
        customer: customers.get(String(order.user)) ?? null,
      },
      allowedStatusTransitions: ALLOWED_STATUS_TRANSITIONS[order.status] ?? [],
    });
  } catch (error) {
    console.error("Admin get order by id failed:", error);
    res.status(500).json({ message: "Unable to retrieve order." });
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid order id." });
      return;
    }

    const status = req.body?.status as OrderStatus | undefined;
    const paymentStatus = req.body?.paymentStatus as PaymentStatus | undefined;

    if (!status && !paymentStatus) {
      res
        .status(400)
        .json({ message: "Provide status and/or paymentStatus to update." });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const changes: string[] = [];

    if (status && status !== order.status) {
      if (!ORDER_STATUSES.includes(status)) {
        res.status(400).json({
          message: `Invalid status "${status}". Allowed values: ${ORDER_STATUSES.join(", ")}.`,
        });
        return;
      }

      const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(status)) {
        res.status(400).json({
          message: `Cannot change status from "${order.status}" to "${status}". Allowed next values: ${
            allowed.length ? allowed.join(", ") : "none (terminal state)"
          }.`,
        });
        return;
      }

      changes.push(`status ${order.status} to ${status}`);
      order.status = status;
    }

    if (paymentStatus && paymentStatus !== order.payment.status) {
      if (!PAYMENT_STATUSES.includes(paymentStatus)) {
        res.status(400).json({
          message: `Invalid paymentStatus "${paymentStatus}". Allowed values: ${PAYMENT_STATUSES.join(", ")}.`,
        });
        return;
      }

      changes.push(`payment ${order.payment.status} to ${paymentStatus}`);
      order.payment.status = paymentStatus;

      // Cash collected in person still needs a reference for the books.
      if (paymentStatus === "paid" && !order.payment.transactionId) {
        order.payment.transactionId = generateReference();
      }
    }

    if (changes.length === 0) {
      res.status(200).json({
        success: true,
        message: "No changes applied, order is already in that state.",
        order: order.toObject(),
      });
      return;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order updated (${changes.join("; ")}).`,
      order: order.toObject(),
      allowedStatusTransitions: ALLOWED_STATUS_TRANSITIONS[order.status] ?? [],
    });
  } catch (error) {
    console.error("Admin update order status failed:", error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getOrderStats = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const [statusGroups, paymentGroups, paidTotals] = await Promise.all([
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $group: { _id: "$payment.status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { "payment.status": "paid" } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byStatus = ORDER_STATUSES.reduce<Record<string, number>>(
      (acc, key) => {
        acc[key] = statusGroups.find((row) => row._id === key)?.count ?? 0;
        return acc;
      },
      {},
    );

    const byPaymentStatus = PAYMENT_STATUSES.reduce<Record<string, number>>(
      (acc, key) => {
        acc[key] = paymentGroups.find((row) => row._id === key)?.count ?? 0;
        return acc;
      },
      {},
    );

    const totalOrders = Object.values(byStatus).reduce(
      (sum, count) => sum + count,
      0,
    );

    res.status(200).json({
      success: true,
      totalOrders,
      paidOrders: paidTotals[0]?.count ?? 0,
      paidRevenue: paidTotals[0]?.revenue ?? 0,
      byStatus,
      byPaymentStatus,
    });
  } catch (error) {
    console.error("Admin order stats failed:", error);
    res.status(500).json({ message: "Unable to retrieve order statistics." });
  }
};
