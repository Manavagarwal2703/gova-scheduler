"use client";

import * as React from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  format,
  parseISO,
  isWeekend,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  CalendarDays,
  RotateCcw,
  MousePointerClick,
} from "lucide-react";

export interface CalendarGridProps {
  /** Array of ISO date strings ("YYYY-MM-DD") representing the user's selected availability */
  selectedDates: string[];
  /** Callback triggered when a single date's selection state is toggled */
  onDateToggle?: (dateStr: string) => void;
  /** Callback triggered when the array of selected dates changes */
  onDatesChange?: (dateStrings: string[]) => void;
  /** Whether the calendar interactions are disabled */
  disabled?: boolean;
  /** Optional container class name */
  className?: string;
}

interface CalendarDragContextType {
  selectedSet: Set<string>;
  disabled: boolean;
  onDatePointerDown: (
    e: React.PointerEvent<HTMLButtonElement>,
    dateStr: string
  ) => void;
  onDatePointerEnter: (dateStr: string) => void;
  onDateClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    dateStr: string
  ) => void;
}

const CalendarDragContext = React.createContext<CalendarDragContextType | null>(
  null
);

/**
 * Custom DayButton component rendered for each calendar cell.
 * Handles drag-to-select, pointer events, and keyboard accessibility.
 */
function CustomDayButton(props: DayButtonProps) {
  const ctx = React.useContext(CalendarDragContext);
  const { day, modifiers, className, children, ...restProps } = props;

  const dateStr = format(day.date, "yyyy-MM-dd");
  const isSelected = ctx?.selectedSet.has(dateStr) ?? modifiers.selected;
  const isDisabled = Boolean(ctx?.disabled || modifiers.disabled);

  return (
    <button
      {...restProps}
      type="button"
      data-day-date={dateStr}
      disabled={isDisabled}
      aria-pressed={isSelected}
      onPointerDown={(e) => ctx?.onDatePointerDown(e, dateStr)}
      onPointerEnter={() => ctx?.onDatePointerEnter(dateStr)}
      onClick={(e) => ctx?.onDateClick(e, dateStr)}
      className={cn(
        "relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-lg text-sm font-medium select-none touch-none transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
        isSelected
          ? "bg-indigo-600 text-white font-semibold shadow-xs hover:bg-indigo-700 active:scale-95 z-10"
          : modifiers.outside
          ? "text-slate-300 dark:text-slate-600 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
          : modifiers.today
          ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50"
          : "text-slate-700 dark:text-slate-200 hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-300",
        isDisabled &&
          "opacity-40 cursor-not-allowed pointer-events-none hover:bg-transparent",
        className
      )}
    >
      {children}
      {modifiers.today && !isSelected && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
      )}
    </button>
  );
}

