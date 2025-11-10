import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LevelTheme {
  primary: string;
  primaryForeground: string;
  accent: string;
  ring: string;
}

const levelThemes: Record<number, LevelTheme> = {
  1: {
    primary: "199 89% 48%", // Sky blue
    primaryForeground: "0 0% 100%",
    accent: "199 89% 48%",
    ring: "199 89% 48%",
  },
  2: {
    primary: "45 93% 47%", // Golden yellow
    primaryForeground: "0 0% 0%",
    accent: "45 93% 47%",
    ring: "45 93% 47%",
  },
  3: {
    primary: "217 91% 35%", // Navy blue
    primaryForeground: "0 0% 100%",
    accent: "217 91% 35%",
    ring: "217 91% 35%",
  },
  4: {
    primary: "142 76% 36%", // Green
    primaryForeground: "0 0% 100%",
    accent: "142 76% 36%",
    ring: "142 76% 36%",
  },
  5: {
    primary: "271 81% 56%", // Purple
    primaryForeground: "0 0% 100%",
    accent: "271 81% 56%",
    ring: "271 81% 56%",
  },
  6: {
    primary: "0 84% 60%", // Red
    primaryForeground: "0 0% 100%",
    accent: "0 84% 60%",
    ring: "0 84% 60%",
  },
  7: {
    primary: "240 10% 4%", // Black
    primaryForeground: "0 0% 100%",
    accent: "240 10% 4%",
    ring: "240 10% 4%",
  },
};

export const useUserLevelTheme = () => {
  const [level, setLevel] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLevel = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLevel(1);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const xp = profile.xp;
        let userLevel = 1;
        
        if (xp >= 10000) userLevel = 7;
        else if (xp >= 4000) userLevel = 6;
        else if (xp >= 2500) userLevel = 5;
        else if (xp >= 1500) userLevel = 4;
        else if (xp >= 800) userLevel = 3;
        else if (xp >= 300) userLevel = 2;
        
        setLevel(userLevel);
      }

      setLoading(false);
    };

    fetchUserLevel();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserLevel();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    level,
    theme: levelThemes[level] || levelThemes[1],
    loading,
  };
};
