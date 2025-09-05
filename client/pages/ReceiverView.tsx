import React, { useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, Camera, Upload, Info, RefreshCw, Send, Save, Check, X } from "lucide-react";
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

  // Get template configuration from location state or build from templateData or use defaults
  const templateConfig: TemplateConfig = location.state?.templateConfig ||
    (location.state?.templateData ? {
      templateName: location.state.templateData.templateName || "New Template",
      personalInfo: {
        enabled: true,
        fields: {
          firstName: true,
          lastName: true,
          email: true,
          dateOfBirth: location.state.templateData.addedFields?.some((f: any) => f.id.includes("date")) || false,
        },
      },
      documentVerification: {
        enabled: location.state.templateData.verificationSteps?.some((s: any) => s.id === "document-verification") || false,
        allowUploadFromDevice: true,
        allowCaptureWebcam: true,
        supportedDocuments: ["Passport", "Aadhar Card", "Drivers License", "Pan Card"],
      },
      biometricVerification: {
        enabled: location.state.templateData.verificationSteps?.some((s: any) => s.id === "biometric-verification") || false,
      },
    } : {
      templateName: "New Template",
      personalInfo: {
        enabled: true,
        fields: {
          firstName: true,
          lastName: true,
          email: true,
          dateOfBirth: true,
        },
      },
      documentVerification: {
        enabled: true,
        allowUploadFromDevice: true,
        allowCaptureWebcam: true,
        supportedDocuments: ["Passport", "Aadhar Card", "Drivers License", "Pan Card"],
      },
      biometricVerification: {
        enabled: true,
      },
    });

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
    { value: "passport", label: "Passport", color: "#5A43D6" },
    { value: "aadhar", label: "Aadhar Card", color: "#00B499" },
    { value: "license", label: "Drivers License", color: "#ED5F00" },
    { value: "pan", label: "Pan Card", color: "#9C2BAD" },
  ].filter(option => 
    templateConfig.documentVerification.supportedDocuments.includes(option.label)
  );

  const renderPersonalInformation = () => {
    if (!templateConfig.personalInfo.enabled) return null;

    return (
      <div className="border border-[#DEDEDD] rounded bg-white">
        {/* Section Header */}
        <div className="px-2 py-4 bg-white border-b border-[#DEDEDD]">
          <div className="flex items-center gap-2 pb-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_5163_43897)">
                <path d="M6.00391 9H12.0039M16.5039 9C16.5039 13.1421 13.146 16.5 9.00391 16.5C4.86177 16.5 1.50391 13.1421 1.50391 9C1.50391 4.85786 4.86177 1.5 9.00391 1.5C13.146 1.5 16.5039 4.85786 16.5039 9Z" stroke="#323238" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h2 className="text-base font-bold text-[#172B4D] leading-3">Personal Information</h2>
          </div>
          <div className="pl-7">
            <p className="text-[13px] text-[#172B4D] leading-5">
              Please provide your basic personal information to begin the identity verification process.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="px-[34px] py-5">
          <div className="flex flex-col gap-6">
            {/* First Row - First Name & Last Name */}
            <div className="flex gap-6">
              {templateConfig.personalInfo.fields.firstName && (
                <div className="flex-1 flex flex-col">
                  <div className="pb-2">
                    <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px]">
                      First Name
                    </Label>
                  </div>
                  <div className="h-[38px] px-3 py-[15px] flex items-center justify-between border border-[#C3C6D4] rounded bg-white">
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter First Name"
                      className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              )}

              {templateConfig.personalInfo.fields.lastName && (
                <div className="flex-1 flex flex-col">
                  <div className="pb-2">
                    <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px]">
                      Last Name
                    </Label>
                  </div>
                  <div className="h-[38px] px-3 py-[15px] flex items-center justify-between border border-[#C3C6D4] rounded bg-white">
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Enter Last Name"
                      className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    <Label className="text-[13px] font-medium leading-[18px]">
                      <span className="text-[#172B4D]">Email </span>
                      <span className="text-[#D83A52]">*</span>
                    </Label>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="h-[38px] px-3 py-[15px] flex items-center justify-between border border-[#C3C6D4] rounded bg-white">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="Enter Your Email Address"
                        className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                      />
                      <div className="h-7 px-3 py-[9px] flex items-center gap-1 rounded bg-white">
                        <Button
                          onClick={handleEmailVerify}
                          className="text-[12px] font-medium text-[#0073EA] p-0 h-auto bg-transparent hover:bg-transparent"
                          variant="ghost"
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                    {!emailVerified && (
                      <div className="h-8 px-2 flex items-center gap-2 border border-[#DEDEDD] rounded bg-[#F1F2F4]">
                        <Info className="w-[18px] h-[18px] text-[#344563]" />
                        <span className="text-[12px] text-[#676879] leading-[22px]">
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
                    <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px]">
                      Date Of Birth
                    </Label>
                  </div>
                  <div className="h-[38px] px-3 py-[15px] flex items-center justify-between border border-[#C3C6D4] rounded bg-white">
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
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
        <div className="px-3 py-4 bg-white border-b border-[#DEDEDD]">
          <div className="flex items-center gap-2 pb-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_5163_43973)">
                <path d="M6.00195 9H12.002M16.502 9C16.502 13.1421 13.1441 16.5 9.00195 16.5C4.85982 16.5 1.50195 13.1421 1.50195 9C1.50195 4.85786 4.85982 1.5 9.00195 1.5C13.1441 1.5 16.502 4.85786 16.502 9Z" stroke="#323238" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h2 className="text-base font-bold text-[#172B4D] leading-3">Document Verification</h2>
          </div>
          <div className="pl-7">
            <p className="text-[13px] text-[#172B4D] leading-5">
              Choose a valid government-issued ID (like a passport, driver's license, or national ID) and upload a clear photo of it.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="px-[34px] py-5">
          <div className="flex flex-col gap-4">
            {/* Country Selection */}
            <div className="h-20 flex flex-col">
              <div className="pb-2">
                <Label className="text-[13px] font-medium text-[#172B4D] leading-[18px]">
                  Country
                </Label>
              </div>
              <div className="flex gap-6">
                <div className="h-[38px] px-3 py-[15px] flex items-center justify-between flex-1 border border-[#C3C6D4] rounded bg-white">
                  <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                    <SelectTrigger className="border-0 p-0 h-auto text-[13px] text-[#676879] bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                    </SelectContent>
                  </Select>
                  <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_5163_43987)">
                      <path d="M1.5 3L5.5 7L9.5 3" stroke="#344563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                  </svg>
                </div>
                <div className="h-[38px] px-3 py-[15px] flex items-center justify-between flex-1 border border-[#C3C6D4] rounded bg-white">
                  <span className="text-[13px] text-[#676879] leading-5">Select</span>
                </div>
              </div>
            </div>

            {/* ID Type Selection */}
            <div className="flex flex-col gap-4">
              <div className="pb-1 flex flex-col gap-1">
                <h3 className="text-base font-bold text-[#172B4D] leading-[26px]">Select the ID Type</h3>
                <p className="text-[13px] text-[#676879] leading-5">
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
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <Label
                        htmlFor={option.value}
                        className={`w-[211px] h-[94px] px-4 py-3 flex flex-col gap-3 border rounded cursor-pointer ${
                          formData.idType === option.value 
                            ? "border-[#0073EA] bg-[#E6F1FD]" 
                            : "border-[#C3C6D4] bg-white"
                        }`}
                      >
                        <div 
                          className="w-8 h-8 p-2 flex items-center justify-center rounded"
                          style={{ backgroundColor: option.color }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Icon content would be specific to each document type */}
                            <circle cx="12" cy="12" r="10" fill="white" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[#172B4D] leading-[22px]">
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
              <h3 className="text-base font-bold text-[#172B4D] leading-[26px]">
                Choose a method to upload your document
              </h3>

              <div className="flex gap-6">
                {templateConfig.documentVerification.allowCaptureWebcam && (
                  <div 
                    className="h-[156px] flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[#C3C6D4] rounded-lg cursor-pointer hover:border-[#0073EA]"
                    onClick={openCamera}
                  >
                    <div className="w-[52px] h-[52px] p-2 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                      <Camera className="w-6 h-6 text-[#676879]" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-[13px] font-medium text-[#323238] leading-normal">Camera</h4>
                      <p className="w-[257px] text-[13px] text-[#676879] leading-5 text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lobortis massa vitae
                      </p>
                    </div>
                  </div>
                )}

                {templateConfig.documentVerification.allowUploadFromDevice && (
                  <div 
                    className="h-[156px] flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[#C3C6D4] rounded-lg cursor-pointer hover:border-[#0073EA]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-[52px] h-[52px] p-2 flex items-center justify-center rounded-full bg-[#F6F7FB]">
                      <Upload className="w-6 h-6 text-[#676879]" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-[13px] font-medium text-[#323238] leading-normal">Upload Files</h4>
                      <p className="w-[257px] text-[13px] text-[#676879] leading-5 text-center">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lobortis massa vitae
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
                )}
              </div>

              {/* QR Code Section */}
              <div className="h-[156px] flex items-center gap-4 border-2 border-dashed border-[#C3C6D4] rounded-lg p-8">
                <div className="flex items-center justify-center gap-4 flex-1">
                  <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/71b92e12d4aa83fb25f12a5fcbfdd11a3f368505?width=220"
                    alt="QR Code"
                    className="w-[110px] h-[113px]"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-[214px] flex flex-col items-center gap-3">
                      <div className="w-[214px] flex flex-col">
                        <p className="text-[13px] text-center leading-5">
                          <span className="text-[#676879]">Continue on another device by scanning the QR code or opening</span>
                          <span className="text-[#0073EA]"> https://id.xyz/verify</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[#0073EA] text-[12px]">
                  <Info className="w-5 h-5" />
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
                      stream.getTracks().forEach(track => track.stop());
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
                    <video ref={videoRef} className="w-full rounded" playsInline muted />
                    <Button onClick={capturePhoto} className="w-full">
                      Capture Photo
                    </Button>
                  </>
                )}
                
                {capturedDataUrl && (
                  <>
                    <img src={capturedDataUrl} alt="Captured" className="w-full rounded" />
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
      </div>
    );
  };

  const renderBiometricVerification = () => {
    if (!templateConfig.biometricVerification.enabled) return null;

    return (
      <div className="border border-[#DEDEDD] rounded bg-white">
        {/* Section Header */}
        <div className="px-3 py-4 bg-white border-b border-[#DEDEDD]">
          <div className="flex items-center gap-2 pb-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_5163_44082)">
                <path d="M6.00195 9H12.002M16.502 9C16.502 13.1421 13.1441 16.5 9.00195 16.5C4.85982 16.5 1.50195 13.1421 1.50195 9C1.50195 4.85786 4.85982 1.5 9.00195 1.5C13.1441 1.5 16.502 4.85786 16.502 9Z" stroke="#323238" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
            <h2 className="text-base font-bold text-[#172B4D] leading-3">Biometric Verification</h2>
          </div>
          <div className="pl-7">
            <p className="text-[13px] text-[#172B4D] leading-5">
              Take a live selfie to confirm you are the person in the ID document. Make sure you're in a well-lit area and your face is clearly visible.
            </p>
          </div>
        </div>

        {/* Section Content */}
        <div className="p-4">
          <div className="w-[956px] p-2 flex items-center gap-6">
            {/* Camera Section */}
            <div className="h-[428px] flex flex-col flex-1">
              <div className="h-[380px] pt-4 flex flex-col items-center gap-2 border-t-2 border-r-2 border-l-2 border-dashed border-[#C3C6D4] rounded-t-lg bg-white">
                <div className="flex flex-col items-center justify-center gap-7 flex-1 border-2 border-dashed border-[#C3C6D4] rounded-lg bg-white">
                  <div className="flex flex-col items-center justify-center gap-2 flex-1 rounded-lg bg-white">
                    <div className="w-[412px] flex flex-col items-center gap-2">
                      <div className="w-[126px] h-[52px] relative">
                        <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-[49px] top-0">
                          <path d="M16.4974 10.668V16.0013M16.4974 21.3346H16.5107M29.8307 16.0013C29.8307 23.365 23.8611 29.3346 16.4974 29.3346C9.1336 29.3346 3.16406 23.365 3.16406 16.0013C3.16406 8.6375 9.1336 2.66797 16.4974 2.66797C23.8611 2.66797 29.8307 8.6375 29.8307 16.0013Z" stroke="#676879" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="absolute left-0 top-8 w-[126px] text-[13px] font-medium text-[#172B4D] text-center leading-5">
                          Camera not detected.
                        </span>
                      </div>
                      <p className="w-[284px] text-[13px] text-[#676879] text-center leading-5">
                        Please check your device or close other apps using the camera.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-[440px] h-8 px-4 py-2 flex items-end justify-end gap-2 rounded-b bg-[#F6F7FB]">
                <div className="h-8 px-3 py-[9px] flex items-center gap-1 rounded bg-[#0073EA]">
                  <RefreshCw className="w-[18px] h-[18px] text-white transform -rotate-90" />
                  <span className="text-[13px] font-medium text-white">Retry</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <svg width="13" height="96" viewBox="0 0 13 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex flex-col items-center justify-center gap-1">
              <path d="M6.5 34L6.5 -1.19209e-07" stroke="#D0D4E4"/>
              <text fill="#676879" xmlSpace="preserve" style={{whiteSpace: 'pre'}} fontFamily="Roboto" fontSize="13" letterSpacing="0em">
                <tspan x="0.590332" y="52.4434">or</tspan>
              </text>
              <path d="M6.5 96L6.5 62" stroke="#D0D4E4"/>
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
                            <p className="text-[13px] text-center leading-5">
                              <span className="text-[#676879]">Continue on another device by scanning the QR code or opening</span>
                              <span className="text-[#0073EA]"> https://id.xyz/verify</span>
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
                  <Info className="w-5 h-5 text-[#0073EA]" />
                  <span className="text-[12px] text-[#0073EA] leading-5">How does this work?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
          <div className="w-8 h-8 p-2 rounded-full bg-[#F65F7C] flex items-center justify-center">
            <span className="text-white text-xs font-medium leading-[10px]">OS</span>
          </div>
        </div>
      </header>

      {/* Sub Header */}
      <div className="w-full h-[86px] flex flex-col border-b border-[#DEDEDD] bg-white">
        {/* Breadcrumbs */}
        <div className="h-[38px] px-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.33268 1.51562V4.26932C9.33268 4.64268 9.33268 4.82937 9.40535 4.97198C9.46928 5.09742 9.57122 5.1994 9.69668 5.26332C9.83928 5.33598 10.0259 5.33598 10.3993 5.33598H13.153M9.33268 11.3359H5.33268M10.666 8.66927H5.33268M13.3327 6.66142V11.4693C13.3327 12.5894 13.3327 13.1494 13.1147 13.5773C12.9229 13.9536 12.617 14.2595 12.2407 14.4513C11.8128 14.6693 11.2528 14.6693 10.1327 14.6693H5.86602C4.74591 14.6693 4.18586 14.6693 3.75804 14.4513C3.38171 14.2595 3.07575 13.9536 2.884 13.5773C2.66602 13.1494 2.66602 12.5894 2.66602 11.4693V4.53594C2.66602 3.41583 2.66602 2.85578 2.884 2.42796C3.07575 2.05163 3.38171 1.74567 3.75804 1.55392C4.18586 1.33594 4.74591 1.33594 5.86602 1.33594H8.00722C8.49635 1.33594 8.74095 1.33594 8.97115 1.3912C9.17522 1.44019 9.37028 1.521 9.54928 1.63066C9.75108 1.75434 9.92402 1.92729 10.2699 2.2732L12.3954 4.39868C12.7413 4.74458 12.9143 4.91754 13.0379 5.11937C13.1476 5.29831 13.2284 5.4934 13.2774 5.69747C13.3327 5.92765 13.3327 6.17224 13.3327 6.66142Z" stroke="#515257" strokeWidth="1.09091" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs text-[#505258] font-medium leading-3">Template</span>
            </div>
            <div className="flex h-8 items-center gap-2">
              <span className="text-xs text-[#505258] font-medium leading-3">/</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#505258] font-medium leading-3">Create New Template</span>
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
            <h1 className="text-xl font-bold text-[#172B4D] leading-[30px]">
              {templateConfig.templateName}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSendInviteDialog(true)}
              className="h-8 px-2 py-[9px] flex items-center gap-1 rounded border border-[#0073EA] bg-white hover:bg-blue-50"
            >
              <Send className="w-4 h-4 text-[#0073EA]" strokeWidth={1.33} />
              <span className="text-[13px] font-medium text-[#0073EA]">Save & Send Invite</span>
            </button>
            <button
              onClick={() => {
                showSaveSuccessToast(templateConfig.templateName);
                navigate("/dashboard");
              }}
              className="h-8 px-[6px] py-[9px] flex items-center gap-1 rounded border border-[#0073EA] bg-[#0073EA] hover:bg-blue-700"
            >
              <Save className="w-4 h-4 text-white" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-white">Save</span>
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
            <span className="text-[13px] font-medium text-[#505258]">Previous</span>
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
              <span className="text-[13px] font-medium text-[#172B4D]">Form builder</span>
            </div>

            {/* Connection Line */}
            <div className="w-[120px] h-px bg-[#DEDEDD]"></div>

            {/* Preview - Current */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-1.5 rounded-full border-2 border-[#0073EA]">
                <div className="w-8 h-8 rounded-full bg-[#0073EA] flex items-center justify-center">
                  <span className="text-white text-base font-bold leading-4">2</span>
                </div>
              </div>
              <span className="text-[13px] font-medium text-[#172B4D]">Preview</span>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-medium text-[#505258]">Next</span>
            <div className="w-3.5 h-3.5"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full h-[1673px] pb-4 flex flex-col items-center">
        <div className="flex items-start w-full">
          {/* Sidebar */}
          <div className="w-[332px] px-4 pr-2 py-4 flex flex-col gap-2 bg-white">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                {/* Admin View Tab - Inactive */}
                <div 
                  className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded opacity-50 cursor-pointer hover:bg-blue-50"
                  onClick={() => navigate(templateId ? `/preview/${templateId}` : "/preview", { state: location.state })}
                >
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="w-[248px] text-sm font-bold text-[#292F4C] leading-[13px]">Admin View</h3>
                    <p className="flex-1 text-[13px] text-[#505258] leading-[18px]">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                    </p>
                  </div>
                </div>

                {/* Receiver's View Tab - Active */}
                <div className="w-[308px] px-[26px] py-3 flex items-center gap-2.5 rounded bg-[#E6F1FD]">
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="w-[248px] text-sm font-bold text-[#292F4C] leading-[13px]">Receiver's View</h3>
                    <p className="flex-1 text-[13px] text-[#505258] leading-[18px]">
                      Lorem Ipsum is simply dummy text of the printing and typesetting industry.
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
              {/* Render enabled sections based on admin configuration */}
              {renderPersonalInformation()}
              {renderDocumentVerification()}
              {renderBiometricVerification()}
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
