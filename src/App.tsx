import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Topics from "./pages/Topics";
import Lesson from "./pages/Lesson";
import LessonComplete from "./pages/LessonComplete";
import Auth from "./pages/Auth";
import StreakStats from "./pages/StreakStats";
import LevelRoadmap from "./pages/LevelRoadmap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DynamicThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/topics/:trackId" element={<Topics />} />
            <Route path="/lesson/:topicId" element={<Lesson />} />
            <Route path="/lesson-complete" element={<LessonComplete />} />
            <Route path="/streak" element={<StreakStats />} />
            <Route path="/levels" element={<LevelRoadmap />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DynamicThemeProvider>
  </QueryClientProvider>
);

export default App;
