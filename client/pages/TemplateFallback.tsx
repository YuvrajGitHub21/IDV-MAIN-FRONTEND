import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, FileText, Settings, Users, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplateFallbackProps {
  mode: "admin" | "receiver";
  templateData?: {
    templateName?: string;
    verificationSteps?: Array<{ id: string; name: string; enabled: boolean }>;
    templateId?: string;
  };
}

const TemplateFallback: React.FC<TemplateFallbackProps> = ({ mode, templateData }) => {
  const navigate = useNavigate();
  const { templateId } = useParams();

  const handleBackToBuilder = () => {
    navigate("/template-builder" + (templateId ? `/${templateId}` : ""));
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleRetryPreview = () => {
    // Retry loading with current URL
    window.location.reload();
  };

  const getStepsInfo = () => {
    if (!templateData?.verificationSteps) {
      return {
        total: 0,
        enabled: 0,
        steps: []
      };
    }

    const enabled = templateData.verificationSteps.filter(step => step.enabled);
    return {
      total: templateData.verificationSteps.length,
      enabled: enabled.length,
      steps: enabled
    };
  };

  const stepsInfo = getStepsInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">
            {mode === "admin" ? "Template Configuration Missing" : "Template Data Unavailable"}
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {mode === "admin" 
              ? "The template configuration data could not be loaded from your local storage."
              : "The template data is not available for viewing at this time."
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Template Info if available */}
          {templateData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Template Name</h3>
                  <p className="text-sm text-gray-600">
                    {templateData.templateName || "Untitled Template"}
                  </p>
                </div>
                {templateId && (
                  <Badge variant="outline">ID: {templateId}</Badge>
                )}
              </div>

              {stepsInfo.total > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium">Verification Steps</h3>
                    <Badge variant="secondary">
                      {stepsInfo.enabled} of {stepsInfo.total} enabled
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {stepsInfo.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>{step.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-orange-600 mt-0.5">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-orange-800">
                  {mode === "admin" ? "Configuration Not Found" : "No Template Data"}
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  {mode === "admin" 
                    ? "This could happen if you navigated directly to this URL or if your session has expired. Please return to the template builder to configure your template."
                    : "The template configuration is not available. This could be due to an expired link or missing template data."
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {mode === "admin" ? (
              <>
                <Button 
                  onClick={handleBackToBuilder} 
                  className="flex-1"
                  variant="default"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back to Template Builder
                </Button>
                <Button 
                  onClick={handleBackToDashboard} 
                  variant="outline"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleRetryPreview} 
                  className="flex-1"
                  variant="default"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Retry Loading
                </Button>
                <Button 
                  onClick={handleBackToDashboard} 
                  variant="outline"
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Contact Administrator
                </Button>
              </>
            )}
          </div>

          {/* Developer Info */}
          {mode === "admin" && (
            <details className="mt-6">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono">
                <p><strong>Template ID:</strong> {templateId || "Not provided"}</p>
                <p><strong>Local Storage Keys:</strong></p>
                <ul className="ml-4 list-disc">
                  <li>arcon_verification_steps</li>
                  <li>arcon_doc_verification_form</li>
                  <li>arcon_biometric_verification_form</li>
                  {templateId && <li>arcon_tpl_state:{templateId}</li>}
                </ul>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateFallback;
