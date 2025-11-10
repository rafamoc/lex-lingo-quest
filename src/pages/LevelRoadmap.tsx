import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const levels = [
  { id: 1, name: "Iniciante", minXp: 0, maxXp: 299, color: "from-sky-400 to-sky-600" },
  { id: 2, name: "Aprendiz", minXp: 300, maxXp: 799, color: "from-amber-400 to-amber-600" },
  { id: 3, name: "Explorador", minXp: 800, maxXp: 1499, color: "from-blue-600 to-blue-800" },
  { id: 4, name: "Conhecedor", minXp: 1500, maxXp: 2499, color: "from-emerald-500 to-emerald-700" },
  { id: 5, name: "Especialista", minXp: 2500, maxXp: 3999, color: "from-purple-500 to-purple-700" },
  { id: 6, name: "Mestre", minXp: 4000, maxXp: 9999, color: "from-red-500 to-red-700" },
  { id: 7, name: "Lendário", minXp: 10000, maxXp: Infinity, color: "from-slate-800 to-slate-950" },
];

const LevelRoadmap = () => {
  const navigate = useNavigate();
  const [userXp, setUserXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("xp")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserXp(profile.xp);
        const level = levels.find(l => profile.xp >= l.minXp && profile.xp <= l.maxXp);
        if (level) setCurrentLevel(level.id);
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const getNextLevel = () => {
    const current = levels.find(l => l.id === currentLevel);
    if (current && current.id < levels.length) {
      return levels[current.id];
    }
    return null;
  };

  const getProgressToNextLevel = () => {
    const current = levels.find(l => l.id === currentLevel);
    if (!current) return 0;
    
    const xpInCurrentLevel = userXp - current.minXp;
    const xpNeededForLevel = current.maxXp - current.minXp + 1;
    return Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
  };

  const getXpToNextLevel = () => {
    const current = levels.find(l => l.id === currentLevel);
    if (!current || current.id === levels.length) return 0;
    return current.maxXp + 1 - userXp;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const nextLevel = getNextLevel();
  const progressPercent = getProgressToNextLevel();
  const xpToNext = getXpToNextLevel();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Roadmap de Níveis
          </h1>
          <p className="text-muted-foreground">
            Acompanhe sua jornada de aprendizado
          </p>
        </div>

        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle>Seu Progresso Atual</CardTitle>
            <CardDescription>
              Você está no nível {currentLevel} com {userXp} XP
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextLevel ? (
              <>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-muted-foreground">
                    Próximo nível: {nextLevel.name}
                  </span>
                  <span className="font-semibold text-primary">
                    Faltam {xpToNext} XP
                  </span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </>
            ) : (
              <p className="text-center text-lg font-semibold text-primary">
                🎉 Você atingiu o nível máximo!
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {levels.map((level) => {
            const isCurrentLevel = level.id === currentLevel;
            const isPastLevel = userXp > level.maxXp;
            const isFutureLevel = userXp < level.minXp;

            return (
              <Card
                key={level.id}
                className={`relative transition-all ${
                  isCurrentLevel
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : isPastLevel
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                <div className={`h-2 rounded-t-lg bg-gradient-to-r ${level.color}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Nível {level.id}
                    </CardTitle>
                    {isCurrentLevel && (
                      <Badge variant="default" className="animate-pulse">
                        Atual
                      </Badge>
                    )}
                    {isPastLevel && (
                      <Badge variant="secondary">
                        Completo
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-lg font-semibold">
                    {level.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`h-16 rounded-lg bg-gradient-to-r ${level.color} flex items-center justify-center text-white font-bold text-2xl shadow-md`}>
                      {level.id}
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {level.minXp} - {level.maxXp === Infinity ? "10000+" : level.maxXp} XP
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelRoadmap;
