import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";

export interface AppHeaderProps {
  className?: string;
  onSearchChange?: (value: string) => void;
  onFilter?: () => void;
  userName?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  className,
  onSearchChange,
  onFilter,
  userName,
}) => {
  return (
    <header
      className={cn(
        "w-full border-b border-arcon-gray-border bg-white/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            width="24"
            height="24"
            viewBox="0 0 30 30"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M27.3723 22.6039C27.9964 23.7209 27.189 25.097 25.9095 25.097H4.88702C3.6005 25.097 2.79387 23.7073 3.43201 22.5902L14.0587 3.98729C14.7055 2.85516 16.3405 2.86285 16.9765 4.00102L27.3723 22.6039Z"
              stroke="#D83A52"
              strokeWidth="2.5"
            />
          </svg>
          <span className="text-arcon-gray-primary text-xl font-bold font-roboto">
            arcon
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search..."
              className="h-10 rounded-control border-arcon-gray-border"
              onChange={(e) => onSearchChange?.(e.target.value)}
              aria-label="Search"
            />
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-control border-arcon-gray-border text-arcon-gray-primary"
            onClick={onFilter}
          >
            Filter
          </Button>
          {userName ? (
            <span className="ml-2 text-arcon-gray-primary font-roboto">
              {userName}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
