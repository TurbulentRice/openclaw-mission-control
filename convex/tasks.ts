// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("taskItems")
        .withIndex("by_status", (q) => q.eq("status", args.status as never))
        .collect();
    }
    return await ctx.db.query("taskItems").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("taskItems", {
      title: args.title,
      description: args.description,
      status: "inbox",
      priority: args.priority,
      source: "manual",
      tags: args.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});
