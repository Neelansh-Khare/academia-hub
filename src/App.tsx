import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import PublicProfile from "./pages/PublicProfile";
import CollaborationBoard from "./pages/CollaborationBoard";
import ResearchAssistant from "./pages/ResearchAssistant";
import PaperChat from "./pages/PaperChat";
import ColdEmailGenerator from "./pages/ColdEmailGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:id" element={<PublicProfile />} />
            <Route path="/board" element={<CollaborationBoard />} />
            <Route path="/assistant" element={<ResearchAssistant />} />
            <Route path="/paper-chat" element={<PaperChat />} />
            <Route path="/cold-email" element={<ColdEmailGenerator />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
