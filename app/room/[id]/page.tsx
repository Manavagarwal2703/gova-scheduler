"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserModal } from "@/components/UserModal";
import { ShareButton } from "@/components/ShareButton";
import { CalendarGrid } from "@/components/CalendarGrid";
import { HeatmapOverlay } from "@/components/HeatmapOverlay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  Users,
  User,
  ArrowLeft,
  Calendar,
  Layers,
} from "lucide-react";
import { RoomDetails } from "@/types/contract";

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  // Unwrap params using React.use (Next.js 15+)
  const unwrappedParams = React.use(params);
  const roomId = unwrappedParams.id;

  const [userId, setUserId] = React.useState<string>("");
  const [userName, setUserName] = React.useState<string>("");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Fallback local state if Convex backend is not connected/configured yet
  const [localFallbackRoom, setLocalFallbackRoom] = React.useState<RoomDetails>(() => ({
    code: roomId,
    createdAt: 0,
    members: [],
    availabilities: {},
  }));

  // Convex real-time subscription
  const convexRoom = useQuery(api.rooms.getRoomDetails, { code: roomId });
  const joinRoomMutation = useMutation(api.rooms.joinRoom);
  const updateAvailabilityMutation = useMutation(api.rooms.updateAvailability);

  // Active room data: use Convex if available, else local fallback
  const activeRoom: RoomDetails = convexRoom ?? localFallbackRoom;

  // Initialize local user state safely on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const storedId = localStorage.getItem("gova_user_id");
      const storedName = localStorage.getItem("gova_user_name");

      if (storedId && storedName) {
        setUserId(storedId);
        setUserName(storedName);
      } else {
        setIsModalOpen(true);
      }
      setIsInitialized(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // When user and room are ready, join the room in Convex
  React.useEffect(() => {
    if (!userId || !userName || !roomId) return;

    joinRoomMutation({ code: roomId, name: userName, userId }).catch(() => {
      // Ignore if offline
    });

    const timer = setTimeout(() => {
      setLocalFallbackRoom((prev) => {
        const exists = prev.members.some((m) => m.userId === userId);
        const members = exists
          ? prev.members.map((m) => (m.userId === userId ? { ...m, name: userName } : m))
          : [...prev.members, { userId, name: userName, joinedAt: Date.now() }];
        return { ...prev, members };
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [userId, userName, roomId, joinRoomMutation]);

  const handleSaveUser = (newId: string, newName: string) => {
    setUserId(newId);
    setUserName(newName);
    setIsModalOpen(false);

    joinRoomMutation({ code: roomId, name: newName, userId: newId }).catch(() => {
      // Ignore if offline
    });

    setLocalFallbackRoom((prev) => {
      const exists = prev.members.some((m) => m.userId === newId);
      const members = exists
        ? prev.members.map((m) => (m.userId === newId ? { ...m, name: newName } : m))
        : [...prev.members, { userId: newId, name: newName, joinedAt: Date.now() }];
      return { ...prev, members };
    });
  };

  // Get current user's dates
  const currentUserDates = React.useMemo(() => {
    return activeRoom.availabilities[userId] || [];
  }, [activeRoom.availabilities, userId]);

  // Handle availability update
  const handleDatesChange = React.useCallback(
    (newDates: string[]) => {
      if (!userId) return;

      // Optimistic local update
      setLocalFallbackRoom((prev) => ({
        ...prev,
        availabilities: {
          ...prev.availabilities,
          [userId]: newDates,
        },
      }));

      // Remote Convex mutation
      updateAvailabilityMutation({
        code: roomId,
        userId,
        dates: newDates,
      }).catch(() => {
        // Ignore if offline
      });
    },
    [roomId, userId, updateAvailabilityMutation]
  );

  const handleDateToggle = React.useCallback(
    (dateStr: string) => {
      const isSelected = currentUserDates.includes(dateStr);
      const nextDates = isSelected
        ? currentUserDates.filter((d) => d !== dateStr)
        : [...currentUserDates, dateStr];
      handleDatesChange(nextDates);
    },
    [currentUserDates, handleDatesChange]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* User name modal */}
      <UserModal
        isOpen={isModalOpen}
        initialName={userName}
        onSave={handleSaveUser}
        onClose={userName ? () => setIsModalOpen(false) : undefined}
      />

      {/* Navigation bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-tight">
                  Gova
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Room: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{roomId}</span>
                </span>
              </div>
            </div>
          </div>

          {/* User identity & Share actions */}
          <div className="flex items-center gap-2.5">
            {isInitialized && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                title="Change display name"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="max-w-[100px] truncate sm:max-w-none">
                  {userName || "Set Name"}
                </span>
              </Button>
            )}
            <ShareButton roomCode={roomId} size="sm" />
          </div>
        </div>
      </header>

      {/* Main room layout */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Room Header Info */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Room <span className="font-mono text-indigo-600 dark:text-indigo-400">#{roomId}</span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Active
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Share this room with your group. Select your available dates below — the heatmap updates in real time!
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Member counter indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <Users className="h-4 w-4 text-indigo-500" />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeRoom.members.length} {activeRoom.members.length === 1 ? "Member" : "Members"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member chips list */}
        {activeRoom.members.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto pb-1 flex-wrap">
            <span className="font-medium text-slate-500 shrink-0">Members:</span>
            {activeRoom.members.map((m) => {
              const isMe = m.userId === userId;
              const userDateCount = (activeRoom.availabilities[m.userId] || []).length;
              return (
                <span
                  key={m.userId}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs shrink-0 font-medium border ${
                    isMe
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isMe ? "bg-indigo-600 animate-pulse" : "bg-emerald-500"
                    }`}
                  />
                  {m.name} {isMe && "(You)"}
                  <span className="text-[10px] opacity-75 font-mono">
                    ({userDateCount}d)
                  </span>
                </span>
              );
            })}
          </div>
        )}

        {/* Calendar and Heatmap Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Calendar Picker Card */}
          <Card id="calendar-container" className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-semibold">Your Availability</CardTitle>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {currentUserDates.length} selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CalendarGrid
                selectedDates={currentUserDates}
                onDateToggle={handleDateToggle}
                onDatesChange={handleDatesChange}
              />
            </CardContent>
          </Card>

          {/* Group Heatmap Card */}
          <Card id="heatmap-container" className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-base font-semibold">Group Heatmap</CardTitle>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Live Overlap
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <HeatmapOverlay
                roomCode={roomId}
                members={activeRoom.members}
                availabilities={activeRoom.availabilities}
                onDateClick={(dateStr) => handleDateToggle(dateStr)}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
