import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserListDropdown } from "./UserListDropdown";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
}

interface InviteesAvatarGroupProps {
  users?: User[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
}

const defaultUsers: User[] = [
  {
    id: "1",
    name: "Roger G. Rhone",
    email: "RogerGRhone@teleworm.us",
    initials: "OP",
    avatarColor: "bg-pink-200",
  },
  {
    id: "2",
    name: "Mike J. Torres",
    email: "MikeJTorres@rhyta.com",
    initials: "VS",
    avatarColor: "bg-blue-200",
  },
];

export function InviteesAvatarGroup({
  users = defaultUsers,
  maxVisible = 2,
  size = "sm",
}: InviteesAvatarGroupProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = Math.max(0, users.length - maxVisible);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div className="flex -space-x-1">
      {visibleUsers.map((user, index) => (
        <UserListDropdown key={user.id} users={users}>
          <Avatar
            className={cn(
              sizeClasses[size],
              "border-2 border-white cursor-pointer hover:z-10",
            )}
          >
            <AvatarFallback
              className={cn("font-medium text-gray-600", user.avatarColor)}
            >
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </UserListDropdown>
      ))}

      {remainingCount > 0 && (
        <UserListDropdown users={users}>
          <Avatar
            className={cn(
              sizeClasses[size],
              "border-2 border-white cursor-pointer hover:z-10",
            )}
          >
            <AvatarFallback className="font-medium text-gray-600 bg-gray-200">
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        </UserListDropdown>
      )}
    </div>
  );
}
