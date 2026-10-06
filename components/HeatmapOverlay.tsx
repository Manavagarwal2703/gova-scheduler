"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { computeHeatmapCells, getHeatmapOpacity } from "@/lib/heatmap-utils";
import { Member, HeatmapCell } from "@/types/contract";
import { Tooltip } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Award,
} from "lucide-react";

export interface HeatmapOverlayProps {
  roomCode: string;
  members: Member[];
  availabilities: Record<string, string[]>;
  displayMonth?: Date;
  onDateClick?: (dateStr: string) => void;
  className?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_MONTH = new Date(2026, 11);

export function HeatmapOverlay({
  roomCode,
  members,
  availabilities,
  displayMonth,
  onDateClick,
  className,
}: HeatmapOverlayProps) {
  // Calendar month state (defaulting to December 2026 or displayMonth)
  const [navMonth, setNavMonth] = React.useState<Date | null>(null);
  const currentMonth = React.useMemo(
    () => navMonth ?? displayMonth ?? DEFAULT_MONTH,
    [navMonth, displayMonth]
  );

  // Calendar dates generation
  const monthStart = React.useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = React.useMemo(() => endOfMonth(currentMonth), [currentMonth]);
  const daysInMonth = React.useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );
  const startDayOfWeek = React.useMemo(() => getDay(monthStart), [monthStart]);

  // Compute heatmap cells for the month
  const dateStrings = React.useMemo(
    () => daysInMonth.map((day) => format(day, "yyyy-MM-dd")),
    [daysInMonth]
  );

  const heatmapCells = React.useMemo(
    () => computeHeatmapCells(dateStrings, members, availabilities),
    [dateStrings, members, availabilities]
  );

