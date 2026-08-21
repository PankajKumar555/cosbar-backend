import { Request, Response } from "express";
import { Types } from "mongoose";
import { Cart, ICartItem } from "../models/Cart";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveCustomers } from "../utils/customer";

interface CartItemPayload {
  productId: number;
  categoryId: number;
  quantity: number;
}

const validateCartPayload = async (
  items: CartItemPayload[],
): Promise<{ items: ICartItem[]; totalAmount: number }> => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart items must include at least one product.");
  }

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    productId: { $in: productIds },
  }).lean();
  if (products.length !== items.length) {
    const foundIds = new Set(products.map((product) => product.productId));
    const missing = items
      .filter((item) => !foundIds.has(item.productId))
      .map((item) => item.productId);
    throw new Error(`Products not found for IDs: ${missing.join(", ")}`);
  }

  const categoryIds = items.map((item) => item.categoryId);
  const categories = await Category.find({
    categoryId: { $in: categoryIds },
  }).lean();
  const categoryIdSet = new Set(
    categories.map((category) => category.categoryId),
  );

  const validatedItems: ICartItem[] = items.map((item) => {
    const product = products.find(
      (productItem) => Number(productItem.productId) === Number(item.productId),
    );

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    if (!categoryIdSet.has(Number(item.categoryId))) {
      throw new Error(`Category not found: ${item.categoryId}`);
    }

    if (Number(product.categoryId) !== Number(item.categoryId)) {
      throw new Error(
        `Product ${item.productId} does not belong to category ${item.categoryId}.`,
      );
    }

    if (!item.quantity || item.quantity < 1) {
      throw new Error(`Invalid quantity for product ${item.productId}.`);
    }

    if (typeof product.price !== "number") {
      throw new Error(`Product ${item.productId} does not have a valid price.`);
    }

    const subtotal = product.price * item.quantity;

    return {
      productId: product.productId,
      categoryId: product.categoryId,
      quantity: item.quantity,
      price: product.price,
      title: product.productName,
      category: product.category,
      image: product.images?.[0] ?? "",
      subtotal,
    };
  });

  const totalAmount = validatedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  return { items: validatedItems, totalAmount };
};

export const saveCart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { guestId, items, currency = "INR", totalAmount, note } = req.body;

    if (!userId && !guestId) {
      res.status(400).json({
        message:
          "Provide either a valid logged-in user token or a guestId to save the cart.",
      });
      return;
    }

    const { items: validatedItems, totalAmount: calculatedTotal } =
      await validateCartPayload(items);

    if (typeof totalAmount !== "number") {
      res.status(400).json({ message: "totalAmount is required." });
      return;
    }
    // console.log(calculatedTotal, totalAmount);
    if (Math.abs(calculatedTotal - totalAmount) > 1) {
      res.status(400).json({
        message:
          "Cart totals do not match database prices. Please refresh your cart.",
        calculatedTotal,
      });
      return;
    }

    const cartQuery: any = {};
    const cartUpdate: any = {
      items: validatedItems,
      currency,
      totalAmount: calculatedTotal,
      note,
      active: true,
    };

    if (userId) {
      cartQuery.user = new Types.ObjectId(userId);
      cartUpdate.user = new Types.ObjectId(userId);
    } else {
      cartQuery.guestId = guestId;
      cartUpdate.guestId = guestId;
    }

    const cart = await Cart.findOneAndUpdate(cartQuery, cartUpdate, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Cart save failed:", error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const validateCart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { items } = req.body;
    const { items: validatedItems, totalAmount } =
      await validateCartPayload(items);

    res.status(200).json({
      success: true,
      valid: true,
      items: validatedItems,
      totalAmount,
      currency: "INR",
    });
  } catch (error) {
    console.error("Cart validation failed:", error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getCart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const guestId = req.query.guestId as string | undefined;

    if (!userId && !guestId) {
      res.status(400).json({
        message:
          "Provide either Authorization token or guestId query parameter.",
      });
      return;
    }

    const query: any = { active: true };
    if (userId) {
      query.user = new Types.ObjectId(userId);
    } else {
      query.guestId = guestId;
    }

    const cart = await Cart.findOne(query).lean();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get cart failed:", error);
    res.status(500).json({ message: "Unable to retrieve cart." });
  }
};

