import { useState, useEffect } from "react"; 
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, Trophy, Flame, BookOpen, Lock, CheckCircle2, 
  LogOut, Users, ArrowRightLeft, CheckCheck, AlertTriangle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Track {
  id: number;
  title: string;
  description: string;
  icon: string;
  order_index: number;
  total_topics: number;
  completed_topics: number;
  locked: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userXP, setUserXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  // Icon mapping
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      BookOpen: <BookOpen className="w-6 h-6" />,
      CheckCircle2: <CheckCircle2 className="w-6 h-6" />,
      Scale: <Scale className="w-6 h-6" />,
      Users: <Users className="w-6 h-6" />,
      ArrowRightLeft: <ArrowRightLeft className="w-6 h-6" />,
      CheckCheck: <CheckCheck className="w-6 h-6" />,
      AlertTriangle: <AlertTriangle className="w-6 h-6" />,
    };
    return icons[iconName] || <BookOpen className="w-6 h-6" />;
  };

  // Load progress from database
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch user profile
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

      // Fetch tracks
      const { data: tracksData } = await supabase
        .from("tracks")
        .select("*")
        .order("order_index");

      // Fetch all topics for all tracks
      const { data: topicsData } = await supabase
        .from("topics")
        .select("*");

      // Fetch user progress
      const { data: progressData } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", session.user.id);

      if (tracksData && topicsData) {
        const progressMap: Record<number, number> = {};
        progressData?.forEach((p) => {
          progressMap[p.topic_id] = p.lessons_completed;
        });

        const tracksWithProgress = tracksData.map((track, index) => {
          const trackTopics = topicsData.filter(t => t.track_id === track.id);
          const completedTopics = trackTopics.filter(t => {
            const completed = progressMap[t.id] || 0;
            return completed >= t.total_lessons;
          }).length;

          const prevTrack = index > 0 ? tracksData[index - 1] : null;
          const prevTrackTopics = prevTrack ? topicsData.filter(t => t.track_id === prevTrack.id) : [];
          const prevCompleted = prevTrack ? prevTrackTopics.filter(t => {
            const completed = progressMap[t.id] || 0;
            return completed >= t.total_lessons;
          }).length : trackTopics.length;
          
          // Unlock if previous track is completed (or if first track)
          const locked = index === 0 ? false : prevCompleted < prevTrackTopics.length;

          return {
            ...track,
            total_topics: trackTopics.length,
            completed_topics: completedTopics,
            locked,
          };
        });

        setTracks(tracksWithProgress);
      }

      setLoading(false);
    };

    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const totalCompletedLessons = tracks.reduce((sum, track) => {
    return sum + track.completed_topics;
  }, 0);

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
              <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full cursor-pointer hover:scale-[1.10] hover:shadow-lg" onClick={() => navigate("/streak")} >
                <Flame className="w-5 h-5 text-accent" />
                <span className="font-bold text-foreground">{streak}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full cursor-pointer hover:scale-[1.10] hover:shadow-lg" onClick={() => navigate("/levels")}>
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
        <Card 
          className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
          onClick={() => navigate("/levels")}
        >
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

        {/* Tracks Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Trilhas de Aprendizado</h2>
          
          {tracks.map((track, index) => {
            const isCompleted = track.completed_topics === track.total_topics;
            return (
              <Card
                key={track.id}
                className={`group hover:shadow-lg transition-all duration-300 ${
                  track.locked ? "opacity-60" : "cursor-pointer hover:scale-[1.02]"
                }`}
                onClick={() => !track.locked && navigate(`/topics/${track.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Ícone com check verde */}
                    <div className="relative w-14 h-14">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          track.locked
                            ? "bg-muted"
                            : isCompleted
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {track.locked ? <Lock className="w-6 h-6" /> : getIcon(track.icon)}
                      </div>

                      {isCompleted && !track.locked && (
                        <CheckCircle2 className="absolute bottom-0 right-0 w-5 h-5 text-green-500 bg-background rounded-full shadow-sm" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground mb-1">{track.title}</h3>
                          <p className="text-sm text-muted-foreground">{track.description}</p>
                        </div>
                        {track.completed_topics > 0 && !track.locked && (
                          <Badge variant="secondary" className="ml-2">
                            {track.completed_topics}/{track.total_topics} tópicos
                          </Badge>
                        )}
                      </div>

                      {!track.locked && (
                        <div className="mt-4">
                          <Progress value={(track.completed_topics / track.total_topics) * 100} className="h-2" />
                        </div>
                      )}

                      {track.locked && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Complete a trilha anterior para desbloquear
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Achievement Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            className="bg-gradient-to-br from-accent/10 to-accent/5 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate("/streak")}
          >
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
                {totalCompletedLessons}
              </p>
              <p className="text-sm text-muted-foreground">Tópicos completos</p>
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
