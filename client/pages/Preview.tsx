import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ChevronLeft, Send, Save, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function Preview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId } = useParams();
  const [activeView, setActiveView] = useState<"admin" | "receiver">("admin");

  // Get template data from location state or localStorage
  const templateData = location.state?.templateData || {};
  const templateName = location.state?.templateName || "New Template";

  const handleBack = () => {
    navigate("/template-builder");
  };

  const handleSaveAndSendInvite = () => {
    console.log("Save and send invite");
    // TODO: Implement save and send invite functionality
  };

  const handleSave = () => {
    console.log("Save template");
    // TODO: Implement save functionality
  };

  const handlePrevious = () => {
    navigate("/template-builder");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="h-11 px-4 flex items-center justify-between border-b border-gray-200 bg-white">
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
      <div className="border-b border-gray-200 bg-white">
        {/* Breadcrumbs */}
        <div className="h-10 px-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-500">Template</span>
          <span className="text-xs text-gray-500">/</span>
          <span className="text-xs text-gray-500">Create New Template</span>
        </div>

        {/* Title Section */}
        <div className="h-12 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-7 h-7 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">{templateName}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveAndSendInvite}
              className="h-8 px-2 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <Send className="w-4 h-4 mr-1" />
              Save & Send Invite
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 px-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="h-22 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {/* Form Builder Step - Completed */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-full border-2 border-green-600 p-1.5">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                  <Check className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
              <span className="text-xs font-medium text-gray-900">
                Form builder
              </span>
            </div>

            {/* Connection Line */}
            <div className="w-30 h-px bg-gray-200"></div>

            {/* Preview Step - Current */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-full border-2 border-blue-600 p-1.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-base font-bold">2</span>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-900">Preview</span>
            </div>
          </div>

          <div className="text-gray-500 text-xs">Next</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="w-83 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 space-y-2">
            {/* Admin View Tab */}
            <div
              className={`p-3 rounded cursor-pointer transition-colors ${
                activeView === "admin"
                  ? "bg-blue-50 border-l-4 border-l-blue-600"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setActiveView("admin")}
            >
              <h3 className="font-bold text-sm text-gray-900">Admin View</h3>
              <p className="text-xs text-gray-500 mt-1">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>

            {/* Receiver's View Tab */}
            <div
              className={`p-3 rounded cursor-pointer transition-colors opacity-50 ${
                activeView === "receiver"
                  ? "bg-blue-50 border-l-4 border-l-blue-600"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setActiveView("receiver")}
            >
              <h3 className="font-bold text-sm text-gray-900">
                Receiver's View
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry.
              </p>
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div className="w-4 bg-white border-r border-gray-200 flex items-center justify-center cursor-col-resize">
          <div className="w-px h-full bg-gray-200"></div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 bg-white overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Personal Information Section */}
            <Card className="border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4.5 h-4.5 rounded-full border border-gray-800 flex items-center justify-center">
                    <div className="w-2 h-px bg-gray-800"></div>
                  </div>
                  <h2 className="text-base font-bold text-gray-900">
                    Personal Information
                  </h2>
                </div>
                <p className="text-xs text-gray-900 ml-6">
                  Please provide your basic personal information to begin the
                  identity verification process.
                </p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-xs font-medium text-gray-900"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Input"
                        className="h-10 text-xs border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-xs font-medium text-gray-900"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Input"
                        className="h-10 text-xs border-gray-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-xs font-medium text-gray-900"
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        placeholder="Input"
                        className="h-10 text-xs border-gray-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="dob"
                        className="text-xs font-medium text-gray-900"
                      >
                        Date Of Birth
                      </Label>
                      <Input
                        id="dob"
                        placeholder="DD/MM/YYYY"
                        className="h-10 text-xs border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Verification Section */}
            <Card className="border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  Document Verification
                </h2>
                <p className="text-xs text-gray-900">
                  Choose a valid government-issued ID (like a passport, driver's
                  license, or national ID) and upload a clear photo of it.
                </p>
              </div>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* User Upload Options */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      User Upload Options
                    </h3>
                    <p className="text-xs text-gray-900 mb-4">
                      Select how users are allowed to submit documents during
                      the process.
                    </p>
                    <div className="bg-gray-50 rounded p-6 space-y-5">
                      <div className="flex items-start gap-2 pb-5 border-b border-gray-200">
                        <div className="w-4.5 h-4.5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900 mb-1">
                            Allow Upload from Device
                          </h4>
                          <p className="text-xs text-gray-500">
                            Let users upload existing documents directly from
                            their device.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-4.5 h-4.5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900 mb-1">
                            Allow Capture via Webcam
                          </h4>
                          <p className="text-xs text-gray-500">
                            Enable webcam access to allow users to capture
                            documents in real time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unreadable Document Handling */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      Unreadable Document Handling
                    </h3>
                    <p className="text-xs text-gray-900 mb-4">
                      Choose what action the system should take if a submitted
                      document is not clear or unreadable.
                    </p>
                    <div className="bg-gray-50 rounded p-6">
                      <div className="flex items-start gap-2">
                        <div className="w-4.5 h-4.5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900 mb-1">
                            Allow Retries Before Rejection
                          </h4>
                          <p className="text-xs text-gray-500">
                            Let users reattempt uploading the document before
                            it's finally rejected.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Supported Countries */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      Supported Countries for Identity Verification
                    </h3>
                    <p className="text-xs text-gray-900 mb-4">
                      Only document from these countries are supported.
                    </p>
                    <div className="bg-gray-50 rounded p-6">
                      <div className="mb-2">
                        <Label className="text-xs font-medium text-gray-900">
                          Which countries are supported?
                        </Label>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="h-10 flex items-center">
                          <span className="text-sm font-medium text-black">
                            India
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg">
                          <Badge
                            variant="secondary"
                            className="h-8 rounded-full border border-gray-300 bg-gray-50"
                          >
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mr-2">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            Aadhar Card
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="h-8 rounded-full border border-gray-300 bg-gray-50"
                          >
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mr-2">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            Driving License
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="h-8 rounded-full border border-gray-300 bg-gray-50"
                          >
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mr-2">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            Pan Card
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="h-8 rounded-full border border-gray-300 bg-gray-50"
                          >
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mr-2">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            Passport
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biometric Verification Section */}
            <Card className="border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  Biometric Verification
                </h2>
                <p className="text-xs text-gray-900">
                  Take a live selfie to confirm you are the person in the ID
                  document. Make sure you're in a well-lit area and your face is
                  clearly visible.
                </p>
              </div>
              <CardContent className="p-4">
                <div className="space-y-6">
                  {/* Retry Attempts */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      Retry Attempts for Selfie Capture
                    </h3>
                    <p className="text-xs text-gray-900 mb-4">
                      Define how many times a user can retry if the selfie
                      capture fails.
                    </p>
                    <div className="bg-gray-50 rounded p-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-900">
                          Set the maximum number of retries
                        </Label>
                        <div className="w-80">
                          <Input
                            value="4"
                            className="h-8 text-xs border-gray-300 bg-gray-50"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Liveness Confidence Threshold */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      Liveness Confidence Threshold (%)
                    </h3>
                    <p className="text-xs text-gray-900 mb-4">
                      Choose what should happen if a user's liveness score does
                      not meet the required threshold.
                    </p>
                    <div className="bg-gray-50 rounded p-6">
                      <div className="flex items-start gap-2">
                        <div className="w-4.5 h-4.5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xs font-medium text-gray-900 mb-1">
                            Ask the user to try again
                          </h4>
                          <p className="text-xs text-gray-500">
                            Prompt the user to reattempt the selfie.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Biometric Data Retention */}
                  <div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">
                      Biometric Data Retention
                    </h3>
                    <p className="text-xs text-gray-900 mb-4">
                      Choose whether to store biometric/selfie data and define
                      retention duration.
                    </p>
                    <div className="bg-gray-50 rounded p-6">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-gray-900">
                          Enable biometric data storage
                        </Label>
                        <div className="w-80">
                          <Input
                            value="6 Months"
                            className="h-8 text-xs border-gray-300"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
