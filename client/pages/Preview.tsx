import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, Send, Save, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SendInviteDialog from "@/components/arcon/SendInviteDialog";
import { showSaveSuccessToast } from "@/lib/saveSuccessToast";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const ENABLE_BACKEND_PREVIEW = false;

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isEnabled: boolean;
}

interface AddedField {
  id: string;
  name: string;
  placeholder: string;
  value?: string;
}

interface TemplateData {
  templateName: string;
  verificationSteps: VerificationStep[];
  addedFields: AddedField[];
  templateData?: {
    personalInfo: boolean;
    documentVerification: boolean;
    biometricVerification: boolean;
  };
}

interface SectionConfig {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  enabled: boolean;
}

export default function Preview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId } = useParams();
  const [showSendInviteDialog, setShowSendInviteDialog] = useState(false);

  // Load template snapshot from navigation (preferred) or localStorage
  const [snapshot, setSnapshot] = useState<any>(null);

  // Prefer snapshot passed via navigation state
  useEffect(() => {
    const navSnap = (location as any)?.state?.snapshot;
    if (navSnap && typeof navSnap === "object") {
      setSnapshot(navSnap);
    }
  }, [location]);

  // Fallback to per-template saved snapshot
  useEffect(() => {
    if (!templateId) return;
    try {
      const raw = localStorage.getItem(`arcon_tpl_state:${templateId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSnapshot((prev) => prev || parsed);
      }
    } catch (e) {
      console.error("Failed to load template snapshot:", e);
    }
  }, [templateId]);

  // ---------- NEW: template doc from Mongo ----------
  const [dbTemplate, setDbTemplate] = useState<any>(null);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [tplError, setTplError] = useState<string | null>(null);

  useEffect(() => {
    if (!ENABLE_BACKEND_PREVIEW) return;
    if (!templateId) return;
    const run = async () => {
      setLoadingTpl(true);
      setTplError(null);
      try {
        const res = await fetch(`${API_BASE}/api/templates/${templateId}`);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
          );
        }
        const json = await res.json();
        setDbTemplate(json);
      } catch (e: any) {
        setTplError(e?.message || "Failed to load template");
      } finally {
        setLoadingTpl(false);
      }
    };
    run();
  }, [templateId]);

  // Load actual configuration data from localStorage (kept)
  const [docVerificationConfig, setDocVerificationConfig] = useState<any>(null);
  const [biometricConfig, setBiometricConfig] = useState<any>(null);

  useEffect(() => {
    try {
      const docKey = templateId
        ? `arcon_doc_verification_form:${templateId}`
        : "arcon_doc_verification_form";
      const docRaw =
        localStorage.getItem(docKey) ||
        localStorage.getItem("arcon_doc_verification_form");
      if (docRaw) setDocVerificationConfig(JSON.parse(docRaw));
    } catch {}
    try {
      const bioKey = templateId
        ? `arcon_biometric_verification_form:${templateId}`
        : "arcon_biometric_verification_form";
      const bioRaw =
        localStorage.getItem(bioKey) ||
        localStorage.getItem("arcon_biometric_verification_form");
      if (bioRaw) setBiometricConfig(JSON.parse(bioRaw));
    } catch {}
  }, [templateId]);

  // Also support per-template snapshot saved by TemplateBuilder
  useEffect(() => {
    if (!templateId) return;
    try {
      const raw = localStorage.getItem(`arcon_tpl_state:${templateId}`);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && typeof s === "object") {
        if (s.doc) setDocVerificationConfig(s.doc);
        if (s.biometric) setBiometricConfig(s.biometric);
      }
    } catch {}
  }, [templateId]);

  // Load steps from localStorage for preview when no navigation state
  const [lsSteps, setLsSteps] = useState<VerificationStep[]>([]);
  useEffect(() => {
    try {
      const key = templateId
        ? `arcon_verification_steps:${templateId}`
        : "arcon_verification_steps";
      const raw =
        localStorage.getItem(key) ||
        localStorage.getItem("arcon_verification_steps");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLsSteps(parsed);
      }
    } catch {}
  }, [templateId]);

  // Get template data from navigation state, else build from LS
  const templateData: TemplateData = location.state || {
    templateName: "New Template",
    verificationSteps: lsSteps,
    addedFields: [],
    templateData: {
      personalInfo: true,
      documentVerification: true,
      biometricVerification: true,
    },
  };

  // ---------- NEW: bridge helpers to map Mongo doc -> UI components ----------
  // Order coming from Mongo; fallback if missing/empty/invalid
  const DEFAULT_SECTION_ORDER = [
    "Personal_info",
    "Doc_verification",
    "Biometric_verification",
  ] as const;

  type SectionKey = (typeof DEFAULT_SECTION_ORDER)[number];

  const isValidKey = (k: string): k is SectionKey =>
    (DEFAULT_SECTION_ORDER as readonly string[]).includes(k);

  // Build the three sections from the Mongo doc, in the exact order specified
  function buildSectionsFromDbTemplate(tpl: any): SectionConfig[] {
    if (!tpl) return [];

    const order: string[] =
      Array.isArray(tpl.sections_order) && tpl.sections_order.length
        ? tpl.sections_order
        : [...DEFAULT_SECTION_ORDER];

    const status = tpl.Section_status || {};
    const enabledPersonal = status.persoanl_info ?? true;
    const enabledDoc = status.doc_verification ?? !!tpl.Doc_verification;
    const enabledBio =
      status.Biometric_verification ?? !!tpl.Biometric_verification;

    const personalNode: SectionConfig | null = enabledPersonal
      ? {
          id: "personal-info",
          title: "Personal Information",
          description:
            "Please provide your basic personal information to begin the identity verification process.",
          enabled: true,
          component: (
            <PersonalInformationSection
              addedFields={getPersonalAddedFields(tpl)}
              showBase={getPersonalShowBase(tpl)}
            />
          ),
        }
      : null;

    const docNode: SectionConfig | null = enabledDoc
      ? {
          id: "document-verification",
          title: "Document Verification",
          description:
            "Choose a valid government-issued ID (like a passport, driver's license, or national ID) and upload a clear photo of it.",
          enabled: true,
          component: (
            <DocumentVerificationSection config={getDocConfigFromDb(tpl)} />
          ),
        }
      : null;

    const bioNode: SectionConfig | null = enabledBio
      ? {
          id: "biometric-verification",
          title: "Biometric Verification",
          description:
            "Take a live selfie to confirm you are the person in the ID document. Make sure you're in a well-lit area and your face is clearly visible.",
          enabled: true,
          component: (
            <BiometricVerificationSection
              config={getBiometricConfigFromDb(tpl)}
            />
          ),
        }
      : null;

    const mapByKey: Record<SectionKey, SectionConfig | null> = {
      Personal_info: personalNode,
      Doc_verification: docNode,
      Biometric_verification: bioNode,
    };

    const visited = new Set<string>();
    const out: SectionConfig[] = [];
    for (const rawKey of order) {
      if (!isValidKey(rawKey)) continue;
      if (visited.has(rawKey)) continue;
      visited.add(rawKey);
      const node = mapByKey[rawKey];
      if (node && node.enabled) out.push(node);
    }

    // If none enabled (edge case), fall back to default order
    if (!out.length) {
      for (const k of DEFAULT_SECTION_ORDER) {
        const n = mapByKey[k];
        if (n && n.enabled) out.push(n);
      }
    }

    return out;
  }

  const getPersonalShowBase = (tpl: any) => {
    const p = tpl?.Personal_info || {};
    return {
      firstName: !!p.firstName,
      lastName: !!p.LastName,
      email: !!p.Email,
    };
  };

  const getPersonalAddedFields = (tpl: any): AddedField[] => {
    const a = tpl?.Personal_info?.Added_fields || {};
    const out: AddedField[] = [];
    if (a.dob)
      out.push({ id: "dob", name: "Date of Birth", placeholder: "DD/MM/YYYY" });
    if (a.Current_address)
      out.push({
        id: "currentAddress",
        name: "Current Address",
        placeholder: "Enter your current address",
      });
    if (a.permanent_address)
      out.push({
        id: "permanentAddress",
        name: "Permanent Address",
        placeholder: "Enter your permanent address",
      });
    if (a.Gender)
      out.push({ id: "gender", name: "Gender", placeholder: "Select gender" });
    return out;
  };

  const getDocConfigFromDb = (tpl: any) => {
    const v = tpl?.Doc_verification || {};
    const uploads = v.user_uploads || {};
    const unreadable = v.Unreadable_docs || {};
    // flatten all enabled docs across countries
    const countries = Array.isArray(v.Countries_array) ? v.Countries_array : [];
    const selectedDocuments: string[] = [];
    countries.forEach((c: any) => {
      const list = c?.listOfdocs || {};
      Object.entries(list).forEach(([k, val]) => {
        if (val) selectedDocuments.push(k);
      });
    });

    return {
      allowUploadFromDevice: !!uploads.Allow_uploads,
      allowCaptureWebcam: !!uploads.allow_capture,
      documentHandling: unreadable.Allow_retries
        ? "retry"
        : unreadable.reject_immediately
          ? "reject"
          : undefined,
      selectedDocuments,
    };
  };

  const getBiometricConfigFromDb = (tpl: any) => {
    const b = tpl?.Biometric_verification || {};
    const retries = Array.isArray(b.number_of_retries)
      ? b.number_of_retries
      : [];
    const maxRetries = retries.length ? Math.max(...retries) : undefined;
    const l = b.liveness || {};
    const r = b.biometric_data_retention || {};
    const durations = Array.isArray(r.duration) ? r.duration : [];
    return {
      maxRetries,
      askUserRetry: !!l.try_again,
      blockAfterRetries: !!l.Block_further,
      dataRetention: durations.join(", "),
    };
  };

  const sectionStatus = dbTemplate?.Section_status || null;

  // ---------- API-ready data structure (kept from your code) ----------
  const apiPayload = useMemo(() => {
    const orderedSections: any[] = [];

    // Personal Information (kept as in your builder flow)
    orderedSections.push({
      type: "personal-info",
      title: "Personal Information",
      order: 0,
      required: true,
      fields: templateData.addedFields.map((field) => ({
        name: field.name,
        type: field.id.includes("email")
          ? "email"
          : field.id.includes("date")
            ? "date"
            : "text",
        required: true,
        placeholder: field.placeholder,
      })),
    });

    templateData.verificationSteps.forEach((step, index) => {
      if (step.id === "document-verification") {
        orderedSections.push({
          type: "document-verification",
          title: "Document Verification",
          order: index + 1,
          required: step.isRequired,
          settings: {
            uploadOptions: {
              allowDeviceUpload: true,
              allowWebcamCapture: true,
            },
            documentHandling: { allowRetries: true },
            supportedCountries: [
              {
                country: "India",
                supportedDocuments: [
                  "Aadhar Card",
                  "Driving License",
                  "Pan Card",
                  "Passport",
                ],
              },
            ],
          },
        });
      } else if (step.id === "biometric-verification") {
        orderedSections.push({
          type: "biometric-verification",
          title: "Biometric Verification",
          order: index + 1,
          required: step.isRequired,
          settings: {
            maxRetryAttempts: 4,
            livenessThreshold: {
              action: "ask-retry",
              description: "Ask the user to try again",
            },
            dataRetention: { enabled: true, duration: "6 Months" },
          },
        });
      }
    });

    return {
      templateId: templateId || "new",
      templateName: dbTemplate?.nameOfTemplate ?? templateData.templateName,
      sections: orderedSections,
      createdAt: new Date().toISOString(),
      status: "false",
    };
  }, [templateData, templateId, dbTemplate]);

  // ---------- Build sections to render (DB first, fallback to builder state) ----------
  // Create section components (DB first with sections_order, else builder fallback)
  const createSectionComponents = (): SectionConfig[] => {
    if (dbTemplate) {
      return buildSectionsFromDbTemplate(dbTemplate);
    }

    // ---- Fallback to builder state ----
    const sections: SectionConfig[] = [];

    // Get sections order from snapshot verificationSteps, or derive from localStorage, else default
    let sectionsOrder: string[] = [];

    // First try to get order from the loaded snapshot
    if (snapshot && Array.isArray(snapshot.verificationSteps)) {
      sectionsOrder = snapshot.verificationSteps
        .map((s: any) =>
          s.id === "personal-info"
            ? "Personal_info"
            : s.id === "document-verification"
              ? "Doc_verification"
              : s.id === "biometric-verification"
                ? "Biometric_verification"
                : null,
        )
        .filter(Boolean);
    }

    // Fallback to templateData.verificationSteps if snapshot not available
    if (
      (!sectionsOrder || !sectionsOrder.length) &&
      Array.isArray(templateData.verificationSteps)
    ) {
      sectionsOrder = templateData.verificationSteps
        .map((s: any) =>
          s.id === "personal-info"
            ? "Personal_info"
            : s.id === "document-verification"
              ? "Doc_verification"
              : s.id === "biometric-verification"
                ? "Biometric_verification"
                : null,
        )
        .filter(Boolean);
    }

    // Final fallback to localStorage arcon_verification_steps
    if (!sectionsOrder || !sectionsOrder.length) {
      try {
        const key = templateId
          ? `arcon_verification_steps:${templateId}`
          : "arcon_verification_steps";
        const raw =
          localStorage.getItem(key) ||
          localStorage.getItem("arcon_verification_steps");
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed) && parsed.length) {
          sectionsOrder = parsed
            .map((s: any) =>
              s.id === "personal-info"
                ? "Personal_info"
                : s.id === "document-verification"
                  ? "Doc_verification"
                  : s.id === "biometric-verification"
                    ? "Biometric_verification"
                    : null,
            )
            .filter(Boolean);
        }
      } catch {}
    }

    // Absolute fallback to default order
    if (!sectionsOrder || !sectionsOrder.length) {
      sectionsOrder = [
        "Personal_info",
        "Doc_verification",
        "Biometric_verification",
      ];
    }

    // Ensure Personal_info is always included at the beginning if not present
    if (!sectionsOrder.includes("Personal_info")) {
      sectionsOrder.unshift("Personal_info");
    }

    // Use snapshot verificationSteps to determine what's enabled, fallback to templateData
    const steps = Array.isArray(snapshot?.verificationSteps)
      ? snapshot.verificationSteps
      : Array.isArray(templateData.verificationSteps)
        ? templateData.verificationSteps
        : [];

    const docFromState = Array.isArray(steps)
      ? steps.some(
          (s: any) => s.id === "document-verification" && (s.isEnabled ?? true),
        )
      : false;
    const bioFromState = Array.isArray(steps)
      ? steps.some(
          (s: any) =>
            s.id === "biometric-verification" && (s.isEnabled ?? true),
        )
      : false;

    let docFlag = false;
    let bioFlag = false;
    try {
      const docKey = templateId
        ? `arcon_has_document_verification:${templateId}`
        : "arcon_has_document_verification";
      const rawDoc =
        localStorage.getItem(docKey) ||
        localStorage.getItem("arcon_has_document_verification");
      if (rawDoc) docFlag = Boolean(JSON.parse(rawDoc));
    } catch {}
    try {
      const bioKey = templateId
        ? `arcon_has_biometric_verification:${templateId}`
        : "arcon_has_biometric_verification";
      const rawBio =
        localStorage.getItem(bioKey) ||
        localStorage.getItem("arcon_has_biometric_verification");
      if (rawBio) bioFlag = Boolean(JSON.parse(rawBio));
    } catch {}

    const docEnabled = docFromState || docFlag || !!docVerificationConfig;
    const bioEnabled = bioFromState || bioFlag || !!biometricConfig;

    const defaultDoc = {
      allowUploadFromDevice: false,
      allowCaptureWebcam: false,
      documentHandling: undefined,
      selectedDocuments: [],
    };
    const defaultBio = {
      maxRetries: undefined,
      askUserRetry: false,
      blockAfterRetries: false,
      dataRetention: "",
    };

    // Create section map
    const sectionMap = {
      Personal_info: {
        id: "personal-info",
        title: "Personal Information",
        description:
          "Please provide your basic personal information to begin the identity verification process.",
        enabled: true,
        component: (
          <PersonalInformationSection
            addedFields={templateData.addedFields}
            showBase={{ firstName: true, lastName: true, email: true }}
          />
        ),
      },
      Doc_verification: {
        id: "document-verification",
        title: "Document Verification",
        description:
          "Choose a valid government-issued ID (like a passport, driver's license, or national ID) and upload a clear photo of it.",
        enabled: docEnabled,
        component: (
          <DocumentVerificationSection
            config={docVerificationConfig ?? defaultDoc}
          />
        ),
      },
      Biometric_verification: {
        id: "biometric-verification",
        title: "Biometric Verification",
        description:
          "Take a live selfie to confirm you are the person in the ID document. Make sure you're in a well-lit area and your face is clearly visible.",
        enabled: bioEnabled,
        component: (
          <BiometricVerificationSection
            config={biometricConfig ?? defaultBio}
          />
        ),
      },
    };

    // Add sections in the specified order, only if enabled
    sectionsOrder.forEach((sectionKey: string) => {
      const section = sectionMap[sectionKey as keyof typeof sectionMap];
      if (section && section.enabled) {
        sections.push(section);
      }
    });

    return sections;
  };

  const orderedSections = createSectionComponents();

  // Count visible personal fields for sidebar blurb
  const visiblePersonalCount = useMemo(() => {
    if (dbTemplate) {
      const base = getPersonalShowBase(dbTemplate);
      const baseCount =
        (base.firstName ? 1 : 0) +
        (base.lastName ? 1 : 0) +
        (base.email ? 1 : 0);
      return baseCount + getPersonalAddedFields(dbTemplate).length;
    }
    return 3 + (templateData.addedFields?.length || 0);
  }, [dbTemplate, templateData.addedFields]);

  const displayName = dbTemplate?.nameOfTemplate ?? templateData.templateName;

  // Helper function to convert template data to format expected by ReceiverView
  const buildTemplateConfigForReceiverView = () => {
    console.log("Preview: Building template config for receiver view", {
      hasDbTemplate: !!dbTemplate,
      hasSnapshot: !!snapshot,
      templateData,
      snapshot,
    });

    if (dbTemplate) {
      // Convert database template to receiver view config
      const personalAddedFields = getPersonalAddedFields(dbTemplate);
      const personalShowBase = getPersonalShowBase(dbTemplate);
      const docConfig = getDocConfigFromDb(dbTemplate);

      return {
        templateName: dbTemplate.nameOfTemplate || "New Template",
        personalInfo: {
          enabled: sectionStatus ? !!sectionStatus.personal_info : true,
          fields: {
            firstName: personalShowBase.firstName,
            lastName: personalShowBase.lastName,
            email: personalShowBase.email,
            dateOfBirth: personalAddedFields.some((f) => f.id === "dob"),
          },
          additionalFields: personalAddedFields,
        },
        documentVerification: {
          enabled: sectionStatus
            ? !!sectionStatus.doc_verification
            : !!dbTemplate.Doc_verification,
          allowUploadFromDevice: docConfig.allowUploadFromDevice,
          allowCaptureWebcam: docConfig.allowCaptureWebcam,
          supportedDocuments: docConfig.selectedDocuments,
        },
        biometricVerification: {
          enabled: sectionStatus
            ? !!sectionStatus.biometric_verification
            : !!dbTemplate.Biometric_verification,
        },
      };
    } else {
      // Convert builder state to receiver view config
      // Use loaded snapshot if available, otherwise fall back to templateData
      const sourceData = snapshot || templateData;
      const steps = Array.isArray(sourceData.verificationSteps)
        ? sourceData.verificationSteps
        : [];
      const addedFields = Array.isArray(sourceData.addedFields)
        ? sourceData.addedFields
        : templateData.addedFields || [];
      const optionalFields =
        "optionalFields" in sourceData &&
        Array.isArray((sourceData as any).optionalFields)
          ? (sourceData as any).optionalFields
          : [];

      const docConfig =
        "doc" in sourceData ? (sourceData as any).doc || {} : {};
      const hasDoc = steps.some(
        (s: any) => s.id === "document-verification" && (s.isEnabled ?? true),
      );
      const hasBio = steps.some(
        (s: any) => s.id === "biometric-verification" && (s.isEnabled ?? true),
      );
      const dob = !!optionalFields.find(
        (f: any) => f.id === "date-of-birth" && f.checked,
      );

      const config = {
        templateName: sourceData.templateName || templateData.templateName,
        personalInfo: {
          enabled: true,
          fields: {
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: dob || addedFields.some((f) => f.id.includes("date")),
          },
          additionalFields: addedFields.filter(
            (field) =>
              !["firstName", "lastName", "email"].includes(field.id) &&
              !field.id.includes("date"),
          ),
        },
        documentVerification: {
          enabled: hasDoc,
          allowUploadFromDevice: !!docConfig.allowUploadFromDevice,
          allowCaptureWebcam: !!docConfig.allowCaptureWebcam,
          supportedDocuments: Array.isArray(docConfig.selectedDocuments)
            ? docConfig.selectedDocuments
            : ["Passport", "Aadhar Card", "Driving License", "Pan Card"],
        },
        biometricVerification: {
          enabled: hasBio,
        },
      };

      console.log(
        "Preview: Built template config from snapshot/templateData:",
        {
          config,
          docConfig,
          selectedDocuments: docConfig.selectedDocuments,
          hasDoc,
          hasBio,
          dob,
          addedFields,
          filteredAdditionalFields: addedFields.filter(
            (field) =>
              !["firstName", "lastName", "email"].includes(field.id) &&
              !field.id.includes("date"),
          ),
        },
      );

      return config;
    }
  };

  const handleBack = () => {
    navigate("/template-builder", {
      state: {
        templateId:
          templateId || localStorage.getItem("arcon_current_template_id") || "",
        snapshot: snapshot || null,
      },
    });
  };

  const handleSaveAndSendInvite = async () => {
    console.log("API Payload for Save & Send Invite:", apiPayload);
    setShowSendInviteDialog(true);
  };

  // ...existing code...
  const handleSave = async () => {
    console.log("This is the HandleSave Function ");
    //console.log("API Payload for Save:", apiPayload);
    console.log("templateId:", templateId);
    const bodyData = { Template_status: true };
    console.log("Request body:", bodyData);

    // Send PUT request to update template status
    if (templateId) {
      try {
        const res = await fetch(
          `${API_BASE}/api/templates/${templateId}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              accept: "*/*",
            },
            body: JSON.stringify(bodyData),
          },
        );
        const responseText = await res.text();
        console.log("Response status:", res.status);
        console.log("Response text:", responseText);
        if (!res.ok) {
          throw new Error(`Failed to update status: ${res.statusText}`);
        }
      } catch (err) {
        console.error("Error updating template status:", err);
        // Optionally show an error toast here
      }
    } else {
      console.warn("No templateId found, not sending PUT request.");
    }

    // Show success toast
    showSaveSuccessToast(templateData?.templateName || "New Template");

    // Navigate to templates page
    navigate("/dashboard");
  };
  // ...existing code...

  const handlePrevious = () => {
    navigate("/template-builder", {
      state: {
        templateId:
          templateId || localStorage.getItem("arcon_current_template_id") || "",
        templateName: templateData.templateName,
        verificationSteps: templateData.verificationSteps,
        addedFields: templateData.addedFields,
        snapshot: snapshot || null,
      },
    });
  };

  // Navigate to receiver view
  const handleReceiverViewClick = () => {
    // Build the templateConfig before using it
    const templateConfig = buildTemplateConfigForReceiverView();
    try {
      navigate(templateId ? `/receiver-view/${templateId}` : "/receiver-view", {
        state: {
          templateConfig,
          templateData,
          snapshot: snapshot || location.state?.snapshot,
          originalState: location.state,
        },
      });
    } catch (error) {
      console.error("Error navigating to receiver view:", error);
      // Fallback navigation without state
      navigate(templateId ? `/receiver-view/${templateId}` : "/receiver-view");
    }
  };

  if (loadingTpl) {
    return (
      <div className="min-h-screen bg-white font-roboto flex items-center justify-center text-sm text-gray-600">
        Loading template…
      </div>
    );
  }
  if (tplError) {
    // Still render the page so your UI remains intact; just show a banner
    console.warn(tplError);
  }

  return (
    <div className="min-h-screen bg-white font-roboto">
      {/* Header - 44px height */}
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

      {/* Optional error banner */}
      {tplError && (
        <div className="px-4 py-2 text-sm text-red-700 bg-red-50 border-b border-red-200">
          {tplError}
        </div>
      )}

      {/* Sub Header - 86px total height */}
      <div className="border-b border-[#DEDEDD] bg-white">
        {/* Breadcrumbs - 38px height */}
        <div className="h-[38px] px-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-1">
              {/* icon kept */}
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
                Create New Template
              </span>
            </div>
          </div>
        </div>

        {/* Heading - 48px height */}
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

      {/* Steps Section - 89px height - CENTERED */}
      <div className="h-[89px] px-4 py-3 border-b border-[#DEDEDD] bg-white">
        <div className="w-full px-4 py-3 flex items-center justify-center border-b border-[#DEDEDD] bg-white">
          {/* Centered Steps */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-8">
              {/* Form Builder Step - Completed */}
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

              {/* Connection Line */}
              <div className="w-[120px] h-px bg-[#DEDEDD]"></div>

              {/* Preview Step - Current */}
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

          {/* Previous and Next buttons positioned absolutely */}
          <button
            onClick={handlePrevious}
            className="absolute left-8 flex items-center gap-1 rounded hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#676879]" strokeWidth={2} />
            <span className="text-[13px] font-medium text-[#505258] font-roboto">
              Previous
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar - 332px width */}
        <div className="w-[332px] bg-white flex flex-col">
          <div className="p-4 pr-2 pl-4 flex flex-col gap-2">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {/* Admin View Tab - Active */}
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

                {/* Receiver's View Tab - Inactive */}
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

        {/* Resize Handle - 16px width */}
        <div className="w-4 bg-white flex flex-col items-center gap-2.5 cursor-col-resize">
          <div className="w-px flex-1 bg-[#DEDEDD]"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-full flex flex-col items-center gap-6 p-4 pt-4 overflow-hidden">
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Render sections in configured order - NO ORDER BADGES */}
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

      {/* Send Invite Dialog */}
      <SendInviteDialog
        isOpen={showSendInviteDialog}
        onClose={() => setShowSendInviteDialog(false)}
      />
    </div>
  );
}

