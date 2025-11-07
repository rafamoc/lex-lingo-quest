import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Scale, Trophy, Flame, BookOpen, Lock, CheckCircle2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: number;
  completed: number;
  locked: boolean;
  icon: React.ReactNode;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userXP, setUserXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [completedModules, setCompletedModules] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // Load progress from database
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch user profile and progress
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserXP(profile.xp);
        setLevel(profile.level);
        setStreak(profile.streak);
      }

      // Fetch module progress
      const { data: progress } = await supabase
        .from("module_progress")
        .select("*")
        .eq("user_id", session.user.id);

      if (progress) {
        const progressMap: Record<number, number> = {};
        progress.forEach((p) => {
          progressMap[p.module_id] = p.lessons_completed;
        });
        setCompletedModules(progressMap);
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const baseModules: Module[] = [
    {
      id: 1,
      title: "Fundamentos das Obrigações",
      description: "Conceitos básicos e fontes das obrigações no Direito Civil",
      lessons: 10,
      completed: 0,
      locked: false,
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: 2,
      title: "Adimplemento e Extinção",
      description: "Formas de cumprimento e extinção das obrigações",
      lessons: 8,
      completed: 0,
      locked: true,
      icon: <CheckCircle2 className="w-6 h-6" />,
    },
    {
      id: 3,
      title: "Inadimplemento",
      description: "Mora, perdas e danos, e cláusula penal",
      lessons: 12,
      completed: 0,
      locked: true,
      icon: <Scale className="w-6 h-6" />,
    },
  ];

  // Apply completion data and unlock logic
  const modules = baseModules.map((module, index) => {
    const completed = completedModules[module.id] || 0;
    const prevModule = index > 0 ? baseModules[index - 1] : null;
    const prevCompleted = prevModule ? completedModules[prevModule.id] || 0 : module.lessons;
    
    // Unlock if previous module is completed (or if first module)
    const locked = index === 0 ? false : prevCompleted < prevModule!.lessons;

    return {
      ...module,
      completed,
      locked,
    };
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">LexLingo</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full">
                <Flame className="w-5 h-5 text-accent" />
                <span className="font-bold text-foreground">{streak}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-bold text-foreground">{userXP} XP</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* User Progress Card */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">Nível {level}</h2>
                <p className="text-muted-foreground">Continue aprendendo para subir de nível!</p>
              </div>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
            </div>
            <Progress value={(userXP % 300) / 3} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">{userXP % 300}/300 XP até o próximo nível</p>
          </CardContent>
        </Card>

        {/* Modules Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Trilha de Aprendizado</h2>
          
          {modules.map((module, index) => (
            <Card
              key={module.id}
              className={`group hover:shadow-lg transition-all duration-300 ${
                module.locked ? "opacity-60" : "cursor-pointer hover:scale-[1.02]"
              }`}
              onClick={() => !module.locked && navigate(`/lesson/${module.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      module.locked
                        ? "bg-muted"
                        : index === 0
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {module.locked ? <Lock className="w-6 h-6" /> : module.icon}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                      {module.completed > 0 && !module.locked && (
                        <Badge variant="secondary" className="ml-2">
                          {module.completed}/{module.lessons} lições
                        </Badge>
                      )}
                    </div>

                    {!module.locked && (
                      <div className="mt-4">
                        <Progress value={(module.completed / module.lessons) * 100} className="h-2" />
                      </div>
                    )}

                    {module.locked && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Complete o módulo anterior para desbloquear
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievement Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
            <CardContent className="pt-6 text-center">
              <Flame className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{streak} dias</p>
              <p className="text-sm text-muted-foreground">Sequência atual</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {Object.values(completedModules).reduce((sum, val) => sum + val, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Lições completas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">85%</p>
              <p className="text-sm text-muted-foreground">Taxa de acerto</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
