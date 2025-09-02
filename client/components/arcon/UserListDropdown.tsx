import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string;
}

interface UserListDropdownProps {
  users: User[];
  children: React.ReactNode;
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
    initials: "MT",
    avatarColor: "bg-blue-200",
  },
  {
    id: "3",
    name: "Wanda C. Moore",
    email: "WandaCMoore@dayrep.com",
    initials: "WM",
    avatarColor: "bg-purple-200",
  },
  {
    id: "4",
    name: "Roy C. Kephart",
    email: "RoyCKephart@dayrep.com",
    initials: "RK",
    avatarColor: "bg-orange-200",
  },
  {
    id: "5",
    name: "Lois S. Spencer",
    email: "LoisSSpencer@rhyta.com",
    initials: "LS",
    avatarColor: "bg-teal-200",
  },
  {
    id: "6",
    name: "Jerry T. Beavers",
    email: "JerryTBeavers@teleworm.us",
    initials: "JB",
    avatarColor: "bg-yellow-200",
  },
];

export function UserListDropdown({
  users = defaultUsers,
  children,
}: UserListDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "w-[280px] p-2 bg-white rounded border shadow-lg",
          "font-roboto max-h-[400px] overflow-y-auto",
        )}
      >
        <div className="space-y-1">
          {users.map((user) => (
            <div
              key={user.id}
              className={cn(
                "flex items-center gap-2 px-2 py-2.5 hover:bg-gray-50 rounded cursor-pointer",
                "transition-colors",
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback
                  className={cn(
                    "text-xs font-medium text-gray-600 border border-white",
                    user.avatarColor,
                  )}
                >
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {user.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
