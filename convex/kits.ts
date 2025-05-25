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
    itemIds: v.array(v.id("items")),
    price: v.number(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    // Ensure all items exist
    for (const itemId of args.itemIds) {
      const item = await ctx.db.get(itemId);
      if (!item) {
        throw new Error(`Item with id ${itemId} not found.`);
      }
    }
    const kitId = await ctx.db.insert("kits", args);
    return kitId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await checkAuth(ctx);
    const kits = await ctx.db.query("kits").order("asc").collect();
    return Promise.all(
      kits.map(async (kit) => {
        const itemsInKit = await Promise.all(
          kit.itemIds.map(async (itemId) => {
            const item = await ctx.db.get(itemId);
            if (!item) return { name: "Unknown Item", _id: itemId, price: 0, thumbnailUrl: null, categoryName: "N/A", purchasedDate: null, description: "", categoryId: "" as Id<"categories"> }; // Handle missing items gracefully
            let thumbnailUrl = null;
            if (item.thumbnailStorageId) {
              thumbnailUrl = await ctx.storage.getUrl(item.thumbnailStorageId);
            }
            const category = await ctx.db.get(item.categoryId);
            return {
              ...item,
              categoryName: category?.name ?? "Uncategorized",
              thumbnailUrl,
            };
          })
        );
        return {
          ...kit,
          items: itemsInKit,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("kits") },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    const kit = await ctx.db.get(args.id);
    if (!kit) {
      return null;
    }
    const itemsInKit = await Promise.all(
      kit.itemIds.map(async (itemId) => {
        const item = await ctx.db.get(itemId);
         if (!item) return { name: "Unknown Item", _id: itemId, price: 0, thumbnailUrl: null, categoryName: "N/A", purchasedDate: null, description: "", categoryId: "" as Id<"categories"> }; // Handle missing items gracefully
        let thumbnailUrl = null;
        if (item.thumbnailStorageId) {
          thumbnailUrl = await ctx.storage.getUrl(item.thumbnailStorageId);
        }
        const category = await ctx.db.get(item.categoryId);
        return {
          ...item,
          categoryName: category?.name ?? "Uncategorized",
          thumbnailUrl,
        };
      })
    );
    return {
      ...kit,
      items: itemsInKit,
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("kits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    itemIds: v.optional(v.array(v.id("items"))),
    price: v.optional(v.number()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    const { id, itemIds, ...rest } = args;
    if (itemIds) {
      for (const itemId of itemIds) {
        const item = await ctx.db.get(itemId);
        if (!item) {
          throw new Error(`Item with id ${itemId} not found.`);
        }
      }
    }
    // Ensure 'undefined' is passed if color is not provided or empty, to allow unsetting.
    const updateData: Partial<typeof args> = { ...rest };
    if (args.color === "" || args.color === undefined) {
      updateData.color = undefined;
    } else {
      updateData.color = args.color;
    }
    
    await ctx.db.patch(id, updateData as any); // Cast to any to handle optional fields correctly
  },
});

export const remove = mutation({
  args: { id: v.id("kits") },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
