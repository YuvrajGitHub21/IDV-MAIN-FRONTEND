import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Send, 
  Link, 
  Download, 
  Edit3, 
  Copy, 
  Edit, 
  Trash2,
  MoreVertical 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateActionsDropdownProps {
  onPreview?: () => void;
  onSendInvite?: () => void;
  onGenerateLink?: () => void;
  onDownload?: () => void;
  onRename?: () => void;
  onClone?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TemplateActionsDropdown({
  onPreview,
  onSendInvite,
  onGenerateLink,
  onDownload,
  onRename,
  onClone,
  onEdit,
  onDelete,
}: TemplateActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="p-1 h-8 w-8 rounded-full hover:bg-gray-100"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-[250px] p-2 bg-white rounded border shadow-lg",
          "font-roboto"
        )}
      >
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onPreview}
        >
          <Eye className="w-4 h-4" />
          Preview
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onSendInvite}
        >
          <Send className="w-4 h-4" />
          Send Invite
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onGenerateLink}
        >
          <Link className="w-4 h-4" />
          Generate Link
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onDownload}
        >
          <Download className="w-4 h-4" />
          Download
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="my-1 bg-gray-200" />
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onRename}
        >
          <Edit3 className="w-4 h-4" />
          Rename
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onClone}
        >
          <Copy className="w-4 h-4" />
          Clone
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onEdit}
        >
          <Edit className="w-4 h-4" />
          Edit
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className={cn(
            "flex items-center gap-2 px-1.5 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
