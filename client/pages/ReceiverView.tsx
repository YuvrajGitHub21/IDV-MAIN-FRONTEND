import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Camera, Upload, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleEmailVerify = () => {
    // Simulate email verification
    setEmailVerified(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, document: file }));
    }
  };

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!emailVerified) newErrors.email = "Email verification is required";
    if (!formData.idType) newErrors.idType = "Please select an ID type";
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted:", formData);
      // Handle form submission
    }
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
          <div className="w-8 h-8 rounded-full bg-[#F65F7C] flex items-center justify-center">
            <span className="text-white text-xs font-medium leading-[10px]">OS</span>
          </div>
        </div>
      </header>

      {/* Sub Header */}
      <div className="border-b border-[#DEDEDD] bg-white">
        {/* Breadcrumbs */}
        <div className="h-[38px] px-4 flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.33268 1.51562V4.26932C9.33268 4.64268 9.33268 4.82937 9.40535 4.97198C9.46928 5.09742 9.57122 5.1994 9.69668 5.26332C9.83928 5.33598 10.0259 5.33598 10.3993 5.33598H13.153M9.33268 11.3359H5.33268M10.666 8.66927H5.33268M13.3327 6.66142V11.4693C13.3327 12.5894 13.3327 13.1494 13.1147 13.5773C12.9229 13.9536 12.617 14.2595 12.2407 14.4513C11.8128 14.6693 11.2528 14.6693 10.1327 14.6693H5.86602C4.74591 14.6693 4.18586 14.6693 3.75804 14.4513C3.38171 14.2595 3.07575 13.9536 2.884 13.5773C2.66602 13.1494 2.66602 12.5894 2.66602 11.4693V4.53594C2.66602 3.41583 2.66602 2.85578 2.884 2.42796C3.07575 2.05163 3.38171 1.74567 3.75804 1.55392C4.18586 1.33594 4.74591 1.33594 5.86602 1.33594H8.00722C8.49635 1.33594 8.74095 1.33594 8.97115 1.3912C9.17522 1.44019 9.37028 1.521 9.54928 1.63066C9.75108 1.75434 9.92402 1.92729 10.2699 2.2732L12.3954 4.39868C12.7413 4.74458 12.9143 4.91754 13.0379 5.11937C13.1476 5.29831 13.2284 5.4934 13.2774 5.69747C13.3327 5.92765 13.3327 6.17224 13.3327 6.66142Z"
                  stroke="#515257"
                  strokeWidth="1.09091"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs text-[#505258] font-medium">Template</span>
            </div>
            <span className="text-xs text-[#505258] font-medium">/</span>
            <span className="text-xs text-[#505258] font-medium">Create New Template</span>
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
            <h1 className="text-xl font-bold text-[#172B4D] leading-[30px]">New Template</h1>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="h-[89px] px-4 py-3 border-b border-[#DEDEDD] bg-white">
        <div className="w-full px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-8">
            {/* Form Builder Step - Completed */}
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

            {/* Preview Step - Current */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="p-1.5 rounded-full border-2 border-[#0073EA]">
                <div className="w-8 h-8 rounded-full bg-[#0073EA] flex items-center justify-center">
                  <span className="text-white text-base font-bold leading-4">2</span>
                </div>
              </div>
              <span className="text-[13px] font-medium text-[#172B4D]">Preview</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="w-[332px] bg-white flex flex-col border-r border-[#DEDEDD]">
          <div className="p-4 flex flex-col gap-4">
            {/* Admin View Tab - Inactive */}
            <div className="w-full px-[26px] py-3 flex items-center gap-2.5 rounded opacity-50">
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#292F4C]">Admin View</h3>
                <p className="text-[13px] text-[#505258] leading-[18px]">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                </p>
              </div>
            </div>

            {/* Receiver's View Tab - Active */}
            <div className="w-full px-[26px] py-3 flex items-center gap-2.5 rounded bg-[#E6F1FD]">
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#292F4C]">Receiver's View</h3>
                <p className="text-[13px] text-[#505258] leading-[18px]">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry.
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
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9H12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" stroke="#323238" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-base font-bold text-[#172B4D]">Personal Information</h2>
                </div>
                <p className="text-[13px] text-[#172B4D] ml-6">
                  Please provide your basic personal information to begin the identity verification process.
                </p>
              </div>
              
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[13px] font-medium text-[#172B4D]">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Enter First Name"
                      className="h-[38px] border-[#C3C6D4] text-[13px]"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs">{errors.firstName}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[13px] font-medium text-[#172B4D]">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
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
                    <Label htmlFor="email" className="text-[13px] font-medium text-[#172B4D]">
                      Email <span className="text-[#D83A52]">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
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
                    <Label htmlFor="dateOfBirth" className="text-[13px] font-medium text-[#172B4D]">
                      Date Of Birth
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
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
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9H12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" stroke="#323238" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-base font-bold text-[#172B4D]">Document Verification</h2>
                </div>
                <p className="text-[13px] text-[#172B4D] ml-6">
                  Choose a valid government-issued ID (like a passport, driver's license, or national ID) and upload a clear photo of it.
                </p>
              </div>
              
              <CardContent className="p-8 space-y-6">
                {/* Country Selection */}
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium text-[#172B4D]">Country</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
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

                {/* ID Type Selection */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[#172B4D] mb-1">Select the ID Type</h3>
                    <p className="text-[13px] text-[#676879]">Select the ID you'd like to use for verification.</p>
                  </div>
                  
                  <RadioGroup 
                    value={formData.idType} 
                    onValueChange={(value) => handleInputChange("idType", value)}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem value="passport" id="passport" className="sr-only" />
                      <Label
                        htmlFor="passport"
                        className={`flex flex-col items-start gap-3 p-4 border rounded cursor-pointer transition-all ${
                          formData.idType === "passport" 
                            ? "border-[#0073EA] bg-[#E6F1FD]" 
                            : "border-[#C3C6D4] bg-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-[#5A43D6] flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 21.5C10.6975 21.5 9.46833 21.2503 8.3125 20.751C7.15667 20.2517 6.14867 19.5718 5.2885 18.7115C4.42817 17.8513 3.74833 16.8433 3.249 15.6875C2.74967 14.5317 2.5 13.3025 2.5 12C2.5 10.6872 2.74967 9.45542 3.249 8.30475C3.74833 7.15408 4.42817 6.14867 5.2885 5.2885C6.14867 4.42817 7.15667 3.74833 8.3125 3.249C9.46833 2.74967 10.6975 2.5 12 2.5C13.3128 2.5 14.5446 2.74967 15.6953 3.249C16.8459 3.74833 17.8513 4.42817 18.7115 5.2885C19.5718 6.14867 20.2517 7.15408 20.751 8.30475C21.2503 9.45542 21.5 10.6872 21.5 12C21.5 13.3025 21.2503 14.5317 20.751 15.6875C20.2517 16.8433 19.5718 17.8513 18.7115 18.7115C17.8513 19.5718 16.8459 20.2517 15.6953 20.751C14.5446 21.2503 13.3128 21.5 12 21.5Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[#172B4D]">Passport</span>
                      </Label>
                      {formData.idType === "passport" && (
                        <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full border-2 border-[#0073EA] bg-white flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[#0073EA]"></div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <RadioGroupItem value="aadhar" id="aadhar" className="sr-only" />
                      <Label
                        htmlFor="aadhar"
                        className={`flex flex-col items-start gap-3 p-4 border rounded cursor-pointer transition-all opacity-50 ${
                          formData.idType === "aadhar" 
                            ? "border-[#0073EA] bg-[#E6F1FD]" 
                            : "border-[#C3C6D4] bg-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-[#00B499] flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
                            <path d="M12 14C8.13401 14 5 17.134 5 21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21C19 17.134 15.866 14 12 14Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[#172B4D]">Aadhar Card</span>
                      </Label>
                    </div>

                    <div className="relative">
                      <RadioGroupItem value="license" id="license" className="sr-only" />
                      <Label
                        htmlFor="license"
                        className={`flex flex-col items-start gap-3 p-4 border rounded cursor-pointer transition-all opacity-50 ${
                          formData.idType === "license" 
                            ? "border-[#0073EA] bg-[#E6F1FD]" 
                            : "border-[#C3C6D4] bg-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-[#ED5F00] flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6H4C2.9 6 2 6.9 2 8V16C2 17.1 2.9 18 4 18H20C21.1 18 22 17.1 22 16V8C22 6.9 21.1 6 20 6ZM8 15C6.9 15 6 14.1 6 13C6 11.9 6.9 11 8 11C9.1 11 10 11.9 10 13C10 14.1 9.1 15 8 15ZM18 15H12V13H18V15ZM18 11H12V9H18V11Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[#172B4D]">Drivers License</span>
                      </Label>
                    </div>

                    <div className="relative">
                      <RadioGroupItem value="pan" id="pan" className="sr-only" />
                      <Label
                        htmlFor="pan"
                        className={`flex flex-col items-start gap-3 p-4 border rounded cursor-pointer transition-all opacity-50 ${
                          formData.idType === "pan" 
                            ? "border-[#0073EA] bg-[#E6F1FD]" 
                            : "border-[#C3C6D4] bg-white"
                        }`}
                      >
                        <div className="w-8 h-8 rounded bg-[#9C2BAD] flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM8.5 15C7.1 15 6 13.9 6 12.5S7.1 10 8.5 10S11 11.1 11 12.5S9.9 15 8.5 15ZM20 15H13V13H20V15ZM20 11H13V9H20V11Z" fill="white"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-[#172B4D]">Pan Card</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.idType && (
                    <p className="text-red-500 text-xs">{errors.idType}</p>
                  )}
                </div>

                {/* Upload Methods */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#172B4D]">Choose a method to upload your document</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Camera Option */}
                    <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex flex-col items-center gap-4 hover:border-[#0073EA] transition-colors cursor-pointer">
                      <div className="w-[52px] h-[52px] rounded-full bg-[#F6F7FB] flex items-center justify-center">
                        <Camera className="w-6 h-6 text-[#676879]" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-[13px] font-medium text-[#323238] mb-2">Camera</h4>
                        <p className="text-[13px] text-[#676879]">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lobortis massa vitae</p>
                      </div>
                    </div>

                    {/* Upload Files Option */}
                    <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex flex-col items-center gap-4 hover:border-[#0073EA] transition-colors cursor-pointer">
                      <div className="w-[52px] h-[52px] rounded-full bg-[#F6F7FB] flex items-center justify-center">
                        <Upload className="w-6 h-6 text-[#676879]" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-[13px] font-medium text-[#323238] mb-2">Upload Files</h4>
                        <p className="text-[13px] text-[#676879]">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris lobortis massa vitae</p>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        className="hidden"
                        id="file-upload"
                      />
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="border-2 border-dashed border-[#C3C6D4] rounded-lg p-8 flex items-center justify-center gap-8">
                    <img 
                      src="https://api.builder.io/api/v1/image/assets/TEMP/71b92e12d4aa83fb25f12a5fcbfdd11a3f368505?width=220" 
                      alt="QR Code" 
                      className="w-[110px] h-[113px]"
                    />
                    <div className="text-center">
                      <p className="text-[13px] text-[#676879] mb-1">
                        Continue on another device by scanning the QR code or opening
                      </p>
                      <a href="#" className="text-[13px] text-[#0073EA] hover:underline">
                        https://id.xyz/verify
                      </a>
                    </div>
                    <div className="flex items-center gap-1 text-[#0073EA] text-[12px]">
                      <Info className="w-5 h-5" />
                      <span>How does this work?</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biometric Verification Section */}
            <Card className="border border-[#DEDEDD]">
              <div className="p-4 bg-white border-b border-[#DEDEDD]">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9H12M16.5 9C16.5 13.1421 13.1421 16.5 9 16.5C4.85786 16.5 1.5 13.1421 1.5 9C1.5 4.85786 4.85786 1.5 9 1.5C13.1421 1.5 16.5 4.85786 16.5 9Z" stroke="#323238" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-base font-bold text-[#172B4D]">Biometric Verification</h2>
                </div>
                <p className="text-[13px] text-[#172B4D] ml-6">
                  Take a live selfie to confirm you are the person in the ID document. Make sure you're in a well-lit area and your face is clearly visible.
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
                        <h4 className="text-[13px] font-medium text-[#172B4D]">Camera not detected.</h4>
                        <p className="text-[13px] text-[#676879]">Please check your device or close other apps using the camera.</p>
                      </div>
                    </div>
                    <div className="bg-[#F6F7FB] rounded-b-lg p-2 flex justify-end">
                      <Button size="sm" className="h-8 text-[13px] bg-[#0073EA] hover:bg-blue-700">
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
                          Continue on another device by scanning the QR code or opening
                        </p>
                        <a href="#" className="text-[13px] text-[#0073EA] hover:underline">
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
