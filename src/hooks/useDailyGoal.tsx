import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DailyGoalData {
  dailyXP: number;
  goalXP: number;
  level: number;
  loading: boolean;
  percentage: number;
}

const DAILY_GOALS: Record<number, number> = {
  1: 50,
  2: 60,
  3: 70,
  4: 80,
  5: 90,
  6: 100,
  7: 150,
};

export const useDailyGoal = (): DailyGoalData => {
  const [dailyXP, setDailyXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      // Get user level
      const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setLevel(profile.level);
      }

      // Get today's date
      const today = new Date().toISOString().split("T")[0];

      // Fetch today's progress
      const { data: progress } = await supabase
        .from("daily_progress")
        .select("points")
        .eq("user_id", session.user.id)
        .eq("date", today)
        .maybeSingle();

      if (progress) {
        setDailyXP(progress.points);
      } else {
        setDailyXP(0);
      }

      setLoading(false);
    };

    fetchDailyProgress();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("daily_progress_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_progress",
        },
        () => {
          fetchDailyProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const goalXP = DAILY_GOALS[level] || 50;
  const percentage = Math.min((dailyXP / goalXP) * 100, 100);

  return {
    dailyXP,
    goalXP,
    level,
    loading,
    percentage,
  };
};

export const updateDailyProgress = async (xpEarned: number) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return;

  const today = new Date().toISOString().split("T")[0];

  // Check if progress exists for today
  const { data: existingProgress } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("date", today)
    .maybeSingle();

  if (existingProgress) {
    // Update existing progress
    await supabase
      .from("daily_progress")
      .update({
        points: existingProgress.points + xpEarned,
      })
      .eq("id", existingProgress.id);
  } else {
    // Insert new progress
    await supabase
      .from("daily_progress")
      .insert({
        user_id: session.user.id,
        date: today,
        points: xpEarned,
      });
  }
};
