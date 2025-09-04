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
  sortBy: "createdAt" | "updatedAt" | undefined;
  sortOrder: "asc" | "desc" | undefined;
  onChangeSortBy: (s: "createdAt" | "updatedAt" | undefined) => void;
  onChangeSortOrder: (o: "asc" | "desc" | undefined) => void;
}

export default function TemplateFilterDropdown({
  isOpen,
  onClose,
  isActiveFilter,
  onChangeIsActive,
  creators,
  selectedCreator,
  onChangeCreator,
  sortBy,
  sortOrder,
  onChangeSortBy,
  onChangeSortOrder,
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

        <div className="mb-2">
          <div className="text-sm font-medium text-gray-700 mb-1">Sort by</div>
          <div className="flex gap-2">
            <select
              value={sortBy ?? ""}
              onChange={(e) =>
                onChangeSortBy(
                  e.target.value ? (e.target.value as any) : undefined,
                )
              }
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
            >
              <option value="">Default</option>
              <option value="createdAt">Created At</option>
              <option value="updatedAt">Last Updated</option>
            </select>

            <select
              value={sortOrder ?? ""}
              onChange={(e) =>
                onChangeSortOrder(
                  e.target.value ? (e.target.value as any) : undefined,
                )
              }
              className="w-28 border border-gray-200 rounded px-2 py-1 text-sm"
            >
              <option value="">Order</option>
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
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
