// @ts-nocheck
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  taskItems: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("inbox"),
      v.literal("selected"),
      v.literal("doing"),
      v.literal("blocked"),
      v.literal("done")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    source: v.union(v.literal("manual"), v.literal("derived"), v.literal("automation")),
    tags: v.array(v.string()),
    dueAt: v.optional(v.number()),
    owner: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"]),

  missionEvents: defineTable({
    type: v.string(),
    summary: v.string(),
    detail: v.optional(v.string()),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
    source: v.union(v.literal("openclaw"), v.literal("mission_control")),
    sourceRef: v.optional(v.string()),
    occurredAt: v.number(),
  }).index("by_occurredAt", ["occurredAt"]),
});
