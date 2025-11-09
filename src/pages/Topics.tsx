import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, ArrowLeft, Lock, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Topic {
  id: number;
  track_id: number;
  title: string;
  description: string;
  order_index: number;
  total_lessons: number;
  lessons_completed: number;
  locked: boolean;
}

interface Track {
  id: number;
  title: string;
  description: string;
}

const Topics = () => {
  const navigate = useNavigate();
  const { trackId } = useParams();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load track info
      const currentTrackId = parseInt(trackId || "1");
      const { data: trackData } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", currentTrackId)
        .single();

      if (trackData) {
        setTrack(trackData);
      }

      // Load topics
      const { data: topicsData } = await supabase
        .from("topics")
        .select("*")
        .eq("track_id", currentTrackId)
        .order("order_index");

      // Load user progress
      const { data: progressData } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", session.user.id);

      if (topicsData) {
        const progressMap: Record<number, number> = {};
        progressData?.forEach((p) => {
          progressMap[p.topic_id] = p.lessons_completed;
        });

        const topicsWithProgress = topicsData.map((topic, index) => {
          const completed = progressMap[topic.id] || 0;
          const prevTopic = index > 0 ? topicsData[index - 1] : null;
          const prevCompleted = prevTopic ? progressMap[prevTopic.id] || 0 : topic.total_lessons;
          
          // Unlock if previous topic is completed (or if first topic)
          const locked = index === 0 ? false : prevCompleted < prevTopic!.total_lessons;

          return {
            ...topic,
            lessons_completed: completed,
            locked,
          };
        });

        setTopics(topicsWithProgress);
      }

      setLoading(false);
    };

    loadTopics();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, trackId]);

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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Scale className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{track?.title}</h1>
                <p className="text-sm text-muted-foreground">{track?.description}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-4">Tópicos</h2>
          
          {topics.map((topic, index) => (
            <Card
              key={topic.id}
              className={`group hover:shadow-lg transition-all duration-300 ${
                topic.locked ? "opacity-60" : "cursor-pointer hover:scale-[1.02]"
              }`}
              onClick={() => !topic.locked && navigate(`/lesson/${topic.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      topic.locked
                        ? "bg-muted"
                        : index === 0
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {topic.locked ? <Lock className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">{topic.title}</h3>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      </div>
                      {topic.lessons_completed > 0 && !topic.locked && (
                        <Badge variant="secondary" className="ml-2">
                          {topic.lessons_completed}/{topic.total_lessons} lições
                        </Badge>
                      )}
                    </div>

                    {!topic.locked && (
                      <div className="mt-4">
                        <Progress value={(topic.lessons_completed / topic.total_lessons) * 100} className="h-2" />
                      </div>
                    )}

                    {topic.locked && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Complete o tópico anterior para desbloquear
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Topics;
