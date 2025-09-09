import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Templates from "./pages/Templates";
import TemplateBuilder from "./pages/TemplateBuilder";
import DocumentVerification from "./pages/DocumentVerification";
import BiometricVerification from "./pages/BiometricVerification";
import Preview from "./pages/Preview";
import ReceiverView from "./pages/ReceiverView";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import ChooseTemplate from "./pages/ChooseTemplate";

const queryClient = new QueryClient();
// 1st change
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DndProvider backend={HTML5Backend}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<SignUp />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Templates />} />
              <Route path="/template-builder" element={<TemplateBuilder />} />
              <Route path="/preview" element={<Preview />} />
              <Route path="/preview/:templateId" element={<Preview />} />
              <Route path="/receiver-view" element={<ReceiverView />} />
              <Route
                path="/receiver-view/:templateId"
                element={<ReceiverView />}
              />

              <Route path="/home" element={<Home />} />
              <Route path="/choose-template" element={<ChooseTemplate />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DndProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
