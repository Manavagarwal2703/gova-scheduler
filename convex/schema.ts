import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    code: v.string(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  members: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    name: v.string(),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  availabilities: defineTable({
    roomId: v.id("rooms"),
    userId: v.string(),
    dates: v.array(v.string()), // ISO format "YYYY-MM-DD" strings
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"]),
});
