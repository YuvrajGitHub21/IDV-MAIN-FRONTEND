import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

/* ===================== API config / helpers ===================== */
const API_BASE = import.meta.env.VITE_API_URL ?? "http://10.10.2.133:8080";
const getToken = () => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("access_token") || localStorage.getItem("access")
    );
  }
  return null;
};

/* ===================== Types for Countries and Documents ===================== */
interface Country {
  id: number;
  name: string;
  isoCodeAlpha2: string;
  isoCodeAlpha3: string;
  isActive: boolean;
}

interface DocumentType {
  id: number;
  name: string;
  code: string;
}

interface CountryWithDocuments extends Country {
  documentTypes: DocumentType[];
  createdAt: string;
  updatedAt: string;
}

/* ===================== API functions for Countries ===================== */
const fetchCountries = async (): Promise<Country[]> => {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/Countries`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch countries: ${response.statusText}`);
  }

  return response.json();
};

const fetchCountryById = async (countryId: number): Promise<CountryWithDocuments> => {
  const token = getToken();
  const response = await fetch(`${API_BASE}/api/Countries/${countryId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch country ${countryId}: ${response.statusText}`);
  }

  return response.json();
};

const apiGet = async <T = any,>(path: string): Promise<T> => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET ${path} failed: ${res.status} ${res.statusText}${
        text ? " — " + text.slice(0, 300) : ""
      }`,
    );
  }
  return res.json();
};

const apiPut = async (path: string, body: any) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PUT ${path} failed: ${res.status} ${res.statusText}${
        text ? " — " + text.slice(0, 300) : ""
      }`,
    );
  }
  return res.status === 204 ? null : res.json();
};

const apiPatch = async (path: string, body: any) => {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `PATCH ${path} failed: ${res.status} ${res.statusText}${
        text ? " — " + text.slice(0, 300) : ""
      }`,
    );
  }
  return res.status === 204 ? null : res.json();
};

/* ===================== Helper functions ===================== */
/**
 * Helper function to get the active version from template data.
 * Handles both old API structure (activeVersion) and new API structure (versions array).
 * This fixes the issue where the API response changed from "activeVersion" to "versions" array.
 */
const getActiveVersion = (templateData: TemplateData | null): TemplateActiveVersion | null => {
  if (!templateData) return null;
  
  // For backward compatibility, check if activeVersion exists
  if (templateData.activeVersion) {
    return templateData.activeVersion;
  }
  
  // New API structure: find active version from versions array
  if (templateData.versions && Array.isArray(templateData.versions)) {
    const activeVersion = templateData.versions.find(version => version.isActive);
    return activeVersion || templateData.versions[0] || null; // Fallback to first version if none is marked active
  }
  
  return null;
};

/* ===================== UI types ===================== */
interface VerificationStep {
  id: "personal-info" | "document-verification" | "biometric-verification";
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
  onRemove: (stepId: VerificationStep["id"]) => void;
}

/* ===================== Template Data types ===================== */
interface TemplateFieldMapping {
  id: number;
  templateSectionId: number;
  structure: any;
  captureAllowed: boolean;
  uploadAllowed: boolean;
}

interface TemplateSection {
  id: number;
  templateVersionId: number;
  name: string;
  description?: string;
  orderIndex: number;
  sectionType: "personalInformation" | "documents" | "biometrics";
  isActive: boolean;
  createdBy: number;
  createdByName: string;
  createdByEmail: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedByEmail?: string;
  createdAt: string;
  updatedAt?: string;
  fieldMappings: TemplateFieldMapping[];
}

interface TemplateActiveVersion {
  versionId: number;
  templateId: number;
  versionNumber: number;
  isActive: boolean;
  enforceRekyc: boolean;
  rekycDeadline?: string;
  changeSummary?: string;
  isDeleted: boolean;
  createdBy: number;
  createdByName: string;
  createdByEmail: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedByEmail?: string;
  createdAt: string;
  updatedAt: string;
  rowVersionBase64: string;
  sections: TemplateSection[];
  invitees: any[];
}

interface TemplateData {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  createdByName: string;
  createdByEmail: string;
  updatedBy?: number;
  updatedByName?: string;
  updatedByEmail?: string;
  createdAt: string;
  updatedAt?: string;
  versions: TemplateActiveVersion[];
  // Legacy support for backward compatibility
  activeVersion?: TemplateActiveVersion;
}

/* ===================== DnD item ===================== */
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

