import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createTemplateMin } from "@/hooks/useTemplates";

interface NameTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (templateName: string) => void;
  onCancel?: () => void;
}

export function NameTemplateDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
}: NameTemplateDialogProps) {
  const [templateName, setTemplateName] = useState("");
  const navigate = useNavigate();

  const handleSave = async () => {
  const name = templateName.trim();
  if (!name) return;

  try {
    // 1) Create on server — stamps created_by & timestamps
    const created = await createTemplateMin(name);

    // 2) Optional notify parent
    onSave?.(name);

    // 3) Close dialog
    setTemplateName("");
    onOpenChange(false);

    // 4) Navigate to builder with new template id + name
    navigate("/template-builder", {
      state: { templateId: created.id, templateName: created.name },
    });
  } catch (err: any) {
    alert(err?.message || "Failed to create template");
  }
};



  const handleCancel = () => {
    setTemplateName("");
    onCancel?.();
    onOpenChange(false);
  };

  const handleClose = () => {
    setTemplateName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[520px] w-full p-0 gap-0 bg-white rounded-lg border shadow-lg",
          "font-roboto",
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Custom Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-300 bg-white">
          <DialogTitle className="text-lg font-bold text-gray-900 leading-7">
            Name Your Template
          </DialogTitle>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
              onClick={handleClose}
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </DialogClose>
        </div>

        {/* Body */}
        <div className="px-5 py-5 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="template-name"
                className="text-sm font-medium text-gray-900 leading-[18px]"
              >
                Template Name
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter Template Name"
                className={cn(
                  "h-[38px] px-3 py-2 text-sm border border-gray-300 rounded",
                  "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "placeholder:text-gray-500",
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  }
                  if (e.key === "Escape") {
                    handleCancel();
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-300 bg-white">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className={cn(
              "h-8 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
              "rounded border-0",
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!templateName.trim()}
            className={cn(
              "h-8 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700",
              "rounded border border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Save & Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
