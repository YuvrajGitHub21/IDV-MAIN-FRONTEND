import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Templates from "./pages/Templates";
import TemplateBuilder from "./pages/TemplateBuilder";
import TemplateEditor from "./pages/TemplateEditor";
import DocumentVerification from "./pages/DocumentVerification";
import BiometricVerification from "./pages/BiometricVerification";
import Preview from "./pages/Preview";
import PreviewBackend from "./pages/PreviewBackend";
import ReceiverView from "./pages/ReceiverView";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import ChooseTemplate from "./pages/ChooseTemplate";
import Debug from "./pages/Debug";
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

function Protected({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

const queryClient = new QueryClient();

// Component to handle automatic token refresh
const TokenRefreshProvider = ({ children }: { children: React.ReactNode }) => {
  useTokenRefresh();
  return <>{children}</>;
};
// 1st change
// chhota change

//FINAL v2
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <TokenRefreshProvider>
          <Toaster />
          <Sonner />
          <DndProvider backend={HTML5Backend}>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<SignUp />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Protected><Templates /></Protected>} />
                <Route path="/template-builder" element={<Protected><TemplateBuilder /></Protected>} />
                <Route path="/TemplateBuilder" element={<Protected><TemplateBuilder /></Protected>} />
                <Route path="/template-editor/:templateId" element={<Protected><TemplateEditor /></Protected>} />

                <Route path="/preview" element={<Protected><Preview /></Protected>} />
                <Route path="/Preview" element={<Protected><Preview /></Protected>} />
                <Route path="/preview/:templateId" element={<Protected><Preview /></Protected>} />
                <Route path="/preview-backend/:id" element={<Protected><PreviewBackend /></Protected>} />
                <Route path="/receiver-view" element={<Protected><ReceiverView /></Protected>} />
                <Route path="/ReceiverView" element={<Protected><ReceiverView /></Protected>} />
                <Route path="/receiver-view/:templateId" element={<Protected><ReceiverView /></Protected>}/>
                <Route path="/home" element={<Protected><Home /></Protected>} />
                <Route path="/choose-template" element={<Protected><ChooseTemplate /></Protected>} />
                <Route path="/debug" element={<Protected><Debug /></Protected>} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DndProvider>
        </TokenRefreshProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
