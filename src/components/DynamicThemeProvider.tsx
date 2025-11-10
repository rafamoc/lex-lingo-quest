import { useEffect } from "react";
import { useUserLevelTheme } from "@/hooks/useUserLevelTheme";

export const DynamicThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme, loading } = useUserLevelTheme();

  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;
    
    // Apply theme with smooth transition
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--primary-foreground", theme.primaryForeground);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--ring", theme.ring);
    
    // Add transition class
    root.style.transition = "background-color 0.5s ease, color 0.5s ease";
    
  }, [theme, loading]);

  return <>{children}</>;
};
