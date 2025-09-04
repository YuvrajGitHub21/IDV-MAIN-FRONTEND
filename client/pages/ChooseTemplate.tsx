import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export default function ChooseTemplate() {
  const navigate = useNavigate();

  const handleUseTemplate = (templateType: "standard" | "secure") => {
    // Navigate to template builder with the selected template type
    navigate("/template-builder", { state: { templateType } });
  };

  const handleCreateOwn = () => {
    // Navigate to template builder for custom template creation
    navigate("/template-builder", { state: { templateType: "custom" } });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="h-11 px-4 flex justify-between items-center border-b border-[#DEDEDD] bg-white">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/4566b1e4f2b69299156b1f1c61472e06e0ad9666?width=180"
          alt="Arcon Logo"
          className="h-7 w-auto"
        />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F65F7C] flex items-center justify-center">
            <span className="text-white text-xs font-medium">OS</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Sub Header */}
        <div className="border-b border-[#DEDEDD]">
          {/* Breadcrumbs */}
          <div className="h-[38px] px-4 flex items-center gap-2">
            <div className="flex items-center gap-1">
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
              <span className="text-xs font-medium text-[#505258] font-roboto">
                Template
              </span>
            </div>
            <span className="text-xs font-medium text-[#505258] font-roboto">
              /
            </span>
            <span className="text-xs font-medium text-[#505258] font-roboto">
              Create New Template
            </span>
          </div>

          {/* Heading */}
          <div className="h-[42px] px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="w-7 h-7 rounded-full bg-[#F1F2F4] flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-[#676879]" />
              </button>
              <h1 className="text-xl font-bold text-[#172B4D] font-roboto">
                New Template
              </h1>
            </div>
          </div>
        </div>

        {/* Template Cards */}
        <div className="p-4 flex gap-6">
          {/* Standard Template */}
          <div className="flex-1 border border-[#DEDEDD] rounded bg-white">
            <div className="p-4 pt-4">
              <div className="h-[66px] flex items-center mb-2">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M30 15V10.2C30 7.67976 30 6.41964 29.5095 5.45705C29.0781 4.61031 28.3897 3.9219 27.543 3.49047C26.5803 3 25.3203 3 22.8 3H13.2C10.6798 3 9.41964 3 8.45705 3.49047C7.61031 3.9219 6.9219 4.61031 6.49047 5.45705C6 6.41964 6 7.67976 6 10.2V25.8C6 28.3203 6 29.5803 6.49047 30.543C6.9219 31.3897 7.61031 32.0781 8.45705 32.5095C9.41964 33 10.6798 33 13.2 33H18.75M27 31.5C27 31.5 31.5 29.3551 31.5 26.1378V22.3844L28.2186 21.2118C27.4302 20.9294 26.568 20.9294 25.7796 21.2118L22.5 22.3844V26.1378C22.5 29.3551 27 31.5 27 31.5Z"
                    stroke="#0073EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#172B4D] font-roboto mb-2">
                Standard
              </h3>
              <p className="text-[13px] text-[#505258] font-roboto leading-[18px] mb-4">
                Upload ID and take a selfie. System matches the selfie with the
                ID photo.
              </p>
            </div>
            <div className="border-t border-[#DEDEDD] p-3 flex justify-end gap-2">
              <button className="h-8 px-4 border border-[#0073EA] bg-white text-[#0073EA] text-[13px] font-medium font-roboto rounded hover:bg-blue-50 transition-colors">
                Preview
              </button>
              <button
                onClick={() => handleUseTemplate("standard")}
                className="h-8 px-4 bg-[#0073EA] text-white text-[13px] font-medium font-roboto rounded hover:bg-[#0060B9] transition-colors"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Secure Template */}
          <div className="flex-1 border border-[#DEDEDD] rounded bg-white">
            <div className="p-4 pt-4">
              <div className="h-[66px] flex items-center mb-2">
                <svg
                  width="37"
                  height="36"
                  viewBox="0 0 37 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M26.1665 15V12C26.1665 7.85787 22.8086 4.5 18.6665 4.5C14.5244 4.5 11.1665 7.85787 11.1665 12V15M18.6665 21.75V24.75M13.8665 31.5H23.4665C25.9868 31.5 27.2468 31.5 28.2095 31.0095C29.0563 30.5781 29.7446 29.8897 30.176 29.043C30.6665 28.0803 30.6665 26.8203 30.6665 24.3V22.2C30.6665 19.6797 30.6665 18.4197 30.176 17.457C29.7446 16.6102 29.0563 15.9219 28.2095 15.4905C27.2468 15 25.9868 15 23.4665 15H13.8665C11.3463 15 10.0861 15 9.12355 15.4905C8.27681 15.9219 7.5884 16.6102 7.15697 17.457C6.6665 18.4197 6.6665 19.6797 6.6665 22.2V24.3C6.6665 26.8203 6.6665 28.0803 7.15697 29.043C7.5884 29.8897 8.27681 30.5781 9.12355 31.0095C10.0861 31.5 11.3463 31.5 13.8665 31.5Z"
                    stroke="#0073EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="text-[15px] font-bold text-[#172B4D] font-roboto mb-2">
                Secure
              </h3>
              <p className="text-[13px] text-[#505258] font-roboto leading-[18px] mb-4">
                Upload ID and take a selfie. System matches the selfie with the
                ID photo.
              </p>
            </div>
            <div className="border-t border-[#DEDEDD] p-3 flex justify-end gap-2">
              <button className="h-8 px-4 border border-[#0073EA] bg-white text-[#0073EA] text-[13px] font-medium font-roboto rounded hover:bg-blue-50 transition-colors">
                Preview
              </button>
              <button
                onClick={() => handleUseTemplate("secure")}
                className="h-8 px-4 bg-[#0073EA] text-white text-[13px] font-medium font-roboto rounded hover:bg-[#0060B9] transition-colors"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Create Your Own Template */}
          <div className="flex-1 border border-[#DEDEDD] rounded bg-white">
            <div className="p-4 pt-4">
              <div className="h-[66px] flex items-center mb-2"></div>
              <h3 className="text-[15px] font-bold text-[#172B4D] font-roboto mb-2">
                Create your own template
              </h3>
              <p className="text-[13px] text-[#505258] font-roboto leading-[18px] mb-4">
                Personalize and create your own template
              </p>
            </div>
            <div className="border-t border-[#DEDEDD] p-3 flex justify-end">
              <button
                onClick={handleCreateOwn}
                className="h-8 px-3 bg-[#0073EA] text-white text-[13px] font-medium font-roboto rounded hover:bg-[#0060B9] transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
