import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function SignUp() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [documentData, setDocumentData] = useState({
    allowUploadFromDevice: false,
    allowCaptureWebcam: false,
    documentHandling: "",
    selectedCountries: ["India"],
    selectedDocuments: [] as string[],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateForm()) return;
      setCurrentStep(2);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("http://localhost:5294/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          documentVerification: documentData,
        }),
      });

      if (response.ok) {
        navigate("/login", { replace: true });
      } else {
        let message = "Registration failed";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {}
        setErrors({ submit: message });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const toggleDocument = (docType: string) => {
    setDocumentData((prev) => ({
      ...prev,
      selectedDocuments: prev.selectedDocuments.includes(docType)
        ? prev.selectedDocuments.filter((d) => d !== docType)
        : [...prev.selectedDocuments, docType],
    }));
  };

  const documentTypes = [
    "Aadhar Card",
    "Pan Card",
    "Driving License",
    "Passport",
  ];

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Illustrations and Content (desktop only) */}
      <div className="relative hidden lg:block lg:w-1/2 bg-white overflow-hidden">
        {/* Background Blur Effects */}
        <div className="absolute inset-0">
          <div
            className="absolute w-[342px] h-[342px] rounded-full opacity-80"
            style={{
              background: "#BCD2E8",
              filter: "blur(115px)",
              left: "335px",
              top: "301px",
            }}
          />
          <div
            className="absolute w-[465px] h-[397px] rounded-full opacity-80"
            style={{
              background: "#E0EFFE",
              filter: "blur(80px)",
              left: "0px",
              top: "0px",
            }}
          />
        </div>

        {/* Decorative Elements */}
        <div className="relative z-10">
          <div
            className="absolute w-[279px] h-[123px] opacity-80"
            style={{
              left: "190px",
              top: "214px",
              transform: "rotate(-12.392deg)",
            }}
          >
            <div
              className="absolute w-full h-full rounded-full"
              style={{
                background: "linear-gradient(135deg, #F8E4E8 0%, #E0EFFE 100%)",
                filter: "blur(34px)",
              }}
            />
          </div>

          {/* Main illustration cards */}
          <div className="absolute" style={{ left: "275px", top: "140px" }}>
            <div
              className="absolute w-[252px] h-[318px] rounded-3xl border border-black/10"
              style={{
                background:
                  "linear-gradient(324deg, #E0EFFE 19.3%, #F3CFFF 70.5%)",
                backdropFilter: "blur(7.5px)",
                transform: "rotate(6.554deg)",
              }}
            />

            <div
              className="absolute w-[252px] h-[318px] rounded-3xl border border-black/10 bg-white"
              style={{
                left: "1px",
                top: "10px",
                backdropFilter: "blur(7.5px)",
              }}
            >
              <div className="absolute top-6 right-6">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path
                      d="M1 5L5 9L13 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute inset-4 top-16">
                <div className="w-full h-[130px] rounded-2xl bg-arcon-blue/20" />

                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 67 94" fill="none">
                      <path
                        d="M33.5 80.1898V93.5464L51.6857 70.2102L33.5 80.1898Z"
                        stroke="#91ACC8"
                        strokeWidth="1.8144"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M33.5 93.5464L52.3406 83.6172L51.6857 70.2102"
                        stroke="#91ACC8"
                        strokeWidth="1.8144"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="h-20 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20"></div>
                  <div className="absolute top-4 left-4">
                    <div className="w-8 h-8 rounded-full bg-white/30"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-2 bg-white/40 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-10 left-8 right-8 text-center z-20 lg:bottom-24 lg:left-20 lg:right-20">
          <h2 className="text-arcon-gray-heading text-2xl md:text-3xl font-bold font-roboto leading-tight mb-4 md:mb-6">
            Proof of identity, made simple.
          </h2>
          <p className="text-arcon-gray-secondary text-sm md:text-base font-roboto leading-relaxed">
            Easily verify your identity in seconds with our secure and seamless
            process.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 md:py-16 bg-white relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden hidden md:block pointer-events-none">
          <div
            className="absolute opacity-80"
            style={{
              width: "279px",
              height: "123px",
              right: "-50px",
              top: "214px",
              transform: "rotate(-12.392deg)",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #F8E4E8 50%, #E0EFFE 100%)",
                filter: "blur(20px)",
                opacity: 0.6,
              }}
            />
          </div>
        </div>

        <div className="relative z-10 max-w-[360px] md:max-w-[420px] mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path
                  d="M27.3723 22.6039C27.9964 23.7209 27.189 25.097 25.9095 25.097H4.88702C3.6005 25.097 2.79387 23.7073 3.43201 22.5902L14.0587 3.98729C14.7055 2.85516 16.3405 2.86285 16.9765 4.00102L27.3723 22.6039Z"
                  stroke="#D83A52"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
              <span className="text-arcon-gray-primary text-2xl font-bold font-roboto">
                arcon
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-arcon-gray-heading text-2xl md:text-3xl font-bold font-roboto mb-2">
              Sign up
            </h1>
            <p className="text-arcon-gray-secondary text-sm font-roboto mb-4">
              {currentStep === 1
                ? "Create your account with email and password."
                : "Set up document verification preferences."
              }
            </p>

            {/* Step Progress */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === 1
                    ? "border-arcon-blue bg-arcon-blue"
                    : "border-arcon-blue bg-arcon-blue"
                }`}>
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <span className="text-xs font-medium text-arcon-gray-primary">
                  Personal Info
                </span>
              </div>

              <div className="w-16 h-px bg-arcon-gray-border"></div>

              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep === 2
                    ? "border-arcon-blue bg-arcon-blue"
                    : "border-arcon-gray-border bg-white"
                }`}>
                  <span className={`font-bold text-sm ${
                    currentStep === 2 ? "text-white" : "text-arcon-gray-secondary"
                  }`}>2</span>
                </div>
                <span className={`text-xs font-medium ${
                  currentStep === 2 ? "text-arcon-gray-primary" : "text-arcon-gray-secondary"
                }`}>
                  Documents
                </span>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-5 sm:space-y-6 md:space-y-7">
            {currentStep === 1 ? (
              // Step 1: Personal Information
              <>
                <div>
                  <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                        errors.firstName
                          ? "border-red-500"
                          : "border-arcon-gray-border"
                      } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                        errors.lastName
                          ? "border-red-500"
                          : "border-arcon-gray-border"
                      } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                    />
                  </div>
                  {errors.lastName && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                        errors.email ? "border-red-500" : "border-arcon-gray-border"
                      } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                        errors.password
                          ? "border-red-500"
                          : "border-arcon-gray-border"
                      } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter your password"
                      className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-arcon-gray-border"
                      } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </>
            ) : (
              // Step 2: Document Verification
              <div className="space-y-6">
                {/* User Upload Options */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-arcon-gray-heading mb-2 font-roboto">
                      User Upload Options
                    </h4>
                    <p className="text-sm text-arcon-gray-secondary font-roboto">
                      Select how users are allowed to submit documents during the process.
                    </p>
                  </div>

                  <div className="bg-arcon-panel rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="upload-device"
                        checked={documentData.allowUploadFromDevice}
                        onCheckedChange={(checked) =>
                          setDocumentData((prev) => ({
                            ...prev,
                            allowUploadFromDevice: checked === true,
                          }))
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="upload-device"
                          className="text-sm font-medium text-arcon-gray-heading font-roboto block mb-1"
                        >
                          Allow Upload from Device
                        </Label>
                        <p className="text-sm text-arcon-gray-secondary font-roboto">
                          Let users upload existing documents directly from their device.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="capture-webcam"
                        checked={documentData.allowCaptureWebcam}
                        onCheckedChange={(checked) =>
                          setDocumentData((prev) => ({
                            ...prev,
                            allowCaptureWebcam: checked === true,
                          }))
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="capture-webcam"
                          className="text-sm font-medium text-arcon-gray-heading font-roboto block mb-1"
                        >
                          Allow Capture via Webcam
                        </Label>
                        <p className="text-sm text-arcon-gray-secondary font-roboto">
                          Enable webcam access to allow users to capture documents in real time.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Handling */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-arcon-gray-heading mb-2 font-roboto">
                      Unreadable Document Handling
                    </h4>
                    <p className="text-sm text-arcon-gray-secondary font-roboto">
                      Choose what action the system should take if a submitted document is not clear.
                    </p>
                  </div>

                  <div className="bg-arcon-panel rounded-lg p-4">
                    <RadioGroup
                      value={documentData.documentHandling}
                      onValueChange={(value) =>
                        setDocumentData((prev) => ({
                          ...prev,
                          documentHandling: value,
                        }))
                      }
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="reject" id="reject" className="mt-0.5" />
                          <div className="flex-1">
                            <Label
                              htmlFor="reject"
                              className="text-sm font-medium text-arcon-gray-heading font-roboto block mb-1"
                            >
                              Reject Immediately
                            </Label>
                            <p className="text-sm text-arcon-gray-secondary font-roboto">
                              Skip retry and reject unclear documents without further attempts.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="retry" id="retry" className="mt-0.5" />
                          <div className="flex-1">
                            <Label
                              htmlFor="retry"
                              className="text-sm font-medium text-arcon-gray-heading font-roboto block mb-1"
                            >
                              Allow Retries Before Rejection
                            </Label>
                            <p className="text-sm text-arcon-gray-secondary font-roboto">
                              Let users reattempt uploading the document before it's finally rejected.
                            </p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Supported Documents */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-arcon-gray-heading mb-2 font-roboto">
                      Supported Documents
                    </h4>
                    <p className="text-sm text-arcon-gray-secondary font-roboto">
                      Select which document types are accepted for verification.
                    </p>
                  </div>

                  <div className="bg-arcon-panel rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {documentTypes.map((docType) => (
                        <div key={docType} className="flex items-center gap-2">
                          <Checkbox
                            id={docType}
                            checked={documentData.selectedDocuments.includes(docType)}
                            onCheckedChange={() => toggleDocument(docType)}
                          />
                          <Label
                            htmlFor={docType}
                            className="text-sm font-medium text-arcon-gray-primary font-roboto cursor-pointer"
                          >
                            {docType}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="text-red-500 text-xs sm:text-sm text-center font-roboto">
                {errors.submit}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex-1 h-[48px] sm:h-[52px] border border-arcon-gray-border text-arcon-gray-primary font-bold text-sm sm:text-base rounded font-roboto hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:ring-offset-2 transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1 h-[48px] sm:h-[52px] bg-arcon-blue text-white font-bold text-sm sm:text-base rounded font-roboto hover:bg-arcon-blue/90 focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading
                  ? "Processing..."
                  : currentStep === 1
                    ? "Next"
                    : "Complete Sign Up"
                }
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-arcon-gray-secondary text-xs sm:text-sm font-roboto">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="text-arcon-blue hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
