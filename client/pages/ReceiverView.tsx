import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, Camera, Upload, Info, RefreshCw,Send, Save, Check, X, FileText, Minus} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SendInviteDialog from "@/components/arcon/SendInviteDialog";
import { showSaveSuccessToast } from "@/lib/saveSuccessToast";
import { getAccessToken } from "@/lib/auth";

const API_BASE = "http://10.10.2.133:8080";
const ENABLE_BACKEND_RECEIVER = false;

// Allow fallback to snapshot from localStorage if backend fails
const ALLOW_SNAPSHOT_FALLBACK = true;

type CountryDocs = { countryName: string; documents: string[] };

type DocConfig = {
  allowUploadFromDevice?: boolean;
  allowCaptureWebcam?: boolean;
  // "retry" | "reject" matches the preview page semantics
  documentHandling?: "retry" | "reject";

  // NEW (preferred, multi-country)
  countries?: CountryDocs[];

  // Legacy single-country (back-compat)
  countryName?: string;
  supportedDocuments?: string[];
};

interface TemplateConfig {
  templateName: string;
  personalInfo: {
    enabled: boolean;
    fields: {
      firstName: boolean;
      lastName: boolean;
      email: boolean;
      dateOfBirth: boolean;
    };
    additionalFields?: Array<{
      id: string;
      name: string;
      placeholder: string;
      value?: string;
    }>;
  };
  documentVerification: {
    enabled: boolean;
    allowUploadFromDevice: boolean;
    allowCaptureWebcam: boolean;
    // use countries[] primarily; fall back to legacy fields if present
    countries?: CountryDocs[];
    countryName?: string;          // legacy
    supportedDocuments?: string[]; // legacy
  };
  biometricVerification: {
    enabled: boolean;
  };
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  country: string;
  idType: string;
  document?: File;
  [key: string]: string | File | undefined; // Allow dynamic fields
}

