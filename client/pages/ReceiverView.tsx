import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Camera,
  Upload,
  Info,
  RefreshCw,
  Send,
  Save,
  Check,
  X,
  FileText,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SendInviteDialog from "@/components/arcon/SendInviteDialog";
import { showSaveSuccessToast } from "@/lib/saveSuccessToast";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const ENABLE_BACKEND_RECEIVER = false;

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  country: string;
  idType: string;
  document?: File;
}

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
  };
  documentVerification: {
    enabled: boolean;
    allowUploadFromDevice: boolean;
    allowCaptureWebcam: boolean;
    supportedDocuments: string[];
  };
  biometricVerification: {
    enabled: boolean;
  };
}

export default function ReceiverView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId } = useParams();

  // Load template from database or state
  const [dbTemplate, setDbTemplate] = useState<any>(null);
  const [loadingTpl, setLoadingTpl] = useState(false);

  useEffect(() => {
    if (!ENABLE_BACKEND_RECEIVER) return;
    if (!templateId) return;
    const run = async () => {
      setLoadingTpl(true);
      try {
        const res = await fetch(`${API_BASE}/api/templates/${templateId}`);
        if (!res.ok) throw new Error(`Failed to fetch template`);
        const json = await res.json();
        setDbTemplate(json);
      } catch (e: any) {
        console.error("Failed to load template:", e);
      } finally {
        setLoadingTpl(false);
      }
    };
    run();
  }, [templateId]);

  // Get template configuration from location state or build from dbTemplate or use defaults
  const templateConfig: TemplateConfig = React.useMemo(() => {
    if (location.state?.templateConfig) {
      return location.state.templateConfig;
    }

    if (ENABLE_BACKEND_RECEIVER && dbTemplate) {
      const sectionStatus = dbTemplate.Section_status || {};
      const personalInfo = dbTemplate.Personal_info || {};
      const docVerification = dbTemplate.Doc_verification || {};
      const biometricVerification = dbTemplate.Biometric_verification || {};

      return {
        templateName: dbTemplate.nameOfTemplate || "New Template",
        personalInfo: {
          enabled: sectionStatus.persoanl_info !== false,
          fields: {
            firstName: personalInfo.firstName !== false,
            lastName: personalInfo.LastName !== false,
            email: personalInfo.Email !== false,
            dateOfBirth: !!personalInfo.Added_fields?.dob,
          },
        },
        documentVerification: {
          enabled:
            sectionStatus.doc_verification !== false &&
            !!docVerification.user_uploads,
          allowUploadFromDevice: !!docVerification.user_uploads?.Allow_uploads,
          allowCaptureWebcam: !!docVerification.user_uploads?.allow_capture,
          supportedDocuments: extractSupportedDocuments(docVerification),
        },
        biometricVerification: {
          enabled:
            sectionStatus.Biometric_verification !== false &&
            !!biometricVerification.number_of_retries,
        },
      };
    }

    // Build from localStorage (no backend)
    try {
      const hasDoc = JSON.parse(localStorage.getItem("arcon_has_document_verification") || "false");
      const hasBio = JSON.parse(localStorage.getItem("arcon_has_biometric_verification") || "false");
      const docRaw = localStorage.getItem("arcon_doc_verification_form");
      const bioRaw = localStorage.getItem("arcon_biometric_verification_form");
      const docCfg = docRaw ? JSON.parse(docRaw) : {};
      const bioCfg = bioRaw ? JSON.parse(bioRaw) : {};

      return {
        templateName: location.state?.templateData?.templateName || "New Template",
        personalInfo: {
          enabled: true,
          fields: { firstName: true, lastName: true, email: true, dateOfBirth: false },
        },
        documentVerification: {
          enabled: Boolean(hasDoc),
          allowUploadFromDevice: Boolean(docCfg.allowUploadFromDevice),
          allowCaptureWebcam: Boolean(docCfg.allowCaptureWebcam),
          supportedDocuments: Array.isArray(docCfg.selectedDocuments) ? docCfg.selectedDocuments : [
            "Passport",
            "Aadhar Card",
            "Drivers License",
            "Pan Card",
          ],
        },
        biometricVerification: {
          enabled: Boolean(hasBio),
        },
      };
    } catch {}

    // Default config
    return {
      templateName: "New Template",
      personalInfo: {
        enabled: true,
        fields: { firstName: true, lastName: true, email: true, dateOfBirth: false },
      },
      documentVerification: {
        enabled: false,
        allowUploadFromDevice: false,
        allowCaptureWebcam: false,
        supportedDocuments: [],
      },
      biometricVerification: { enabled: false },
    };
  }, [location.state, dbTemplate]);

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

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    country: "India",
    idType: "passport",
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

  const idOptions = [
    {
      value: "passport",
      label: "Passport",
      color: "#5A43D6",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 21.5C10.6975 21.5 9.46833 21.2503 8.3125 20.751C7.15667 20.2517 6.14867 19.5718 5.2885 18.7115C4.42817 17.8513 3.74833 16.8433 3.249 15.6875C2.74967 14.5317 2.5 13.3025 2.5 12C2.5 10.6872 2.74967 9.45542 3.249 8.30475C3.74833 7.15408 4.42817 6.14867 5.2885 5.2885C6.14867 4.42817 7.15667 3.74833 8.3125 3.249C9.46833 2.74967 10.6975 2.5 12 2.5C13.3128 2.5 14.5446 2.74967 15.6953 3.249C16.8459 3.74833 17.8513 4.42817 18.7115 5.2885C19.5718 6.14867 20.2517 7.15408 20.751 8.30475C21.2503 9.45542 21.5 10.6872 21.5 12C21.5 13.3025 21.2503 14.5317 20.751 15.6875C20.2517 16.8433 19.5718 17.8513 18.7115 18.7115C17.8513 19.5718 16.8459 20.2517 15.6953 20.751C14.5446 21.2503 13.3128 21.5 12 21.5Z"
            fill="white"
          />
        </svg>
      ),
    },
    {
      value: "aadhar",
      label: "Aadhar Card",
      color: "#00B499",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.25 17.6923C11.2653 17.6923 10.316 17.8509 9.402 18.1683C8.48783 18.4856 7.64225 18.9679 6.86525 19.6152C6.87808 19.7064 6.91342 19.7882 6.97125 19.8605C7.02892 19.933 7.093 19.9795 7.1635 20H17.327C17.3975 19.9795 17.4616 19.933 17.5193 19.8605C17.5769 19.7882 17.6122 19.7064 17.625 19.6152C16.8608 18.9679 16.0218 18.4856 15.1077 18.1683C14.1936 17.8509 13.241 17.6923 12.25 17.6923Z"
            fill="white"
          />
        </svg>
      ),
    },
    {
      value: "license",
      label: "Drivers License",
      color: "#ED5F00",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.80775 20.5C4.30258 20.5 3.875 20.325 3.525 19.975C3.175 19.625 3 19.1974 3 18.6923V5.30775C3 4.80258 3.175 4.375 3.525 4.025C3.875 3.675 4.30258 3.5 4.80775 3.5H20.1923C20.6974 3.5 21.125 3.675 21.475 4.025C21.825 4.375 22 4.80258 22 5.30775V18.6923C22 19.1974 21.825 19.625 21.475 19.975C21.125 20.325 20.6974 20.5 20.1923 20.5H4.80775Z"
            fill="white"
          />
        </svg>
      ),
    },
    {
      value: "pan",
      label: "Pan Card",
      color: "#9C2BAD",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.05775 19.5C4.55258 19.5 4.125 19.325 3.775 18.975C3.425 18.625 3.25 18.1974 3.25 17.6923V6.30775C3.25 5.80258 3.425 5.375 3.775 5.025C4.125 4.675 4.55258 4.5 5.05775 4.5H20.4423C20.9474 4.5 21.375 4.675 21.725 5.025C22.075 5.375 22.25 5.80258 22.25 6.30775V17.6923C22.25 18.1974 22.075 18.625 21.725 18.975C21.375 19.325 20.9474 19.5 20.4423 19.5H5.05775Z"
            fill="white"
          />
        </svg>
      ),
    },
  ].filter((option) =>
    templateConfig.documentVerification.supportedDocuments.includes(
      option.label,
    ),
  );

  // Build sections in order based on template configuration
  const buildSections = () => {
    const sections = [];

    // Get sections order from backend, or derive from localStorage builder steps, else default
    let sectionsOrder = dbTemplate?.sections_order;
    if (!sectionsOrder) {
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
    if (!sectionsOrder || !sectionsOrder.length) {
      sectionsOrder = [
        "Personal_info",
        "Doc_verification",
        "Biometric_verification",
      ];
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

    return (
      <div className="border border-[#DEDEDD] rounded bg-white">
        {/* Section Header */}
        <div className="px-2 py-4 bg-white">
          <div className="flex items-center gap-2 pb-1">
            <Minus
              className="w-[18px] h-[18px] text-[#323238]"
              strokeWidth={1.5}
            />
            <h2 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
              Personal Information
            </h2>
          </div>
          <div className="pl-7">
            <p className="text-[13px] text-[#172B4D] leading-5 font-roboto">
              Please provide your basic personal information to begin the
              identity verification process.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="px-[34px] py-5 border-t border-[#DEDEDD] bg-white">
          <div className="flex flex-col gap-6">
            {/* First Row - First Name & Last Name */}
            <div className="flex gap-6">
              {templateConfig.personalInfo.fields.firstName && (
                <div className="flex-1 flex flex-col">
                  <div className="pb-2">
                    <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                      First Name
                    </Label>
                  </div>
                  <div className="h-[38px] px-3 py-[15px] flex items-center border border-[#C3C6D4] rounded bg-white">
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter First Name"
                      className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-roboto placeholder:text-[#676879]"
                    />
                  </div>
                </div>
              )}

              {templateConfig.personalInfo.fields.lastName && (
                <div className="flex-1 flex flex-col">
                  <div className="pb-2">
                    <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                      Last Name
                    </Label>
                  </div>
                  <div className="h-[38px] px-3 py-[15px] flex items-center border border-[#C3C6D4] rounded bg-white">
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter Last Name"
                      className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-roboto placeholder:text-[#676879]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Second Row - Email & Date of Birth */}
            <div className="flex gap-6">
              {templateConfig.personalInfo.fields.email && (
                <div className="flex-1 flex flex-col">
                  <div className="pb-2">
                    <Label className="text-[13px] font-medium leading-[18px] font-roboto">
                      <span className="text-[#172B4D]">Email </span>
                      <span className="text-[#D83A52]">*</span>
                    </Label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-[38px] px-3 py-[15px] flex items-center justify-between border border-[#C3C6D4] rounded bg-white">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter Your Email Address"
                        className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 font-roboto placeholder:text-[#676879]"
                      />
                      <div className="h-7 px-3 py-[9px] flex items-center gap-1 rounded bg-white">
                        <Button
                          onClick={handleEmailVerify}
                          className="text-[12px] font-medium text-[#0073EA] p-0 h-auto bg-transparent hover:bg-transparent font-figtree"
                          variant="ghost"
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                    {!emailVerified && (
                      <div className="h-8 px-2 flex items-center gap-2 border border-[#DEDEDD] rounded bg-[#F1F2F4]">
                        <Info className="w-[18px] h-[18px] text-[#344563]" />
                        <span className="text-[12px] text-[#676879] leading-[22px] font-roboto">
                          Email verification is required to continue
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {templateConfig.personalInfo.fields.dateOfBirth && (
                <div className="w-[452px] flex flex-col">
                  <div className="pb-2">
                    <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px] font-roboto">
                      Date Of Birth
                    </Label>
                  </div>
                  <div className="h-[38px] px-3 py-[15px] flex items-center justify-between border border-[#C3C6D4] rounded bg-white">
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      placeholder="DD/MM/YYYY"
                      className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-roboto placeholder:text-[#676879]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentVerification = () => {
    if (!templateConfig.documentVerification.enabled) return null;

    return (
      <div className="border border-[#DEDEDD] rounded bg-white">
        {/* Section Header */}
        <div className="px-3 py-4 bg-white">
          <div className="flex items-center gap-2 pb-1">
            <Minus
              className="w-[18px] h-[18px] text-[#323238]"
              strokeWidth={1.5}
            />
            <h2 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
              Document Verification
            </h2>
          </div>
          <div className="pl-7">
            <p className="text-[13px] text-[#172B4D] leading-5 font-roboto">
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
                <div className="h-[38px] px-3 py-[15px] flex items-center justify-between flex-1 border border-[#C3C6D4] rounded bg-white">
                  <span className="text-[13px] text-[#676879] leading-5 font-roboto">
                    India
                  </span>
                  <svg
                    width="11"
                    height="10"
                    viewBox="0 0 11 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.5 3L5.5 7L9.5 3"
                      stroke="#344563"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="h-[38px] px-3 py-[15px] flex items-center justify-between flex-1 border border-[#C3C6D4] rounded bg-white">
                  <span className="text-[13px] text-[#676879] leading-5 font-roboto">
                    Select
                  </span>
                </div>
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
                      className="h-[156px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[#C3C6D4] rounded-t-lg cursor-pointer hover:border-[#0073EA] bg-white"
                      onClick={openCamera}
                    >
                      <div className="w-[52px] h-[52px] p-2 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                        <Camera
                          className="w-6 h-6 text-[#676879]"
                          strokeWidth={1.35}
                        />
                      </div>
                      <div className="text-center">
                        <h4 className="text-[13px] font-medium text-[#323238] leading-normal font-figtree mb-2">
                          Camera
                        </h4>
                        <p className="w-[257px] text-[13px] text-[#676879] leading-5 text-center font-roboto">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Mauris lobortis massa vitae
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Files Option */}
                {templateConfig.documentVerification.allowUploadFromDevice && (
                  <div className="flex-1 flex flex-col">
                    <div
                      className="h-[156px] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[#C3C6D4] rounded-t-lg cursor-pointer hover:border-[#0073EA] bg-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-[52px] h-[52px] p-2 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                        <Upload
                          className="w-6 h-6 text-[#676879]"
                          strokeWidth={1.41}
                        />
                      </div>
                      <div className="text-center">
                        <h4 className="text-[13px] font-medium text-[#323238] leading-normal font-figtree mb-2">
                          Upload Files
                        </h4>
                        <p className="w-[257px] text-[13px] text-[#676879] leading-5 text-center font-roboto">
                          Lorem ipsum dolor sit amet, consectetur adipiscing
                          elit. Mauris lobortis massa vitae
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
      <div className="border border-[#DEDEDD] rounded bg-white">
        {/* Section Header */}
        <div className="px-3 py-4 bg-white">
          <div className="flex items-center gap-2 pb-1">
            <Minus
              className="w-[18px] h-[18px] text-[#323238]"
              strokeWidth={1.5}
            />
            <h2 className="text-base font-bold text-[#172B4D] leading-3 font-roboto">
              Biometric Verification
            </h2>
          </div>
          <div className="pl-7">
            <p className="text-[13px] text-[#172B4D] leading-5 font-roboto">
              Take a live selfie to confirm you are the person in the ID
              document. Make sure you're in a well-lit area and your face is
              clearly visible.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-4 border-t border-[#DEDEDD] bg-white">
          <div className="w-[956px] p-2 flex items-center gap-6">
            {/* Camera Section */}
            <div className="h-[428px] flex flex-col flex-1">
              <div className="h-[380px] pt-4 flex flex-col items-center gap-2 border-t-2 border-r-2 border-l-2 border-dashed border-[#C3C6D4] rounded-t-lg bg-white">
                <div className="flex flex-col items-center justify-center gap-7 flex-1 border-2 border-dashed border-[#C3C6D4] rounded-lg bg-white">
                  <div className="flex flex-col items-center justify-center gap-2 flex-1 rounded-lg bg-white">
                    <div className="w-[412px] flex flex-col items-center gap-2">
                      <div className="w-[126px] h-[52px] relative">
                        <svg
                          width="33"
                          height="32"
                          viewBox="0 0 33 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute left-[49px] top-0"
                        >
                          <path
                            d="M16.4974 10.668V16.0013M16.4974 21.3346H16.5107M29.8307 16.0013C29.8307 23.365 23.8611 29.3346 16.4974 29.3346C9.1336 29.3346 3.16406 23.365 3.16406 16.0013C3.16406 8.6375 9.1336 2.66797 16.4974 2.66797C23.8611 2.66797 29.8307 8.6375 29.8307 16.0013Z"
                            stroke="#676879"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="absolute left-0 top-8 w-[126px] text-[13px] font-medium text-[#172B4D] text-center leading-5 font-roboto">
                          Camera not detected.
                        </span>
                      </div>
                      <p className="w-[284px] text-[13px] text-[#676879] text-center leading-5 font-roboto">
                        Please check your device or close other apps using the
                        camera.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[440px] h-12 px-4 py-2 flex items-end justify-end gap-2 rounded-b bg-[#F6F7FB]">
                <div className="h-8 px-3 py-[9px] flex items-center gap-1 rounded bg-[#0073EA]">
                  <RefreshCw
                    className="w-[18px] h-[18px] text-white transform -rotate-90"
                    strokeWidth={1.5}
                  />
                  <span className="text-[13px] font-medium text-white font-roboto">
                    Retry
                  </span>
                </div>
              </div>
            </div>

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
                        <div className="w-[214px] flex flex-col items-center gap-3">
                          <div className="w-[214px] flex flex-col">
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
              <div className="w-[440px] h-12 px-4 py-4 flex justify-end bg-[#F6F7FB] rounded-b">
                <div className="w-[135px] flex items-center justify-end gap-1">
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

  const sections = buildSections();

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
            <ChevronLeft className="w-4 h-4 text-[#676879]" strokeWidth={2} />
            <span className="text-[13px] font-medium text-[#505258] font-roboto">
              Previous
            </span>
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
        <div className="flex items-start w-full h-[1657px]">
          {/* Sidebar */}
          <div className="w-[332px] px-4 pr-2 py-4 flex flex-col gap-2 bg-white">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {/* Admin View Tab - Inactive */}
                <div
                  className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded opacity-50 cursor-pointer hover:bg-blue-50"
                  onClick={() =>
                    navigate(
                      templateId ? `/preview/${templateId}` : "/preview",
                      { state: location.state },
                    )
                  }
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

          {/* Resize Handle */}
          <div className="w-4 h-[1641px] flex flex-col items-center gap-2.5 bg-white">
            <div className="w-px flex-1 bg-[#DEDEDD]"></div>
          </div>

          {/* Main Content Area */}
          <div className="w-[987px] h-[1641px] p-6 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Render sections in the order specified by the admin */}
              {sections.map((section, index) => (
                <div key={section.id} className="w-full">
                  {section.component}
                </div>
              ))}

              {sections.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-8">
                  No sections enabled for this template.
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