/* ===================== Document Verification section ===================== */
const DocumentVerificationSection: React.FC<{
  isExpanded: boolean;
  onToggle: () => void;
  stateBag: {
    allowUploadFromDevice: boolean;
    setAllowUploadFromDevice: (v: boolean) => void;
    allowCaptureWebcam: boolean;
    setAllowCaptureWebcam: (v: boolean) => void;
    documentHandling: string;
    setDocumentHandling: (v: string) => void;
    // New country and document state
    availableCountries: Country[];
    selectedCountryIds: number[];
    setSelectedCountryIds: React.Dispatch<React.SetStateAction<number[]>>;
    countryDocuments: Map<number, DocumentType[]>;
    selectedDocumentIds: Map<number, number[]>;
    setSelectedDocumentIds: React.Dispatch<React.SetStateAction<Map<number, number[]>>>;
    loadingCountries: boolean;
    loadingDocuments: Set<number>;
    // Legacy state for backward compatibility
    selectedCountries: string[];
    setSelectedCountries: React.Dispatch<React.SetStateAction<string[]>>;
    selectedDocuments: string[];
    setSelectedDocuments: React.Dispatch<React.SetStateAction<string[]>>;
  };
}> = ({ isExpanded, onToggle, stateBag }) => {
  const {
    allowUploadFromDevice,
    setAllowUploadFromDevice,
    allowCaptureWebcam,
    setAllowCaptureWebcam,
    documentHandling,
    setDocumentHandling,
    availableCountries,
    selectedCountryIds,
    setSelectedCountryIds,
    countryDocuments,
    selectedDocumentIds,
    setSelectedDocumentIds,
    loadingCountries,
    loadingDocuments,
    selectedCountries,
    setSelectedCountries,
    selectedDocuments,
    setSelectedDocuments,
  } = stateBag;

  // Local state for controlling the Select component
  const [selectValue, setSelectValue] = React.useState<string>("");

  const toggleDocument = (countryId: number, documentId: number) => {
    setSelectedDocumentIds(prev => {
      const newMap = new Map(prev);
      const currentDocs = newMap.get(countryId) || [];
      
      if (currentDocs.includes(documentId)) {
        // Remove document
        newMap.set(countryId, currentDocs.filter(id => id !== documentId));
      } else {
        // Add document
        newMap.set(countryId, [...currentDocs, documentId]);
      }
      
      return newMap;
    });
  };

  const removeCountry = (countryId: number) => {
    setSelectedCountryIds(prev => prev.filter(id => id !== countryId));
    setSelectedDocumentIds(prev => {
      const newMap = new Map(prev);
      newMap.delete(countryId);
      return newMap;
    });
  };

  const addCountry = (countryId: number) => {
    if (!selectedCountryIds.includes(countryId)) {
      setSelectedCountryIds(prev => [...prev, countryId]);
      setSelectValue(""); // Reset the select value
    }
  };

  // Get country name by ID
  const getCountryName = (countryId: number): string => {
    return availableCountries.find(c => c.id === countryId)?.name || `Country ${countryId}`;
  };

  return (
    <div className="border border-gray-300 rounded">
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

      {!isExpanded && (
        <div className="px-4 lg:px-9 pb-3">
          <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
            Define how users can submit ID documents and what happens if files
            are unclear.
          </p>
        </div>
      )}

      {isExpanded && (
        <div className="p-8 space-y-6">
          {/* Upload Options */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                User Upload Options
              </h4>
              <p className="text-sm text-gray-600">
                Select how users are allowed to submit documents.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="pb-5 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="upload-device"
                    checked={allowUploadFromDevice}
                    onCheckedChange={(v) =>
                      setAllowUploadFromDevice(v === true)
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
                    <p className="text-sm text-gray-600">
                      Let users upload existing documents from their device.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="capture-webcam"
                    checked={allowCaptureWebcam}
                    onCheckedChange={(v) => setAllowCaptureWebcam(v === true)}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="capture-webcam"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Allow Capture via Webcam
                    </Label>
                    <p className="text-sm text-gray-600">
                      Enable webcam access for real-time capture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unreadable Handling */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Unreadable Document Handling
              </h4>
              <p className="text-sm text-gray-600">
                Choose what happens when an upload is not clear.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <RadioGroup
                value={documentHandling}
                onValueChange={setDocumentHandling}
              >
                <div className="space-y-5">
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
                        <p className="text-sm text-gray-600">
                          Reject unclear documents without retries.
                        </p>
                      </div>
                    </div>
                  </div>

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
                        <p className="text-sm text-gray-600">
                          Let users retry before a final rejection.
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
                Supported Countries
              </h4>
              <p className="text-sm text-gray-600">
                Only documents from these countries are supported.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900 block mb-2">
                  Which countries are supported?
                </Label>
                <div className="relative max-w-80">
                  <Select 
                    value={selectValue} 
                    onValueChange={(value) => {
                      const countryId = parseInt(value, 10);
                      if (!isNaN(countryId)) {
                        addCountry(countryId);
                      }
                    }}
                    disabled={loadingCountries}
                  >
                    <SelectTrigger className="w-full h-8 text-sm text-gray-600 border-gray-300 bg-white">
                      <SelectValue placeholder={loadingCountries ? "Loading countries..." : "Select Countries"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCountries
                        .filter(country => !selectedCountryIds.includes(country.id))
                        .map((country) => (
                          <SelectItem key={country.id} value={country.id.toString()}>
                            {country.name}
                          </SelectItem>
                        ))}
                      {availableCountries.filter(country => !selectedCountryIds.includes(country.id)).length === 0 && (
                        <SelectItem value="no-countries" disabled>
                          {loadingCountries ? "Loading..." : "No more countries available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedCountryIds.map((countryId) => {
                const countryName = getCountryName(countryId);
                const documents = countryDocuments.get(countryId) || [];
                const selectedDocs = selectedDocumentIds.get(countryId) || [];
                const isLoadingDocs = loadingDocuments.has(countryId);

                return (
                  <div key={countryId} className="bg-white rounded p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-black">
                        {countryName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 hover:bg-gray-100"
                        onClick={() => removeCountry(countryId)}
                      >
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </Button>
                    </div>

                    <div className="bg-gray-50 rounded p-3 flex flex-wrap gap-2">
                      {isLoadingDocs ? (
                        <div className="text-sm text-gray-500">Loading documents...</div>
                      ) : documents.length === 0 ? (
                        <div className="text-sm text-gray-500">No documents available for this country</div>
                      ) : (
                        documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 bg-gray-50 rounded-full px-2 py-2"
                          >
                            <Checkbox
                              id={`${countryId}-${doc.id}`}
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={() => toggleDocument(countryId, doc.id)}
                              className="w-4 h-4"
                            />
                            <Label
                              htmlFor={`${countryId}-${doc.id}`}
                              className="text-sm font-medium text-gray-600 cursor-pointer"
                            >
                              {doc.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== Biometric Verification section ===================== */
const BiometricVerificationSection: React.FC<{
  isExpanded: boolean;
  onToggle: () => void;
  stateBag: {
    maxRetries: string;
    setMaxRetries: (v: string) => void;
    askUserRetry: boolean;
    setAskUserRetry: (v: boolean) => void;
    blockAfterRetries: boolean;
    setBlockAfterRetries: (v: boolean) => void;
    dataRetention: string;
    setDataRetention: (v: string) => void;
  };
}> = ({ isExpanded, onToggle, stateBag }) => {
  const {
    maxRetries,
    setMaxRetries,
    askUserRetry,
    setAskUserRetry,
    blockAfterRetries,
    setBlockAfterRetries,
    dataRetention,
    setDataRetention,
  } = stateBag;

  return (
    <div className="border border-gray-300 rounded">
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
          Biometric Verification
        </h2>
      </div>

      {!isExpanded && (
        <div className="px-4 lg:px-9 pb-3">
          <p className="text-xs lg:text-[13px] text-[#505258] leading-relaxed">
            Configure selfie capture retries, liveness threshold, and data
            storage.
          </p>
        </div>
      )}

      {isExpanded && (
        <div className="p-8 space-y-6">
          {/* Retry attempts */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Retry Attempts for Selfie Capture
              </h4>
              <p className="text-sm text-gray-600">
                Define how many times a user can retry if capture fails.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Set the maximum number of retries
                </Label>
                <div className="w-full max-w-80 relative">
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-600 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Liveness */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Liveness Confidence Threshold (%)
              </h4>
              <p className="text-sm text-gray-600">
                Choose what happens on low liveness score.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="pb-5 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="ask-retry"
                    checked={askUserRetry}
                    onCheckedChange={(v) => {
                      const checked = v === true;
                      setAskUserRetry(checked);
                      if (checked) setBlockAfterRetries(false);
                    }}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="ask-retry"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Ask the user to try again
                    </Label>
                    <p className="text-sm text-gray-600">
                      Prompt the user to reattempt the selfie.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="block-attempts"
                    checked={blockAfterRetries}
                    onCheckedChange={(v) => {
                      const checked = v === true;
                      setBlockAfterRetries(checked);
                      if (checked) setAskUserRetry(false);
                    }}
                    className="mt-0.5 w-4 h-4"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="block-attempts"
                      className="text-sm font-medium text-gray-900 block mb-2"
                    >
                      Block further attempts after allowed retries fail
                    </Label>
                    <p className="text-sm text-gray-600">
                      Send submission for manual verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data retention */}
          <div className="space-y-4">
            <div>
              <h4 className="text-base font-bold text-gray-900 mb-2">
                Biometric Data Retention
              </h4>
              <p className="text-sm text-gray-600">
                Define retention duration.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Retention period
                </Label>
                <div className="w-full max-w-80 relative">
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
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-gray-600 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== Template Builder ===================== */
export default function TemplateBuilder() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const templateName = location?.state?.templateName || "New Template";
  const templateId: string =
    location?.state?.templateId ||
    localStorage.getItem("arcon_current_template_id") ||
    "";

  // Template data from backend
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);

  // left-rail steps
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

  // Load any persisted ordering/fields
  useEffect(() => {
    try {
      const incoming = location?.state || {};
      if (Array.isArray(incoming.verificationSteps)) {
        const parsed = incoming.verificationSteps;
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
        if (Array.isArray(incoming.addedFields))
          setAddedFields(incoming.addedFields);
        return;
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // right rail (optional personal-info fields)
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

  // section expand/collapse
  const [personalInfoExpanded, setPersonalInfoExpanded] = useState(true);
  const [documentVerificationExpanded, setDocumentVerificationExpanded] =
    useState(false);
  const [biometricVerificationExpanded, setBiometricVerificationExpanded] =
    useState(false);

  // single source of truth for which section is active (by id)
  const [currentSectionId, setCurrentSectionId] =
    useState<VerificationStep["id"]>("personal-info");

  // system fields (readonly UI)
  const [systemFieldAlerts, setSystemFieldAlerts] = useState<{
    [key: string]: boolean;
  }>({});
  const [systemFieldValues] = useState({
    firstName: "Eg: John",
    lastName: "Eg: Wick",
    email: "Eg: johnwick@email.com",
  });

  // doc verification state bag
  const [allowUploadFromDevice, setAllowUploadFromDevice] = useState(false);
  const [allowCaptureWebcam, setAllowCaptureWebcam] = useState(false);
  const [documentHandling, setDocumentHandling] = useState("");
  
  // Updated country and document state
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>([]);
  const [countryDocuments, setCountryDocuments] = useState<Map<number, DocumentType[]>>(new Map());
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Map<number, number[]>>(new Map());
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState<Set<number>>(new Set());

  // Legacy state for backward compatibility (can be removed later)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  // biometric verification state bag
  const [maxRetries, setMaxRetries] = useState("4");
  const [askUserRetry, setAskUserRetry] = useState(false);
  const [blockAfterRetries, setBlockAfterRetries] = useState(false);
  const [dataRetention, setDataRetention] = useState("6 Months");

  // Ensure liveness options remain mutually exclusive even after hydration
  useEffect(() => {
    if (askUserRetry && blockAfterRetries) {
      setBlockAfterRetries(false);
    }
  }, [askUserRetry, blockAfterRetries]);

  // Load available countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoadingCountries(true);
        const countries = await fetchCountries();
        setAvailableCountries(countries.filter(c => c.isActive));
        console.log('✅ Loaded countries:', countries);
      } catch (error) {
        console.error('❌ Failed to load countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  // Load documents when countries are selected
  useEffect(() => {
    const loadDocumentsForSelectedCountries = async () => {
      for (const countryId of selectedCountryIds) {
        if (!countryDocuments.has(countryId) && !loadingDocuments.has(countryId)) {
          try {
            setLoadingDocuments(prev => new Set(prev).add(countryId));
            const countryWithDocs = await fetchCountryById(countryId);
            setCountryDocuments(prev => new Map(prev).set(countryId, countryWithDocs.documentTypes));
            console.log(`✅ Loaded documents for country ${countryId}:`, countryWithDocs.documentTypes);
          } catch (error) {
            console.error(`❌ Failed to load documents for country ${countryId}:`, error);
          } finally {
            setLoadingDocuments(prev => {
              const newSet = new Set(prev);
              newSet.delete(countryId);
              return newSet;
            });
          }
        }
      }
    };

    if (selectedCountryIds.length > 0) {
      loadDocumentsForSelectedCountries();
    }
  }, [selectedCountryIds]); // Remove countryDocuments and loadingDocuments from dependencies

  // Convert Map-based selections to legacy arrays for backward compatibility with Preview/ReceiverView
  useEffect(() => {
    // Update selectedCountries array with country names
    const countryNames = selectedCountryIds.map(countryId => {
      const country = availableCountries.find(c => c.id === countryId);
      return country ? country.name : `Country_${countryId}`;
    });
    setSelectedCountries(countryNames);

    // Update selectedDocuments array with all selected document names across all countries
    const allSelectedDocuments: string[] = [];
    selectedCountryIds.forEach(countryId => {
      const selectedDocIds = selectedDocumentIds.get(countryId) || [];
      const countryDocs = countryDocuments.get(countryId) || [];
      
      selectedDocIds.forEach(docId => {
        const doc = countryDocs.find(d => d.id === docId);
        if (doc && !allSelectedDocuments.includes(doc.name)) {
          allSelectedDocuments.push(doc.name);
        }
      });
    });
    setSelectedDocuments(allSelectedDocuments);
    
    console.log('🔄 Updated legacy arrays for Preview/ReceiverView:', {
      selectedCountries: countryNames,
      selectedDocuments: allSelectedDocuments,
      selectedCountryIds,
      selectedDocumentIds: Object.fromEntries(selectedDocumentIds),
      countryDocuments: Object.fromEntries(countryDocuments)
    });
  }, [selectedCountryIds, selectedDocumentIds, countryDocuments, availableCountries]);

  // save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Per-template storage key
  const templateStorageKey = (id: string) => `arcon_tpl_state:${id}`;

  // Reset builder to defaults (blank state for new templates)
  const resetToDefaults = () => {
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

    setOptionalFields([
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

    setAddedFields([]);

    setPersonalInfoExpanded(true);
    setDocumentVerificationExpanded(false);
    setBiometricVerificationExpanded(false);
    setCurrentSectionId("personal-info");

    setAllowUploadFromDevice(false);
    setAllowCaptureWebcam(false);
    setDocumentHandling("");
    
    // Reset new country and document state
    setSelectedCountryIds([]);
    setCountryDocuments(new Map());
    setSelectedDocumentIds(new Map());
    
    // Reset legacy state
    setSelectedCountries([]);
    setSelectedDocuments([]);

    setMaxRetries("4");
    setAskUserRetry(false);
    setBlockAfterRetries(false);
    setDataRetention("6 Months");
  };

  // Build a full snapshot of the current builder state
  const buildSnapshot = () => ({
    verificationSteps,
    addedFields,
    optionalFields,
    personalInfoExpanded,
    documentVerificationExpanded,
    biometricVerificationExpanded,
    currentSectionId,
    doc: {
      allowUploadFromDevice,
      allowCaptureWebcam,
      documentHandling,
      // New country and document state (serialize Maps to objects)
      selectedCountryIds,
      countryDocuments: Object.fromEntries(countryDocuments),
      selectedDocumentIds: Object.fromEntries(selectedDocumentIds),
      // Legacy state for backward compatibility
      selectedCountries,
      selectedDocuments,
    },
    biometric: {
      maxRetries,
      askUserRetry,
      blockAfterRetries,
      dataRetention,
    },
  });

  // Apply a snapshot object to local state (used when returning from Preview or loading LS)
  const applySnapshot = (s: any) => {
    try {
      if (!s || typeof s !== "object") return;
      if (Array.isArray(s.verificationSteps))
        setVerificationSteps(s.verificationSteps);
      if (Array.isArray(s.addedFields)) setAddedFields(s.addedFields);
      if (Array.isArray(s.optionalFields)) setOptionalFields(s.optionalFields);
      if (typeof s.personalInfoExpanded === "boolean")
        setPersonalInfoExpanded(s.personalInfoExpanded);
      if (typeof s.documentVerificationExpanded === "boolean")
        setDocumentVerificationExpanded(s.documentVerificationExpanded);
      if (typeof s.biometricVerificationExpanded === "boolean")
        setBiometricVerificationExpanded(s.biometricVerificationExpanded);
      if (typeof s.currentSectionId === "string")
        setCurrentSectionId(s.currentSectionId);

      const d = s.doc || {};
      if (typeof d.allowUploadFromDevice === "boolean")
        setAllowUploadFromDevice(d.allowUploadFromDevice);
      if (typeof d.allowCaptureWebcam === "boolean")
        setAllowCaptureWebcam(d.allowCaptureWebcam);
      if (typeof d.documentHandling === "string")
        setDocumentHandling(d.documentHandling);
        
      // Handle new country and document state
      if (Array.isArray(d.selectedCountryIds))
        setSelectedCountryIds(d.selectedCountryIds);
      if (d.countryDocuments && typeof d.countryDocuments === "object")
        setCountryDocuments(new Map(Object.entries(d.countryDocuments).map(([k, v]) => [parseInt(k, 10), v as DocumentType[]])));
      if (d.selectedDocumentIds && typeof d.selectedDocumentIds === "object")
        setSelectedDocumentIds(new Map(Object.entries(d.selectedDocumentIds).map(([k, v]) => [parseInt(k, 10), v as number[]])));
        
      // Handle legacy state for backward compatibility
      if (Array.isArray(d.selectedCountries))
        setSelectedCountries(d.selectedCountries);
      if (Array.isArray(d.selectedDocuments))
        setSelectedDocuments(d.selectedDocuments);

      const b = s.biometric || {};
      if (typeof b.maxRetries === "string") setMaxRetries(b.maxRetries);
      if (typeof b.askUserRetry === "boolean") setAskUserRetry(b.askUserRetry);
      if (typeof b.blockAfterRetries === "boolean")
        setBlockAfterRetries(b.blockAfterRetries);
      if (typeof b.dataRetention === "string")
        setDataRetention(b.dataRetention);
    } catch {}
  };

  // Hydrate from snapshot/localStorage when templateId or navigation state changes
  useEffect(() => {
    // 1) Prefer snapshot passed via navigation (from Preview)
    const incoming = (location as any)?.state?.snapshot;
    if (incoming && typeof incoming === "object") {
      applySnapshot(incoming);
      return;
    }

    // 2) If we have a templateId, try per-template snapshot
    if (templateId) {
      try {
        localStorage.setItem("arcon_current_template_id", templateId);
      } catch {}

      try {
        const raw = localStorage.getItem(templateStorageKey(templateId));
        if (raw) {
          const s = JSON.parse(raw);
          applySnapshot(s);
          return;
        }
      } catch {}
    }

    // 3) Fallback to global keys to preserve current builder state even for new templates
    try {
      const stepsRaw = localStorage.getItem("arcon_verification_steps");
      const docRaw = localStorage.getItem("arcon_doc_verification_form");
      const bioRaw = localStorage.getItem("arcon_biometric_verification_form");

      const s: any = {};
      if (stepsRaw) {
        const steps = JSON.parse(stepsRaw);
        if (Array.isArray(steps)) s.verificationSteps = steps;
      }
      if (docRaw) s.doc = JSON.parse(docRaw);
      if (bioRaw) s.biometric = JSON.parse(bioRaw);

      if (s.verificationSteps || s.doc || s.biometric) {
        applySnapshot({
          verificationSteps: s.verificationSteps || verificationSteps,
          addedFields,
          optionalFields,
          personalInfoExpanded,
          documentVerificationExpanded,
          biometricVerificationExpanded,
          currentSectionId,
          doc: s.doc || {
            allowUploadFromDevice,
            allowCaptureWebcam,
            documentHandling,
            selectedCountries,
            selectedDocuments,
          },
          biometric: s.biometric || {
            maxRetries,
            askUserRetry,
            blockAfterRetries,
            dataRetention,
          },
        });
        return;
      }
    } catch {}

    // 4) Nothing found -> defaults
    resetToDefaults();
  }, [templateId, (location as any)?.state?.snapshot]);

  // Persist snapshot whenever relevant state changes (scoped by templateId)
  const persistSnapshot = () => {
    if (!templateId) return;
    try {
      localStorage.setItem(
        templateStorageKey(templateId),
        JSON.stringify(buildSnapshot()),
      );
    } catch {}
  };

  useEffect(() => {
    // Persist per-template snapshot when applicable
    persistSnapshot();

    // Always persist global keys so Preview can read from localStorage without backend
    try {
      const hasDoc = verificationSteps.some(
        (s) => s.id === "document-verification",
      );
      const hasBio = verificationSteps.some(
        (s) => s.id === "biometric-verification",
      );
      localStorage.setItem(
        "arcon_has_document_verification",
        JSON.stringify(hasDoc),
      );
      if (templateId) {
        localStorage.setItem(
          `arcon_has_document_verification:${templateId}`,
          JSON.stringify(hasDoc),
        );
      }
      localStorage.setItem(
        "arcon_has_biometric_verification",
        JSON.stringify(hasBio),
      );
      if (templateId) {
        localStorage.setItem(
          `arcon_has_biometric_verification:${templateId}`,
          JSON.stringify(hasBio),
        );
      }

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
      if (templateId) {
        localStorage.setItem(
          `arcon_doc_verification_form:${templateId}`,
          JSON.stringify({
            allowUploadFromDevice,
            allowCaptureWebcam,
            documentHandling,
            selectedCountries,
            selectedDocuments,
          }),
        );
      }

      localStorage.setItem(
        "arcon_biometric_verification_form",
        JSON.stringify({
          maxRetries,
          askUserRetry,
          blockAfterRetries,
          dataRetention,
        }),
      );
      if (templateId) {
        localStorage.setItem(
          `arcon_biometric_verification_form:${templateId}`,
          JSON.stringify({
            maxRetries,
            askUserRetry,
            blockAfterRetries,
            dataRetention,
          }),
        );
      }

      // Also keep a simple list of chosen steps
      localStorage.setItem(
        "arcon_verification_steps",
        JSON.stringify(verificationSteps),
      );
      if (templateId) {
        localStorage.setItem(
          `arcon_verification_steps:${templateId}`,
          JSON.stringify(verificationSteps),
        );
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    templateId,
    verificationSteps,
    addedFields,
    optionalFields,
    personalInfoExpanded,
    documentVerificationExpanded,
    biometricVerificationExpanded,
    currentSectionId,
    allowUploadFromDevice,
    allowCaptureWebcam,
    documentHandling,
    selectedCountryIds,        // ✅ add these
    selectedDocumentIds,       // ✅ add these
    selectedCountries,
    selectedDocuments,
    maxRetries,
    askUserRetry,
    blockAfterRetries,
    dataRetention,
  ]);

  // single source of truth for which section is active (by id)
  const orderedSectionIds: VerificationStep["id"][] = verificationSteps.map(
    (s) => s.id,
  );

  /* ============ Fetch template data from backend ============ */
  useEffect(() => {
    if (!templateId) {
      setTemplateData(null);
      return;
    }
    
    (async () => {
      try {
        const templateResponse: TemplateData = await apiGet(`/api/Template/${templateId}`);
        console.log('🔍 Template response received:', templateResponse);
        setTemplateData(templateResponse);
        
        // Get active version using helper function
        const activeVersion = getActiveVersion(templateResponse);
        console.log('🔍 Active version found:', activeVersion);
        
        // Hydrate personal info fields from template data if available
        const personalSection = activeVersion?.sections?.find(
          section => section.sectionType === "personalInformation"
        );
        
        if (personalSection?.fieldMappings?.[0]?.structure?.personalInfo) {
          const personalInfo = personalSection.fieldMappings[0].structure.personalInfo;
          
          const isChecked = (id: string) => {
            if (id === "date-of-birth") return !!personalInfo.dateOfBirth;
            if (id === "current-address") return !!personalInfo.currentAddress;
            if (id === "permanent-address") return !!personalInfo.permanentAddress;
            if (id === "gender") return !!personalInfo.gender;
            return false;
          };

          setOptionalFields((prev) =>
            prev.map((f) => ({ ...f, checked: isChecked(f.id) })),
          );
        }

        // Hydrate document verification fields from template data if available
        const documentSection = activeVersion?.sections?.find(
          section => section.sectionType === "documents"
        );
        
        if (documentSection?.fieldMappings?.[0]?.structure?.documentVerification) {
          const docInfo = documentSection.fieldMappings[0].structure.documentVerification;
          
          setAllowUploadFromDevice(!!docInfo.allowUploadFromDevice);
          setAllowCaptureWebcam(!!docInfo.allowCaptureWebcam);
          setDocumentHandling(
            docInfo.documentHandlingRejectImmediately ? "reject" :
            docInfo.documentHandlingAllowRetries ? "retry" : ""
          );
          if (Array.isArray(docInfo.supportedCountries)) {
            setSelectedCountries(docInfo.supportedCountries);
          }
          if (Array.isArray(docInfo.selectedDocuments)) {
            setSelectedDocuments(docInfo.selectedDocuments);
          }
        }

        // Hydrate biometric verification fields from template data if available
        const biometricSection = activeVersion?.sections?.find(
          section => section.sectionType === "biometrics"
        );
        
        if (biometricSection?.fieldMappings?.[0]?.structure?.biometricVerification) {
          const bioInfo = biometricSection.fieldMappings[0].structure.biometricVerification;
          
          if (typeof bioInfo.maxRetries === "number") {
            setMaxRetries(bioInfo.maxRetries.toString());
          }
          setAskUserRetry(!!bioInfo.askUserRetry);
          setBlockAfterRetries(!!bioInfo.blockAfterRetries);
          if (typeof bioInfo.dataRetention === "string") {
            setDataRetention(bioInfo.dataRetention);
          }
        }
      } catch (e) {
        console.warn("Could not fetch template data:", e);
        setTemplateData(null);
      }
    })();
  }, [templateId]);

  /* ============ Section mapping helpers ============ */
  const getSectionTypeFromStepId = (stepId: VerificationStep["id"]): "personalInformation" | "documents" | "biometrics" => {
    switch (stepId) {
      case "personal-info":
        return "personalInformation";
      case "document-verification":
        return "documents";
      case "biometric-verification":
        return "biometrics";
      default:
        return "personalInformation";
    }
  };

  const getFieldMappingId = (stepId: VerificationStep["id"]): number | null => {
    const activeVersion = getActiveVersion(templateData);
    console.log(`🔍 Getting field mapping ID for ${stepId}:`, { activeVersion, sections: activeVersion?.sections });
    if (!activeVersion?.sections) return null;
    
    const sectionType = getSectionTypeFromStepId(stepId);
    const section = activeVersion.sections.find(
      s => s.sectionType === sectionType
    );
    
    const mappingId = section?.fieldMappings?.[0]?.id || null;
    console.log(`🔍 Field mapping ID for ${stepId}:`, mappingId);
    return mappingId;
  };

  const getSectionId = (stepId: VerificationStep["id"]): number | null => {
    const activeVersion = getActiveVersion(templateData);
    console.log(`🔍 Getting section ID for ${stepId}:`, { activeVersion, sections: activeVersion?.sections });
    if (!activeVersion?.sections) return null;
    
    const sectionType = getSectionTypeFromStepId(stepId);
    const section = activeVersion.sections.find(
      s => s.sectionType === sectionType
    );
    
    const sectionId = section?.id || null;
    console.log(`🔍 Section ID for ${stepId}:`, sectionId);
    return sectionId;
  };

  const buildPersonalInfoStructure = () => ({
    personalInfo: {
      firstName: true,
      lastName: true,
      email: true,
      dateOfBirth: optionalFields.find(f => f.id === "date-of-birth")?.checked || false,
      currentAddress: optionalFields.find(f => f.id === "current-address")?.checked || false,
      permanentAddress: optionalFields.find(f => f.id === "permanent-address")?.checked || false,
      gender: optionalFields.find(f => f.id === "gender")?.checked || false,
    }
  });

  const buildDocumentVerificationStructure = () => {
    // Convert Map-based data to the expected format with country names and document lists
    const supportedCountries = selectedCountryIds.map(countryId => {
      const country = availableCountries.find(c => c.id === countryId);
      const countryName = country ? country.name : `Country_${countryId}`;
      const documents = selectedDocumentIds.get(countryId) || [];
      const documentNames = documents.map(docId => {
        const countryDocs = countryDocuments.get(countryId) || [];
        const doc = countryDocs.find(d => d.id === docId);
        return doc ? doc.name : `Document_${docId}`;
      });
      
      return {
        countryName,
        documents: documentNames
      };
    });

    return {
      documentVerification: {
        allowUploadFromDevice,
        allowCaptureWebcam,
        documentHandlingRejectImmediately: documentHandling === "reject",
        documentHandlingAllowRetries: documentHandling === "retry",
        supportedCountries,
        selectedCountries,  // ✅ keep arrays for Preview/ReceiverView
        selectedDocuments,  // ✅ ensure these are synced
        // selectedDocuments: [], // Keep for backward compatibility if needed
      }
    };
  };

  const buildBiometricVerificationStructure = () => ({
    biometricVerification: {
      maxRetries: parseInt(maxRetries, 10),
      askUserRetry,
      blockAfterRetries,
      dataRetention: dataRetention,
    }
  });

  /* ============ PATCH section data ============ */
  const patchSectionData = async (stepId: VerificationStep["id"]) => {
    const fieldMappingId = getFieldMappingId(stepId);
    if (!fieldMappingId) {
      throw new Error(`Could not find field mapping ID for section: ${stepId}`);
    }

    let structure;
    switch (stepId) {
      case "personal-info":
        structure = buildPersonalInfoStructure();
        break;
      case "document-verification":
        structure = buildDocumentVerificationStructure();
        break;
      case "biometric-verification":
        structure = buildBiometricVerificationStructure();
        break;
      default:
        throw new Error(`Unknown step ID: ${stepId}`);
    }

    const patchData = {
      structure,
      captureAllowed: true,
      uploadAllowed: true,
    };

    console.log(`Patching section ${stepId} with ID ${fieldMappingId}:`, patchData);

    try {
      await apiPatch(`/api/section-field-mappings/by-section/${fieldMappingId}`, patchData);
      console.log(`Successfully patched section ${stepId}`);
    } catch (error) {
      console.error(`Failed to patch section ${stepId}:`, error);
      throw error;
    }
  };

  /* ============ PUT section order and activation ============ */
  const updateSectionOrderAndStatus = async (stepId: VerificationStep["id"], orderIndex: number) => {
    const sectionId = getSectionId(stepId);
    if (!sectionId) {
      throw new Error(`Could not find section ID for section: ${stepId}`);
    }

    const putData = {
      orderIndex,
      isActive: true,
    };

    console.log(`Updating section ${stepId} order and status with ID ${sectionId}:`, putData);

    try {
      await apiPut(`/api/sections/${sectionId}`, putData);
      console.log(`Successfully updated section ${stepId} order and status`);
    } catch (error) {
      console.error(`Failed to update section ${stepId} order and status:`, error);
      throw error;
    }
  };
  const addVerificationStep = (stepId: VerificationStep["id"]) => {
    const stepToAdd = availableSteps.find((s) => s.id === stepId);
    if (stepToAdd) {
      setVerificationSteps((prev) => [
        ...prev,
        { ...stepToAdd, isEnabled: true },
      ]);
      // Do not change current section here; flow will follow Next
    }
  };
  const removeVerificationStep = (stepId: VerificationStep["id"]) => {
    if (stepId === "personal-info") return;
    setVerificationSteps((prev) => prev.filter((s) => s.id !== stepId));
  };
  const moveStep = useCallback((dragIndex: number, hoverIndex: number) => {
    setVerificationSteps((prev) => {
      const dragged = prev[dragIndex];
      const next = [...prev];
      next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, dragged);
      return next;
    });
  }, []);

  /* ============ Optional fields helpers ============ */
  const toggleOptionalField = (fieldId: string) => {
    const field = optionalFields.find((f) => f.id === fieldId);
    if (!field) return;
    if (field.checked) {
      setAddedFields((prev) => prev.filter((f) => f.id !== fieldId));
      setOptionalFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, checked: false } : f)),
      );
    } else {
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

  /* ============ Section selectors ============ */
  const setCurrentSection = (id: VerificationStep["id"]) => {
    setCurrentSectionId(id);
    setPersonalInfoExpanded(id === "personal-info");
    setDocumentVerificationExpanded(id === "document-verification");
    setBiometricVerificationExpanded(id === "biometric-verification");
  };

  const handlePrev = async () => {
    const sectionSetters: Record<
      VerificationStep["id"],
      React.Dispatch<React.SetStateAction<boolean>>
    > = {
      "personal-info": setPersonalInfoExpanded,
      "document-verification": setDocumentVerificationExpanded,
      "biometric-verification": setBiometricVerificationExpanded,
    };

    const activeSections = orderedSectionIds.map((id) => ({
      name: id,
      setExpanded: sectionSetters[id],
    }));
    const currentIndex = Math.max(
      0,
      activeSections.findIndex((s) => s.name === currentSectionId),
    );

    if (currentIndex <= 0) {
      navigate("/dashboard");
      return;
    }

    const prevIndex = currentIndex - 1;
    activeSections[currentIndex].setExpanded(false);
    setCurrentSection(activeSections[prevIndex].name as VerificationStep["id"]);
  };

  /* ============ Payload builders (root-level, match Swagger) ============ */
  const buildPersonalPayload = () => ({
    section_id: 1,
    firstName: true,
    LastName: true,
    Email: true,
    Added_fields: {
      dob:
        optionalFields.find((f) => f.id === "date-of-birth")?.checked ?? false,
      Current_address:
        optionalFields.find((f) => f.id === "current-address")?.checked ??
        false,
      permanent_address:
        optionalFields.find((f) => f.id === "permanent-address")?.checked ??
        false,
      Gender: optionalFields.find((f) => f.id === "gender")?.checked ?? false,
    },
  });

  const buildDocsPayload = () => ({
    section_id: 2,
    user_uploads: {
      Allow_uploads: allowUploadFromDevice,
      allow_capture: allowCaptureWebcam,
    },
    Unreadable_docs: {
      reject_immediately: documentHandling === "reject",
      Allow_retries: documentHandling === "retry",
    },
    Countries_array: selectedCountries.map((country) => ({
      country_name: country,
      listOfdocs: selectedDocuments.reduce(
        (acc: Record<string, boolean>, d) => {
          acc[d] = true;
          return acc;
        },
        {},
      ),
    })),
  });

  const buildBiometricPayload = () => ({
    section_id: 3,
    number_of_retries: maxRetries ? [parseInt(maxRetries, 10)] : [],
    liveness: {
      try_again: askUserRetry,
      Block_further: blockAfterRetries,
    },
    biometric_data_retention: {
      duration: dataRetention ? [dataRetention] : [],
    },
  });

  // sections_order must ALWAYS have 3 items; include current_step in body
  const buildOrderPayload = (currentStep: number) => {
    const map: Record<VerificationStep["id"], string> = {
      "personal-info": "Personal_info",
      "document-verification": "Doc_verification",
      "biometric-verification": "Biometric_verification",
    };

    const ordered = verificationSteps
      .map((s) => map[s.id])
      .filter(Boolean) as string[];
    const all = ["Personal_info", "Doc_verification", "Biometric_verification"];
    for (const sec of all) if (!ordered.includes(sec)) ordered.push(sec);

    return {
      sections_order: ordered.slice(0, 3),
      current_step: Math.max(1, Math.min(3, currentStep)),
    };
  };

  /* ============ Persist to backend (section PUTs + order) - COMMENTED OUT ============ */
  // Save only the current section, not all
  // const saveCurrentSection = useCallback(
  //   async (currentStepNumber: number, sectionName?: string) => {
  //     if (!templateId) throw new Error("Missing template id");

  //     setSaving(true);
  //     setSaveError(null);
  //     setSaveSuccess(null);

  //     try {
  //       if (sectionName === "personal-info") {
  //         await apiPut(
  //           `/api/templates/${templateId}/personal?currentStep=1`,
  //           buildPersonalPayload(),
  //         );
  //       } else if (sectionName === "document-verification") {
  //         await apiPut(
  //           `/api/templates/${templateId}/docs?currentStep=2`,
  //           buildDocsPayload(),
  //         );
  //       } else if (sectionName === "biometric-verification") {
  //         await apiPut(
  //           `/api/templates/${templateId}/biometric?currentStep=3`,
  //           buildBiometricPayload(),
  //         );
  //       }

  //       // Always update order + current_step
  //       await apiPut(
  //         `/api/templates/${templateId}/order`,
  //         buildOrderPayload(currentStepNumber),
  //       );

  //       setSaveSuccess("Progress saved.");
  //     } catch (e: any) {
  //       setSaveError(e?.message || "Failed to save progress.");
  //       throw e;
  //     } finally {
  //       setSaving(false);
  //     }
  //   },
  //   [
  //     templateId,
  //     verificationSteps,
  //     optionalFields,
  //     allowUploadFromDevice,
  //     allowCaptureWebcam,
  //     documentHandling,
  //     selectedCountries,
  //     selectedDocuments,
  //     maxRetries,
  //     askUserRetry,
  //     blockAfterRetries,
  //     dataRetention,
  //   ],
  // );

  /* ============ Original Next button with PUT requests - COMMENTED OUT ============ */
  // const handleNext = async () => {
  //   const sectionSetters: Record<
  //     VerificationStep["id"],
  //     React.Dispatch<React.SetStateAction<boolean>>
  //   > = {
  //     "personal-info": setPersonalInfoExpanded,
  //     "document-verification": setDocumentVerificationExpanded,
  //     "biometric-verification": setBiometricVerificationExpanded,
  //   };

  //   const activeSections = orderedSectionIds.map((id) => ({
  //     name: id,
  //     setExpanded: sectionSetters[id],
  //   }));
  //   const currentIndex = Math.max(
  //     0,
  //     activeSections.findIndex((s) => s.name === currentSectionId),
  //   );

  //   // step number we're leaving (1-based)
  //   const currentStepNumber = Math.min(activeSections.length, currentIndex + 1);
  //   const currentSectionName = activeSections[currentIndex]?.name as VerificationStep["id"] | undefined;

  //   try {
  //     await saveCurrentSection(currentStepNumber, currentSectionName);
  //   } catch {
  //     return; // stay on current page if save failed
  //   }

  //   if (currentIndex < activeSections.length) {
  //     activeSections[currentIndex].setExpanded(false);
  //     const nextIndex = currentIndex + 1;

  //     if (nextIndex < activeSections.length) {
  //       setCurrentSection(activeSections[nextIndex].name as VerificationStep["id"]);
  //     } else {
  //       navigate(templateId ? `/preview/${templateId}` : "/preview", {
  //         state: {
  //           templateName,
  //           verificationSteps,
  //           addedFields,
  //           templateData: {
  //             personalInfo: true,
  //             documentVerification: verificationSteps.some((s) => s.id === "document-verification"),
  //             biometricVerification: verificationSteps.some((s) => s.id === "biometric-verification"),
  //           },
  //         },
  //       });
  //     }
  //   }
  // };

  /* ============ Connection test helper ============ */
  const testConnection = async (): Promise<boolean> => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      // Simple connection test - try to reach the API base URL or a simple endpoint
      const response = await fetch(`${API_BASE}/api/templates`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      });

      // Accept any response (including 401, 403, etc.) as long as we can connect
      if (response.status >= 200 && response.status < 500) {
        setSaveSuccess("Connection successful!");
        return true;
      } else {
        throw new Error(
          `Connection failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error: any) {
      setSaveError(
        error?.message ||
          "Connection failed. Please check your network and try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* ============ Next button - Modified to send PATCH requests ============ */
  const handleNext = async () => {
    const sectionSetters: Record<
      VerificationStep["id"],
      React.Dispatch<React.SetStateAction<boolean>>
    > = {
      "personal-info": setPersonalInfoExpanded,
      "document-verification": setDocumentVerificationExpanded,
      "biometric-verification": setBiometricVerificationExpanded,
    };

    const activeSections = orderedSectionIds.map((id) => ({
      name: id,
      setExpanded: sectionSetters[id],
    }));
    const currentIndex = Math.max(
      0,
      activeSections.findIndex((s) => s.name === currentSectionId),
    );

    // Get current section name and calculate order index (1-based)
    const currentSectionName = activeSections[currentIndex]?.name as VerificationStep["id"] | undefined;
    const orderIndex = currentIndex + 1; // Convert 0-based index to 1-based order

    if (currentSectionName) {
      try {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(null);

        // Send PATCH request for current section structure
        await patchSectionData(currentSectionName);
        
        // Send PUT request for section order and activation
        await updateSectionOrderAndStatus(currentSectionName, orderIndex);
        
        setSaveSuccess(`${currentSectionName} section saved successfully.`);
      } catch (error: any) {
        setSaveError(error?.message || `Failed to save ${currentSectionName} section.`);
        console.error(`Error saving section ${currentSectionName}:`, error);
        return; // Stay on current page if save failed
      } finally {
        setSaving(false);
      }
    }

    if (currentIndex < activeSections.length) {
      activeSections[currentIndex].setExpanded(false);
      const nextIndex = currentIndex + 1;

      if (nextIndex < activeSections.length) {
        setCurrentSection(
          activeSections[nextIndex].name as VerificationStep["id"],
        );
      } else {
        try {
          persistSnapshot();
        } catch {}
        const snapshot = buildSnapshot();
        navigate(templateId ? `/preview/${templateId}` : "/preview", {
          state: {
            templateId: templateId || "",
            templateName,
            verificationSteps,
            addedFields,
            snapshot,
            templateData: {
              personalInfo: true,
              documentVerification: verificationSteps.some(
                (s) => s.id === "document-verification",
              ),
              biometricVerification: verificationSteps.some(
                (s) => s.id === "biometric-verification",
              ),
            },
          },
        });
      }
    }
  };

  // Persist chosen steps for back/forward nav (handled by per-template persistence)
  useEffect(() => {}, [verificationSteps]);

  // After reordering, always focus the first section (keeps UI consistent)
  useEffect(() => {
    const first = orderedSectionIds[0] || "personal-info";
    if (
      !orderedSectionIds.includes(currentSectionId) ||
      currentSectionId !== first
    ) {
      setCurrentSection(first);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationSteps]);

  const handleSystemFieldFocus = (key: string) =>
    setSystemFieldAlerts((prev) => ({ ...prev, [key]: true }));
  const handleSystemFieldBlur = (key: string) =>
    setTimeout(
      () => setSystemFieldAlerts((prev) => ({ ...prev, [key]: false })),
      3000,
    );

  const getAvailableStepsToAdd = () =>
    availableSteps.filter(
      (s) => !verificationSteps.find((vs) => vs.id === s.id),
    );

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

        {/* Subheader */}
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span>Template</span>
            <span>/</span>
            <span>Create New Template</span>
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-7 h-7 p-0 rounded-full bg-gray-100"
                onClick={() => navigate("/dashboard")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">
                {templateName}
              </h1>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <Button
            variant="ghost"
            className="text-gray-600 text-sm"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-600">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                Form builder
              </span>
            </div>

            <div className="w-24 h-px bg-gray-300" />

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
            disabled={saving}
          >
            {saving ? "Saving..." : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Inline save notifications */}
        {(saveError || saveSuccess) && (
          <div className="px-4 pt-2">
            {saveError && (
              <div className="mb-3 p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-3 p-3 border border-green-200 bg-green-50 rounded text-sm text-green-800">
                {saveSuccess}
              </div>
            )}
          </div>
        )}

        {/* Main */}
        <div className="flex flex-1">
          {/* Left rail */}
          <div className="w-80 p-4 border-r border-gray-200 bg-white">
            <div className="mb-8">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">
                  Build your process
                </h2>
                <p className="text-sm text-gray-600">
                  Create a flow by adding required information fields and
                  verification steps.
                </p>
              </div>

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

            {getAvailableStepsToAdd().length > 0 && (
              <div>
                <div className="mb-6">
                  <h2 className="text-base font-bold text-gray-900 mb-2">
                    Add Verification Steps
                  </h2>
                  <p className="text-sm text-gray-600">
                    Insert secure verification steps as needed.
                  </p>
                </div>

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

          {/* Resize handle */}
          <div className="w-4 bg-gray-100 cursor-col-resize border-r border-gray-200">
            <div className="w-px h-full bg-gray-300 mx-auto" />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 bg-white overflow-auto">
            <div className="space-y-6">
              {orderedSectionIds.map((id) => {
                if (id === "personal-info") {
                  return (
                    <div key={id} className="border border-gray-300 rounded">
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

                      {!personalInfoExpanded && (
                        <div className="px-4 lg:px-9 pb-3">
                          <p className="text-xs lg:text-[13px] text-[#505258]">
                            Set up fields to collect basic user details like
                            name, contact.
                          </p>
                        </div>
                      )}

                      {personalInfoExpanded && (
                        <div className="p-8">
                          <div className="mb-6">
                            <h3 className="font-bold text-base text-gray-900 mb-2">
                              System-required Fields
                            </h3>
                            <p className="text-sm text-gray-600">
                              The following fields are required in every
                              template.
                            </p>
                          </div>

                          {/* Required fields (readonly) */}
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
                                <div className="h-2 bg-blue-500 rounded-t-lg" />
                              )}
                              <div className="p-4">
                                {systemFieldAlerts.firstName && (
                                  <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-400 rounded flex items-center gap-2">
                                    <Info className="w-5 h-5 text-red-500" />
                                    <span className="text-sm text-gray-900 font-medium">
                                      This field is system-required and cannot
                                      be modified.
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
                                  onFocus={() =>
                                    handleSystemFieldFocus("firstName")
                                  }
                                  onBlur={() =>
                                    handleSystemFieldBlur("firstName")
                                  }
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
                                <div className="h-2 bg-blue-500 rounded-t-lg" />
                              )}
                              <div className="p-4">
                                {systemFieldAlerts.lastName && (
                                  <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-400 rounded flex items-center gap-2">
                                    <Info className="w-5 h-5 text-red-500" />
                                    <span className="text-sm text-gray-900 font-medium">
                                      This field is system-required and cannot
                                      be modified.
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
                                  onFocus={() =>
                                    handleSystemFieldFocus("lastName")
                                  }
                                  onBlur={() =>
                                    handleSystemFieldBlur("lastName")
                                  }
                                  className="border-gray-300 text-gray-600"
                                  readOnly
                                />
                              </div>
                            </div>

                            {/* Email */}
                            <div
                              className={cn(
                                "rounded-lg border-r border-b border-l bg-white",
                                systemFieldAlerts.email
                                  ? "border-blue-500"
                                  : "border-gray-300",
                              )}
                            >
                              {systemFieldAlerts.email && (
                                <div className="h-2 bg-blue-500 rounded-t-lg" />
                              )}
                              <div className="p-4">
                                {systemFieldAlerts.email && (
                                  <div className="mb-4 p-2 bg-red-50 border-l-2 border-red-400 rounded flex items-center gap-2">
                                    <Info className="w-5 h-5 text-red-500" />
                                    <span className="text-sm text-gray-900 font-medium">
                                      This field is system-required and cannot
                                      be modified.
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
                                  onFocus={() =>
                                    handleSystemFieldFocus("email")
                                  }
                                  onBlur={() => handleSystemFieldBlur("email")}
                                  className="border-gray-300 text-gray-600"
                                  readOnly
                                />
                              </div>
                            </div>
                          </div>

                          {/* Added Fields */}
                          {addedFields.length > 0 && (
                            <div>
                              <div className="mb-4">
                                <h3 className="font-bold text-base text-gray-900 mb-2">
                                  Added Fields
                                </h3>
                                <p className="text-sm text-gray-600">
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
                                        onClick={() =>
                                          removeAddedField(field.id)
                                        }
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
                        </div>
                      )}
                    </div>
                  );
                }

                if (id === "document-verification") {
                  return (
                    <DocumentVerificationSection
                      key={id}
                      isExpanded={documentVerificationExpanded}
                      onToggle={() =>
                        setDocumentVerificationExpanded(
                          !documentVerificationExpanded,
                        )
                      }
                      stateBag={{
                        allowUploadFromDevice,
                        setAllowUploadFromDevice,
                        allowCaptureWebcam,
                        setAllowCaptureWebcam,
                        documentHandling,
                        setDocumentHandling,
                        // New country and document state
                        availableCountries,
                        selectedCountryIds,
                        setSelectedCountryIds,
                        countryDocuments,
                        selectedDocumentIds,
                        setSelectedDocumentIds,
                        loadingCountries,
                        loadingDocuments,
                        // Legacy state for backward compatibility
                        selectedCountries,
                        setSelectedCountries,
                        selectedDocuments,
                        setSelectedDocuments,
                      }}
                    />
                  );
                }

                if (id === "biometric-verification") {
                  return (
                    <BiometricVerificationSection
                      key={id}
                      isExpanded={biometricVerificationExpanded}
                      onToggle={() =>
                        setBiometricVerificationExpanded(
                          !biometricVerificationExpanded,
                        )
                      }
                      stateBag={{
                        maxRetries,
                        setMaxRetries,
                        askUserRetry,
                        setAskUserRetry,
                        blockAfterRetries,
                        setBlockAfterRetries,
                        dataRetention,
                        setDataRetention,
                      }}
                    />
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* Right sidebar */}
          {personalInfoExpanded ? (
            <div className="w-72 border-l border-gray-200 bg-white">
              <div className="p-3 border-b border-gray-300">
                <h2 className="font-bold text-base text-gray-900 mb-1">
                  Add Fields
                </h2>
                <p className="text-sm text-gray-600">
                  Add fields specific to your verification flow.
                </p>
              </div>
              <div className="p-3">
                <div className="space-y-3">
                  {optionalFields
                    .filter((f) => !f.checked)
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
          ) : (
            <div className="w-72 border-l border-gray-200 bg-white">
              <div className="p-3 text-center text-gray-500">
                <p className="text-sm">
                  Configure options for the selected section
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
