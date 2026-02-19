// @ts-nocheck
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("missionEvents")
      .withIndex("by_occurredAt")
      .order("desc")
      .take(args.limit ?? 25);
  },
});

export const append = mutation({
  args: {
    type: v.string(),
    summary: v.string(),
    detail: v.optional(v.string()),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    source: v.union(v.literal("openclaw"), v.literal("mission_control")),
    sourceRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("missionEvents", {
      ...args,
      occurredAt: Date.now(),
    });
  },
});
