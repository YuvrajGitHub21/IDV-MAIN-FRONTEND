import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Camera,
  Upload,
  Info,
  Check,
  X,
  RefreshCw,
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
import { Card, CardContent } from "@/components/ui/card";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  country: string;
  idType: string;
  document?: File;
  biometricData?: string;
}

export default function ReceiverView() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Load admin/preview configuration for Document Verification
  const [docConfig, setDocConfig] = useState<any>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("arcon_doc_verification_form");
      if (raw) setDocConfig(JSON.parse(raw));
    } catch {}
  }, []);

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

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!emailVerified) newErrors.email = "Email verification is required";
    if (!formData.idType) newErrors.idType = "Please select an ID type";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted:", formData);
    }
  };

  // ID types mapping and filtering based on admin selection/preview
  const allIdOptions: { value: string; label: string; iconBg: string }[] = [
    { value: "passport", label: "Passport", iconBg: "#5A43D6" },
    { value: "aadhar", label: "Aadhar Card", iconBg: "#00B499" },
    { value: "license", label: "Drivers License", iconBg: "#ED5F00" },
    { value: "pan", label: "Pan Card", iconBg: "#9C2BAD" },
  ];
  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    const list: string[] = docConfig?.selectedDocuments || [];
    const map: Record<string, string> = {
      Passport: "passport",
      "Aadhar Card": "aadhar",
      "Pan Card": "pan",
      "Driving License": "license",
      "Drivers License": "license",
    };
    for (const item of list) {
      const v = map[item];
      if (v) set.add(v);
    }
    return set;
  }, [docConfig]);
  const filteredIdOptions = selectedSet.size
    ? allIdOptions.filter((opt) => selectedSet.has(opt.value))
    : allIdOptions;

  // Upload methods based on admin selection/preview
  // Show both options by default if no admin config exists
  const allowUploadFromDevice = docConfig
    ? !!docConfig.allowUploadFromDevice
    : true;
  const allowCaptureWebcam = docConfig ? !!docConfig.allowCaptureWebcam : true;

  // Camera capture state for Document upload
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
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
    stopStream();
  };

  const retake = () => {
    setCapturedDataUrl(null);
    openCamera();
  };

  const useCaptured = async () => {
    if (!capturedDataUrl) return;
    const res = await fetch(capturedDataUrl);
    const blob = await res.blob();
    const file = new File([blob], "captured.jpg", {
      type: blob.type || "image/jpeg",
    });
    setFormData((prev) => ({ ...prev, document: file }));
    setShowCamera(false);
  };

  useEffect(() => {
    return () => stopStream();
  }, []);

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
            <span className="text-white text-xs font-medium leading-[10px]">
              OS
            </span>
          </div>
        </div>
      </header>

      {/* Sub Header */}
      <div className="border-b border-[#DEDEDD] bg-white">
        {/* Breadcrumbs */}
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
              <span className="text-xs text-[#505258] font-medium">
                Template
              </span>
            </div>
            <span className="text-xs text-[#505258] font-medium">/</span>
            <span className="text-xs text-[#505258] font-medium">
              Create New Template
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="h-12 px-4 py-2 flex items-center justify-between">
          <div className="flex items-start gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 p-2 flex items-center justify-center rounded-full bg-[#F1F2F4] hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#676879]" strokeWidth={2} />
            </button>
            <h1 className="text-xl font-bold text-[#172B4D] leading-[30px]">
              New Template
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="w-[332px] bg-white flex flex-col border-r border-[#DEDEDD]">
          <div className="p-4 flex flex-col gap-4">
            {/* Admin View Tab - Inactive (clickable link) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() =>
                navigate(
                  templateId ? `/preview/${templateId}` : "/preview",
                  { state: location.state as any }
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(
                    templateId ? `/preview/${templateId}` : "/preview",
                    { state: location.state as any }
                  );
                }
              }}
              className="w-full px-[26px] py-3 flex items-center gap-2.5 rounded opacity-50 cursor-pointer hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#292F4C]">Admin View</h3>
                <p className="text-[13px] text-[#505258] leading-[18px]">
                  This preview shows exactly what users will see.
                </p>
              </div>
            </div>

            {/* Receiver's View Tab - Active */}
            <div className="w-full px-[26px] py-3 flex items-center gap-2.5 rounded bg-[#E6F1FD]">
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#292F4C]">
                  Receiver's View
                </h3>
                <p className="text-[13px] text-[#505258] leading-[18px]">
                  Fill the form as the end user.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Personal Information Section */}
            <Card className="border border-[#DEDEDD]">
              <div className="p-4 bg-white border-b border-[#DEDEDD]">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9H12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#323238"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h2 className="text-base font-bold text-[#172B4D]">
                    Personal Information
                  </h2>
                </div>
                <p className="text-[13px] text-[#172B4D] ml-6">
                  Please provide your basic personal information to begin the
                  identity verification process.
                </p>
              </div>

              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-[13px] font-medium text-[#172B4D]"
                    >
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="Enter First Name"
                      className="h-[38px] border-[#C3C6D4] text-[13px]"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-[13px] font-medium text-[#172B4D]"
                    >
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Enter Last Name"
                      className="h-[38px] border-[#C3C6D4] text-[13px]"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[13px] font-medium text-[#172B4D]"
                    >
                      Email <span className="text-[#D83A52]">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter Your Email Address"
                        className="h-[38px] border-[#C3C6D4] text-[13px] pr-20"
                      />
                      <Button
                        type="button"
                        onClick={handleEmailVerify}
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1 h-[28px] text-[12px] text-[#0073EA] hover:bg-blue-50"
                      >
                        Verify
                      </Button>
                    </div>
                    {!emailVerified && (
                      <div className="flex items-center gap-2 p-2 bg-[#F1F2F4] border border-[#DEDEDD] rounded text-[12px] text-[#676879]">
                        <Info className="w-4 h-4" />
                        Email verification is required to continue
                      </div>
                    )}
                    {errors.email && (
                      <p className="text-red-500 text-xs">{errors.email}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-[13px] font-medium text-[#172B4D]"
                    >
                      Date Of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        handleInputChange("dateOfBirth", e.target.value)
                      }
                      className="h-[38px] border-[#C3C6D4] text-[13px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Verification Section */}
            <Card className="border border-[#DEDEDD]">
              <div className="p-4 bg-white border-b border-[#DEDEDD]">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9H12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#323238"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h2 className="text-base font-bold text-[#172B4D]">
                    Document Verification
                  </h2>
                </div>
                <p className="text-[13px] text-[#172B4D] ml-6">
                  Choose a valid government-issued ID (like a passport, driver's
                  license, or national ID) and upload a clear photo of it.
                </p>
              </div>

              <CardContent className="p-8 space-y-6">
                {/* Country Selection */}
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-[#172B4D]">
                    Country
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      value={formData.country}
                      onValueChange={(value) =>
                        handleInputChange("country", value)
                      }
                    >
                      <SelectTrigger className="h-[38px] border-[#C3C6D4] text-[13px]">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="UK">UK</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="h-[38px] border-[#C3C6D4] text-[13px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ID Type Selection - show only admin-selected or preview items */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#172B4D] mb-1">
                      Select the ID Type
                    </h3>
                    <p className="text-[13px] text-[#676879]">
                      Select the ID you'd like to use for verification.
                    </p>
                  </div>

                  <RadioGroup
                    value={formData.idType}
                    onValueChange={(value) =>
                      handleInputChange("idType", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {filteredIdOptions.map((opt) => (
                      <div key={opt.value} className="relative">
                        <RadioGroupItem
                          value={opt.value}
                          id={opt.value}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={opt.value}
                          className={`flex flex-col items-start gap-3 p-4 border rounded cursor-pointer transition-all ${
                            formData.idType === opt.value
                              ? "border-[#0073EA] bg-[#E6F1FD]"
                              : "border-[#C3C6D4] bg-white"
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ backgroundColor: opt.iconBg }}
                          >
                            <svg
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle cx="12" cy="12" r="10" fill="white" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-[#172B4D]">
                            {opt.label}
                          </span>
                        </Label>
                        {formData.idType === opt.value && (
                          <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full border-2 border-[#0073EA] bg-white flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#0073EA]"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                  {errors.idType && (
                    <p className="text-red-500 text-xs">{errors.idType}</p>
                  )}
                </div>

                {/* Upload Methods - only show those enabled by admin/preview */}
                {(allowCaptureWebcam || allowUploadFromDevice) && (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-[#172B4D]">
                      Choose a method to upload your document
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {allowCaptureWebcam && (
                        <button
                          type="button"
                          onClick={openCamera}
                          className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex flex-col items-center gap-4 hover:border-[#0073EA] transition-colors cursor-pointer"
                        >
                          <div className="w-[52px] h-[52px] rounded-full bg-[#F6F7FB] flex items-center justify-center">
                            <Camera className="w-6 h-6 text-[#676879]" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-[13px] font-medium text-[#323238] mb-2">
                              Camera
                            </h4>
                            <p className="text-[13px] text-[#676879]">
                              Use your device camera to capture the document.
                            </p>
                          </div>
                        </button>
                      )}

                      {allowUploadFromDevice && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex flex-col items-center gap-4 hover:border-[#0073EA] transition-colors cursor-pointer"
                        >
                          <div className="w-[52px] h-[52px] rounded-full bg-[#F6F7FB] flex items-center justify-center">
                            <Upload className="w-6 h-6 text-[#676879]" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-[13px] font-medium text-[#323238] mb-2">
                              Upload Files
                            </h4>
                            <p className="text-[13px] text-[#676879]">
                              Upload a photo or PDF of your document from this
                              device.
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            accept="image/*,.pdf"
                            className="hidden"
                          />
                        </button>
                      )}
                    </div>

                    {formData.document && (
                      <div className="text-[13px] text-[#172B4D]">
                        Selected file:{" "}
                        <span className="font-medium">
                          {formData.document.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Camera panel for capturing document */}
                {showCamera && (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-4 flex flex-col items-center gap-4 min-h-[320px] justify-center relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCamera(false);
                          stopStream();
                        }}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-100"
                        aria-label="Close camera"
                      >
                        <X className="w-5 h-5 text-[#676879]" />
                      </button>

                      {!capturedDataUrl && !cameraError && (
                        <video
                          ref={videoRef}
                          className="w-full max-w-md rounded bg-black"
                          playsInline
                          muted
                        />
                      )}
                      {capturedDataUrl && (
                        <img
                          src={capturedDataUrl}
                          alt="Captured"
                          className="w-full max-w-md rounded"
                        />
                      )}
                      {cameraError && (
                        <div className="text-center space-y-2">
                          <div className="w-8 h-8 rounded-full border-2 border-[#676879] flex items-center justify-center mx-auto">
                            <span className="text-[#676879]">!</span>
                          </div>
                          <h4 className="text-[13px] font-medium text-[#172B4D]">
                            {cameraError}
                          </h4>
                          <p className="text-[13px] text-[#676879]">
                            Please check your device or close other apps using
                            the camera.
                          </p>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                    <div className="bg-[#F6F7FB] rounded-b-lg p-2 flex justify-end gap-2">
                      {!capturedDataUrl && !cameraError && (
                        <Button
                          size="sm"
                          className="h-8 text-[13px] bg-[#0073EA] hover:bg-blue-700"
                          onClick={capturePhoto}
                        >
                          Capture
                        </Button>
                      )}
                      {capturedDataUrl && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[13px]"
                            onClick={retake}
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retake
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-[13px] bg-[#0073EA] hover:bg-blue-700"
                            onClick={useCaptured}
                          >
                            Use Photo
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code Section */}
                <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex items-center justify-center gap-8">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/71b92e12d4aa83fb25f12a5fcbfdd11a3f368505?width=220"
                    alt="QR Code"
                    className="w-[110px] h-[113px]"
                  />
                  <div className="text-center">
                    <p className="text-[13px] text-[#676879] mb-1">
                      Continue on another device by scanning the QR code or
                      opening
                    </p>
                    <a
                      href="#"
                      className="text-[13px] text-[#0073EA] hover:underline"
                    >
                      https://id.xyz/verify
                    </a>
                  </div>
                  <div className="flex items-center gap-1 text-[#0073EA] text-[12px]">
                    <Info className="w-5 h-5" />
                    <span>How does this work?</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biometric Verification Section */}
            <Card className="border border-[#DEDEDD]">
              <div className="p-4 bg-white border-b border-[#DEDEDD]">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9H12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z"
                      stroke="#323238"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h2 className="text-base font-bold text-[#172B4D]">
                    Biometric Verification
                  </h2>
                </div>
                <p className="text-[13px] text-[#172B4D] ml-6">
                  Take a live selfie to confirm you are the person in the ID
                  document. Make sure you're in a well-lit area and your face is
                  clearly visible.
                </p>
              </div>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Camera Section */}
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex flex-col items-center gap-4 min-h-[380px] justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-8 h-8 rounded-full border-2 border-[#676879] flex items-center justify-center mx-auto">
                          <span className="text-[#676879]">!</span>
                        </div>
                        <h4 className="text-[13px] font-medium text-[#172B4D]">
                          Camera not detected.
                        </h4>
                        <p className="text-[13px] text-[#676879]">
                          Please check your device or close other apps using the
                          camera.
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#F6F7FB] rounded-b-lg p-2 flex justify-end">
                      <Button
                        size="sm"
                        className="h-8 text-[13px] bg-[#0073EA] hover:bg-blue-700"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex flex-col items-center justify-center gap-8 min-h-[380px]">
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/d64a4aa6e5265da330b1a90aa5cad41733623a19?width=256"
                        alt="QR Code"
                        className="w-[128px] h-[132px]"
                      />
                      <div className="text-center">
                        <p className="text-[13px] text-[#676879] mb-1">
                          Continue on another device by scanning the QR code or
                          opening
                        </p>
                        <a
                          href="#"
                          className="text-[13px] text-[#0073EA] hover:underline"
                        >
                          https://id.xyz/verify
                        </a>
                      </div>
                    </div>
                    <div className="bg-[#F6F7FB] rounded-b-lg p-4 flex justify-end">
                      <div className="flex items-center gap-1 text-[#0073EA] text-[12px]">
                        <Info className="w-5 h-5" />
                        <span>How does this work?</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleSubmit}
                className="h-12 px-8 bg-[#0073EA] hover:bg-blue-700 text-white font-medium"
              >
                Submit Verification
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