export function CalendarGrid({
  selectedDates,
  onDateToggle,
  onDatesChange,
  disabled = false,
  className,
}: CalendarGridProps) {
  // Navigation month defaulting to December 2026 (index 11)
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    () => new Date(2026, 11, 1)
  );

  // Set for fast lookup
  const selectedSet = React.useMemo(
    () => new Set(selectedDates),
    [selectedDates]
  );

  // Parse ISO date strings for react-day-picker
  const selectedDateObjects = React.useMemo(() => {
    return selectedDates.map((dateStr) => {
      try {
        return parseISO(dateStr);
      } catch {
        return new Date(dateStr);
      }
    });
  }, [selectedDates]);

  // Drag interaction refs
  const isDraggingRef = React.useRef(false);
  const dragModeRef = React.useRef<"select" | "deselect">("select");
  const activeDatesRef = React.useRef<Set<string>>(new Set(selectedDates));
  const lastProcessedDateRef = React.useRef<string | null>(null);
  const pointerHandledRef = React.useRef(false);
  const hasDraggedRef = React.useRef(false);

  // Sync ref when selectedDates changes while not actively dragging
  React.useEffect(() => {
    if (!isDraggingRef.current) {
      activeDatesRef.current = new Set(selectedDates);
    }
  }, [selectedDates]);

  // Global pointer up / cancel listener to terminate dragging anywhere on the page
  React.useEffect(() => {
    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        lastProcessedDateRef.current = null;
      }
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  // Single date toggle logic (for clicks or keyboard)
  const toggleDate = React.useCallback(
    (dateStr: string) => {
      if (disabled) return;
      const isSelected = selectedSet.has(dateStr);
      const nextDates = isSelected
        ? selectedDates.filter((d) => d !== dateStr)
        : [...selectedDates, dateStr].sort();

      onDateToggle?.(dateStr);
      onDatesChange?.(nextDates);
    },
    [disabled, selectedSet, selectedDates, onDateToggle, onDatesChange]
  );

  // Handle pointer down on a day button
  const handleDatePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, dateStr: string) => {
      if (disabled || e.button !== 0) return;

      // Release pointer capture so pointerenter/move events can hit other elements
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe to ignore in unsupported environments
      }

      isDraggingRef.current = true;
      pointerHandledRef.current = true;
      hasDraggedRef.current = false;
      lastProcessedDateRef.current = dateStr;

      const isCurrentlySelected = activeDatesRef.current.has(dateStr);
      const mode = isCurrentlySelected ? "deselect" : "select";
      dragModeRef.current = mode;

      if (mode === "select") {
        activeDatesRef.current.add(dateStr);
      } else {
        activeDatesRef.current.delete(dateStr);
      }

      const nextDates = Array.from(activeDatesRef.current).sort();
      onDateToggle?.(dateStr);
      onDatesChange?.(nextDates);
    },
    [disabled, onDateToggle, onDatesChange]
  );

  // Handle dragging into a day button
  const handleDateDragOver = React.useCallback(
    (dateStr: string) => {
      if (disabled || !isDraggingRef.current) return;
      if (lastProcessedDateRef.current === dateStr) return;

      lastProcessedDateRef.current = dateStr;
      hasDraggedRef.current = true;

      const mode = dragModeRef.current;
      let changed = false;

      if (mode === "select" && !activeDatesRef.current.has(dateStr)) {
        activeDatesRef.current.add(dateStr);
        changed = true;
      } else if (mode === "deselect" && activeDatesRef.current.has(dateStr)) {
        activeDatesRef.current.delete(dateStr);
        changed = true;
      }

      if (changed) {
        const nextDates = Array.from(activeDatesRef.current).sort();
        onDateToggle?.(dateStr);
        onDatesChange?.(nextDates);
      }
    },
    [disabled, onDateToggle, onDatesChange]
  );

  // Container pointer move handles touch drag or rapid cursor movement
  const handleContainerPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || disabled) return;

      if (e.buttons === 0) {
        isDraggingRef.current = false;
        lastProcessedDateRef.current = null;
        return;
      }

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const dayBtn = target?.closest<HTMLButtonElement>("button[data-day-date]");
      if (dayBtn) {
        const dateStr = dayBtn.getAttribute("data-day-date");
        if (dateStr) {
          handleDateDragOver(dateStr);
        }
      }
    },
    [disabled, handleDateDragOver]
  );

  // Handle native click (distinguishes pointer click from keyboard interaction)
  const handleDateClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, dateStr: string) => {
      if (disabled) return;

      // If pointerdown or drag gesture already processed this, skip to avoid double-toggle
      if (pointerHandledRef.current || hasDraggedRef.current) {
        pointerHandledRef.current = false;
        hasDraggedRef.current = false;
        return;
      }

      // Keyboard click trigger
      toggleDate(dateStr);
    },
    [disabled, toggleDate]
  );

  // Quick Action: Select All Weekends in the currently viewed month
  const handleSelectAllWeekends = React.useCallback(() => {
    if (disabled) return;

    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    const weekendDateStrings = daysInMonth
      .filter((d) => isWeekend(d))
      .map((d) => format(d, "yyyy-MM-dd"));

    const allWeekendsAlreadySelected = weekendDateStrings.every((d) =>
      selectedSet.has(d)
    );

    const nextSet = new Set(selectedDates);

    if (allWeekendsAlreadySelected) {
      // Toggle off weekends of this month
      for (const d of weekendDateStrings) {
        nextSet.delete(d);
      }
    } else {
      // Add all weekends of this month
      for (const d of weekendDateStrings) {
        nextSet.add(d);
      }
    }

    onDatesChange?.(Array.from(nextSet).sort());
  }, [disabled, currentMonth, selectedSet, selectedDates, onDatesChange]);

  // Quick Action: Select Current Week (relative to viewed month or today)
  const handleSelectCurrentWeek = React.useCallback(() => {
    if (disabled) return;

    const today = new Date();
    // Use today if it's within current viewed month, otherwise use start of displayed month
    const referenceDate = isSameMonth(today, currentMonth)
      ? today
      : startOfMonth(currentMonth);

    const weekDays = eachDayOfInterval({
      start: startOfWeek(referenceDate, { weekStartsOn: 0 }),
      end: endOfWeek(referenceDate, { weekStartsOn: 0 }),
    });

    const weekDateStrings = weekDays.map((d) => format(d, "yyyy-MM-dd"));
    const allWeekAlreadySelected = weekDateStrings.every((d) =>
      selectedSet.has(d)
    );

    const nextSet = new Set(selectedDates);

    if (allWeekAlreadySelected) {
      // Toggle off the week
      for (const d of weekDateStrings) {
        nextSet.delete(d);
      }
    } else {
      // Add the week
      for (const d of weekDateStrings) {
        nextSet.add(d);
      }
    }

    onDatesChange?.(Array.from(nextSet).sort());
  }, [disabled, currentMonth, selectedSet, selectedDates, onDatesChange]);

  // Quick Action: Clear all selection
  const handleClearSelection = React.useCallback(() => {
    if (disabled) return;
    onDatesChange?.([]);
  }, [disabled, onDatesChange]);

  // Context value for DayButton
  const contextValue = React.useMemo<CalendarDragContextType>(
    () => ({
      selectedSet,
      disabled,
      onDatePointerDown: handleDatePointerDown,
      onDatePointerEnter: handleDateDragOver,
      onDateClick: handleDateClick,
    }),
    [
      selectedSet,
      disabled,
      handleDatePointerDown,
      handleDateDragOver,
      handleDateClick,
    ]
  );

  const customComponents = React.useMemo(
    () => ({
      DayButton: CustomDayButton,
    }),
    []
  );

  return (
    <div
      className={cn("w-full flex flex-col space-y-4", className)}
      onPointerMove={handleContainerPointerMove}
    >
      {/* Header controls & Selection indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Selection:
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
            Selected: {selectedDates.length}{" "}
            {selectedDates.length === 1 ? "day" : "days"}
          </span>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handleSelectAllWeekends}
            className="text-xs h-8 px-2.5 font-medium border-slate-200 dark:border-slate-700 hover:bg-indigo-50/60 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Toggle selection of all weekends in this month"
          >
            <CalendarCheck className="h-3.5 w-3.5 mr-1.5 text-indigo-500 shrink-0" />
            Select All Weekends
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handleSelectCurrentWeek}
            className="text-xs h-8 px-2.5 font-medium border-slate-200 dark:border-slate-700 hover:bg-indigo-50/60 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Toggle selection of the current week"
          >
            <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-violet-500 shrink-0" />
            Select Current Week
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || selectedDates.length === 0}
            onClick={handleClearSelection}
            className="text-xs h-8 px-2.5 font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Clear all selected dates"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5 shrink-0" />
            Clear All Selection
          </Button>
        </div>
      </div>

      {/* Calendar Area */}
      <CalendarDragContext.Provider value={contextValue}>
        <div
          className="relative flex justify-center py-2 px-1 select-none"
          style={
            {
              "--rdp-accent-color": "#4f46e5",
              "--rdp-accent-background-color": "#eef2ff",
              "--rdp-day-height": "42px",
              "--rdp-day-width": "42px",
              "--rdp-day_button-height": "38px",
              "--rdp-day_button-width": "38px",
              "--rdp-day_button-border-radius": "8px",
            } as React.CSSProperties
          }
        >
          <DayPicker
            mode="multiple"
            defaultMonth={new Date(2026, 11, 1)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            selected={selectedDateObjects}
            showOutsideDays={true}
            components={customComponents}
            classNames={{
              root: "w-full flex justify-center text-slate-800 dark:text-slate-100",
              months: "w-full flex justify-center",
              month: "space-y-3",
              month_caption:
                "flex justify-center items-center relative py-1 text-sm font-semibold text-slate-800 dark:text-slate-100",
              caption_label:
                "text-base font-semibold text-slate-900 dark:text-slate-100",
              nav: "flex items-center justify-between absolute inset-x-0 px-1",
              button_previous:
                "h-8 w-8 p-0 rounded-md inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer",
              button_next:
                "h-8 w-8 p-0 rounded-md inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer",
              weekday:
                "text-slate-400 dark:text-slate-500 font-medium text-xs text-center py-1",
              day: "p-0.5 text-center relative focus-within:relative focus-within:z-20",
            }}
          />
        </div>
      </CalendarDragContext.Provider>

      {/* Helpful tip hint footer */}
      <div className="text-[11px] text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
        <MousePointerClick className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span>Click or drag across dates to quickly select your availability</span>
      </div>
    </div>
  );
}

export default CalendarGrid;