export default function ReceiverView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId } = useParams();

  // Load template snapshot from localStorage
  const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
    if (!templateId) return;
    try {
      const raw = localStorage.getItem(`arcon_tpl_state:${templateId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSnapshot(parsed);
      }
    } catch (e) {
      console.error("Failed to load template snapshot:", e);
    }
  }, [templateId]);

  // Load template from database or state
  const [dbTemplate, setDbTemplate] = useState<any>(null);
  const [loadingTpl, setLoadingTpl] = useState(false);
  // .NET GET /api/Template/{id}
  const [apiTemplate, setApiTemplate] = useState<any>(null);
  const [tplError, setTplError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    const controller = new AbortController();
    setLoadingTpl(true);
    (async () => {
      try {
        const token = typeof getAccessToken === "function" ? getAccessToken() : undefined;
        const res = await fetch(`${API_BASE}/api/Template/${templateId}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
        const json = await res.json();
        setApiTemplate(json);
        console.log("✅ Fetched template from backend:", json);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("Failed to load template:", e);
          setTplError(e?.message || "Failed to load template");
        }
      } finally {
        setLoadingTpl(false);
      }
    })();
    return () => controller.abort();
  }, [templateId]);

  // Get template configuration from location state or build from dbTemplate or use defaults
  const templateConfig: TemplateConfig = React.useMemo(() => {
    // ✅ PREFERRED: Use apiTemplate from backend
    if (apiTemplate) {
      try {
        const activeVersion = Array.isArray(apiTemplate.versions)
          ? apiTemplate.versions.find((v) => v.isActive) ?? apiTemplate.versions[0]
          : apiTemplate.activeVersion;

        const sections = activeVersion?.sections ?? [];

        // Sort by orderIndex
        const sortedSections = [...sections]
          .filter((s) => s.isActive)
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const sectionMap: Record<string, any> = {};

        for (const section of sortedSections) {
          const type = section.sectionType;
          const mapping = section.fieldMappings?.[0]?.structure ?? {};

          sectionMap[type] = mapping;
          sectionMap[`${type}_upload`] = section.fieldMappings?.[0]?.uploadAllowed ?? false;
          sectionMap[`${type}_capture`] = section.fieldMappings?.[0]?.captureAllowed ?? false;
        }

        const personalInfoStruct = sectionMap["personalInformation"]?.personalInfo ?? {};

        const additionalFields = [];
        if (personalInfoStruct.gender) additionalFields.push({ id: "gender", name: "Gender", placeholder: "Select gender" });
        if (personalInfoStruct.currentAddress) additionalFields.push({ id: "currentAddress", name: "Current Address", placeholder: "Enter your current address" });
        if (personalInfoStruct.permanentAddress) additionalFields.push({ id: "permanentAddress", name: "Permanent Address", placeholder: "Enter your permanent address" });

        const docStruct = sectionMap["documents"]?.documentVerification ?? {};

        // Normalize countries
        const countries: CountryDocs[] = Array.isArray(docStruct.supportedCountries)
          ? docStruct.supportedCountries.map((c: any) => ({
              countryName: c.countryName,
              documents: Array.isArray(c.documents) ? c.documents : [],
            }))
          : [];

        // If selectedCountries exist, filter the normalized countries
        const selectedCountries = new Set((docStruct.selectedCountries ?? []).map((c: string) => c.toLowerCase()));
        const filteredCountries = countries.filter((c) =>
          selectedCountries.has(c.countryName.toLowerCase())
        );

        return {
          templateName: apiTemplate.name || "New Template",
          personalInfo: {
            enabled: !!sectionMap["personalInformation"],
            fields: {
              firstName: !!personalInfoStruct.firstName,
              lastName: !!personalInfoStruct.lastName,
              email: !!personalInfoStruct.email,
              dateOfBirth: !!personalInfoStruct.dateOfBirth,
            },
            additionalFields,
          },
          documentVerification: {
            enabled: !!sectionMap["documents"],
            allowUploadFromDevice: !!sectionMap["documents_upload"],
            allowCaptureWebcam: !!sectionMap["documents_capture"],
            countries: filteredCountries,
          },
          biometricVerification: {
            enabled: !!sectionMap["biometrics"],
          },
        };
      } catch (e) {
        console.error("❌ Failed to parse backend template, falling back to snapshot/localStorage:", e);
        setTplError("Failed to parse backend template structure.");
      }
    }

    // 🟡 Fallback: Use snapshot (localStorage)
    if (ALLOW_SNAPSHOT_FALLBACK && snapshot) {
      console.log("📦 Using snapshot fallback from localStorage...");
      try {
        // Map snapshot to TemplateConfig interface
        const personalFields = snapshot.addedFields || [];
        const optionalFields = snapshot.optionalFields || [];
        const fieldSet = new Set(personalFields.map((f: any) => f.id));
        const additionalFields = [];
        if (optionalFields.includes("gender"))
          additionalFields.push({
            id: "gender",
            name: "Gender",
            placeholder: "Select gender",
          });
        if (optionalFields.includes("currentAddress"))
          additionalFields.push({
            id: "currentAddress",
            name: "Current Address",
            placeholder: "Enter your current address",
          });
        if (optionalFields.includes("permanentAddress"))
          additionalFields.push({
            id: "permanentAddress",
            name: "Permanent Address",
            placeholder: "Enter your permanent address",
          });
        return {
          templateName: snapshot.templateName || "Snapshot Template",
          personalInfo: {
            enabled: snapshot.personalInfoExpanded ?? true,
            fields: {
              firstName: fieldSet.has("firstName"),
              lastName: fieldSet.has("lastName"),
              email: fieldSet.has("email"),
              dateOfBirth: fieldSet.has("dateOfBirth"),
            },
            additionalFields,
          },
          documentVerification: {
            enabled: snapshot.documentVerificationExpanded ?? false,
            allowUploadFromDevice: true,
            allowCaptureWebcam: true,
            countries: [], // can't be derived from snapshot unless you stored them
          },
          biometricVerification: {
            enabled: snapshot.biometricVerificationExpanded ?? false,
          },
        };
      } catch (e) {
        console.error("❌ Failed to parse snapshot fallback:", e);
        setTplError("Failed to parse snapshot fallback.");
      }
    }

    // 🔴 Final fallback (defaults)
    console.warn("⚠️ Using fallback template config. API + snapshot both failed.");
    return {
      templateName: "",
      personalInfo: {
        enabled: false,
        fields: {
          firstName: false,
          lastName: false,
          email: false,
          dateOfBirth: false,
        },
        additionalFields: [],
      },
      documentVerification: {
        enabled: false,
        allowUploadFromDevice: false,
        allowCaptureWebcam: false,
        countries: [],
      },
      biometricVerification: {
        enabled: false,
      },
    };
  }, [apiTemplate, snapshot]);

  console.log("Final template config:", templateConfig);
  console.log("Loading state:", loadingTpl);
  console.log("Error state:", tplError);
  console.log("API Template:", apiTemplate);
  console.log("Snapshot:", snapshot);

  function normalizeCountriesFromDocCfg(d: any): CountryDocs[] {
    if (!d) return [];
    const out: CountryDocs[] = [];

    // .NET shape
    if (Array.isArray(d.supportedCountries)) {
      for (const c of d.supportedCountries) {
        const name = String(c?.countryName ?? c?.country ?? c?.name ?? "").trim();
        const docs = Array.isArray(c?.documents) ? c.documents.filter(Boolean) : [];

        if (name) {
          out.push({ countryName: name, documents: docs });
          console.log("✔️ Parsed supported country:", name, docs);
        } else {
          console.warn("❌ Skipping invalid country:", c);
        }
      }
    }

    return out;
  }


  function extractSupportedDocuments(docVerification: any): string[] {
    const countries = Array.isArray(docVerification.Countries_array)
      ? docVerification.Countries_array
      : [];
    const supportedDocs: string[] = [];
    countries.forEach((country: any) => {
      const listOfDocs = country?.listOfdocs || {};
      Object.entries(listOfDocs).forEach(([docType, isEnabled]) => {
        if (isEnabled && !supportedDocs.includes(docType)) {
          supportedDocs.push(docType);
        }
      });
    });
    return supportedDocs;
  }

  // NEW: extract countries into a simple string[] from multiple possible shapes
  function extractSupportedCountries(input: any): string[] {
    // 1) Preferred: .NET API shape has a string[] of selectedCountries
    if (Array.isArray(input?.selectedCountries)) {
      return Array.from(
        new Set(
          input.selectedCountries
            .map((s: any) => String(s ?? "").trim())
            .filter(Boolean),
        ),
      );
    }

    // 2) Or derive from supportedCountries[].countryName
    if (Array.isArray(input?.supportedCountries)) {
      return Array.from(
        new Set(
          input.supportedCountries
            .map((c: any) =>
              String(c?.countryName ?? c?.country ?? c?.name ?? "").trim(),
            )
            .filter(Boolean),
        ),
      );
    }

    // 3) Legacy DB fallback (if present)
    if (Array.isArray(input?.Countries_array)) {
      return Array.from(
        new Set(
          input.Countries_array
            .map((c: any) =>
              String(c?.countryName ?? c?.country ?? c?.name ?? c?.label ?? "")
                .trim(),
            )
            .filter(Boolean),
        ),
      );
    }

    return [];
  }

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    country: "India",
    idType: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [emailVerified, setEmailVerified] = useState(false);
  const [showSendInviteDialog, setShowSendInviteDialog] = useState(false);

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Country -> docs mapping derived from templateConfig
  const allCountries: CountryDocs[] =
    templateConfig.documentVerification?.countries ?? [];

  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const hasMultiCountry = (allCountries?.length ?? 0) > 0;
  const allowedDocsForCountry = hasMultiCountry
    ? (allCountries.find(c => c.countryName === selectedCountry)?.documents ?? [])
    : (templateConfig.documentVerification?.supportedDocuments ?? []);

  // Initialize default country only once
  useEffect(() => {
    if (!selectedCountry && allCountries.length > 0) {
      setSelectedCountry(allCountries[0].countryName);
    }
  }, [allCountries]); // Only depend on allCountries, not selectedCountry

  // Update idType when selectedCountry changes
  useEffect(() => {
    if (selectedCountry) {
      const currentAllowedDocs = hasMultiCountry
        ? (allCountries.find(c => c.countryName === selectedCountry)?.documents ?? [])
        : (templateConfig.documentVerification?.supportedDocuments ?? []);
      
      if (currentAllowedDocs.length > 0) {
        const firstSlug = slugifyLabel(currentAllowedDocs[0]);
        setFormData(prev => ({ ...prev, idType: firstSlug }));
      } else {
        setFormData(prev => ({ ...prev, idType: "" }));
      }
    }
  }, [selectedCountry, hasMultiCountry, allCountries, templateConfig.documentVerification?.supportedDocuments]); // Stable dependencies


  const onCountryChange = (value: string) => {
    setSelectedCountry(value);
    setFormData((prev) => ({ ...prev, country: value }));
    // idType will be updated automatically by useEffect
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleEmailVerify = () => {
    setEmailVerified(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, document: file }));
    }
  };

  const openCamera = async () => {
    setShowCamera(true);
    setCapturedDataUrl(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setCameraError(null);
    } catch (e) {
      setCameraError("Camera not detected.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const retakePhoto = () => {
    setCapturedDataUrl(null);
    openCamera();
  };

  // ---- dynamic options from backend names, preserving the same card look ----
  const slugifyLabel = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  const getDocVisuals = (label: string) => {
    // 🔄 Improvement: Defensive programming
    const k = (label ?? "").toLowerCase();
    // Reuse the same four visuals you already had; add safe defaults for unknown types.
    if (k.includes("passport") && !k.includes("internal")) {
      return {
        color: "#5A43D6",
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.5C10.6975 21.5 9.46833 21.2503 8.3125 20.751C7.15667 20.2517 6.14867 19.5718 5.2885 18.7115C4.42817 17.8513 3.74833 16.8433 3.249 15.6875C2.74967 14.5317 2.5 13.3025 2.5 12C2.5 10.6872 2.74967 9.45542 3.249 8.30475C3.74833 7.15408 4.42817 6.14867 5.2885 5.2885C6.14867 4.42817 7.15667 3.74833 8.3125 3.249C9.46833 2.74967 10.6975 2.5 12 2.5C13.3128 2.5 14.5446 2.74967 15.6953 3.249C16.8459 3.74833 17.8513 4.42817 18.7115 5.2885C19.5718 6.14867 20.2517 7.15408 20.751 8.30475C21.2503 9.45542 21.5 10.6872 21.5 12C21.5 13.3025 21.2503 14.5317 20.751 15.6875C20.2517 16.8433 19.5718 17.8513 18.7115 18.7115C17.8513 19.5718 16.8459 20.2517 15.6953 20.751C14.5446 21.2503 13.3128 21.5 12 21.5Z" fill="white"/>
          </svg>
        ),
      };
    }
    if (k.includes("aadhar") || k.includes("aadhaar") || k.includes("national id") || k === "national id" || k.includes("state id")) {
      return {
        color: "#00B499",
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 17.6923C11.2653 17.6923 10.316 17.8509 9.402 18.1683C8.48783 18.4856 7.64225 18.9679 6.86525 19.6152C6.87808 19.7064 6.91342 19.7882 6.97125 19.8605C7.02892 19.933 7.093 19.9795 7.1635 20H17.327C17.3975 19.9795 17.4616 19.933 17.5193 19.8605C17.5769 19.7882 17.6122 19.7064 17.625 19.6152C16.8608 18.9679 16.0218 18.4856 15.1077 18.1683C14.1936 17.8509 13.241 17.6923 12.25 17.6923Z" fill="white"/>
          </svg>
        ),
      };
    }
    if (k.includes("driver") || k.includes("driving") || k === "license" || k.includes("licence")) {
      return {
        color: "#ED5F00",
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
           <path d="M4.80775 20.5C4.30258 20.5 3.875 20.325 3.525 19.975C3.175 19.625 3 19.1974 3 18.6923V5.30775C3 4.80258 3.175 4.375 3.525 4.025C3.875 3.675 4.30258 3.5 4.80775 3.5H20.1923C20.6974 3.5 21.125 3.675 21.475 4.025C21.825 4.375 22 4.80258 22 5.30775V18.6923C22 19.1974 21.825 19.625 21.475 19.975C21.125 20.325 20.6974 20.5 20.1923 20.5H4.80775Z" fill="white"/>
          </svg>
        ),
      };
    }
    if (k.includes("pan") || k.includes("tax")) {
      return {
        color: "#9C2BAD",
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.05775 19.5C4.55258 19.5 4.125 19.325 3.775 18.975C3.425 18.625 3.25 18.1974 3.25 17.6923V6.30775C3.25 5.80258 3.425 5.375 3.775 5.025C4.125 4.675 4.55258 4.5 5.05775 4.5H20.4423C20.9474 4.5 21.375 4.675 21.725 5.025C22.075 5.375 22.25 5.80258 22.25 6.30775V17.6923C22.25 18.1974 22.075 18.625 21.725 18.975C21.375 19.325 20.9474 19.5 20.4423 19.5H5.05775Z" fill="white"/>
          </svg>
        ),
      };
    }
    if (k.includes("internal passport")) {
      return {
        color: "#5A43D6",
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.5C10.6975 21.5 9.46833 21.2503 8.3125 20.751C7.15667 20.2517 6.14867 19.5718 5.2885 18.7115C4.42817 17.8513 3.74833 16.8433 3.249 15.6875C2.74967 14.5317 2.5 13.3025 2.5 12C2.5 10.6872 2.74967 9.45542 3.249 8.30475C3.74833 7.15408 4.42817 6.14867 5.2885 5.2885C6.14867 4.42817 7.15667 3.74833 8.3125 3.249C9.46833 2.74967 10.6975 2.5 12 2.5C13.3128 2.5 14.5446 2.74967 15.6953 3.249C16.8459 3.74833 17.8513 4.42817 18.7115 5.2885C19.5718 6.14867 20.2517 7.15408 20.751 8.30475C21.2503 9.45542 21.5 10.6872 21.5 12C21.5 13.3025 21.2503 14.5317 20.751 15.6875C20.2517 16.8433 19.5718 17.8513 18.7115 18.7115C17.8513 19.5718 16.8459 20.2517 15.6953 20.751C14.5446 21.2503 13.3128 21.5 12 21.5Z" fill="white"/>
          </svg>
        ),
      };
    }
    if (k.includes("social security")) {
      return {
        color: "#00B499",
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 17.6923C11.2653 17.6923 10.316 17.8509 9.402 18.1683C8.48783 18.4856 7.64225 18.9679 6.86525 19.6152C6.87808 19.7064 6.91342 19.7882 6.97125 19.8605C7.02892 19.933 7.093 19.9795 7.1635 20H17.327C17.3975 19.9795 17.4616 19.933 17.5193 19.8605C17.5769 19.7882 17.6122 19.7064 17.625 19.6152C16.8608 18.9679 16.0218 18.4856 15.1077 18.1683C14.1936 17.8509 13.241 17.6923 12.25 17.6923Z" fill="white"/>
          </svg>
        ),
      };
    }
    // default fallback: same card style with a neutral color + file icon
    return {
      color: "#C3C6D4",
      icon: <FileText className="w-4 h-4 text-white" />,
    };
  };

  const idOptions = (allowedDocsForCountry ?? []).map((name) => {
    const visuals = getDocVisuals(name);
    return { value: slugifyLabel(name), label: name, ...visuals };
  });


  console.log("Doc idOptions (backend-driven):", idOptions.map((opt) => opt.label));


  // Build sections in order based on template configuration
  const buildSections = () => {
    const sections = [];
    
    // 🧼 Defensive Guard
    if (!templateConfig?.personalInfo || !templateConfig.documentVerification || !templateConfig.biometricVerification) {
      console.warn("❌ Template config structure is incomplete. Skipping rendering.");
      return [];
    }
    // Guard against missing apiTemplate.versions[0]
    const versions = Array.isArray(apiTemplate?.versions) ? apiTemplate.versions : [];
    let sectionsOrder = versions.length
      ? versions[0].sections
          ?.filter((s) => s.isActive)
          ?.sort((a, b) => a.orderIndex - b.orderIndex)
          ?.map((s) => {
            switch (s.sectionType) {
              case "personalInformation":
                return "Personal_info";
              case "documents":
                return "Doc_verification";
              case "biometrics":
                return "Biometric_verification";
              default:
                return null;
            }
          })
          ?.filter(Boolean)
      : null;
    if (!sectionsOrder) {
      // First try to get order from the per-template snapshot
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
    }
    // Fallback to global localStorage arcon_verification_steps
    if (!sectionsOrder || !sectionsOrder.length) {
      try {
        const raw = localStorage.getItem("arcon_verification_steps");
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

    const sectionMap = {
      Personal_info: {
        id: "personal-info",
        enabled: templateConfig.personalInfo.enabled,
        component: renderPersonalInformation(),
      },
      Doc_verification: {
        id: "document-verification",
        enabled: templateConfig.documentVerification.enabled,
        component: renderDocumentVerification(),
      },
      Biometric_verification: {
        id: "biometric-verification",
        enabled: templateConfig.biometricVerification.enabled,
        component: renderBiometricVerification(),
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

  const renderPersonalInformation = () => {
    if (!templateConfig.personalInfo.enabled) return null;

    // Debug logging for additional fields
    if (
      templateConfig.personalInfo.additionalFields &&
      templateConfig.personalInfo.additionalFields.length > 0
    ) {
      console.log(
        "Rendering additional fields:",
        templateConfig.personalInfo.additionalFields,
      );
    }

    return (
      <div className="border border-[#DEDEDD] rounded-lg bg-white shadow-sm">
        {/* Section Header */}
        <div className="px-6 py-5 bg-white rounded-t-lg border-b border-[#DEDEDD]">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Minus className="w-4 h-4 text-black" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-[#172B4D] leading-6 font-roboto">
              Personal Information
            </h2>
          </div>
          <div className="pl-11">
            <p className="text-sm text-[#5E6C84] leading-6 font-roboto">
              Please provide your basic personal information to begin the
              identity verification process.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="px-8 py-8 bg-white rounded-b-lg">
          <div className="flex flex-col gap-8">
            {/* First Row - First Name & Last Name */}
            <div className="flex flex-col sm:flex-row gap-6">
              {templateConfig.personalInfo.fields.firstName && (
                <div className="flex-1 flex flex-col group">
                  <div className="pb-3">
                    <Label className="text-sm font-semibold text-[#172B4D] leading-5 font-roboto">
                      First Name
                    </Label>
                  </div>
                  <div className="relative">
                    <div className="h-12 px-4 py-3 flex items-center border-2 border-[#DFE1E6] rounded-lg bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                      <Input
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="Enter First Name"
                        className="border-0 p-0 h-auto text-sm text-[#172B4D] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-roboto placeholder:text-[#8993A4] w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {templateConfig.personalInfo.fields.lastName && (
                <div className="flex-1 flex flex-col group">
                  <div className="pb-3">
                    <Label className="text-sm font-semibold text-[#172B4D] leading-5 font-roboto">
                      Last Name
                    </Label>
                  </div>
                  <div className="relative">
                    <div className="h-12 px-4 py-3 flex items-center border-2 border-[#DFE1E6] rounded-lg bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                      <Input
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        placeholder="Enter Last Name"
                        className="border-0 p-0 h-auto text-sm text-[#172B4D] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-roboto placeholder:text-[#8993A4] w-full"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Second Row - Email & Date of Birth */}
            <div className="flex flex-col sm:flex-row gap-6">
              {templateConfig.personalInfo.fields.email && (
                <div className="flex-1 flex flex-col group">
                  <div className="pb-3">
                    <Label className="text-sm font-semibold leading-5 font-roboto flex items-center gap-1">
                      <span className="text-[#172B4D]">Email</span>
                      <span className="text-red-500 text-lg">*</span>
                    </Label>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="h-12 px-4 py-3 flex items-center justify-between border-2 border-[#DFE1E6] rounded-lg bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter Your Email Address"
                        className="border-0 p-0 h-auto text-sm text-[#172B4D] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 font-roboto placeholder:text-[#8993A4]"
                      />
                      <div className="ml-3">
                        <Button
                          onClick={handleEmailVerify}
                          className="text-sm font-medium text-[#0073EA] px-4 py-2 h-auto bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                          variant="ghost"
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                    {!emailVerified && (
                      <div className="px-3 py-2 flex items-center gap-2 border border-orange-200 rounded-lg bg-orange-50">
                        <Info className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        <span className="text-sm text-orange-700 leading-5 font-roboto">
                          Email verification is required to continue
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Additional Fields from Admin Configuration */}
            {templateConfig.personalInfo.additionalFields &&
              templateConfig.personalInfo.additionalFields.length > 0 &&
              (() => {
                console.log(
                  "Rendering additional fields:",
                  templateConfig.personalInfo.additionalFields,
                );

                // Group fields into rows of 2
                const fields = templateConfig.personalInfo.additionalFields;
                const rows = [];
                for (let i = 0; i < fields.length; i += 2) {
                  rows.push(fields.slice(i, i + 2));
                }

                return rows.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}`}
                    className="flex flex-col sm:flex-row gap-6"
                  >
                    {row.map((field) => (
                      <div
                        key={field.id}
                        className="flex-1 flex flex-col group"
                      >
                        <div className="pb-3">
                          <Label className="text-sm font-semibold text-[#172B4D] leading-5 font-roboto">
                            {field.name}
                          </Label>
                        </div>
                        <div className="relative">
                          <div className="h-12 px-4 py-3 flex items-center border-2 border-[#DFE1E6] rounded-lg bg-white hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                            <Input
                              value={(formData[field.id] as string) || ""}
                              onChange={(e) =>
                                handleInputChange(field.id, e.target.value)
                              }
                              placeholder={field.placeholder}
                              className="border-0 p-0 h-auto text-sm text-[#172B4D] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-roboto placeholder:text-[#8993A4] w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Add empty div if odd number of fields in last row on larger screens */}
                    {row.length === 1 && (
                      <div className="hidden sm:block flex-1"></div>
                    )}
                  </div>
                ));
              })()}
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentVerification = () => {
    // 🧪 Fix: Add null checks in templateConfig.documentVerification
    if (!templateConfig.documentVerification?.enabled) return null;

    return (
      <div className="border border-[#DEDEDD] rounded-lg bg-white shadow-sm">
        {/* Section Header */}
        <div className="px-6 py-5 bg-white rounded-t-lg border-b border-[#DEDEDD]">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Minus className="w-4 h-4 text-black" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-[#172B4D] leading-6 font-roboto">
              Document Verification
            </h2>
          </div>
          <div className="pl-11">
            <p className="text-sm text-[#5E6C84] leading-6 font-roboto">
              Choose a valid government-issued ID (like a passport, driver's
              license, or national ID) and upload a clear photo of it.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="px-[34px] py-5 border-t border-[#DEDEDD] bg-white">
          <div className="flex flex-col gap-4">
            {/* Country Selection */}
            <div className="h-20 flex flex-col">
              <div className="pb-2">
                <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                  Country
                </Label>
              </div>
              <div className="flex gap-6">
                <Select value={selectedCountry} onValueChange={onCountryChange}>
                  <SelectTrigger className="h-[38px] px-3 flex-1 border border-[#C3C6D4] rounded bg-white">
                    <SelectValue placeholder="Select country">
                      {selectedCountry || ""}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map((c) => (
                      <SelectItem key={c.countryName} value={c.countryName}>
                        {c.countryName}
                      </SelectItem>
                    ))}
                  </SelectContent>

                </Select>
                {/* <div className="h-[38px] px-3 py-[15px] flex items-center justify-between flex-1 border border-[#C3C6D4] rounded bg-white opacity-50">
                  <span className="text-[13px] text-[#676879] leading-5 font-roboto">Select</span>
                </div> */}
              </div>
            </div>

            {/* ID Type Selection */}
            <div className="flex flex-col gap-4">
              <div className="pb-1 flex flex-col gap-1">
                <h3 className="text-base font-bold text-[#172B4D] leading-[26px] font-roboto">
                  Select the ID Type
                </h3>
                <p className="text-[13px] text-[#676879] leading-5 font-roboto">
                  Select the ID you'd like to use for verification.
                </p>
              </div>

              <div className="flex gap-6">
                <RadioGroup
                  value={formData.idType}
                  onValueChange={(value) => handleInputChange("idType", value)}
                  className="flex gap-6"
                >
                  {idOptions.map((option) => (
                    <div key={option.value} className="relative">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={option.value}
                        className={`w-[211px] h-[94px] px-4 py-3 flex flex-col gap-3 border rounded cursor-pointer ${
                          formData.idType === option.value
                            ? "border-[#0073EA] bg-[#E6F1FD]"
                            : "border-[#C3C6D4] bg-white opacity-50"
                        }`}
                      >
                        <div
                          className="w-8 h-8 p-2 flex items-center justify-center rounded"
                          style={{ backgroundColor: option.color }}
                        >
                          {option.icon}
                        </div>
                        <span className="text-sm font-medium text-[#172B4D] leading-[22px] font-roboto">
                          {option.label}
                        </span>
                      </Label>
                      {formData.idType === option.value && (
                        <div className="absolute top-2 right-2 w-[18px] h-[18px] border-2 border-[#0073EA] rounded-full bg-white flex items-center justify-center">
                          <div className="w-[9px] h-[9px] rounded-full bg-[#0073EA]"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            {/* Upload Methods */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#172B4D] leading-[26px] font-roboto">
                Choose a method to upload your document
              </h3>

              <div className="flex gap-6 h-[334px]">
                {/* Camera Option */}
                {templateConfig.documentVerification.allowCaptureWebcam && (
                  <div className="flex-1 flex flex-col">
                    <div
                      className="h-full flex flex-col items-center justify-center gap-6 border-2 border-dashed border-[#C3C6D4] rounded-lg cursor-pointer hover:border-[#0073EA] bg-white p-8"
                      onClick={openCamera}
                    >
                      <div className="w-[64px] h-[64px] p-3 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                        <Camera
                          className="w-8 h-8 text-[#676879]"
                          strokeWidth={1.35}
                        />
                      </div>
                      <div className="text-center max-w-sm">
                        <h4 className="text-base font-semibold text-[#323238] leading-normal font-figtree mb-3">
                          Camera
                        </h4>
                        <p className="text-sm text-[#676879] leading-relaxed font-roboto">
                          Take a clear photo of your document using your
                          device's camera. Make sure the document is well-lit
                          and all text is readable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Files Option */}
                {templateConfig.documentVerification.allowUploadFromDevice && (
                  <div className="flex-1 flex flex-col">
                    <div
                      className="h-full flex flex-col items-center justify-center gap-6 border-2 border-dashed border-[#C3C6D4] rounded-lg cursor-pointer hover:border-[#0073EA] bg-white p-8"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-[64px] h-[64px] p-3 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                        <Upload
                          className="w-8 h-8 text-[#676879]"
                          strokeWidth={1.41}
                        />
                      </div>
                      <div className="text-center max-w-sm">
                        <h4 className="text-base font-semibold text-[#323238] leading-normal font-figtree mb-3">
                          Upload Files
                        </h4>
                        <p className="text-sm text-[#676879] leading-relaxed font-roboto">
                          Select and upload a clear image or PDF of your
                          document from your device. Supported formats: JPG,
                          PNG, PDF.
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              <div className="h-[156px] flex items-center gap-4 border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 relative">
                <div className="flex items-center justify-center gap-4 flex-1">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/71b92e12d4aa83fb25f12a5fcbfdd11a3f368505?width=220"
                    alt="QR Code"
                    className="w-[110px] h-[113px]"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-[214px] flex flex-col items-center gap-3">
                      <div className="w-[214px] flex flex-col">
                        <p className="text-[13px] text-center leading-5 font-roboto">
                          <span className="text-[#676879]">
                            Continue on another device by scanning the QR code
                            or opening
                          </span>
                          <span className="text-[#0073EA]">
                            {" "}
                            https://id.xyz/verify
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[#0073EA] text-[12px] font-roboto">
                  <Info className="w-5 h-5" strokeWidth={1.5} />
                  <span>How does this work?</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Capture Document</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCamera(false);
                    if (stream) {
                      stream.getTracks().forEach((track) => track.stop());
                      setStream(null);
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {!capturedDataUrl && !cameraError && (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full rounded"
                      playsInline
                      muted
                    />
                    <Button onClick={capturePhoto} className="w-full">
                      Capture Photo
                    </Button>
                  </>
                )}

                {capturedDataUrl && (
                  <>
                    <img
                      src={capturedDataUrl}
                      alt="Captured"
                      className="w-full rounded"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={retakePhoto}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retake
                      </Button>
                      <Button
                        onClick={() => setShowCamera(false)}
                        className="flex-1"
                      >
                        Use Photo
                      </Button>
                    </div>
                  </>
                )}

                {cameraError && (
                  <div className="text-center space-y-2">
                    <p className="text-red-600">{cameraError}</p>
                    <Button
                      onClick={() => setCameraError(null)}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBiometricVerification = () => {
    if (!templateConfig.biometricVerification.enabled) return null;

    return (
      <div className="border border-[#DEDEDD] rounded-lg bg-white shadow-sm">
        {/* Section Header */}
        <div className="px-6 py-5 bg-white rounded-t-lg border-b border-[#DEDEDD]">
          <div className="flex items-center gap-3 pb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Minus className="w-4 h-4 text-black" strokeWidth={2} />
            </div>
            <h2 className="text-lg font-bold text-[#172B4D] leading-6 font-roboto">
              Biometric Verification
            </h2>
          </div>
          <div className="pl-11">
            <p className="text-sm text-[#5E6C84] leading-6 font-roboto">
              Take a live selfie to confirm you are the person in the ID
              document. Make sure you're in a well-lit area and your face is
              clearly visible.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-4 border-t border-[#DEDEDD] bg-white">
          <div className="w-full max-w-full p-2 flex items-center gap-6 overflow-hidden">
            {/* Camera Section */}
            
            {/* Upload Methods (Biometric) */}
            <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-[#172B4D] leading-[26px] font-roboto">
                Take a live selfie
            </h3>

            <div className="flex gap-6 h-[334px]">
                {/* Camera Option */}
                <div className="flex-1 flex flex-col">
                <div
                    className="h-full flex flex-col items-center justify-center gap-6 border-2 border-dashed border-[#C3C6D4] rounded-lg cursor-pointer hover:border-[#0073EA] bg-white p-8"
                    onClick={openCamera}
                >
                    <div className="w-[64px] h-[64px] p-3 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                    <Camera className="w-8 h-8 text-[#676879]" strokeWidth={1.35} />
                    </div>
                    <div className="text-center max-w-sm">
                    <h4 className="text-base font-semibold text-[#323238] leading-normal font-figtree mb-3">
                        Camera
                    </h4>
                    <p className="text-sm text-[#676879] leading-relaxed font-roboto">
                        Take a clear selfie using your device’s camera. Make sure your face
                        is well-lit and fully visible.
                    </p>
                    </div>
                </div>
                </div>
            </div>
            </div>

            {/* Camera Modal (same as Doc Verification) */}
            {showCamera && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Capture Selfie</h3>
                    <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setShowCamera(false);
                        if (stream) {
                        stream.getTracks().forEach((track) => track.stop());
                        setStream(null);
                        }
                    }}
                    >
                    <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    {!capturedDataUrl && !cameraError && (
                    <>
                        <video
                        ref={videoRef}
                        className="w-full rounded"
                        playsInline
                        muted
                        />
                        <Button onClick={capturePhoto} className="w-full">
                        Capture Selfie
                        </Button>
                    </>
                    )}

                    {capturedDataUrl && (
                    <>
                        <img
                        src={capturedDataUrl}
                        alt="Selfie"
                        className="w-full rounded"
                        />
                        <div className="flex gap-2">
                        <Button variant="outline" onClick={retakePhoto} className="flex-1">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retake
                        </Button>
                        <Button onClick={() => setShowCamera(false)} className="flex-1">
                            Use Photo
                        </Button>
                        </div>
                    </>
                    )}

                    {cameraError && (
                    <div className="text-center space-y-2">
                        <p className="text-red-600">{cameraError}</p>
                        <Button onClick={() => setCameraError(null)} variant="outline">
                        Try Again
                        </Button>
                    </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
            )}

            {/* Divider */}
            <svg
              width="13"
              height="96"
              viewBox="0 0 13 96"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex flex-col items-center justify-center gap-1"
            >
              <path d="M6.5 34L6.5 -1.19209e-07" stroke="#D0D4E4" />
              <text
                fill="#676879"
                xmlSpace="preserve"
                style={{ whiteSpace: "pre" }}
                fontFamily="Roboto"
                fontSize="13"
                letterSpacing="0em"
              >
                <tspan x="0.590332" y="52.4434">
                  or
                </tspan>
              </text>
              <path d="M6.5 96L6.5 62" stroke="#D0D4E4" />
            </svg>

            {/* QR Code Section */}
            <div className="h-[428px] flex flex-col flex-1">
              <div className="h-[380px] flex flex-col items-center gap-2 flex-1 border-2 border-dashed border-[#C3C6D4] rounded-t-lg">
                <div className="pt-4 flex flex-col items-center justify-between flex-1">
                  <div className="flex flex-col items-center justify-center gap-2 flex-1">
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/d64a4aa6e5265da330b1a90aa5cad41733623a19?width=256"
                        alt="QR Code"
                        className="w-[128px] h-[132px]"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-full max-w-[214px] flex flex-col items-center gap-3">
                          <div className="w-full max-w-[214px] flex flex-col">
                            <p className="text-[13px] text-center leading-5 font-roboto">
                              <span className="text-[#676879]">
                                Continue on another device by scanning the QR
                                code or opening
                              </span>
                              <span className="text-[#0073EA]">
                                {" "}
                                https://id.xyz/verify
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full max-w-[440px] h-12 px-4 py-4 flex justify-end bg-[#F6F7FB] rounded-b">
                <div className="max-w-[135px] flex items-center justify-end gap-1">
                  <Info className="w-5 h-5 text-[#0073EA]" strokeWidth={1.5} />
                  <span className="text-[12px] text-[#0073EA] leading-5 font-roboto">
                    How does this work?
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loadingTpl) {
    return (
      <div className="min-h-screen bg-white font-roboto flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading template...</div>
      </div>
    );
  }

  if (tplError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-red-500 font-semibold">
        {tplError}
      </div>
    );
  }

  // Debug: Add safety check for templateConfig
  if (!templateConfig) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-gray-600">Template config is undefined</div>
      </div>
    );
  }

  const sections = buildSections();
  console.log("Built sections:", sections);

  return (
    <div className="min-h-screen bg-white font-roboto">
      {/* Header */}
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

      {/* Sub Header */}
      <div className="w-full h-[86px] flex flex-col border-b border-[#DEDEDD] bg-white">
        {/* Breadcrumbs */}
        <div className="h-[38px] px-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-1">
              <FileText className="w-4 h-4 text-[#515257]" strokeWidth={1.09} />
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
            <span className="text-xs text-[#505258] font-medium leading-3 font-roboto">
              Create New Template
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="h-12 px-4 py-2 flex items-center justify-between">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 p-2 flex items-center justify-center rounded-full bg-[#F1F2F4]">
              <ChevronLeft
                className="w-4 h-4 text-[#676879] cursor-pointer"
                strokeWidth={2}
                onClick={() => navigate(-1)}
              />
            </div>
            <h1 className="text-xl font-bold text-[#172B4D] leading-[30px] font-roboto">
              {templateConfig.templateName}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSendInviteDialog(true)}
              className="h-8 px-2 py-[9px] flex items-center gap-1 rounded border border-[#0073EA] bg-white hover:bg-blue-50"
            >
              <Send className="w-4 h-4 text-[#0073EA]" strokeWidth={1.33} />
              <span className="text-[13px] font-medium text-[#0073EA] font-roboto">
                Save & Send Invite
              </span>
            </button>
            <button
              onClick={() => {
                showSaveSuccessToast(templateConfig.templateName);
                navigate("/dashboard");
              }}
              className="h-8 px-[6px] py-[9px] flex items-center gap-1 rounded border border-[#0073EA] bg-[#0073EA] hover:bg-blue-700"
            >
              <Save className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-white font-roboto">
                Save
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="h-[89px] px-4 py-3 border-b border-[#DEDEDD] bg-white">
        <div className="w-full px-4 py-3 flex items-center justify-between border-b border-[#DEDEDD] bg-white">
          {/* Previous Button */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4 text-[#676879]" strokeWidth={2} />
              <span className="text-[13px] font-medium text-[#505258] font-roboto">
                Previous
              </span>
            </button>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-8">
            {/* Form Builder - Completed */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-1.5 rounded-full border-2 border-[#258750]">
                <div className="w-8 h-8 rounded-full bg-[#258750] flex items-center justify-center">
                  <Check className="w-[18px] h-[18px] text-white" />
                </div>
              </div>
              <span className="text-[13px] font-medium text-[#172B4D] font-roboto">
                Form builder
              </span>
            </div>

            {/* Connection Line */}
            <div className="w-[120px] h-px bg-[#DEDEDD]"></div>

            {/* Preview - Current */}
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

          {/* Next Button */}
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-medium text-[#505258] font-roboto">
              Next
            </span>
            <div className="w-3.5 h-3.5"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full pb-4 flex flex-col items-center">
        <div className="flex items-start w-full min-h-screen">
          {/* Sidebar */}
          <div className="w-[332px] px-4 pr-2 py-4 flex flex-col gap-2 bg-white min-h-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {/* Admin View Tab - Inactive */}
                <div
                  className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded opacity-50 cursor-pointer hover:bg-blue-50"
                  onClick={() => {
                    try {
                      console.log("Navigating to admin view...", {
                        templateId,
                        currentLocationState: location.state,
                        snapshot: snapshot,
                        templateConfig: templateConfig,
                      });

                      // Use original state if available, otherwise build from current data
                      let previewState = location.state?.originalState;

                      if (!previewState) {
                        // Build proper state for Preview.tsx from current template data
                        previewState = {
                          templateName:
                            templateConfig.templateName || "New Template",
                          verificationSteps: snapshot?.verificationSteps || [],
                          addedFields: snapshot?.addedFields || [],
                          templateData: {
                            personalInfo:
                              templateConfig.personalInfo?.enabled ?? true,
                            documentVerification:
                              templateConfig.documentVerification?.enabled ??
                              false,
                            biometricVerification:
                              templateConfig.biometricVerification?.enabled ??
                              false,
                          },
                          snapshot: snapshot,
                        };
                        console.log("Built preview state:", previewState);
                      } else {
                        console.log("Using original state:", previewState);
                      }

                      navigate(
                        templateId ? `/preview-backend/${templateId}` : "/preview",
                        { state: previewState },
                      );
                    } catch (error) {
                      console.error("Error navigating to admin view:", error);
                      // Fallback navigation without state
                      navigate(
                        templateId ? `/preview-backend/${templateId}` : "/preview",
                      );
                    }
                  }}
                >
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="w-[248px] text-sm font-bold text-[#292F4C] leading-[13px] font-roboto">
                      Admin View
                    </h3>
                    <p className="flex-1 text-[13px] text-[#505258] leading-[18px] font-roboto">
                      Lorem Ipsum is simply dummy text of the printing and
                      typesetting industry.
                    </p>
                  </div>
                </div>

                {/* Receiver's View Tab - Active */}
                <div className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded bg-[#E6F1FD]">
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="w-[248px] text-sm font-bold text-[#292F4C] leading-[13px] font-roboto">
                      Receiver's View
                    </h3>
                    <p className="flex-1 text-[13px] text-[#505258] leading-[18px] font-roboto">
                      Lorem Ipsum is simply dummy text of the printing and
                      typesetting industry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="w-[987px] min-h-full p-6 flex flex-col items-center gap-6 border-l border-[#DEDEDD] self-stretch">
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Render sections in the order specified by the admin */}
              {sections.map((section, index) => (
                <div key={section.id} className="w-full">
                  {section.component}
                </div>
              ))}

              {sections.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8 border border-dashed rounded-lg p-6">
                  No enabled sections found in the template. Please check with the admin.
                </div>
              )}
            </div>
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
