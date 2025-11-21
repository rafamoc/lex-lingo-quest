import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { updateDailyProgress } from "@/hooks/useDailyGoal";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface TheorySection {
  id: string;
  topic_id: number;
  order_index: number;
  title: string;
  content: string;
  image_url: string | null;
  avatar_id?: number | null;
  audio_id?: number | null;
}

const TheoryLesson = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sections, setSections] = useState<TheorySection[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topicTitle, setTopicTitle] = useState("");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const returnToLesson = location.state?.returnToLesson;
  const isAutoScrolling = useRef(false);

  // 🔒 Carrega teoria e autenticação
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: sectionsData, error: sectionsError } = await supabase
        .from("theory_sections")
        .select("*")
        .eq("topic_id", parseInt(topicId!))
        .order("order_index");

      if (sectionsError) {
        console.error("Erro ao buscar seções:", sectionsError);
        toast.error("Erro ao carregar conteúdo teórico");
        navigate(-1);
        return;
      }

      const { data: topicData } = await supabase
        .from("topics")
        .select("title, track_id")
        .eq("id", parseInt(topicId!))
        .single();

      if (topicData) setTopicTitle(topicData.title);

      setSections(
        (sectionsData || []).map((section: any) => ({
          ...section,
          avatar_id: section.avatar_id ?? 1,
        }))
      );

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate, topicId]);

  // 🔄 Scroll + teclado
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const sectionHeight = window.innerHeight;

    const handleScroll = () => {
      if (isAutoScrolling.current) return;
      window.requestAnimationFrame(() => {
        const newSection = Math.round(container.scrollTop / sectionHeight);
        if (newSection !== currentSection) setCurrentSection(newSection);
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToSection(Math.min(currentSection + 1, sections.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToSection(Math.max(currentSection - 1, 0));
      }
    };

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentSection, sections.length]);

  const scrollToSection = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isAutoScrolling.current = true;
    container.scrollTo({
      top: index * window.innerHeight,
      behavior: "smooth",
    });
    setTimeout(() => {
      setCurrentSection(index);
      isAutoScrolling.current = false;
    }, 400);
  };

  // 🎧 Controle de áudio
  useEffect(() => {
    if (sections.length === 0) return;

    const currentAudioId = sections[currentSection]?.audio_id || 1;
    const audioFile = `/audios/audio_${currentAudioId}.ogg`;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioFile);
    }

    if (audioRef.current.src !== window.location.origin + audioFile) {
      audioRef.current.pause();
      audioRef.current.src = audioFile;
    }

    const currentAudio = audioRef.current;

    const playAudio = () => {
      setTimeout(() => {
        if (isAudioEnabled) {
          currentAudio.play().then(() => {
            setIsAudioPlaying(true);
          }).catch(() => {
            console.warn("Autoplay bloqueado.");
          });
        }
      }, 1000);
    };

    playAudio();

    currentAudio.onended = () => setIsAudioPlaying(false);

    // 🧹 Cleanup: pausa e reseta ao desmontar ou trocar de lição
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setIsAudioPlaying(false);
      }
    };
  }, [currentSection, isAudioEnabled, sections]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
      setIsAudioEnabled(false);
    } else {
      audio.play().then(() => {
        setIsAudioPlaying(true);
        setIsAudioEnabled(true);
      });
    }
  };

  // 🧹 Pausa áudio ao sair ou concluir
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }
  };

  const handleSkipTheory = async () => {
    stopAudio();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: progressData } = await supabase
      .from("topic_progress")
      .select("theory_completed, theory_skipped")
      .eq("user_id", session.user.id)
      .eq("topic_id", parseInt(topicId!))
      .maybeSingle();

    const alreadyProcessed = progressData?.theory_completed || progressData?.theory_skipped;

    if (!alreadyProcessed) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const newXP = profile.xp + 30;
        const newLevel = Math.floor(newXP / 100) + 1;
        await supabase.from("profiles").update({ xp: newXP, level: newLevel }).eq("id", session.user.id);
        await updateDailyProgress(30);
      }
    }

    await supabase
      .from("topic_progress")
      .upsert(
        { user_id: session.user.id, topic_id: parseInt(topicId!), theory_skipped: true, lessons_completed: 0 },
        { onConflict: "user_id,topic_id" }
      );

    toast.success(alreadyProcessed ? "Indo para lições práticas" : "+30 XP ganhos!");
    navigate(`/lesson/${topicId}`);
  };

  const handleComplete = async () => {
    stopAudio();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: progressData } = await supabase
      .from("topic_progress")
      .select("theory_completed")
      .eq("user_id", session.user.id)
      .eq("topic_id", parseInt(topicId!))
      .maybeSingle();

    const alreadyCompleted = progressData?.theory_completed;

    if (!alreadyCompleted) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, level")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const newXP = profile.xp + 30;
        const newLevel = Math.floor(newXP / 100) + 1;
        await supabase.from("profiles").update({ xp: newXP, level: newLevel }).eq("id", session.user.id);
        await updateDailyProgress(30);
      }
    }

    await supabase
      .from("topic_progress")
      .upsert(
        { user_id: session.user.id, topic_id: parseInt(topicId!), theory_completed: true, lessons_completed: 0 },
        { onConflict: "user_id,topic_id" }
      );

    if (returnToLesson) {
      toast.success("Voltando para a lição");
      const progress = location.state?.lessonProgress;
      if (progress) localStorage.setItem(`lessonProgress_${topicId}`, JSON.stringify(progress));
      navigate(`/lesson/${topicId}`, { state: { resumeProgress: progress } });
    } else {
      toast.success(alreadyCompleted ? "Indo para lições práticas" : "+30 XP ganhos!");
      navigate(`/lesson/${topicId}`);
    }
  };

  // 🧹 Pausa áudio ao desmontar (voltar no navegador, sair da tela)
  useEffect(() => {
    return () => stopAudio();
  }, []);

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
          <Button onClick={() => navigate(`/lesson/${topicId}`)}>Ir para lições práticas</Button>
        </Card>
      </div>
    );
  }

  const progress = ((currentSection + 1) / sections.length) * 100;
  const currentSectionAvatarId = sections[currentSection]?.avatar_id || 1;
  const avatarSrc = `/mascot/person_${currentSectionAvatarId}.png`;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
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
                  onClick={() => {
                    const progress = location.state?.lessonProgress;
                    if (progress)
                      localStorage.setItem(`lessonProgress_${topicId}`, JSON.stringify(progress));
                    stopAudio();
                    navigate(`/lesson/${topicId}`, { state: { resumeProgress: progress } });
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para prática
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSkipTheory}>
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

      {/* Conteúdo principal */}
      <div
        ref={scrollContainerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory pt-20"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {sections.map((section, index) => (
          <div key={section.id} className="h-screen snap-start flex items-center justify-center p-4">
            <Card className="max-w-3xl w-full p-8 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                {section.image_url && (
                  <img src={section.image_url} alt={section.title} className="w-full rounded-lg" />
                )}
                <div className="prose prose-sm sm:prose-base max-w-none text-foreground/80 leading-relaxed">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>

              {index === sections.length - 1 ? (
                <Button onClick={handleComplete} className="w-full" size="lg">
                  {returnToLesson ? "Voltar para prática" : "Concluir teoria e ir para prática"}
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => scrollToSection(index + 1)} className="w-full">
                  Continuar
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              )}
            </Card>
          </div>
        ))}
      </div>

      {/* Avatar + áudio */}
      <div
        className="
          fixed bottom-4 left-4 z-20 flex flex-col items-center
          md:absolute md:bottom-6 md:left-[calc(50%-35rem)]
        "
      >
        <div className="mb-2">
          <button
            onClick={toggleAudio}
            className="
              relative bg-white border border-border shadow-md rounded-full
              w-10 h-10 flex items-center justify-center
              hover:bg-accent transition
            "
          >
            <Volume2
              className={`absolute w-5 h-5 text-primary transition-opacity duration-200 ${
                isAudioEnabled ? "opacity-100" : "opacity-0"
              }`}
            />
            <VolumeX
              className={`absolute w-5 h-5 text-muted-foreground transition-opacity duration-200 ${
                isAudioEnabled ? "opacity-0" : "opacity-100"
              }`}
            />
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div
            className="
              w-40 h-40 md:w-44 md:h-44
              rounded-full bg-white shadow-lg border-2 border-primary
              overflow-hidden flex items-center justify-center
            "
          >
            <img
              key={`${currentSection}-${sections[currentSection]?.avatar_id}`}
              src={avatarSrc}
              alt={`Locutor da seção ${currentSection + 1}`}
              className="object-cover w-full h-full transition-opacity duration-300 ease-in-out"
            />
          </div>

          {isAudioPlaying && (
            <img
              src="/images/audio_playing.gif"
              alt="Áudio tocando"
              className="absolute -right-12 bottom-6 w-10 h-10 animate-pulse"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TheoryLesson;
