import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Info,
  ChevronDown,
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

// Document Verification Configuration Component
const DocumentVerificationSection: React.FC<{ isExpanded: boolean; onToggle: () => void }> = ({
  isExpanded,
  onToggle,
}) => {
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
    <div className="border border-gray-300 rounded">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-300 bg-white">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto"
          onClick={onToggle}
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </Button>
        <h2 className="font-bold text-base text-gray-900">
          Document Verification
        </h2>
      </div>

      {/* Description when collapsed */}
      {!isExpanded && (
        <div className="px-4 lg:px-9 pb-3">
          <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
            Define how users can submit ID documents and what happens if files
            are unclear.
          </p>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-8 space-y-6">
          {/* User Upload Options */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                User Upload Options
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Select how users are allowed to submit documents during the
                process.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              {/* Upload from Device */}
              <div className="pb-5 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="upload-device"
                    checked={allowUploadFromDevice}
                    onCheckedChange={(checked) =>
                      setAllowUploadFromDevice(checked === true)
                    }
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="upload-device"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Allow Upload from Device
                    </Label>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Let users upload existing documents directly from their
                      device.
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
                    onCheckedChange={(checked) =>
                      setAllowCaptureWebcam(checked === true)
                    }
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="capture-webcam"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Allow Capture via Webcam
                    </Label>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Enable webcam access to allow users to capture documents
                      in real time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unreadable Document Handling */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Unreadable Document Handling
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Choose what action the system should take if a submitted
                document is not clear or unreadable.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <RadioGroup
                value={documentHandling}
                onValueChange={setDocumentHandling}
              >
                <div className="space-y-5">
                  {/* Reject Immediately */}
                  <div className="pb-5 border-b border-gray-200">
                    <div className="flex items-start gap-2">
                      <RadioGroupItem
                        value="reject"
                        id="reject"
                        className="mt-0.5 w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor="reject"
                          className="text-sm font-medium text-gray-900 block mb-2"
                        >
                          Reject Immediately
                        </Label>
                        <p className="text-sm text-gray-600 leading-relaxed">
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
                        className="mt-0.5 w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor="retry"
                          className="text-sm font-medium text-gray-900 block mb-2"
                        >
                          Allow Retries Before Rejection
                        </Label>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Let users reattempt uploading the document before it's
                          finally rejected.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Supported Countries */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Supported Countries for Identity Verification
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Only documents from these countries are supported.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              {/* Country Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-900 block mb-2">
                  Which countries are supported?
                </Label>
                <div className="relative max-w-80">
                  <Button
                    variant="outline"
                    className="w-full h-8 justify-between text-sm text-gray-600 border-gray-300 bg-white"
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
                    <span className="text-sm font-medium text-black">
                      {country}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 p-0 hover:bg-gray-100"
                      onClick={() => removeCountry(country)}
                    >
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>

                  {/* Document Types */}
                  <div className="bg-gray-50 rounded p-3 flex flex-wrap gap-2">
                    {documentTypes.map((docType) => (
                      <div
                        key={docType}
                        className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-2"
                      >
                        <Checkbox
                          id={`${country}-${docType}`}
                          checked={selectedDocuments.includes(docType)}
                          onCheckedChange={() => toggleDocument(docType)}
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor={`${country}-${docType}`}
                          className="text-sm font-medium text-gray-600 cursor-pointer"
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
      )}
    </div>
  );
};

// Biometric Verification Configuration Component
const BiometricVerificationSection: React.FC<{ onNext?: () => void }> = ({
  onNext,
}) => {
  const [maxRetries, setMaxRetries] = useState("4");
  const [askUserRetry, setAskUserRetry] = useState(false);
  const [blockAfterRetries, setBlockAfterRetries] = useState(false);
  const [dataRetention, setDataRetention] = useState("6 Months");
  const [isExpanded, setIsExpanded] = useState(true);

  const handleNext = () => {
    setIsExpanded(false);
    onNext?.();
  };

  // Load form state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("arcon_biometric_verification_form");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (typeof parsed.maxRetries === "string")
            setMaxRetries(parsed.maxRetries);
          if (typeof parsed.askUserRetry === "boolean")
            setAskUserRetry(parsed.askUserRetry);
          if (typeof parsed.blockAfterRetries === "boolean")
            setBlockAfterRetries(parsed.blockAfterRetries);
          if (typeof parsed.dataRetention === "string")
            setDataRetention(parsed.dataRetention);
        }
      }
    } catch {}
  }, []);

  // Persist form state whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "arcon_biometric_verification_form",
        JSON.stringify({
          maxRetries,
          askUserRetry,
          blockAfterRetries,
          dataRetention,
        }),
      );
    } catch {}
  }, [maxRetries, askUserRetry, blockAfterRetries, dataRetention]);

  return (
    <div className="border border-gray-300 rounded">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-300 bg-white">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Minus className="w-5 h-5 text-gray-700" />
        </Button>
        <h2 className="font-bold text-base text-gray-900">
          Biometric Verification
        </h2>
      </div>

      {/* Description when collapsed */}
      {!isExpanded && (
        <div className="px-4 lg:px-9 pb-3">
          <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
            Configure selfie capture retries, liveness score thresholds, and
            biometric data storage.
          </p>
        </div>
      )}

      {/* Content */}
      {isExpanded && (
        <div className="p-8 space-y-6">
          {/* Retry Attempts for Selfie Capture */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Retry Attempts for Selfie Capture
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Define how many times a user can retry if the selfie capture
                fails.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Set the maximum number of retries
                </Label>
                <div className="w-full max-w-80">
                  <div className="relative">
                    <select
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(e.target.value)}
                      className="w-full h-8 px-3 text-sm text-gray-600 border border-gray-300 bg-white rounded appearance-none pr-8"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 text-gray-600 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liveness Confidence Threshold */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Liveness Confidence Threshold (%)
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Choose what should happen if a user's liveness score does not
                meet the required threshold.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              {/* Ask user to retry */}
              <div className="pb-5 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ask-retry"
                    checked={askUserRetry}
                    onCheckedChange={setAskUserRetry}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="ask-retry"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Ask the user to try again
                    </Label>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Prompt the user to reattempt the selfie.
                    </p>
                  </div>
                </div>
              </div>

              {/* Block further attempts */}
              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="block-attempts"
                    checked={blockAfterRetries}
                    onCheckedChange={setBlockAfterRetries}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="block-attempts"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Block further attempts after allowed retries fail.
                    </Label>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Send submission for manual verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biometric Data Retention */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Biometric Data Retention
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Choose whether to store biometric/selfie data and define
                retention duration.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Enable biometric data storage
                </Label>
                <div className="w-full max-w-80">
                  <div className="relative">
                    <select
                      value={dataRetention}
                      onChange={(e) => setDataRetention(e.target.value)}
                      className="w-full h-8 px-3 text-sm text-gray-600 border border-gray-300 bg-white rounded appearance-none pr-8"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 text-gray-600 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end pt-6">
            <Button
              className="bg-[#0073EA] hover:bg-blue-700 text-white px-6 py-2"
              onClick={handleNext}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateName = location.state?.templateName || "New Template";

  const [verificationSteps, setVerificationSteps] = useState<
    VerificationStep[]
  >([
    {
      id: "personal-info",
      title: "Personal Information",
      description:
        "Set up fields to collect basic user details like name, contact.",
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
      description:
        "Set selfie retries, liveness threshold, and biometric storage",
      isRequired: false,
      isEnabled: false,
    },
  ]);

  // Load persisted verification steps on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("arcon_verification_steps");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const hasPI = parsed.some((s: any) => s?.id === "personal-info");
          const normalized = hasPI
            ? parsed
            : [
                {
                  id: "personal-info",
                  title: "Personal Information",
                  description:
                    "Set up fields to collect basic user details like name, contact.",
                  isRequired: true,
                  isEnabled: true,
                },
                ...parsed,
              ];
          setVerificationSteps(
            normalized.filter((s: any) => s && typeof s.id === "string"),
          );
        }
      }
    } catch {}
  }, []);

  const [optionalFields, setOptionalFields] = useState<FieldOption[]>([
    {
      id: "date-of-birth",
      name: "Date Of Birth",
      placeholder: "10/07/1997",
      checked: false,
    },
    {
      id: "current-address",
      name: "Current Address",
      placeholder: "Enter your current address",
      checked: false,
    },
    {
      id: "permanent-address",
      name: "Permanent Address",
      placeholder: "Enter your permanent address",
      checked: false,
    },
    {
      id: "gender",
      name: "Gender",
      placeholder: "Select gender",
      checked: false,
    },
  ]);

  const [addedFields, setAddedFields] = useState<AddedField[]>([]);
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(true);
  const [documentVerificationExpanded, setDocumentVerificationExpanded] = useState(false);
  const [biometricVerificationExpanded, setBiometricVerificationExpanded] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // System fields state
  const [systemFieldAlerts, setSystemFieldAlerts] = useState<{
    [key: string]: boolean;
  }>({});
  const [systemFieldValues, setSystemFieldValues] = useState({
    firstName: "Eg: John",
    lastName: "Eg: Wick",
    email: "Eg: johnwick@email.com",
  });

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
    const field = optionalFields.find((f) => f.id === fieldId);
    if (!field) return;

    if (field.checked) {
      // Remove from added fields and uncheck
      setAddedFields((prev) => prev.filter((f) => f.id !== fieldId));
      setOptionalFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, checked: false } : f)),
      );
    } else {
      // Add to added fields and check
      setAddedFields((prev) => [
        ...prev,
        {
          id: field.id,
          name: field.name,
          placeholder: field.placeholder,
          value: "",
        },
      ]);
      setOptionalFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, checked: true } : f)),
      );
    }
  };

  const removeAddedField = (fieldId: string) => {
    setAddedFields((prev) => prev.filter((f) => f.id !== fieldId));
    setOptionalFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, checked: false } : f)),
    );
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    setAddedFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, value } : f)),
    );
  };

  const handlePrevious = () => {
    navigate("/dashboard");
  };

  const handleNext = () => {
    const sections = [
      { name: 'personal-info', setExpanded: setPersonalInfoExpanded },
      { name: 'document-verification', setExpanded: setDocumentVerificationExpanded },
      { name: 'biometric-verification', setExpanded: setBiometricVerificationExpanded }
    ];

    // Get only the sections that are added to the verification steps
    const activeSections = sections.filter(section =>
      section.name === 'personal-info' ||
      verificationSteps.some(step => step.id === section.name)
    );

    if (currentSectionIndex < activeSections.length) {
      // Collapse current section
      activeSections[currentSectionIndex].setExpanded(false);

      // Move to next section or preview
      const nextIndex = currentSectionIndex + 1;
      setCurrentSectionIndex(nextIndex);

      if (nextIndex < activeSections.length) {
        // Expand next section
        activeSections[nextIndex].setExpanded(true);
      } else {
        // All sections completed, navigate to preview
        console.log("Template ready for preview");
        // TODO: Implement preview page navigation
      }
    }
  };

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

  const handleSystemFieldFocus = (fieldKey: string) => {
    setSystemFieldAlerts((prev) => ({ ...prev, [fieldKey]: true }));
  };

  const handleSystemFieldBlur = (fieldKey: string) => {
    setTimeout(() => {
      setSystemFieldAlerts((prev) => ({ ...prev, [fieldKey]: false }));
    }, 3000); // Hide alert after 3 seconds
  };

  // Get available steps that aren't already added
  const getAvailableStepsToAdd = () => {
    return availableSteps.filter(
      (step) => !verificationSteps.find((vs) => vs.id === step.id),
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
              <h1 className="text-xl font-bold text-gray-900">
                {templateName}
              </h1>
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
              <span className="text-sm font-medium text-gray-900">
                Form builder
              </span>
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
                <h2 className="text-base font-bold text-gray-900 mb-2">
                  Build your process
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Create a flow by adding required information fields and
                  verification steps for your users.
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
                  <h2 className="text-base font-bold text-gray-900 mb-2">
                    Add Verification Steps
                  </h2>
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
                          <h3 className="font-bold text-sm text-gray-900 mb-1">
                            {step.title}
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {step.description}
                          </p>
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
          <div className="flex-1 p-4 bg-white overflow-auto">
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="border border-gray-300 rounded">
                {/* Header */}
                <div className="flex items-center gap-2 p-3 border-b border-gray-300 bg-white">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() =>
                      setPersonalInfoExpanded(!personalInfoExpanded)
                    }
                  >
                    <Minus className="w-5 h-5 text-gray-700" />
                  </Button>
                  <h2 className="font-bold text-base text-gray-900">
                    Personal Information
                  </h2>
                </div>

                {/* Description when collapsed */}
                {!personalInfoExpanded && (
                  <div className="px-4 lg:px-9 pb-3">
                    <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
                      Set up fields to collect basic user details like name,
                      contact.
                    </p>
                  </div>
                )}

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
                      <div
                        className={cn(
                          "rounded-lg border-r border-b border-l bg-white",
                          systemFieldAlerts.firstName
                            ? "border-blue-500"
                            : "border-gray-300",
                        )}
                      >
                        {systemFieldAlerts.firstName && (
                          <div className="h-2 bg-blue-500 rounded-t-lg"></div>
                        )}
                        <div className="p-4">
                          {systemFieldAlerts.firstName && (
                            <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-400 rounded flex items-center gap-2">
                              <Info className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-gray-900 font-medium">
                                This field is system-required and cannot be
                                modified.
                              </span>
                            </div>
                          )}
                          <div className="mb-2">
                            <div className="h-10 px-3 py-2 bg-gray-100 rounded border border-gray-300 flex items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                First Name
                              </span>
                            </div>
                          </div>
                          <Input
                            value={systemFieldValues.firstName}
                            onFocus={() => handleSystemFieldFocus("firstName")}
                            onBlur={() => handleSystemFieldBlur("firstName")}
                            className="border-gray-300 text-gray-600"
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Last Name */}
                      <div
                        className={cn(
                          "rounded-lg border-r border-b border-l bg-white",
                          systemFieldAlerts.lastName
                            ? "border-blue-500"
                            : "border-gray-300",
                        )}
                      >
                        {systemFieldAlerts.lastName && (
                          <div className="h-2 bg-blue-500 rounded-t-lg"></div>
                        )}
                        <div className="p-4">
                          {systemFieldAlerts.lastName && (
                            <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-400 rounded flex items-center gap-2">
                              <Info className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-gray-900 font-medium">
                                This field is system-required and cannot be
                                modified.
                              </span>
                            </div>
                          )}
                          <div className="mb-2">
                            <div className="h-10 px-3 py-2 bg-gray-100 rounded border border-gray-300 flex items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                Last Name
                              </span>
                            </div>
                          </div>
                          <Input
                            value={systemFieldValues.lastName}
                            onFocus={() => handleSystemFieldFocus("lastName")}
                            onBlur={() => handleSystemFieldBlur("lastName")}
                            className="border-gray-300 text-gray-600"
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div
                        className={cn(
                          "rounded-lg border-r border-b border-l bg-white",
                          systemFieldAlerts.email
                            ? "border-blue-500"
                            : "border-gray-300",
                        )}
                      >
                        {systemFieldAlerts.email && (
                          <div className="h-2 bg-blue-500 rounded-t-lg"></div>
                        )}
                        <div className="p-4">
                          {systemFieldAlerts.email && (
                            <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-400 rounded flex items-center gap-2">
                              <Info className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-gray-900 font-medium">
                                This field is system-required and cannot be
                                modified.
                              </span>
                            </div>
                          )}
                          <div className="mb-2">
                            <div className="h-10 px-3 py-2 bg-gray-100 rounded border border-gray-300 flex items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                Email Address
                              </span>
                            </div>
                          </div>
                          <Input
                            value={systemFieldValues.email}
                            onFocus={() => handleSystemFieldFocus("email")}
                            onBlur={() => handleSystemFieldBlur("email")}
                            className="border-gray-300 text-gray-600"
                            readOnly
                          />
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
                            Extra fields to collect specific to your
                            verification flow.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {addedFields.map((field) => (
                            <div
                              key={field.id}
                              className="border border-gray-300 rounded-lg p-5 bg-white"
                            >
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
                              <div className="text-sm text-gray-500">
                                {field.placeholder}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Button */}
                    <div className="flex justify-end pt-6">
                      <Button
                        className="bg-[#0073EA] hover:bg-blue-700 text-white px-6 py-2"
                        onClick={() => setPersonalInfoExpanded(false)}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Verification Section */}
              {verificationSteps.some(
                (step) => step.id === "document-verification",
              ) && <DocumentVerificationSection />}

              {/* Biometric Verification Section */}
              {verificationSteps.some(
                (step) => step.id === "biometric-verification",
              ) && <BiometricVerificationSection />}
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
                {optionalFields
                  .filter((field) => !field.checked)
                  .map((field) => (
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