  // Map for O(1) cell lookup by ISO date string
  const cellMap = React.useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    heatmapCells.forEach((cell) => {
      map.set(cell.date, cell);
    });
    return map;
  }, [heatmapCells]);

  // Member name lookup
  const memberNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((m) => {
      map.set(m.userId, m.name);
    });
    return map;
  }, [members]);

  // Calculate top matching dates
  const { bestCells, maxAvailableCount, bestRatio } = React.useMemo(() => {
    if (heatmapCells.length === 0 || members.length === 0) {
      return { bestCells: [], maxAvailableCount: 0, bestRatio: 0 };
    }
    const maxCount = Math.max(...heatmapCells.map((c) => c.availableCount), 0);
    if (maxCount === 0) {
      return { bestCells: [], maxAvailableCount: 0, bestRatio: 0 };
    }
    const filtered = heatmapCells.filter((c) => c.availableCount === maxCount);
    return {
      bestCells: filtered,
      maxAvailableCount: maxCount,
      bestRatio: maxCount / members.length,
    };
  }, [heatmapCells, members.length]);

  return (
    <div
      className={cn("space-y-6 w-full", className)}
      data-room-code={roomCode}
    >
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setNavMonth(subMonths(currentMonth, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 min-w-[140px] text-center select-none">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setNavMonth(addMonths(currentMonth, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {format(currentMonth, "yyyy-MM") !== "2026-12" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNavMonth(new Date(2026, 11))}
            className="text-xs text-indigo-600 dark:text-indigo-400 h-7 px-2 font-medium"
          >
            Dec 2026
          </Button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1.5">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {WEEKDAYS.map((dayName, index) => (
            <div
              key={dayName}
              className={cn(
                "text-[11px] sm:text-xs font-semibold py-1 uppercase tracking-wider select-none",
                index === 0 || index === 6
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-600 dark:text-slate-300"
              )}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty padding cells for start of month */}
          {Array.from({ length: startDayOfWeek }).map((_, index) => (
            <div
              key={`blank-${index}`}
              aria-hidden="true"
              className="aspect-square rounded-lg border border-transparent opacity-0 pointer-events-none"
            />
          ))}

          {/* Actual days of month */}
          {daysInMonth.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const cell = cellMap.get(dateStr);
            const ratio = cell ? cell.ratio : 0;
            const availableCount = cell ? cell.availableCount : 0;
            const totalMembers = cell ? cell.totalMembers : members.length;
            const opacity = cell ? getHeatmapOpacity(ratio) : 0;
            const isFullMatch = totalMembers > 0 && ratio === 1;
            const hasPartial = totalMembers > 0 && ratio > 0 && ratio < 1;

            // Resolve available and unavailable friend names
            const availableFriends = (cell?.availableUserIds || []).map((uid) => ({
              userId: uid,
              name: memberNameMap.get(uid) || `User ${uid.slice(0, 6)}`,
            }));

            const unavailableFriends = (cell?.unavailableUserIds || []).map((uid) => ({
              userId: uid,
              name: memberNameMap.get(uid) || `User ${uid.slice(0, 6)}`,
            }));

            // Determine cell styles and classes based on ratio
            let cellStyle: React.CSSProperties = {};
            let cellClassName = "";

            if (isFullMatch) {
              // 100% full match
              cellClassName =
                "bg-emerald-600 text-white font-bold border-2 border-emerald-400 shadow-md shadow-emerald-700/25 ring-2 ring-emerald-400/50 hover:bg-emerald-500 hover:scale-[1.03]";
            } else if (hasPartial) {
              // Partial ratio: dynamic opacity with emerald tint
              const dynamicAlpha = Math.max(0.2, opacity);
              cellStyle = {
                backgroundColor: `rgba(16, 185, 129, ${dynamicAlpha})`,
              };
              cellClassName = cn(
                "border border-emerald-500/50 hover:border-emerald-400 hover:scale-[1.02]",
                ratio >= 0.5
                  ? "text-slate-900 dark:text-emerald-50 font-semibold"
                  : "text-slate-800 dark:text-emerald-100 font-medium"
              );
            } else {
              // 0% ratio or no members
              cellClassName =
                "bg-transparent border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50";
            }

            // Adjust tooltip position for edge columns to prevent clipping
            const dayOfWeek = day.getDay();
            const tooltipAlignment =
              dayOfWeek === 0
                ? "left-0 translate-x-0"
                : dayOfWeek === 6
                ? "left-auto right-0 translate-x-0"
                : "";

            return (
              <div key={dateStr} className="w-full flex justify-center">
                <Tooltip
                  content={
                    <div className="space-y-2 p-1 text-left w-56 sm:w-64 max-w-xs">
                      {/* Tooltip Header */}
                      <div className="flex items-center justify-between gap-1.5 border-b border-slate-700/80 pb-1.5">
                        <span className="font-semibold text-slate-100 text-xs sm:text-sm">
                          {format(day, "MMM d, yyyy")}
                        </span>
                        {isFullMatch ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/40">
                            <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                            All free!
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-400">
                            {format(day, "EEEE")}
                          </span>
                        )}
                      </div>

                      {/* Count summary */}
                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <span className="font-medium">
                          {totalMembers > 0
                            ? `${availableCount} of ${totalMembers} available`
                            : "No members joined"}
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {totalMembers > 0 ? `${Math.round(ratio * 100)}%` : "0%"}
                        </span>
                      </div>

                      {/* Friends details */}
                      {totalMembers > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-800">
                          {/* Available friends */}
                          {availableFriends.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                                <Check className="h-3 w-3" />
                                <span>Available ({availableFriends.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {availableFriends.map((f) => (
                                  <span
                                    key={f.userId}
                                    className="inline-flex items-center gap-1 rounded bg-emerald-950/80 text-emerald-200 border border-emerald-700/50 px-1.5 py-0.5 text-[11px]"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span className="truncate max-w-[120px]">{f.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Unavailable friends */}
                          {unavailableFriends.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                <X className="h-3 w-3 text-slate-500" />
                                <span>Unavailable ({unavailableFriends.length})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {unavailableFriends.map((f) => (
                                  <span
                                    key={f.userId}
                                    className="inline-flex items-center gap-1 rounded bg-slate-800/90 text-slate-400 border border-slate-700/60 px-1.5 py-0.5 text-[11px]"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500 shrink-0" />
                                    <span className="truncate max-w-[120px]">{f.name}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  }
                  className={cn(
                    "w-auto max-w-xs p-2 text-left bg-slate-900 border-slate-700 shadow-xl z-50",
                    tooltipAlignment
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onDateClick?.(dateStr)}
                    className={cn(
                      "relative w-full aspect-square min-h-[42px] sm:min-h-[50px] rounded-lg flex flex-col items-center justify-center p-1 transition-all duration-150 select-none cursor-pointer",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                      cellClassName
                    )}
                    style={cellStyle}
                    aria-label={`${format(day, "MMMM d, yyyy")}: ${availableCount} of ${totalMembers} available`}
                  >
                    {/* Day number */}
                    <span className="text-xs sm:text-sm font-semibold leading-none">
                      {format(day, "d")}
                    </span>

                    {/* Sparkle badge for 100% full match */}
                    {isFullMatch && (
                      <Sparkles
                        className="h-3 w-3 text-amber-300 absolute top-1 right-1 animate-pulse"
                        aria-hidden="true"
                      />
                    )}

                    {/* Compact ratio text below date */}
                    {isFullMatch ? (
                      <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-tighter sm:tracking-normal mt-0.5 leading-none">
                        Free!
                      </span>
                    ) : hasPartial ? (
                      <span className="text-[9px] sm:text-[10px] font-mono leading-none opacity-80 mt-0.5">
                        {availableCount}/{totalMembers}
                      </span>
                    ) : (
                      <span
                        className="text-[9px] opacity-0 leading-none mt-0.5"
                        aria-hidden="true"
                      >
                        -
                      </span>
                    )}
                  </button>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Section */}
      <div className="space-y-4 pt-2">
        {/* Best Dates Highlight Section */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Award className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                Best Dates Found
              </h3>
            </div>
            {bestRatio === 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Sparkles className="h-3 w-3 text-amber-500" /> Perfect Match
              </span>
            )}
          </div>

          {bestCells.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Top dates with max attendance:{" "}
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                  {maxAvailableCount} of {members.length} friends ({Math.round(bestRatio * 100)}%)
                </strong>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bestCells.map((topCell) => {
                  const dateObj = parseISO(topCell.date);
                  return (
                    <button
                      key={topCell.date}
                      type="button"
                      onClick={() => onDateClick?.(topCell.date)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                        bestRatio === 1
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                          : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-800"
                      )}
                      title={`Select ${format(dateObj, "MMM d, yyyy")}`}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>{format(dateObj, "EEE, MMM d")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {members.length === 0
                ? "No members in this room yet. Share the link with friends to get started."
                : "No availability marked yet. Click dates on the calendar to mark when you are free!"}
            </p>
          )}
        </div>

        {/* Availability Legend */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-[11px] uppercase tracking-wider">
              Availability Legend
            </span>
            <span className="text-[11px] text-slate-500">Group overlap ratio</span>
          </div>

          {/* Color gradient bar */}
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-slate-200 via-emerald-400 to-emerald-600 dark:from-slate-800 dark:via-emerald-500 dark:to-emerald-400 border border-slate-200/50 dark:border-slate-700/50" />

          {/* Legend step labels */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded border border-slate-300 dark:border-slate-700 bg-transparent inline-block" />
              0% (None)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-emerald-400/60 inline-block" />
              50% (Partial)
            </span>
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2.5 w-2.5 rounded bg-emerald-600 inline-block" />
              100% (All free 🌟)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
