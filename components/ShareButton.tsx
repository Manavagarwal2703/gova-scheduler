"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShareButtonProps extends ButtonProps {
  url?: string;
  roomCode?: string;
}

export function ShareButton({
  url,
  roomCode,
  className,
  variant = "outline",
  size = "default",
  ...props
}: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      const shareUrl =
        url ||
        (typeof window !== "undefined"
          ? roomCode
            ? `${window.location.origin}/room/${encodeURIComponent(roomCode)}`
            : window.location.href
          : "");
      if (shareUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to copy link to clipboard", err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("transition-all duration-200 select-none", className)}
      aria-label="Share room link"
      {...props}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500 animate-in zoom-in" />
          <span className="text-emerald-600 font-medium">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 text-slate-500" />
          <span>Share Room</span>
        </>
      )}
    </Button>
  );
}
