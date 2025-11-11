import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, ChevronDown } from "lucide-react";
import { updateDailyProgress } from "@/hooks/useDailyGoal";
import { toast } from "sonner";

interface TheorySection {
  id: string;
  topic_id: number;
  order_index: number;
  title: string;
  content: string;
  image_url: string | null;
}

const TheoryLesson = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sections, setSections] = useState<TheorySection[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topicTitle, setTopicTitle] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const returnToLesson = location.state?.returnToLesson;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch theory sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from("theory_sections")
        .select("*")
        .eq("topic_id", parseInt(topicId!))
        .order("order_index");

      if (sectionsError) {
        console.error("Error fetching theory sections:", sectionsError);
        toast.error("Erro ao carregar conteúdo teórico");
        navigate(-1);
        return;
      }

      // Fetch topic title
      const { data: topicData } = await supabase
        .from("topics")
        .select("title, track_id")
        .eq("id", parseInt(topicId!))
        .single();

      if (topicData) {
        setTopicTitle(topicData.title);
      }

      setSections(sectionsData || []);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, topicId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const sectionHeight = window.innerHeight;
      const newSection = Math.round(scrollPosition / sectionHeight);
      setCurrentSection(newSection);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSkipTheory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if already completed or skipped
    const { data: progressData } = await supabase
      .from("topic_progress")
      .select("theory_completed, theory_skipped")
      .eq("user_id", session.user.id)
      .eq("topic_id", parseInt(topicId!))
      .maybeSingle();

    const alreadyProcessed = progressData?.theory_completed || progressData?.theory_skipped;

    if (!alreadyProcessed) {
      // Award 30 XP for skipping (first time only)
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const newXP = profile.xp + 30;
        const newLevel = Math.floor(newXP / 100) + 1;

        await supabase
          .from("profiles")
          .update({ xp: newXP, level: newLevel })
          .eq("id", session.user.id);

        await updateDailyProgress(30);
      }
    }

    // Mark theory as skipped
    await supabase
      .from("topic_progress")
      .upsert({
        user_id: session.user.id,
        topic_id: parseInt(topicId!),
        theory_skipped: true,
        lessons_completed: 0,
      }, {
        onConflict: "user_id,topic_id",
      });

    toast.success(alreadyProcessed ? "Indo para lições práticas" : "+30 XP ganhos!");
    navigate(`/lesson/${topicId}`);
  };

  const handleComplete = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check if already completed
    const { data: progressData } = await supabase
      .from("topic_progress")
      .select("theory_completed")
      .eq("user_id", session.user.id)
      .eq("topic_id", parseInt(topicId!))
      .maybeSingle();

    const alreadyCompleted = progressData?.theory_completed;

    if (!alreadyCompleted) {
      // Award 30 XP for completing theory (first time only)
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const newXP = profile.xp + 30;
        const newLevel = Math.floor(newXP / 100) + 1;

        await supabase
          .from("profiles")
          .update({ xp: newXP, level: newLevel })
          .eq("id", session.user.id);

        await updateDailyProgress(30);
      }
    }

    // Mark theory as completed
    await supabase
      .from("topic_progress")
      .upsert({
        user_id: session.user.id,
        topic_id: parseInt(topicId!),
        theory_completed: true,
        lessons_completed: 0,
      }, {
        onConflict: "user_id,topic_id",
      });

    if (returnToLesson) {
      toast.success("Voltando para a lição");
      navigate(`/lesson/${topicId}`, { 
        state: { resumeProgress: location.state.lessonProgress } 
      });
    } else {
      toast.success(alreadyCompleted ? "Indo para lições práticas" : "+30 XP ganhos!");
      navigate(`/lesson/${topicId}`);
    }
  };

  const scrollToSection = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    container.scrollTo({
      top: index * window.innerHeight,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Carregando teoria...</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-6 max-w-md">
          <p className="text-foreground mb-4">Nenhum conteúdo teórico disponível para esta skill.</p>
          <Button onClick={() => navigate(`/lesson/${topicId}`)}>
            Ir para lições práticas
          </Button>
        </Card>
      </div>
    );
  }

  const progress = ((currentSection + 1) / sections.length) * 100;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header with progress */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">{topicTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              {returnToLesson && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/lesson/${topicId}`, { 
                    state: { resumeProgress: location.state.lessonProgress } 
                  })}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para prática
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipTheory}
              >
                Pular teoria
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {currentSection + 1}/{sections.length}
            </span>
          </div>
        </div>
      </div>

      {/* Scroll container with snap */}
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory pt-20"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="h-screen snap-start flex items-center justify-center p-4"
          >
            <Card className="max-w-3xl w-full p-8 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  {section.title}
                </h2>
                {section.image_url && (
                  <img
                    src={section.image_url}
                    alt={section.title}
                    className="w-full rounded-lg"
                  />
                )}
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>

              {index === sections.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  className="w-full"
                  size="lg"
                >
                  {returnToLesson ? "Voltar para prática" : "Concluir teoria e ir para prática"}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => scrollToSection(index + 1)}
                  className="w-full"
                >
                  Continuar
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TheoryLesson;