export const clearCart = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const guestId = req.query.guestId as string | undefined;

    if (!userId && !guestId) {
      res.status(400).json({
        message:
          "Provide either Authorization token or guestId query parameter.",
      });
      return;
    }

    const deleteQuery: any = {};
    if (userId) {
      deleteQuery.user = new Types.ObjectId(userId);
    } else {
      deleteQuery.guestId = guestId;
    }

    await Cart.deleteOne(deleteQuery);

    res.status(200).json({ success: true, message: "Cart cleared." });
  } catch (error) {
    console.error("Clear cart failed:", error);
    res.status(500).json({ message: "Unable to clear cart." });
  }
};

/* -------------------------------------------------------------------------- */
/* Admin endpoints                                                            */
/*                                                                            */
/* Mounted behind requireAdmin. The handlers above resolve a single cart from  */
/* the caller token or a guestId; these list every cart so the admin panel can */
/* show abandoned baskets.                                                     */
/* -------------------------------------------------------------------------- */

const escapeCartRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllCarts = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const owner = req.query.owner as string | undefined;
    const search = (req.query.search as string | undefined)?.trim();

    const query: any = {};

    // "active" is optional on old documents, so only filter when asked to.
    if (req.query.active === "true") {
      query.active = true;
    } else if (req.query.active === "false") {
      query.active = false;
    }

    if (owner === "registered") {
      query.user = { $ne: null };
    } else if (owner === "guest") {
      query.user = null;
    } else if (owner) {
      res.status(400).json({
        message: `Invalid owner "${owner}". Allowed values: registered, guest.`,
      });
      return;
    }

    if (search) {
      const pattern = new RegExp(escapeCartRegex(search), "i");
      const or: any[] = [
        { guestId: pattern },
        { "items.title": pattern },
        { "items.category": pattern },
      ];

      if (Types.ObjectId.isValid(search)) {
        or.push({ _id: new Types.ObjectId(search) });
        or.push({ user: new Types.ObjectId(search) });
      }

      query.$or = or;
    }

    const [carts, total] = await Promise.all([
      Cart.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Cart.countDocuments(query),
    ]);

    const customers = await resolveCustomers(carts.map((cart) => cart.user));

    const enrichedCarts = carts.map((cart) => ({
      ...cart,
      customer: cart.user ? (customers.get(String(cart.user)) ?? null) : null,
      itemCount: cart.items?.length ?? 0,
      unitCount:
        cart.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0,
    }));

    res.status(200).json({
      success: true,
      carts: enrichedCarts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Admin get all carts failed:", error);
    res.status(500).json({ message: "Unable to retrieve carts." });
  }
};

export const getAdminCartById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid cart id." });
      return;
    }

    const cart = await Cart.findById(id).lean();

    if (!cart) {
      res.status(404).json({ message: "Cart not found." });
      return;
    }

    const customers = await resolveCustomers([cart.user]);

    res.status(200).json({
      success: true,
      cart: {
        ...cart,
        customer: cart.user ? (customers.get(String(cart.user)) ?? null) : null,
      },
    });
  } catch (error) {
    console.error("Admin get cart by id failed:", error);
    res.status(500).json({ message: "Unable to retrieve cart." });
  }
};

export const deleteCartById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: "Invalid cart id." });
      return;
    }

    const deleted = await Cart.findByIdAndDelete(id).lean();

    if (!deleted) {
      res.status(404).json({ message: "Cart not found." });
      return;
    }

    res.status(200).json({ success: true, message: "Cart deleted." });
  } catch (error) {
    console.error("Admin delete cart failed:", error);
    res.status(500).json({ message: "Unable to delete cart." });
  }
};

export const getCartStats = async (
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const [totals, ownerSplit] = await Promise.all([
      Cart.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            value: { $sum: "$totalAmount" },
          },
        },
      ]),
      Cart.aggregate([
        {
          $group: {
            _id: { $cond: [{ $ifNull: ["$user", false] }, "registered", "guest"] },
            count: { $sum: 1 },
            value: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      totalCarts: totals[0]?.count ?? 0,
      totalCartValue: totals[0]?.value ?? 0,
      registeredCarts:
        ownerSplit.find((row) => row._id === "registered")?.count ?? 0,
      guestCarts: ownerSplit.find((row) => row._id === "guest")?.count ?? 0,
    });
  } catch (error) {
    console.error("Admin cart stats failed:", error);
    res.status(500).json({ message: "Unable to retrieve cart statistics." });
  }
};
