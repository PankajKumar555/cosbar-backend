import { Types } from "mongoose";
import { PublicUser } from "../models/PublicUser.model";
import { User } from "../models/user.model";

export interface CustomerSummary {
  id: string;
  username: string;
  email: string;
  accountType: "public" | "admin";
}

/**
 * Resolves account details for a set of user ids taken from orders/carts.
 *
 * Order.user and Cart.user are both declared as `ref: "User"`, but checkout runs
 * through /user/public/login, so in practice those ids point at the PublicUser
 * collection. A plain .populate("user") therefore returns null for real customer
 * orders. This looks the ids up in both collections instead so the admin panel can
 * always show who placed an order.
 */
export const resolveCustomers = async (
  userIds: (Types.ObjectId | string | undefined | null)[],
): Promise<Map<string, CustomerSummary>> => {
  const uniqueIds = Array.from(
    new Set(
      userIds
        .filter((id): id is Types.ObjectId | string => Boolean(id))
        .map((id) => String(id))
        .filter((id) => Types.ObjectId.isValid(id)),
    ),
  );

  const summaries = new Map<string, CustomerSummary>();

  if (uniqueIds.length === 0) {
    return summaries;
  }

  const objectIds = uniqueIds.map((id) => new Types.ObjectId(id));

  const [publicUsers, adminUsers] = await Promise.all([
    PublicUser.find({ _id: { $in: objectIds } })
      .select("username email")
      .lean(),
    User.find({ _id: { $in: objectIds } })
      .select("username email")
      .lean(),
  ]);

  for (const user of publicUsers) {
    summaries.set(String(user._id), {
      id: String(user._id),
      username: user.username,
      email: user.email,
      accountType: "public",
    });
  }

  // Admin accounts only fill gaps — a public account with the same id wins.
  for (const user of adminUsers) {
    const key = String(user._id);
    if (!summaries.has(key)) {
      summaries.set(key, {
        id: key,
        username: user.username,
        email: user.email,
        accountType: "admin",
      });
    }
  }

  return summaries;
};
