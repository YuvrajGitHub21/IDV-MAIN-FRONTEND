import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Minus,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isEnabled: boolean;
}

interface FieldOption {
  id: string;
  name: string;
  placeholder: string;
  checked: boolean;
}

interface AddedField {
  id: string;
  name: string;
  placeholder: string;
  value: string;
}

interface DraggableVerificationStepProps {
  step: VerificationStep;
  index: number;
  moveStep: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (stepId: string) => void;
}

const DraggableVerificationStep: React.FC<DraggableVerificationStepProps> = ({
  step,
  index,
  moveStep,
  onRemove,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "verification-step",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "verification-step",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveStep(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn("relative mb-4 cursor-move", isDragging && "opacity-50")}
    >
      <div className="p-3 rounded border border-gray-200 bg-white">
        <div className="flex items-start gap-3">
          <GripVertical className="w-4 h-4 text-gray-400 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900 mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>
          {!step.isRequired && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto text-red-500 hover:text-red-700"
              onClick={() => onRemove(step.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateName = location.state?.templateName || "New Template";

  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Set up fields to collect basic user details like name, contact.",
      isRequired: true,
      isEnabled: true,
    },
  ]);

  const [availableSteps] = useState<VerificationStep[]>([
    {
      id: "document-verification",
      title: "Document Verification",
      description: "Set ID submission rules and handling for unclear files.",
      isRequired: false,
      isEnabled: false,
    },
    {
      id: "biometric-verification",
      title: "Biometric Verification",
      description: "Set selfie retries, liveness threshold, and biometric storage",
      isRequired: false,
      isEnabled: false,
    },
  ]);

  const [optionalFields, setOptionalFields] = useState<FieldOption[]>([
    { id: "date-of-birth", name: "Date Of Birth", placeholder: "10/07/1997", checked: false },
    { id: "current-address", name: "Current Address", placeholder: "Enter your current address", checked: false },
    { id: "permanent-address", name: "Permanent Address", placeholder: "Enter your permanent address", checked: false },
    { id: "gender", name: "Gender", placeholder: "Select gender", checked: false },
  ]);

  const [addedFields, setAddedFields] = useState<AddedField[]>([]);
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(true);

  const addVerificationStep = (stepId: string) => {
    const stepToAdd = availableSteps.find((step) => step.id === stepId);
    if (stepToAdd) {
      setVerificationSteps((prev) => [
        ...prev,
        { ...stepToAdd, isEnabled: true },
      ]);
    }
  };

  const removeVerificationStep = (stepId: string) => {
    if (stepId === "personal-info") return; // Can't remove required step
    setVerificationSteps((prev) => prev.filter((step) => step.id !== stepId));
  };

  const moveStep = useCallback((dragIndex: number, hoverIndex: number) => {
    setVerificationSteps((prev) => {
      const draggedStep = prev[dragIndex];
      const newSteps = [...prev];
      newSteps.splice(dragIndex, 1);
      newSteps.splice(hoverIndex, 0, draggedStep);
      return newSteps;
    });
  }, []);

  const toggleOptionalField = (fieldId: string) => {
    const field = optionalFields.find(f => f.id === fieldId);
    if (!field) return;

    if (field.checked) {
      // Remove from added fields and uncheck
      setAddedFields(prev => prev.filter(f => f.id !== fieldId));
      setOptionalFields(prev =>
        prev.map(f =>
          f.id === fieldId ? { ...f, checked: false } : f
        )
      );
    } else {
      // Add to added fields and check
      setAddedFields(prev => [
        ...prev,
        { id: field.id, name: field.name, placeholder: field.placeholder, value: "" }
      ]);
      setOptionalFields(prev =>
        prev.map(f =>
          f.id === fieldId ? { ...f, checked: true } : f
        )
      );
    }
  };

  const removeAddedField = (fieldId: string) => {
    setAddedFields(prev => prev.filter(f => f.id !== fieldId));
    setOptionalFields(prev =>
      prev.map(f =>
        f.id === fieldId ? { ...f, checked: false } : f
      )
    );
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    setAddedFields(prev =>
      prev.map(f =>
        f.id === fieldId ? { ...f, value } : f
      )
    );
  };

  const handlePrevious = () => {
    navigate("/dashboard");
  };

  const handleNext = () => {
    // Navigate to preview step
    console.log("Navigate to preview");
  };

  // Get available steps that aren't already added
  const getAvailableStepsToAdd = () => {
    return availableSteps.filter(step => 
      !verificationSteps.find(vs => vs.id === step.id)
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/4566b1e4f2b69299156b1f1c61472e06e0ad9666?width=180"
            alt="Logo"
            className="h-7"
          />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center">
              <span className="text-white text-xs font-medium">OS</span>
            </div>
          </div>
        </header>

        {/* Sub Header */}
        <div className="border-b border-gray-200">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Template</span>
            <span>/</span>
            <span>Create New Template</span>
          </div>

          {/* Page Title */}
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-7 h-7 p-0 rounded-full bg-gray-100"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{templateName}</h1>
            </div>
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            className="text-gray-600 text-sm"
            onClick={handlePrevious}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-8">
            {/* Step 1 - Active */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-600">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Form builder</span>
            </div>

            <div className="w-24 h-px bg-gray-300"></div>

            {/* Step 2 - Inactive */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white">
                <span className="text-gray-600 font-bold text-sm">2</span>
              </div>
              <span className="text-sm text-gray-600">Preview</span>
            </div>
          </div>

          <Button
            variant="ghost"
            className="text-gray-600 text-sm"
            onClick={handleNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Left Sidebar */}
          <div className="w-80 p-4 border-r border-gray-200 bg-white">
            {/* Build Process Section */}
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">Build your process</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Create a flow by adding required information fields and verification steps for your users.
                </p>
              </div>

              {/* All Added Verification Steps */}
              {verificationSteps.map((step, index) => (
                <DraggableVerificationStep
                  key={step.id}
                  step={step}
                  index={index}
                  moveStep={moveStep}
                  onRemove={removeVerificationStep}
                />
              ))}
            </div>

            {/* Verification Steps Section */}
            {getAvailableStepsToAdd().length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-2">Add Verification Steps</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Insert secure verification steps as needed.
                  </p>
                </div>

                {/* Available Steps to Add */}
                {getAvailableStepsToAdd().map((step) => (
                  <div key={step.id} className="relative mb-4 opacity-50">
                    <div className="p-3 rounded border border-gray-200 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-900 mb-1">{step.title}</h3>
                          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-auto text-blue-600 hover:text-blue-800"
                          onClick={() => addVerificationStep(step.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div className="w-4 bg-gray-100 cursor-col-resize border-r border-gray-200">
            <div className="w-px h-full bg-gray-300 mx-auto"></div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-4 bg-white">
            {/* Personal Information Section */}
            <div className="border border-gray-300 rounded">
              {/* Header */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-300 bg-white">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto"
                  onClick={() => setPersonalInfoExpanded(!personalInfoExpanded)}
                >
                  <Minus className="w-5 h-5 text-gray-700" />
                </Button>
                <h2 className="font-bold text-base text-gray-900">
                  Personal Information
                </h2>
              </div>

              {/* Content */}
              {personalInfoExpanded && (
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="font-bold text-base text-gray-900 mb-2">
                      System-required Fields
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      The following fields are fixed and required in every
                      template. Continue adding your own fields below.
                    </p>
                  </div>

                  {/* Required Fields */}
                  <div className="space-y-4 mb-8">
                    {/* First Name */}
                    <div className="border border-gray-300 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-gray-900">
                          First Name
                        </h4>
                      </div>
                      <div className="text-sm text-gray-500">Eg: John</div>
                    </div>

                    {/* Last Name */}
                    <div className="border border-gray-300 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-gray-900">
                          Last Name
                        </h4>
                      </div>
                      <div className="text-sm text-gray-500">Eg: Wick</div>
                    </div>

                    {/* Email Address */}
                    <div className="border border-gray-300 rounded-lg p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-gray-900">
                          Email Address
                        </h4>
                      </div>
                      <div className="text-sm text-gray-500">
                        Eg: johnwick@email.com
                      </div>
                    </div>
                  </div>

                  {/* Added Fields Section */}
                  {addedFields.length > 0 && (
                    <div>
                      <div className="mb-4">
                        <h3 className="font-bold text-base text-gray-900 mb-2">
                          Added Fields
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Extra fields to collect specific to your verification flow.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {addedFields.map((field) => (
                          <div key={field.id} className="border border-blue-300 rounded-lg p-5 bg-blue-50">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="font-semibold text-sm text-gray-900">
                                {field.name}
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-auto text-red-500 hover:text-red-700"
                                onClick={() => removeAddedField(field.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <Input
                              value={field.value}
                              onChange={(e) => updateFieldValue(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              className="bg-white border-gray-300"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {field.placeholder.includes("Required") ? "Required" : "Optional"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Add Fields */}
          <div className="w-72 border-l border-gray-200 bg-white">
            {/* Header */}
            <div className="p-3 border-b border-gray-300">
              <h2 className="font-bold text-base text-gray-900 mb-1">
                Add Fields
              </h2>
              <p className="text-sm text-gray-600">
                Add fields specific to your verification flow.
              </p>
            </div>

            {/* Optional Fields */}
            <div className="p-3">
              <div className="space-y-3">
                {optionalFields.filter(field => !field.checked).map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Checkbox
                      id={field.id}
                      checked={field.checked}
                      onCheckedChange={() => toggleOptionalField(field.id)}
                      className="w-4 h-4"
                    />
                    <label
                      htmlFor={field.id}
                      className="text-sm font-bold text-gray-600 cursor-pointer"
                    >
                      {field.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
