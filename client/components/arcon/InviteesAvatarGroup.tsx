import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserListDropdown } from "./UserListDropdown";
import { cn } from "@/lib/utils";
//final v3
type Invitee = {
  id: number | string;
  name?: string;
  email: string;
  status?: string;
};

interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarColor: string; // tailwind bg-* class
}

interface InviteesAvatarGroupProps {
  /** Pass backend invitees from useTemplates → template.invitees */
  invitees?: Invitee[];
  /** (optional) legacy prop; still supported */
  users?: User[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
}

const defaultUsers: User[] = [
  { id: "1", name: "Roger G. Rhone", email: "roger@example.com", initials: "RR", avatarColor: "bg-pink-200" },
  { id: "2", name: "Mike J. Torres", email: "mike@example.com", initials: "MT", avatarColor: "bg-blue-200" },
];

const initialsOf = (name?: string, email?: string) => {
  const fromName =
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");
  if (fromName) return fromName;
  const handle = (email || "").split("@")[0] || "";
  return (handle[0] || "?").toUpperCase();
};

const hashCode = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const pickBgClass = (seed: string) => {
  const palette = [
    "bg-pink-200",
    "bg-blue-200",
    "bg-purple-200",
    "bg-orange-200",
    "bg-emerald-200",
    "bg-slate-200",
  ];
  return palette[hashCode(seed) % palette.length];
};

export default function InviteesAvatarGroup({
  invitees,
  users,
  maxVisible = 2,
  size = "sm",
}: InviteesAvatarGroupProps) {
  // Normalize: prefer backend invitees → renderable users
  const renderUsers: User[] = React.useMemo(() => {
    if (invitees && invitees.length) {
      return invitees.map((i) => {
        const id = String(i.id ?? i.email);
        const name = (i.name && i.name.trim()) || i.email?.split("@")[0] || "—";
        return {
          id,
          name,
          email: i.email,
          initials: initialsOf(name, i.email),
          avatarColor: pickBgClass(id),
        };
      });
    }
    if (users && users.length) return users;
    return defaultUsers;
  }, [invitees, users]);

  const visible = renderUsers.slice(0, maxVisible);
  const remaining = Math.max(0, renderUsers.length - maxVisible);

  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div className="flex -space-x-1">
      {visible.map((u) => (
        <UserListDropdown key={u.id} users={renderUsers}>
          <Avatar className={cn(sizeClasses[size], "border-2 border-white cursor-pointer hover:z-10")}>
            <AvatarFallback className={cn("font-medium text-gray-600", u.avatarColor)}>
              {u.initials}
            </AvatarFallback>
          </Avatar>
        </UserListDropdown>
      ))}

      {remaining > 0 && (
        <UserListDropdown users={renderUsers}>
          <Avatar className={cn(sizeClasses[size], "border-2 border-white cursor-pointer hover:z-10")}>
            <AvatarFallback className="font-medium text-gray-600 bg-gray-200">
              +{remaining}
            </AvatarFallback>
          </Avatar>
        </UserListDropdown>
      )}
    </div>
  );
}
