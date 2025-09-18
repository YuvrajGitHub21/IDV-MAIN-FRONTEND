import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Minus, Check, Send, Save } from "lucide-react";
import SendInviteDialog from "@/components/arcon/SendInviteDialog";
import { getAccessToken } from "@/lib/auth";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://10.10.2.133:8080";

interface AddedField {
  id: string;
  name: string;
  placeholder: string;
  value?: string;
}

interface SectionConfig {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  component: React.ReactNode;
}

export default function PreviewBackend() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showSendInviteDialog, setShowSendInviteDialog] = useState(false);

  const [apiTemplate, setApiTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch template from backend (.NET) using singular endpoint, fall back to plural
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const commonHeaders: HeadersInit = {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        let res = await fetch(`${API_BASE}/api/Template/${id}`, {
          headers: commonHeaders,
          signal: controller.signal,
        });
        if (!res.ok && res.status === 404) {
          res = await fetch(`${API_BASE}/api/Templates/${id}`, {
            headers: commonHeaders,
            signal: controller.signal,
          });
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Failed to fetch template: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
          );
        }
        const json = await res.json();
        setApiTemplate(json);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Failed to load template");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [id]);

  const displayName: string =
    apiTemplate?.name ||
    apiTemplate?.Name ||
    apiTemplate?.nameOfTemplate ||
    "Template";

  // Select the version to preview: prefer the FIRST version if present, else fall back to activeVersion
  function pickVersion(apiData: any): any {
    if (!apiData) return {};
    const list =
      (apiData as any)?.versions ||
      (apiData as any)?.Versions ||
      (apiData as any)?.templateVersions ||
      (apiData as any)?.TemplateVersions ||
      null;
    if (Array.isArray(list) && list.length) return list[0];
    return (
      (apiData as any).activeVersion || (apiData as any).ActiveVersion || {}
    );
  }

  // Build sections from the selected version
  function buildSectionsFromApiTemplate(apiData: any): SectionConfig[] {
    if (!apiData) return [];
    const version = pickVersion(apiData);
    const sections = Array.isArray(version.sections) ? version.sections : [];

    const ordered = [...sections].sort(
      (a: any, b: any) => (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0),
    );

    const out: SectionConfig[] = [];
    for (const sec of ordered) {
      // Only render sections explicitly marked active
      if (sec?.isActive !== true) continue;
      const mapping =
        Array.isArray(sec?.fieldMappings) && sec.fieldMappings.length
          ? sec.fieldMappings[0]
          : null;
      const structure = mapping?.structure || {};
      const type = String(sec?.sectionType || "");

      if (type === "personalInformation") {
        const s = structure.personalInfo || structure.personal || {};
        const added: AddedField[] = [];
        if (s?.dateOfBirth)
          added.push({
            id: "dob",
            name: "Date of Birth",
            placeholder: "DD/MM/YYYY",
          });
        if (s?.currentAddress)
          added.push({
            id: "currentAddress",
            name: "Current Address",
            placeholder: "Enter your current address",
          });
        if (s?.permanentAddress)
          added.push({
            id: "permanentAddress",
            name: "Permanent Address",
            placeholder: "Enter your permanent address",
          });
        if (s?.gender)
          added.push({
            id: "gender",
            name: "Gender",
            placeholder: "Select gender",
          });
        const showBase = {
          firstName: !!s?.firstName,
          lastName: !!s?.lastName,
          email: !!s?.email,
        };
        out.push({
          id: "personal-info",
          title: "Personal Information",
          description:
            "Please provide your basic personal information to begin the identity verification process.",
          enabled: true,
          component: (
            <PersonalInformationSection
              addedFields={added}
              showBase={showBase}
            />
          ),
        });
      } else if (type === "documents") {
        const d = structure.documentVerification || structure.documents || {};
        const countryName =
          (Array.isArray(d?.supportedCountries) && d.supportedCountries[0]?.countryName) ||
          (Array.isArray(d?.selectedCountries) && d.selectedCountries[0]) ||
          undefined;

        // derive selected documents from either an array or an object of booleans
        let selectedDocuments: string[] = [];
        if (Array.isArray(d.selectedDocuments))
          selectedDocuments = d.selectedDocuments;
        else if (
          d.selectedDocuments &&
          typeof d.selectedDocuments === "object"
        ) {
          selectedDocuments = Object.entries(d.selectedDocuments)
            .filter(([, v]) => Boolean(v))
            .map(([k]) => k as string);
        }
        const config = {
          allowUploadFromDevice: !!d.allowUploadFromDevice,
          allowCaptureWebcam: !!d.allowCaptureWebcam,
          documentHandling: d.documentHandlingRejectImmediately
            ? "reject"
            : d.documentHandlingAllowRetries
              ? "retry"
              : undefined,
          countryName,
          selectedDocuments
        };
        out.push({
          id: "document-verification",
          title: "Document Verification",
          description:
            "Choose a valid government-issued ID (like a passport, driver's license, or national ID) and upload a clear photo of it.",
          enabled: true,
          component: <DocumentVerificationSection config={config} />,
        });
      } else if (type === "biometrics") {
        const b = structure.biometricVerification || structure.biometrics || {};
        const config = {
          maxRetries:
            typeof b.maxRetries === "number" ? b.maxRetries : undefined,
          askUserRetry: !!b.askUserRetry,
          blockAfterRetries: !!b.blockAfterRetries,
          dataRetention: b.dataRetention || "",
        };
        out.push({
          id: "biometric-verification",
          title: "Biometric Verification",
          description:
            "Take a live selfie to confirm you are the person in the ID document. Make sure you're in a well-lit area and your face is clearly visible.",
          enabled: true,
          component: <BiometricVerificationSection config={config} />,
        });
      }
    }
    return out;
  }

  const orderedSections = useMemo(
    () => buildSectionsFromApiTemplate(apiTemplate),
    [apiTemplate],
  );

  const buildTemplateConfigForReceiverView = () => {
    const version = pickVersion(apiTemplate);
    const sections = Array.isArray(version.sections) ? version.sections : [];

    let personalFields: any = {};
    let docCfg: any = {};
    let bioCfg: any = {};

    for (const s of sections) {
      if (s?.isActive !== true) continue;
      const mapping =
        Array.isArray(s?.fieldMappings) && s.fieldMappings.length
          ? s.fieldMappings[0]
          : null;
      const structure = mapping?.structure || {};
      if (s.sectionType === "personalInformation") {
        personalFields = structure.personalInfo || structure.personal || {};
      } else if (s.sectionType === "documents") {
        docCfg = structure.documentVerification || structure.documents || {};
      } else if (s.sectionType === "biometrics") {
        bioCfg = structure.biometricVerification || structure.biometrics || {};
      }
    }

    const added: AddedField[] = [];
    if (personalFields?.dateOfBirth)
      added.push({
        id: "dob",
        name: "Date of Birth",
        placeholder: "DD/MM/YYYY",
      });
    if (personalFields?.currentAddress)
      added.push({
        id: "currentAddress",
        name: "Current Address",
        placeholder: "Enter your current address",
      });
    if (personalFields?.permanentAddress)
      added.push({
        id: "permanentAddress",
        name: "Permanent Address",
        placeholder: "Enter your permanent address",
      });
    if (personalFields?.gender)
      added.push({
        id: "gender",
        name: "Gender",
        placeholder: "Select gender",
      });

    let docs: string[] = [];
    if (Array.isArray(docCfg.selectedDocuments))
      docs = docCfg.selectedDocuments;
    else if (
      docCfg.selectedDocuments &&
      typeof docCfg.selectedDocuments === "object"
    ) {
      docs = Object.entries(docCfg.selectedDocuments)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k as string);
    }

    return {
      templateName: displayName,
      personalInfo: {
        enabled: true,
        fields: {
          firstName: !!personalFields.firstName,
          lastName: !!personalFields.lastName,
          email: !!personalFields.email,
          dateOfBirth: !!personalFields.dateOfBirth,
        },
        additionalFields: added,
      },
      documentVerification: {
        enabled: sections.some(
          (s: any) => s.sectionType === "documents" && s.isActive === true,
        ),
        allowUploadFromDevice: !!docCfg.allowUploadFromDevice,
        allowCaptureWebcam: !!docCfg.allowCaptureWebcam,
        countryName:
          (Array.isArray(docCfg?.supportedCountries) && docCfg.supportedCountries[0]?.countryName) ||
          (Array.isArray(docCfg?.selectedCountries) && docCfg.selectedCountries[0]) ||
          undefined,
        supportedDocuments: docs,
      },
      biometricVerification: {
        enabled: sections.some(
          (s: any) => s.sectionType === "biometrics" && s.isActive === true,
        ),
      },
    };
  };

  const handleBack = () => navigate(-1);
  const handleSaveAndSendInvite = () => setShowSendInviteDialog(true);
  const handleSave = () => navigate("/dashboard");
  const handleReceiverViewClick = () => {
    try {
      navigate(id ? `/receiver-view/${id}` : "/receiver-view", {
        state: { templateConfig: buildTemplateConfigForReceiverView() },
      });
    } catch {
      navigate(id ? `/receiver-view/${id}` : "/receiver-view");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-roboto flex items-center justify-center text-sm text-gray-600">
        Loading template…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-roboto">
      <header className="h-11 px-4 flex items-center justify-between border-b border-[#DEDEDD] bg-white">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/4566b1e4f2b69299156b1f1c61472e06e0ad9666?width=180"
          alt="Logo"
          className="w-[90px] h-7"
        />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F65F7C] flex items-center justify-center">
            <span className="text-white text-xs font-medium leading-[10px] font-roboto">
              OS
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border-b border-red-200">
          {error}
        </div>
      )}

      <div className="border-b border-[#DEDEDD] bg-white">
        <div className="h-[38px] px-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.33268 1.51562V4.26932C9.33268 4.64268 9.33268 4.82937 9.40535 4.97198C9.46928 5.09742 9.57122 5.1994 9.69668 5.26332C9.83928 5.33598 10.0259 5.33598 10.3993 5.33598H13.153M9.33268 11.3359H5.33268M10.666 8.66927H5.33268M13.3327 6.66142V11.4693C13.3327 12.5894 13.3327 13.1494 13.1147 13.5773C12.9229 13.9536 12.617 14.2595 12.2407 14.4513C11.8128 14.6693 11.2528 14.6693 10.1327 14.6693H5.86602C4.74591 14.6693 4.18586 14.6693 3.75804 14.4513C3.38171 14.2595 3.07575 13.9536 2.884 13.5773C2.66602 13.1494 2.66602 12.5894 2.66602 11.4693V4.53594C2.66602 3.41583 2.66602 2.85578 2.884 2.42796C3.07575 2.05163 3.38171 1.74567 3.75804 1.55392C4.18586 1.33594 4.74591 1.33594 5.86602 1.33594H8.00722C8.49635 1.33594 8.74095 1.33594 8.97115 1.3912C9.17522 1.44019 9.37028 1.521 9.54928 1.63066C9.75108 1.75434 9.92402 1.92729 10.2699 2.2732L12.3954 4.39868C12.7413 4.74458 12.9143 4.91754 13.0379 5.11937C13.1476 5.29831 13.2284 5.4934 13.2774 5.69747C13.3327 5.92765 13.3327 6.17224 13.3327 6.66142Z"
                  stroke="#515257"
                  strokeWidth="1.09091"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs text-[#505258] font-medium leading-3 font-roboto">
                Template
              </span>
            </div>
            <div className="flex h-8 items-center gap-2">
              <span className="text-xs text-[#505258] font-medium leading-3 font-roboto">
                /
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-1">
              <span className="text-xs text-[#505258] font-medium leading-3 font-roboto">
                Preview
              </span>
            </div>
          </div>
        </div>

        <div className="h-12 px-4 py-2 flex items-center justify-between">
          <div className="flex items-start gap-2">
            <div className="flex items-start gap-2">
              <button
                onClick={handleBack}
                className="w-7 h-7 p-2 flex items-center justify-center rounded-full bg-[#F1F2F4] hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft
                  className="w-4 h-4 text-[#676879]"
                  strokeWidth={2}
                />
              </button>
              <h1 className="text-xl font-bold text-[#172B4D] leading-[30px] font-roboto">
                {displayName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveAndSendInvite}
              className="h-8 px-2 py-[9px] flex items-center gap-1 rounded border border-[#0073EA] bg-white hover:bg-blue-50 transition-colors"
            >
              <Send className="w-4 h-4 text-[#0073EA]" strokeWidth={1.33} />
              <span className="text-[13px] font-medium text-[#0073EA] font-roboto">
                Save & Send Invite
              </span>
            </button>
            <button
              onClick={handleSave}
              className="h-8 px-2 py-[9px] flex items-center gap-1 rounded border border-[#0073EA] bg-[#0073EA] hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-white font-roboto">
                Save
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="h-[89px] px-4 py-3 border-b border-[#DEDEDD] bg-white">
        <div className="w-full px-4 py-3 flex items-center justify-center border-b border-[#DEDEDD] bg-white relative">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-1.5 rounded-full border-2 border-[#258750]">
                  <div className="w-8 h-8 rounded-full bg-[#258750] flex items-center justify-center">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.16241 11.2116L13.438 4.93608C13.6089 4.76515 13.8117 4.67969 14.0463 4.67969C14.281 4.67969 14.4837 4.76515 14.6547 4.93608C14.8256 5.107 14.9111 5.30979 14.9111 5.54444C14.9111 5.77908 14.8256 5.98186 14.6547 6.15278L7.76363 13.0438C7.59271 13.2147 7.3923 13.3002 7.16241 13.3002C6.93253 13.3002 6.73212 13.2147 6.5612 13.0438L3.34516 9.82778C3.17423 9.65686 3.09115 9.45408 3.0959 9.21944C3.10066 8.98479 3.1885 8.782 3.35943 8.61108C3.53035 8.44015 3.73314 8.35469 3.96779 8.35469C4.20243 8.35469 4.40521 8.44015 4.57613 8.61108L7.16241 11.2116Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                </div>
                <span className="text-[13px] font-medium text-[#172B4D] font-roboto">
                  Form builder
                </span>
              </div>
              <div className="w-[120px] h-px bg-[#DEDEDD]"></div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="p-1.5 rounded-full border-2 border-[#0073EA]">
                  <div className="w-8 h-8 rounded-full bg-[#0073EA] flex items-center justify-center">
                    <span className="text-white text-base font-bold leading-4 font-roboto">
                      2
                    </span>
                  </div>
                </div>
                <span className="text-[13px] font-medium text-[#172B4D] font-roboto">
                  Preview
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="absolute left-8 flex items-center gap-1 rounded hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#676879]" strokeWidth={2} />
            <span className="text-[13px] font-medium text-[#505258] font-roboto">
              Previous
            </span>
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-[332px] bg-white flex flex-col">
          <div className="p-4 pr-2 pl-4 flex flex-col gap-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded bg-[#E6F1FD]">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <h3 className="w-[248px] text-sm font-bold text-[#292F4C] leading-[13px] font-roboto">
                        Admin View
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-[13px] text-[#505258] leading-[18px] font-roboto">
                        Lorem Ipsum is simply dummy text of the printing and
                        typesetting industry.
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleReceiverViewClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleReceiverViewClick();
                  }}
                  className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded opacity-50 cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                      <h3 className="w-[248px] text-sm font-bold text-[#292F4C] leading-[13px] font-roboto">
                        Receiver's View
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-[13px] text-[#505258] leading-[18px] font-roboto">
                        Lorem Ipsum is simply dummy text of the printing and
                        typesetting industry.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-4 bg-white flex flex-col items-center gap-2.5 cursor-col-resize">
          <div className="w-px flex-1 bg-[#DEDEDD]"></div>
        </div>
        <div className="flex-1 max-w-full flex flex-col items-center gap-6 p-4 pt-4 overflow-hidden">
          <div className="flex flex-col items-center gap-4 w-full">
            {orderedSections.map((section) => (
              <div
                key={section.id}
                className="flex flex-col gap-4 w-full rounded bg-white"
              >
                <div className="p-0 pb-px pl-px pr-px flex flex-col w-full rounded border border-[#DEDEDD]">
                  <div className="px-2 py-4 flex flex-col items-center gap-2 w/full bg-white">
                    <div className="flex items-center gap-2 w-full pb-1">
                      <Minus
                        className="w-[18px] h-[18px] text-[#323238]"
                        strokeWidth={1.5}
                      />
                      <h2 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                        {section.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2.5 w-full pl-7">
                      <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-[34px] py-5 flex flex-col w-full border-t border-[#DEDEDD] bg-white">
                    {section.component}
                  </div>
                </div>
              </div>
            ))}
            {!orderedSections.length && (
              <div className="text-sm text-gray-500">
                No sections enabled for this template.
              </div>
            )}
          </div>
        </div>
      </div>

      <SendInviteDialog
        isOpen={showSendInviteDialog}
        onClose={() => setShowSendInviteDialog(false)}
      />
    </div>
  );
}

function PersonalInformationSection({
  addedFields,
  showBase = { firstName: true, lastName: true, email: true },
}: {
  addedFields: AddedField[];
  showBase?: { firstName: boolean; lastName: boolean; email: boolean };
}) {
  const baseFields = [
    showBase.firstName && {
      id: "firstName",
      name: "First Name",
      placeholder: "Enter your first name",
    },
    showBase.lastName && {
      id: "lastName",
      name: "Last Name",
      placeholder: "Enter your last name",
    },
    showBase.email && {
      id: "email",
      name: "Email Address",
      placeholder: "Enter your email address",
    },
  ].filter(Boolean) as AddedField[];

  const allFields = [...baseFields, ...(addedFields || [])];
  const rows: AddedField[][] = [];
  for (let i = 0; i < allFields.length; i += 2)
    rows.push(allFields.slice(i, i + 2));

  if (!allFields.length) {
    return (
      <div className="text-[13px] text-[#676879]">
        No personal fields enabled.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col gap-6 w-full">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-6 w-full">
            {row.map((field) => (
              <div key={field.id} className="flex flex-col flex-1">
                <div className="flex gap-2 w-full pb-2">
                  <div className="flex flex-col justify-center flex-1 h-2.5">
                    <span className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                      {field.name}
                    </span>
                  </div>
                </div>
                <div className="h-[38px] px-3 py-[15px] flex items-center justify-between w-full rounded border border-[#C3C6D4] bg-white">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[13px] text-[#676879] leading-5 font-roboto">
                      {field.placeholder}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {row.length === 1 && <div className="flex-1"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DocListItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="h-[58px] pb-5 flex flex-col w-full">
      <div className="pb-5 flex flex-col w-full">
        <div className="flex gap-2 w-full">
          <div className="w-[18px] h-[18px] pt-[1.688px] pb-[1.688px] px-[8.438px] flex flex-col items-center gap-[4.5px] rounded-full bg-[#258750]">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex flex-col justify-center w-full h-2.5">
              <span className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                {title}
              </span>
            </div>
            <p className="w-full text-[13px] text-[#505258] leading-5 font-roboto">
              {desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentVerificationSection({ config }: { config: any }) {
  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-[13px] text-[#676879]">Loading configuration...</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 w-full">
      {(config.allowUploadFromDevice || config.allowCaptureWebcam) && (
        <div className="flex items-center w-full rounded-t-lg bg-white">
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="flex gap-6 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                    User Upload Options
                  </h3>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                    Selected upload methods for document submission.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-6 pr-0 pb-0 pl-6 flex flex-col gap-5 w-full rounded bg-[#F6F7FB]">
              {config.allowUploadFromDevice && (
                <DocListItem
                  title="Allow Upload from Device"
                  desc="Let users upload existing documents directly from their device."
                />
              )}
              {config.allowCaptureWebcam && (
                <DocListItem
                  title="Allow Capture via Webcam"
                  desc="Enable webcam access to allow users to capture documents in real time."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {config.documentHandling && (
        <div className="flex items-center w-full bg-white">
          <div className="flex flex-col items-center gap-4 flex-1">
            <div className="flex gap-6 w-full">
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                    Unreadable Document Handling
                  </h3>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                    Action taken if submitted document is unclear.
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-6 pr-0 pb-0 pl-6 flex flex-col gap-5 w-full rounded bg-[#F6F7FB]">
              <div className="h-[58px] pb-5 flex flex-col w-full">
                <div className="pb-5 flex flex-col w-full">
                  <div className="flex gap-2 w-full">
                    <div className="w-[18px] h-[18px] pt-[1.688px] pb-[1.688px] px-[8.438px] flex flex-col items-center gap-[4.5px] rounded-full bg-[#258750]">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex flex-col justify-center w-full h-2.5">
                        <span className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                          {config.documentHandling === "retry"
                            ? "Allow Retries Before Rejection"
                            : "Reject Immediately"}
                        </span>
                      </div>
                      <p className="w-full text-[13px] text-[#505258] leading-5 font-roboto">
                        {config.documentHandling === "retry"
                          ? "Let users reattempt uploading the document before it's finally rejected."
                          : "Skip retry and reject unclear documents without further attempts."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {config.selectedDocuments && config.selectedDocuments.length > 0 && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                  Supported Documents for Identity Verification
                </h3>
              </div>
              <div className="flex items-center gap-2 w-full">
                <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                  Only these document types are accepted.
                </p>
              </div>
            </div>
          </div>
          <div className="h-[165px] pt-6 px-6 pb-0 flex flex-col gap-2 w-full rounded bg-[#F6F7FB]">
            <div className="px-3 pb-3 flex flex-col w-full rounded-lg bg-white">
              <div className="h-[42px] flex items-center gap-6 w-full">
                <span className="text-sm font-medium text-black leading-[22px] font-roboto">
                  {config.countryName ?? "Country"}
                </span>
              </div>
              <div className="p-3 flex items-start content-start gap-2 w-full flex-wrap rounded-lg bg-white">
                {config.selectedDocuments.map((doc: string) => (
                  <div
                    key={doc}
                    className="h-8 px-2 py-2 flex items-center gap-2 rounded-full border border-[#C3C6D4] bg-[#FEFEFE]"
                  >
                    <div className="w-5 h-5 pt-[1.875px] pb-[1.875px] px-[9.375px] flex flex-col items-center gap-[5px] rounded-full bg-[#258750]">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[13px] font-medium text-[#505258] font-roboto">
                      {doc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BiometricVerificationSection({ config }: { config: any }) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center w-full rounded-t-lg bg-white">
        <div className="flex flex-col items-center gap-4 flex-1">
          <div className="flex gap-6 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                  Biometric Settings
                </h3>
              </div>
              <div className="flex items-center gap-2 w-full">
                <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                  Configured liveness and retry policy.
                </p>
              </div>
            </div>
          </div>
          <div className="pt-6 pr-0 pb-0 pl-6 flex flex-col gap-5 w-full rounded bg-[#F6F7FB]">
            <DocListItem
              title={`Max Retries: ${config?.maxRetries ?? "Not set"}`}
              desc="Number of allowed retry attempts for liveness."
            />
            {config?.askUserRetry && (
              <DocListItem
                title="Ask User to Retry"
                desc="Prompt users to try again if liveness fails."
              />
            )}
            {config?.blockAfterRetries && (
              <DocListItem
                title="Block After Retries"
                desc="Block further attempts after exceeding retries."
              />
            )}
            {config?.dataRetention && (
              <DocListItem
                title={`Data Retention: ${config.dataRetention}`}
                desc="Retention policy for biometric data."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
