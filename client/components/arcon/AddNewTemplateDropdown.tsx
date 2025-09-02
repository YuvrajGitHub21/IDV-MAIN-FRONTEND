import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddNewTemplateDropdownProps {
  onCreateNew?: () => void;
  onChooseTemplate?: () => void;
}

export function AddNewTemplateDropdown({
  onCreateNew,
  onChooseTemplate,
}: AddNewTemplateDropdownProps) {
  return (
    <DropdownMenu>
      <div className="flex">
        <Button 
          className="bg-blue-600 text-white px-3 py-1.5 text-sm font-medium rounded-l hover:bg-blue-700"
          onClick={onCreateNew}
        >
          Add New
        </Button>
        <DropdownMenuTrigger asChild>
          <Button className="bg-blue-600 border-l border-blue-500 text-white px-2 py-1.5 rounded-r hover:bg-blue-700">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent 
        align="end" 
        className={cn(
          "w-[230px] p-2 bg-white rounded border shadow-lg",
          "font-roboto"
        )}
      >
        <DropdownMenuItem 
          className={cn(
            "flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onCreateNew}
        >
          Create New Template
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={cn(
            "flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
            "font-medium"
          )}
          onClick={onChooseTemplate}
        >
          Choose Template
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
