import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, ArrowLeft, Lock, BookOpen, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DailyGoalFooter } from "@/components/DailyGoalFooter";

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
      <main className="container mx-auto px-4 py-8 max-w-5xl pb-24">
        {/* Legend */}
        <div className="mb-8 bg-card/50 rounded-lg p-4 border border-border">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-accent"></div>
              <span className="text-muted-foreground">Anel dourado: progresso nas lições</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-accent" />
              <span className="text-muted-foreground">Coroa: vezes que completou todas as lições</span>
            </div>
          </div>
        </div>

        {/* Skills Layout - Duolingo Style */}
        <div className="flex flex-col gap-8">
          {(() => {
            const pattern = [1, 2, 3, 2, 1]; // Duolingo-style funnel pattern
            const rows: Topic[][] = [];
            let currentIndex = 0;
            let patternIndex = 0;

            while (currentIndex < topics.length) {
              const itemsInRow = pattern[patternIndex % pattern.length];
              rows.push(topics.slice(currentIndex, currentIndex + itemsInRow));
              currentIndex += itemsInRow;
              patternIndex++;
            }

            return rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex justify-center items-center gap-8 flex-wrap"
              >
                {row.map((topic, index) => {
                  const progressPercentage = (topic.lessons_completed / topic.total_lessons) * 100;
                  const completionCount = Math.floor(topic.lessons_completed / topic.total_lessons);
                  const isCompleted = topic.lessons_completed >= topic.total_lessons;
                  
                  return (
                    <div
                      key={topic.id}
                      className={`flex flex-col items-center gap-3 ${
                        topic.locked ? "opacity-50" : "cursor-pointer"
                      } transition-all duration-300 hover:scale-105`}
                      onClick={async () => {
                        if (topic.locked) return;
                        
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) return;

                        // Check if theory has been completed or skipped
                        const { data: progressData } = await supabase
                          .from("topic_progress")
                          .select("theory_completed, theory_skipped")
                          .eq("user_id", session.user.id)
                          .eq("topic_id", topic.id)
                          .maybeSingle();

                        // If theory not completed and not skipped, go to theory first
                        if (!progressData?.theory_completed && !progressData?.theory_skipped) {
                          navigate(`/theory/${topic.id}`);
                        } else {
                          navigate(`/lesson/${topic.id}`);
                        }
                      }}
                    >
                      {/* Circular Skill */}
                      <div className="relative">
                        {/* Progress Ring */}
                        <svg className="w-32 h-32 transform -rotate-90">
                          {/* Background circle */}
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            fill="none"
                            stroke="hsl(var(--muted))"
                            strokeWidth="8"
                          />
                          {/* Progress circle */}
                          {!topic.locked && (
                            <circle
                              cx="64"
                              cy="64"
                              r="58"
                              fill="none"
                              stroke="hsl(var(--accent))"
                              strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 58}`}
                              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progressPercentage / 100)}`}
                              strokeLinecap="round"
                              className="transition-all duration-500"
                            />
                          )}
                        </svg>

                        {/* Inner Circle with Icon */}
                        <div
                          className={`absolute inset-0 m-4 rounded-full flex items-center justify-center ${
                            topic.locked
                              ? "bg-muted"
                              : isCompleted
                              ? "bg-accent/20"
                              : index === 0
                              ? "bg-primary/10"
                              : "bg-secondary"
                          }`}
                        >
                          {topic.locked ? (
                            <Lock className="w-10 h-10 text-muted-foreground" />
                          ) : (
                            <BookOpen
                              className={`w-10 h-10 ${
                                isCompleted ? "text-accent" : "text-primary"
                              }`}
                            />
                          )}
                        </div>

                        {/* Crown Badge */}
                        {!topic.locked && completionCount > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-accent rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-background">
                            <div className="flex flex-col items-center">
                              <Crown className="w-5 h-5 text-accent-foreground" />
                              <span className="text-xs font-bold text-accent-foreground -mt-1">
                                {completionCount}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Topic Info */}
                      <div className="text-center max-w-[200px]">
                        <h3 className="text-base font-bold text-foreground mb-1">{topic.title}</h3>
                        {!topic.locked && (
                          <Badge variant="secondary" className="text-xs">
                            {topic.lessons_completed}/{topic.total_lessons} lições
                          </Badge>
                        )}
                        {topic.locked && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Complete o anterior
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      </main>

      {/* Daily Goal Footer */}
      <DailyGoalFooter />
    </div>
  );
};

export default Topics;
