import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useDailyGoal } from "@/hooks/useDailyGoal";

export const DailyGoalFooter = () => {
  const { dailyXP, goalXP, loading, percentage } = useDailyGoal();

  if (loading) return null;

  const isGoalReached = dailyXP >= goalXP;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isGoalReached ? "bg-success/20" : "bg-primary/20"}`}>
            <Target className={`w-5 h-5 ${isGoalReached ? "text-success" : "text-primary"}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-foreground">
                Meta diária
              </span>
              <span className="text-sm font-bold text-foreground">
                {dailyXP}/{goalXP} XP
              </span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
            />
          </div>
          {isGoalReached && (
            <span className="text-2xl animate-bounce">🔥</span>
          )}
        </div>
      </div>
    </div>
  );
};
