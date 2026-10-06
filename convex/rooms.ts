import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { RoomDetails } from "../types/contract";

export const getRoomDetails = query({
  args: { code: v.string() },
  handler: async (ctx, args): Promise<RoomDetails | null> => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) return null;

    const members = await ctx.db
      .query("members")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const avails = await ctx.db
      .query("availabilities")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    const availabilities: Record<string, string[]> = {};
    for (const a of avails) {
      availabilities[a.userId] = a.dates;
    }

    return {
      code: room.code,
      createdAt: room.createdAt,
      members: members.map((m) => ({
        userId: m.userId,
        name: m.name,
        joinedAt: m.joinedAt,
      })),
      availabilities,
    };
  },
});

export const getOrCreateRoom = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (room) {
      return room.code;
    }

    await ctx.db.insert("rooms", {
      code: args.code,
      createdAt: Date.now(),
    });

    return args.code;
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    let roomId = room?._id;
    if (!roomId) {
      roomId = await ctx.db.insert("rooms", {
        code: args.code,
        createdAt: Date.now(),
      });
    }

    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", roomId).eq("userId", args.userId)
      )
      .first();

    if (existingMember) {
      if (existingMember.name !== args.name) {
        await ctx.db.patch(existingMember._id, { name: args.name });
      }
    } else {
      await ctx.db.insert("members", {
        roomId,
        userId: args.userId,
        name: args.name,
        joinedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const updateAvailability = mutation({
  args: {
    code: v.string(),
    userId: v.string(),
    dates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) {
      throw new Error(`Room with code "${args.code}" not found.`);
    }

    const existingAvail = await ctx.db
      .query("availabilities")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", room._id).eq("userId", args.userId)
      )
      .first();

    if (existingAvail) {
      await ctx.db.patch(existingAvail._id, { dates: args.dates });
    } else {
      await ctx.db.insert("availabilities", {
        roomId: room._id,
        userId: args.userId,
        dates: args.dates,
      });
    }

    return { success: true };
  },
});
