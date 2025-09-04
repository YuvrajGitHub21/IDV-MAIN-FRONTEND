import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NameTemplateDialog } from "./NameTemplateDialog";

interface AddNewTemplateDropdownProps {
  onCreateNew?: (templateName: string) => void;
  onChooseTemplate?: () => void;
}

export function AddNewTemplateDropdown({
  onCreateNew,
  onChooseTemplate,
}: AddNewTemplateDropdownProps) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const navigate = useNavigate();

  const handleCreateNewClick = () => {
    setShowNameDialog(true);
  };

  const handleCreateNewFromDropdown = () => {
    setShowNameDialog(true);
  };

  const handleChooseTemplateClick = () => {
    navigate("/choose-template");
  };

  const handleSaveTemplate = (templateName: string) => {
    onCreateNew?.(templateName);
  };
  return (
    <>
      <DropdownMenu>
        <div className="flex items-center">
          <button
            className="h-8 px-3 bg-[#0073EA] hover:bg-[#0060B9] text-white text-xs font-medium font-roboto rounded-l border-r border-[#0060B9] transition-colors"
            onClick={handleCreateNewClick}
          >
            Add New
          </button>
          <DropdownMenuTrigger asChild>
            <button className="h-8 px-2 bg-[#0073EA] hover:bg-[#0060B9] text-white rounded-r transition-colors flex items-center justify-center">
              <svg
                width="9"
                height="6"
                viewBox="0 0 9 6"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1.0575 0.222656L4.5 3.65766L7.9425 0.222656L9 1.28016L4.5 5.78016L0 1.28016L1.0575 0.222656Z"
                  fill="white"
                />
              </svg>
            </button>
          </DropdownMenuTrigger>
        </div>
        <DropdownMenuContent
          align="end"
          className={cn(
            "w-[230px] p-2 bg-white rounded border shadow-lg",
            "font-roboto",
          )}
        >
          <DropdownMenuItem
            className={cn(
              "flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
              "font-medium",
            )}
            onClick={handleCreateNewFromDropdown}
          >
            Create New Template
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(
              "flex items-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer",
              "font-medium",
            )}
            onClick={onChooseTemplate}
          >
            Choose Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NameTemplateDialog
        open={showNameDialog}
        onOpenChange={setShowNameDialog}
        onSave={handleSaveTemplate}
        onCancel={() => setShowNameDialog(false)}
      />
    </>
  );
}
