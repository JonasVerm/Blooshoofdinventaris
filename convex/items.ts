import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to check for authenticated user
async function checkAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("User must be authenticated.");
  }
  return userId;
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    thumbnailStorageId: v.optional(v.id("_storage")),
    price: v.number(),
    purchasedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    const itemId = await ctx.db.insert("items", args);
    return itemId;
  },
});

export const list = query({
  args: { categoryId: v.optional(v.id("categories")) },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    let itemsQuery;
    if (args.categoryId) {
      itemsQuery = ctx.db
        .query("items")
        .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!));
    } else {
      itemsQuery = ctx.db.query("items");
    }
    const items = await itemsQuery.order("asc").collect();
    const allKits = await ctx.db.query("kits").collect();

    return Promise.all(
      items.map(async (item) => {
        let thumbnailUrl = null;
        if (item.thumbnailStorageId) {
          thumbnailUrl = await ctx.storage.getUrl(item.thumbnailStorageId);
        }
        const category = await ctx.db.get(item.categoryId);
        
        const associatedKits = allKits
          .filter(kit => kit.itemIds.includes(item._id))
          .map(kit => ({ _id: kit._id, name: kit.name, color: kit.color }));

        return {
          ...item,
          categoryName: category?.name ?? "Uncategorized",
          thumbnailUrl,
          associatedKits,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) {
      return null;
    }
    let thumbnailUrl = null;
    if (item.thumbnailStorageId) {
      thumbnailUrl = await ctx.storage.getUrl(item.thumbnailStorageId);
    }
    const category = await ctx.db.get(item.categoryId);

    // Find kits this item belongs to
    const allKits = await ctx.db.query("kits").collect();
    const associatedKits = allKits
      .filter(kit => kit.itemIds.includes(args.id))
      .map(kit => ({ _id: kit._id, name: kit.name, color: kit.color }));

    return {
      ...item,
      categoryName: category?.name ?? "Uncategorized",
      thumbnailUrl,
      associatedKits, // Add associated kits to the return object
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    thumbnailStorageId: v.optional(v.id("_storage")),
    price: v.optional(v.number()),
    purchasedDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    
    // Check if the item is part of any kits
    const allKits = await ctx.db.query("kits").collect();
    const kitsWithItem = allKits.filter(kit => kit.itemIds.includes(args.id));

    if (kitsWithItem.length > 0) {
      const kitNames = kitsWithItem.map(k => k.name).join(", ");
      throw new Error(
        `Cannot delete item. It is part of the following kit(s): ${kitNames}. Please remove it from these kits first.`
      );
    }

    const item = await ctx.db.get(args.id);
    if (item?.thumbnailStorageId) {
      await ctx.storage.delete(item.thumbnailStorageId);
    }
    await ctx.db.delete(args.id);
  },
});
