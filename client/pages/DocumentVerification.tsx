import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Minus,
  Eye,
  Save,
  ChevronDown,
  Trash2,
} from "lucide-react";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isEnabled: boolean;
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
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
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
      ref={(n) => drag(drop(n))}
      className={cn("relative mb-4 cursor-move", isDragging && "opacity-50")}
    >
      <div className="p-3 rounded border border-gray-200 bg-white">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-sm text-gray-900 mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {step.description}
            </p>
          </div>
          {!step.isRequired && (
            <button
              className="p-1 h-auto text-red-500 hover:text-red-700"
              onClick={() => onRemove(step.id)}
              aria-label={`Remove ${step.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function DocumentVerification() {
  const navigate = useNavigate();
  const [allowUploadFromDevice, setAllowUploadFromDevice] = useState(false);
  const [allowCaptureWebcam, setAllowCaptureWebcam] = useState(false);
  const [documentHandling, setDocumentHandling] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "India",
  ]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // Load form state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("arcon_doc_verification_form");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.allowUploadFromDevice === "boolean")
            setAllowUploadFromDevice(parsed.allowUploadFromDevice);
          if (typeof parsed.allowCaptureWebcam === "boolean")
            setAllowCaptureWebcam(parsed.allowCaptureWebcam);
          if (typeof parsed.documentHandling === "string")
            setDocumentHandling(parsed.documentHandling);
          if (Array.isArray(parsed.selectedCountries))
            setSelectedCountries(parsed.selectedCountries);
          if (Array.isArray(parsed.selectedDocuments))
            setSelectedDocuments(parsed.selectedDocuments);
        }
      }
    } catch {}
  }, []);

  // Persist form state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "arcon_doc_verification_form",
        JSON.stringify({
          allowUploadFromDevice,
          allowCaptureWebcam,
          documentHandling,
          selectedCountries,
          selectedDocuments,
        }),
      );
    } catch {}
  }, [
    allowUploadFromDevice,
    allowCaptureWebcam,
    documentHandling,
    selectedCountries,
    selectedDocuments,
  ]);

  // Verification steps state (shared via localStorage)
  const [verificationSteps, setVerificationSteps] = useState<
    VerificationStep[]
  >([]);
  const availableSteps: VerificationStep[] = [
    {
      id: "document-verification",
      title: "Document Verification",
      description: "Set ID submission rules and handling for unclear files.",
      isRequired: false,
      isEnabled: true,
    },
    {
      id: "biometric-verification",
      title: "Biometric Verification",
      description:
        "Set selfie retries, liveness threshold, and biometric storage",
      isRequired: false,
      isEnabled: false,
    },
  ];

  useEffect(() => {
    try {
      const raw = localStorage.getItem("arcon_verification_steps");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          let next = parsed.filter((s: any) => s && typeof s.id === "string");
          const hasPI = next.some((s: any) => s.id === "personal-info");
          if (!hasPI) {
            next = [
              {
                id: "personal-info",
                title: "Personal Information",
                description:
                  "Set up fields to collect basic user details like name, contact.",
                isRequired: true,
                isEnabled: true,
              },
              ...next,
            ];
          }
          if (!next.some((s: any) => s.id === "document-verification")) {
            next = [
              ...next,
              {
                id: "document-verification",
                title: "Document Verification",
                description:
                  "Set ID submission rules and handling for unclear files.",
                isRequired: false,
                isEnabled: true,
              },
            ];
          }
          setVerificationSteps(next);
          return;
        }
      }
    } catch {}
    // Fallback: ensure Personal Information is always present
    setVerificationSteps([
      {
        id: "personal-info",
        title: "Personal Information",
        description:
          "Set up fields to collect basic user details like name, contact.",
        isRequired: true,
        isEnabled: true,
      },
    ]);
  }, []);

  useEffect(() => {
    const hasDoc = verificationSteps.some(
      (s) => s.id === "document-verification",
    );
    try {
      localStorage.setItem(
        "arcon_has_document_verification",
        JSON.stringify(hasDoc),
      );
      localStorage.setItem(
        "arcon_verification_steps",
        JSON.stringify(verificationSteps),
      );
    } catch {}
  }, [verificationSteps]);

  const moveStep = (dragIndex: number, hoverIndex: number) => {
    setVerificationSteps((prev) => {
      const dragged = prev[dragIndex];
      const next = [...prev];
      next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, dragged);
      return next;
    });
  };

  const addVerificationStep = (stepId: string) => {
    const step = availableSteps.find((s) => s.id === stepId);
    if (!step) return;
    setVerificationSteps((prev) =>
      prev.find((s) => s.id === stepId)
        ? prev
        : [...prev, { ...step, isEnabled: true }],
    );
  };

  const removeVerificationStep = (stepId: string) => {
    if (stepId === "personal-info") return;
    setVerificationSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const getAvailableStepsToAdd = () =>
    availableSteps.filter(
      (s) => !verificationSteps.find((vs) => vs.id === s.id),
    );

  const handlePrevious = () => {
    navigate("/template-builder");
  };

  const handleNext = () => {
    console.log("Navigate to preview");
  };

  const handleSave = () => {
    console.log("Save template");
  };

  const handlePreview = () => {
    console.log("Preview template");
  };

  const toggleDocument = (docType: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docType)
        ? prev.filter((d) => d !== docType)
        : [...prev, docType],
    );
  };

  const removeCountry = (country: string) => {
    setSelectedCountries((prev) => prev.filter((c) => c !== country));
  };

  const documentTypes = [
    "Aadhar Card",
    "Pan Card",
    "Driving License",
    "Passport",
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-3 lg:px-4 h-11 border-b border-gray-200 bg-white">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/4566b1e4f2b69299156b1f1c61472e06e0ad9666?width=180"
          alt="Logo"
          className="h-7 w-auto"
        />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F65F7C] flex items-center justify-center">
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

        {/* Page Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2 gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-7 h-7 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
              onClick={handlePrevious}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold text-[#172B4D]">
              New Template
            </h1>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs border-gray-300 whitespace-nowrap"
            >
              <div className="w-4 h-4 rounded border border-gray-300 mr-2"></div>
              <span className="hidden sm:inline">Mark As Complete</span>
              <span className="sm:hidden">Complete</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs border-[#0073EA] text-[#0073EA] hover:bg-blue-50 whitespace-nowrap"
              onClick={handlePreview}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs bg-[#0073EA] hover:bg-blue-700 whitespace-nowrap"
              onClick={handleSave}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Steps Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-200 bg-white gap-3">
        <Button
          variant="ghost"
          className="text-gray-600 text-sm hover:bg-gray-50 self-start sm:self-auto"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="flex items-center gap-4 sm:gap-8 justify-center">
          {/* Step 1 - Active */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full border-2 border-[#0073EA] bg-[#0073EA]">
              <span className="text-white font-bold text-xs sm:text-sm">1</span>
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#172B4D] text-center">
              Form builder
            </span>
          </div>

          <div className="w-16 sm:w-[120px] h-px bg-[#D0D4E4]"></div>

          {/* Step 2 - Inactive */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full border border-[#D0D4E4] bg-white">
              <span className="text-gray-600 font-bold text-xs sm:text-sm">
                2
              </span>
            </div>
            <span className="text-xs sm:text-sm text-gray-600 text-center">
              Preview
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="text-gray-600 text-sm hover:bg-gray-50 self-end sm:self-auto"
          onClick={handleNext}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[332px] p-4 lg:pr-2 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
          <DndProvider backend={HTML5Backend}>
            <div className="space-y-6 lg:space-y-8">
              {/* Build Process Section */}
              <div className="space-y-2">
                <div className="pb-2">
                  <h2 className="text-sm lg:text-[15px] font-bold text-[#292F4C] leading-tight mb-2">
                    Build your process
                  </h2>
                  <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                    Create a flow by adding required information fields and
                    verification steps for your users.
                  </p>
                </div>

                {/* All Added Verification Steps (draggable) */}
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

              {/* Add Verification Steps */}
              <div className="space-y-2">
                <div className="pb-2">
                  <h2 className="text-sm lg:text-[15px] font-bold text-[#292F4C] leading-tight mb-2">
                    Add Verification Steps
                  </h2>
                  <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                    Insert secure verification steps as needed.
                  </p>
                </div>

                {/* Available Steps to Add */}
                {getAvailableStepsToAdd().map((step) => (
                  <div key={step.id} className="relative mb-4">
                    <div className="p-3 rounded border border-gray-200 bg-white">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-gray-900 mb-1">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                        <button
                          className="p-1 h-auto text-blue-600 hover:text-blue-800"
                          onClick={() => addVerificationStep(step.id)}
                          aria-label={`Add ${step.title}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DndProvider>
        </div>

        {/* Resize Handle */}
        <div className="hidden lg:flex w-4 flex-col items-center bg-white">
          <div className="w-px flex-1 bg-[#D0D4E4]"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 lg:pl-2 bg-white overflow-auto">
          <div className="space-y-4 lg:space-y-6">
            {/* Personal Information Accordion */}
            <div className="border border-[#D0D4E4] rounded">
              <div className="p-3 flex items-center gap-2">
                <Minus className="w-4 lg:w-[18px] h-4 lg:h-[18px] text-[#323238]" />
                <h3 className="text-sm lg:text-base font-bold text-[#172B4D]">
                  Personal Information
                </h3>
              </div>
              <div className="px-4 lg:px-9 pb-3">
                <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                  Set up fields to collect basic user details like name,
                  contact.
                </p>
              </div>
            </div>

            {/* Document Verification Accordion - Expanded */}
            <div className="border border-[#D0D4E4] rounded">
              <div className="p-3 flex items-center gap-2">
                <Minus className="w-4 lg:w-[18px] h-4 lg:h-[18px] text-[#323238]" />
                <h3 className="text-sm lg:text-base font-bold text-[#172B4D]">
                  Document Verification
                </h3>
              </div>
              <div className="px-4 lg:px-9 pb-3">
                <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                  Define how users can submit ID documents and what happens if
                  files are unclear.
                </p>
              </div>

              {/* Document Verification Content */}
              <div className="px-4 lg:px-9 pb-4 lg:pb-6 space-y-4 lg:space-y-6">
                {/* User Upload Options */}
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h4 className="text-sm lg:text-base font-bold text-[#172B4D] leading-tight mb-2">
                      User Upload Options
                    </h4>
                    <p className="text-xs lg:text-[13px] text-[#172B4D] leading-relaxed">
                      Select how users are allowed to submit documents during
                      the process.
                    </p>
                  </div>

                  <div className="bg-[#F6F7FB] rounded p-4 lg:p-6 space-y-4 lg:space-y-5">
                    {/* Upload from Device */}
                    <div className="pb-4 lg:pb-5 border-b border-[#D0D4E4]">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="upload-device"
                          checked={allowUploadFromDevice}
                          onCheckedChange={setAllowUploadFromDevice}
                          className="mt-0.5 w-4 h-4 lg:w-[18px] lg:h-[18px]"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor="upload-device"
                            className="text-xs lg:text-[13px] font-medium text-[#172B4D] leading-relaxed block mb-2"
                          >
                            Allow Upload from Device
                          </Label>
                          <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                            Let users upload existing documents directly from
                            their device.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Capture via Webcam */}
                    <div>
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="capture-webcam"
                          checked={allowCaptureWebcam}
                          onCheckedChange={setAllowCaptureWebcam}
                          className="mt-0.5 w-4 h-4 lg:w-[18px] lg:h-[18px]"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor="capture-webcam"
                            className="text-xs lg:text-[13px] font-medium text-[#172B4D] leading-relaxed block mb-2"
                          >
                            Allow Capture via Webcam
                          </Label>
                          <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                            Enable webcam access to allow users to capture
                            documents in real time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unreadable Document Handling */}
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h4 className="text-sm lg:text-base font-bold text-[#172B4D] leading-tight mb-2">
                      Unreadable Document Handling
                    </h4>
                    <p className="text-xs lg:text-[13px] text-[#172B4D] leading-relaxed">
                      Choose what action the system should take if a submitted
                      document is not clear or unreadable.
                    </p>
                  </div>

                  <div className="bg-[#F6F7FB] rounded p-4 lg:p-6">
                    <RadioGroup
                      value={documentHandling}
                      onValueChange={setDocumentHandling}
                    >
                      <div className="space-y-4 lg:space-y-5">
                        {/* Reject Immediately */}
                        <div className="pb-4 lg:pb-5 border-b border-[#D0D4E4]">
                          <div className="flex items-start gap-2">
                            <RadioGroupItem
                              value="reject"
                              id="reject"
                              className="mt-0.5 w-4 h-4 lg:w-[18px] lg:h-[18px]"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor="reject"
                                className="text-xs lg:text-[13px] font-medium text-[#172B4D] leading-relaxed block mb-2"
                              >
                                Reject Immediately
                              </Label>
                              <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                                Skip retry and reject unclear documents without
                                further attempts.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Allow Retries */}
                        <div>
                          <div className="flex items-start gap-2">
                            <RadioGroupItem
                              value="retry"
                              id="retry"
                              className="mt-0.5 w-4 h-4 lg:w-[18px] lg:h-[18px]"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor="retry"
                                className="text-xs lg:text-[13px] font-medium text-[#172B4D] leading-relaxed block mb-2"
                              >
                                Allow Retries Before Rejection
                              </Label>
                              <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                                Let users reattempt uploading the document
                                before it's finally rejected.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Supported Countries */}
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h4 className="text-sm lg:text-base font-bold text-[#172B4D] leading-tight mb-2">
                      Supported Countries for Identity Verification
                    </h4>
                    <p className="text-xs lg:text-[13px] text-[#172B4D] leading-relaxed">
                      Only document from these countries are supported.
                    </p>
                  </div>

                  <div className="bg-[#F6F7FB] rounded p-4 lg:p-6 space-y-3 lg:space-y-4">
                    {/* Country Selection */}
                    <div>
                      <Label className="text-xs lg:text-[13px] font-medium text-[#172B4D] leading-relaxed block mb-2">
                        Which countries are supported?
                      </Label>
                      <div className="relative">
                        <Button
                          variant="outline"
                          className="w-full max-w-80 h-8 justify-between text-xs lg:text-[13px] text-[#676879] border-[#C3C6D4] bg-white"
                        >
                          Select Countries
                          <ChevronDown className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Selected Countries */}
                    {selectedCountries.map((country) => (
                      <div key={country} className="bg-white rounded p-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm lg:text-[14px] font-medium text-black">
                            {country}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 hover:bg-gray-100"
                            onClick={() => removeCountry(country)}
                          >
                            <Trash2 className="w-4 lg:w-[18px] h-4 lg:h-[18px] text-[#676879]" />
                          </Button>
                        </div>

                        {/* Document Types */}
                        <div className="bg-[#F6F7FB] rounded p-3 flex flex-wrap gap-2">
                          {documentTypes.map((docType) => (
                            <div
                              key={docType}
                              className="flex items-center gap-2 bg-[#F6F7FB] rounded-full px-2 py-2"
                            >
                              <Checkbox
                                id={`${country}-${docType}`}
                                checked={selectedDocuments.includes(docType)}
                                onCheckedChange={() => toggleDocument(docType)}
                                className="w-4 h-4 lg:w-[18px] lg:h-[18px]"
                              />
                              <Label
                                htmlFor={`${country}-${docType}`}
                                className="text-xs lg:text-[13px] font-medium text-[#505258] cursor-pointer"
                              >
                                {docType}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
