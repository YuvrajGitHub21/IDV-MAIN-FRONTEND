import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { 
  FileText, 
  Settings, 
  Users, 
  Eye, 
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface TemplateDebugProps {
  mode: "admin" | "receiver";
}

const TemplateDebug: React.FC<TemplateDebugProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const location = useLocation();

  // Check localStorage data
  const checkLocalStorageData = () => {
    const keys = [
      "arcon_verification_steps",
      "arcon_doc_verification_form", 
      "arcon_biometric_verification_form",
      "arcon_has_document_verification",
      "arcon_has_biometric_verification",
      "arcon_current_template_id"
    ];

    if (templateId) {
      keys.push(`arcon_tpl_state:${templateId}`);
    }

    return keys.map(key => {
      const value = localStorage.getItem(key);
      return {
        key,
        exists: !!value,
        value: value ? (value.length > 100 ? `${value.substring(0, 100)}...` : value) : null,
        parsed: value ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        })() : null
      };
    });
  };

  const localStorageData = checkLocalStorageData();
  const hasAnyLocalStorage = localStorageData.some(item => item.exists);
  const navigationState = location.state;

  const handleReturnToBuilder = () => {
    navigate(templateId ? `/template-builder/${templateId}` : "/template-builder");
  };

  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Template Configuration Debug
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === "admin" 
                ? "Detailed information about template configuration data"
                : "Template data inspection for receiver view"
              }
            </p>
          </div>
        </div>

        {/* Current State Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Status:</strong> {hasAnyLocalStorage || navigationState 
              ? "Some data is available but may be incomplete"
              : "No template configuration data found"
            }
          </AlertDescription>
        </Alert>

        {/* Template Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Template Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Template ID</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {templateId || "Not provided"}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Current Route</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {location.pathname}
                </div>
              </div>
            </div>
            
            {navigationState && (
              <div>
                <label className="text-sm font-medium text-gray-700">Navigation State</label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm max-h-32 overflow-y-auto">
                  <pre className="text-xs">{JSON.stringify(navigationState, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Local Storage Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Local Storage Data
              <Badge variant={hasAnyLocalStorage ? "default" : "secondary"}>
                {localStorageData.filter(item => item.exists).length} of {localStorageData.length} keys found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {localStorageData.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1">
                    {item.exists ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.key}
                      </code>
                      <Badge variant={item.exists ? "default" : "outline"} className="text-xs">
                        {item.exists ? "Found" : "Missing"}
                      </Badge>
                    </div>
                    {item.exists && item.value && (
                      <div className="mt-1 text-xs text-gray-600">
                        <div className="p-2 bg-gray-50 rounded max-h-20 overflow-y-auto">
                          {typeof item.parsed === 'object' ? (
                            <pre>{JSON.stringify(item.parsed, null, 2)}</pre>
                          ) : (
                            <span>{item.value}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {!hasAnyLocalStorage && !navigationState && (
                <Alert>
                  <AlertDescription>
                    <strong>No data found:</strong> This usually means you navigated directly to this URL. 
                    Please return to the template builder to configure your template properly.
                  </AlertDescription>
                </Alert>
              )}
              
              {mode === "admin" && (
                <div className="space-y-2">
                  <p><strong>For Admin Users:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Return to Template Builder to configure your template</li>
                    <li>Ensure you complete all required sections before previewing</li>
                    <li>Check that your browser allows localStorage</li>
                  </ul>
                </div>
              )}

              {mode === "receiver" && (
                <div className="space-y-2">
                  <p><strong>For Receiver Users:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Contact the administrator who sent you the link</li>
                    <li>Ensure the link hasn't expired</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {mode === "admin" ? (
            <>
              <Button onClick={handleReturnToBuilder} className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Return to Template Builder
              </Button>
              <Button onClick={handleReturnToDashboard} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleRefresh} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button onClick={handleReturnToDashboard} variant="outline" className="flex-1">
                <Users className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </>
          )}
        </div>

        {/* Debug Mode Toggle */}
        <Card>
          <CardContent className="pt-6">
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 mb-2">
                Advanced Debug Information
              </summary>
              <div className="space-y-2 font-mono">
                <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                <div><strong>URL:</strong> {window.location.href}</div>
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                <div><strong>localStorage Support:</strong> {typeof Storage !== "undefined" ? "Yes" : "No"}</div>
                <div><strong>sessionStorage Support:</strong> {typeof sessionStorage !== "undefined" ? "Yes" : "No"}</div>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TemplateDebug;
