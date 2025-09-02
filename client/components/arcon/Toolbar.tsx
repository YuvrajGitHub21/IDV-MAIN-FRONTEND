import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";

export interface ToolbarProps {
  onSearchChange?: (value: string) => void;
  onFilter?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onSearchChange,
  onFilter,
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 max-w-md">
        <Input
          placeholder="Search users..."
          className="h-10 rounded-control border-arcon-gray-border"
          onChange={(e) => onSearchChange?.(e.target.value)}
          aria-label="Search users"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-10 rounded-control border-arcon-gray-border text-arcon-gray-primary"
          onClick={onFilter}
        >
          Filter
        </Button>
      </div>
    </div>
  );
};

export default Toolbar;
