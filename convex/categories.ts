import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
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
  },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (existingCategory) {
      throw new Error("Category with this name already exists.");
    }

    const categoryId = await ctx.db.insert("categories", { name: args.name });
    return categoryId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await checkAuth(ctx);
    return await ctx.db.query("categories").order("asc").collect();
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await checkAuth(ctx);
    return await ctx.db.get(args.id);
  },
});
