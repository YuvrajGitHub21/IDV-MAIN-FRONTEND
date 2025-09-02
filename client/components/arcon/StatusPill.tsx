import { cn } from "@/lib/utils";
import React from "react";

export type StatusVariant = "neutral" | "success" | "warning" | "danger";

export interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  neutral: "bg-arcon-panel text-arcon-gray-primary border-arcon-gray-border",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = "neutral",
  className,
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium font-roboto",
        variantClasses[variant],
        className,
      )}
      aria-label={label}
    >
      {label}
    </span>
  );
};

export default StatusPill;
