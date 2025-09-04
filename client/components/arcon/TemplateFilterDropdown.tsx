import React from "react";
import { Button } from "@/components/ui/button";

interface TemplateFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isActiveFilter: boolean | undefined;
  onChangeIsActive: (value: boolean | undefined) => void;
  creators: { id: string; name: string }[];
  selectedCreator: string | undefined;
  onChangeCreator: (id: string | undefined) => void;
}

export default function TemplateFilterDropdown({
  isOpen,
  onClose,
  isActiveFilter,
  onChangeIsActive,
  creators,
  selectedCreator,
  onChangeCreator,
}: TemplateFilterDropdownProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-1 z-50 w-[260px] bg-white rounded border border-gray-200 shadow-lg p-3">
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-700 mb-1">Status</div>
          <div className="flex flex-col gap-1">
            <button
              className={`text-left px-2 py-1 rounded ${isActiveFilter === undefined ? "bg-gray-100" : "hover:bg-gray-50"}`}
              onClick={() => onChangeIsActive(undefined)}
            >
              All
            </button>
            <button
              className={`text-left px-2 py-1 rounded ${isActiveFilter === true ? "bg-gray-100" : "hover:bg-gray-50"}`}
              onClick={() => onChangeIsActive(true)}
            >
              Completed
            </button>
            <button
              className={`text-left px-2 py-1 rounded ${isActiveFilter === false ? "bg-gray-100" : "hover:bg-gray-50"}`}
              onClick={() => onChangeIsActive(false)}
            >
              In Progress
            </button>
          </div>
        </div>

        <div className="mb-2">
          <div className="text-sm font-medium text-gray-700 mb-1">Creator</div>
          <select
            value={selectedCreator ?? ""}
            onChange={(e) => onChangeCreator(e.target.value || undefined)}
            className="w-full border border-gray-200 rounded px-2 py-1 text-sm"
          >
            <option value="">All creators</option>
            {creators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
