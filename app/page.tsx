"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  Sparkles,
  Users,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = React.useState("");
  const [joinError, setJoinError] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreateRoom = () => {
    setIsCreating(true);
    // Generate clean slug/code e.g. gova-xyz12
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const roomCode = `gova-${randomSuffix}`;
    router.push(`/room/${roomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toLowerCase();
    if (!cleanCode) {
      setJoinError("Please enter a room code");
      return;
    }
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      setJoinError("Room code must be between 3 and 20 characters");
      return;
    }

    router.push(`/room/${encodeURIComponent(cleanCode)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <CalendarDays className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Gova
            </span>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            No signup needed
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col items-center">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
            <Sparkles className="h-3.5 w-3.5" />
            Group dates made effortless
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Find the perfect date for your{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              group meetup
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300">
            Coordinate vacations, team offsites, or friend hangouts in seconds.
            Select your available dates, share the link, and see live heatmaps.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-12">
          {/* Create Room Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Create a New Room</CardTitle>
              <CardDescription>
                Start fresh with an instant room and invite your friends.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A unique link will be generated for you. Share it anywhere to
                start picking dates together.
              </p>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                size="lg"
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full text-base group-hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
              >
                <span>{isCreating ? "Generating room..." : "Create Room"}</span>
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </CardFooter>
          </Card>

          {/* Join Room Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
            <CardHeader className="pb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-2">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Join Existing Room</CardTitle>
              <CardDescription>
                Have a room code or invite link? Enter it below.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleJoinRoom} className="flex-1 flex flex-col justify-between">
              <CardContent className="space-y-2">
                <div className="space-y-1.5">
                  <Input
                    placeholder="e.g. gova-abc12"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value);
                      if (joinError) setJoinError("");
                    }}
                    className="font-mono uppercase text-sm sm:text-base tracking-wider"
                  />
                  {joinError && (
                    <p className="text-xs text-rose-500 font-medium">
                      {joinError}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  variant="secondary"
                  className="w-full text-base border border-slate-200 dark:border-slate-700"
                >
                  Join Room
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mt-16 sm:mt-24 pt-12 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Instant Real-Time Sync
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Changes propagate immediately across all devices with Convex-powered live subscriptions.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Interactive Heatmap
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Color intensity indicates group overlap, making the most popular dates immediately apparent.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Zero Login Friction
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No account, email, or password required. Pick a name and start coordinating instantly.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        <p>Gova Scheduler &copy; {new Date().getFullYear()} &bull; Fast, private group date coordination</p>
      </footer>
    </div>
  );
}
