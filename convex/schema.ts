import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),

  items: defineTable({
    name: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    thumbnailStorageId: v.optional(v.id("_storage")),
    price: v.number(),
    purchasedDate: v.optional(v.number()), // Added: Unix timestamp (milliseconds)
  })
    .index("by_name", ["name"])
    .index("by_categoryId", ["categoryId"]),

  kits: defineTable({
    name: v.string(),
    description: v.string(),
    itemIds: v.array(v.id("items")),
    price: v.number(), // Price of the kit, could be different from sum of item prices
    color: v.optional(v.string()), // Added: Color for the kit
  }).index("by_name", ["name"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
