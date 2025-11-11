import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Sparkles, Target } from "lucide-react";
import { useDailyGoal } from "@/hooks/useDailyGoal";

const LessonComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { xpEarned = 0, trackId = 1 } = location.state || {};
  const { dailyXP, goalXP, percentage } = useDailyGoal();
  const [showCelebration, setShowCelebration] = useState(false);

  const remaining = Math.max(goalXP - dailyXP, 0);
  const isGoalReached = dailyXP >= goalXP;

  useEffect(() => {
    // Trigger celebration animation
    setTimeout(() => setShowCelebration(true), 100);
  }, []);

  const handleContinue = () => {
    navigate(`/topics/${trackId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card 
        className={`max-w-md w-full shadow-2xl border-2 ${
          isGoalReached ? "border-success" : "border-primary"
        } ${showCelebration ? "animate-scale-in" : "opacity-0"}`}
      >
        <CardContent className="pt-8 pb-8 text-center">
          {/* Icon */}
          <div className="mb-6 relative inline-block">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
              isGoalReached ? "bg-success/20" : "bg-primary/20"
            }`}>
              <Trophy className={`w-12 h-12 ${
                isGoalReached ? "text-success" : "text-primary"
              }`} />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-500 animate-pulse" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Lição Concluída!
          </h1>
          <p className="text-lg text-primary font-semibold mb-6">
            +{xpEarned} XP
          </p>

          {/* Daily Goal Progress */}
          <div className="mb-6 p-4 bg-card/50 rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Progresso da Meta Diária
              </span>
            </div>
            
            <Progress value={percentage} className="h-3 mb-2" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {dailyXP}/{goalXP} XP
              </span>
              <span className={`font-semibold ${
                isGoalReached ? "text-success" : "text-primary"
              }`}>
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Message */}
          {isGoalReached ? (
            <div className="mb-6 p-4 bg-success/10 rounded-xl border border-success/20">
              <p className="text-lg font-bold text-success mb-1">
                🎉 Parabéns!
              </p>
              <p className="text-sm text-foreground">
                Você atingiu sua meta diária! Continue assim! 🔥
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              Faltam <span className="font-bold text-foreground">{remaining} XP</span> para atingir sua meta diária!
            </p>
          )}

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonComplete;
