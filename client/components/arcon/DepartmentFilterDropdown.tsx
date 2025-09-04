import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface DepartmentFilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDepartments: string[];
  onDepartmentChange: (departments: string[]) => void;
  departments: string[];
}

export default function DepartmentFilterDropdown({
  isOpen,
  onClose,
  selectedDepartments,
  onDepartmentChange,
  departments,
}: DepartmentFilterDropdownProps) {
  if (!isOpen) return null;

  const handleDepartmentToggle = (department: string) => {
    const isSelected = selectedDepartments.includes(department);
    if (isSelected) {
      onDepartmentChange(selectedDepartments.filter(d => d !== department));
    } else {
      onDepartmentChange([...selectedDepartments, department]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-1 z-50 w-[250px] bg-white rounded border border-[#C3C6D4] shadow-lg">
        <div className="flex flex-col p-2 gap-0.5">
          {departments.map((department) => {
            const isSelected = selectedDepartments.includes(department);
            return (
              <div
                key={department}
                className="flex items-center gap-2 px-1.5 py-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => handleDepartmentToggle(department)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleDepartmentToggle(department)}
                  className="w-4 h-4 border border-[#C3C6D4] data-[state=checked]:bg-[#0073EA] data-[state=checked]:border-[#0073EA]"
                />
                <span className="text-sm text-[#676879] font-roboto font-normal">
                  {department}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