/* ----------------------------- Section Components ----------------------------- */
const PersonalInformationSection = ({
  addedFields,
  showBase = { firstName: true, lastName: true, email: true }, // NEW: control the 3 base fields
}: {
  addedFields: AddedField[];
  showBase?: { firstName: boolean; lastName: boolean; email: boolean };
}) => {
  // Base fields, but include only when true
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

  // Combine with optional fields from admin/DB
  const allFields = [...baseFields, ...(addedFields || [])];

  // Group fields into rows (2 fields per row)
  const fieldRows: AddedField[][] = [];
  for (let i = 0; i < allFields.length; i += 2) {
    fieldRows.push(allFields.slice(i, i + 2));
  }

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
        {fieldRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-6 w-full">
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
};

const DocumentVerificationSection = ({ config }: { config: any }) => {
  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-[13px] text-[#676879]">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* User Upload Options */}
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

      {/* Unreadable Document Handling */}
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

      {/* Supported Documents */}
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
                  India
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
};

const BiometricVerificationSection = ({ config }: { config: any }) => {
  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-[13px] text-[#676879]">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full flex flex-col gap-6 overflow-hidden">
      {/* Retry Attempts */}
      {typeof config.maxRetries !== "undefined" && (
        <div className="flex flex-col gap-5 w-full">
          <div className="flex items-center w-full bg-white">
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                    Retry Attempts for Selfie Capture
                  </h3>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                    Maximum retry attempts configured by admin.
                  </p>
                </div>
              </div>
              <div className="pt-6 px-6 pb-0 flex flex-col gap-2 w-full rounded bg-[#F6F7FB]">
                <div className="pb-5 flex flex-col w-full">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex flex-col justify-center w-full h-2.5">
                        <span className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                          Maximum number of retries
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-shrink-0 w-full max-w-80 flex gap-3 bg-[#F6F7FB]">
                      <div className="h-8 px-3 py-2 flex items-center justify-between flex-1 rounded border border-[#C3C6D4] bg-[#F6F7FB]">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[13px] text-[#676879] leading-5 font-roboto">
                            {String(config.maxRetries)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liveness Confidence Threshold */}
      {(config.askUserRetry || config.blockAfterRetries) && (
        <div className="flex flex-col gap-5 w-full">
          <div className="flex items-center w-full bg-white">
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="flex gap-6 w-full">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                      Liveness Confidence Threshold (%)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                      Admin-configured action for low liveness scores.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6 px-6 pb-0 flex flex-col gap-5 w-full rounded bg-[#F6F7FB]">
                {config.askUserRetry && (
                  <DocListItem
                    title="Ask the user to try again"
                    desc="Prompt the user to reattempt the selfie."
                  />
                )}
                {config.blockAfterRetries && (
                  <DocListItem
                    title="Block further attempts after retries fail"
                    desc="Send submission for manual verification."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Data Retention */}
      {config.dataRetention && (
        <div className="flex flex-col gap-5 w-full">
          <div className="flex items-center w-full bg-white">
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="flex gap-6 w-full">
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
                      Biometric Data Retention
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 w-full">
                    <p className="flex-1 text-[13px] text-[#172B4D] leading-5 font-roboto">
                      Data storage duration configured by admin.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-6 px-6 pb-0 flex flex-col gap-2 w-full rounded bg-[#F6F7FB]">
                <div className="pb-5 flex flex-col items-center w-full">
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex flex-col justify-center w-full h-2.5">
                        <span className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                          Biometric data storage duration
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-shrink-0 w-full max-w-80 flex gap-3">
                      <div className="h-8 px-3 py-2 flex items-center justify-between flex-1 rounded border border-[#C3C6D4]">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-[13px] text-[#676879] leading-5 font-roboto">
                            {config.dataRetention}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------ Small helpers ------------------------------ */
function DocListItem({ title, desc }) {
  return (
    <div className="pb-5">
      <div className="flex gap-2 w-full">
        <div className="w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#258750]">
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[#172B4D] font-roboto">
              {title}
            </span>
            <p className="text-[13px] text-[#505258] font-roboto">{desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
