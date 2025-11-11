import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { DynamicThemeProvider } from "@/components/DynamicThemeProvider";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Topics from "./pages/Topics";
import TheoryLesson from "./pages/TheoryLesson";
import Lesson from "./pages/Lesson";
import LessonComplete from "./pages/LessonComplete";
import Auth from "./pages/Auth";
import StreakStats from "./pages/StreakStats";
import LevelRoadmap from "./pages/LevelRoadmap";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/321dd543-fe6e-4204-ae30-85f578708d9c";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/topics/:trackId" element={<PageTransition><Topics /></PageTransition>} />
        <Route path="/theory/:topicId" element={<PageTransition><TheoryLesson /></PageTransition>} />
        <Route path="/lesson/:topicId" element={<PageTransition><Lesson /></PageTransition>} />
        <Route path="/lesson-complete" element={<PageTransition><LessonComplete /></PageTransition>} />
        <Route path="/streak" element={<PageTransition><StreakStats /></PageTransition>} />
        <Route path="/levels" element={<PageTransition><LevelRoadmap /></PageTransition>} />
        <Route path="/321dd543-fe6e-4204-ae30-85f578708d9c" element={<PageTransition><AdminPanel /></PageTransition>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DynamicThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </DynamicThemeProvider>
  </QueryClientProvider>
);

export default App;
