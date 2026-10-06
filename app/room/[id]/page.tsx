"use client";

import * as React from "react";
import Link from "next/link";
import { UserModal } from "@/components/UserModal";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  Users,
  User,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

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

  // Initialize local user state safely on mount
  React.useEffect(() => {
    const storedId = localStorage.getItem("gova_user_id");
    const storedName = localStorage.getItem("gova_user_name");

    const timer = setTimeout(() => {
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

  const handleSaveUser = (newId: string, newName: string) => {
    setUserId(newId);
    setUserName(newName);
    setIsModalOpen(false);
  };

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
              Share the room code or link with your group. Select your availability below to generate the heatmap.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Member counter indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <Users className="h-4 w-4 text-indigo-500" />
              <div className="text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {userName ? "1 Member" : "Connecting..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member chips / list preview */}
        {userName && (
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto pb-1">
            <span className="font-medium text-slate-500 shrink-0">Members:</span>
            <span
              data-user-id={userId}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 font-medium"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              {userName} (You)
            </span>
          </div>
        )}

        {/* Calendar and Heatmap Container Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Calendar Picker Container */}
          <Card id="calendar-container" className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-semibold">Your Availability</CardTitle>
                </div>
                <span className="text-xs text-slate-400">Select dates</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                id="calendar-slot"
                className="min-h-[350px] flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-900/50"
              >
                <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Availability Calendar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Interactive multi-date picker component mounts here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Group Heatmap Container */}
          <Card id="heatmap-container" className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-base font-semibold">Group Heatmap</CardTitle>
                </div>
                <span className="text-xs text-slate-400">Live aggregate</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div
                id="heatmap-slot"
                className="min-h-[350px] flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center bg-slate-50/50 dark:bg-slate-900/50"
              >
                <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Collective Availability Heatmap
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Real-time color-coded density grid and best dates mount here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
