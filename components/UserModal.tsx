"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface UserModalProps {
  isOpen: boolean;
  initialName?: string;
  onSave: (userId: string, userName: string) => void;
  onClose?: () => void;
}

export function UserModal({
  isOpen,
  initialName = "",
  onSave,
  onClose,
}: UserModalProps) {
  const [name, setName] = React.useState(initialName);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync state when dialog opens or initialName changes without triggering cascading render lint rule
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setName(initialName);
      setError("");
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue");
      inputRef.current?.focus();
      return;
    }

    // Retrieve or generate persistent userId
    let userId = "";
    if (typeof window !== "undefined") {
      userId = localStorage.getItem("gova_user_id") || "";
      if (!userId) {
        userId = `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
        localStorage.setItem("gova_user_id", userId);
      }
      localStorage.setItem("gova_user_name", trimmed);
    } else {
      userId = `user_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    }

    onSave(userId, trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && onClose) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>What&apos;s your name?</DialogTitle>
            <DialogDescription>
              Enter your name so your group knows which dates work best for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div>
              <Input
                ref={inputRef}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Alex Chen"
                className="w-full text-base"
                autoComplete="name"
              />
              {error && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">
                  {error}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
