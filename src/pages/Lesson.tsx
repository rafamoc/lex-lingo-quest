import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateDailyProgress } from "@/hooks/useDailyGoal";

const correctSound = new Audio("/sounds/correct_answer.mp3");
const wrongSound = new Audio("/sounds/wrong_answer.mp3");

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: "Qual das opções abaixo NÃO é uma fonte de obrigação no Direito Civil?",
    options: [
      "Contrato",
      "Ato ilícito",
      "Declaração de vontade unilateral",
      "Sentença penal condenatória",
    ],
    correctAnswer: 3,
    explanation:
      "A sentença penal condenatória não é considerada uma fonte de obrigação no Direito Civil. As principais fontes são: contratos, atos ilícitos e declaração de vontade unilateral.",
  },
  {
    id: 2,
    question: "O que caracteriza uma obrigação de dar coisa certa?",
    options: [
      "Entrega de qualquer bem do mesmo gênero",
      "Prestação de um serviço específico",
      "Entrega de um bem determinado e individualizado",
      "Abstenção de determinado ato",
    ],
    correctAnswer: 2,
    explanation:
      "A obrigação de dar coisa certa é caracterizada pela entrega de um bem determinado e individualizado, como um carro específico ou um imóvel determinado.",
  },
  {
    id: 3,
    question: "O que é mora do devedor?",
    options: [
      "Impossibilidade de cumprir a obrigação",
      "Cumprimento da obrigação antes do prazo",
      "Descumprimento culposo da obrigação no tempo devido",
      "Recusa do credor em receber a prestação",
    ],
    correctAnswer: 2,
    explanation:
      "A mora do devedor ocorre quando há descumprimento culposo da obrigação no tempo devido, ou seja, o devedor está em atraso no cumprimento de sua obrigação.",
  },
];

const Lesson = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Resume progress if returning from theory
  useEffect(() => {
    // Try location.state first
    if (location.state?.resumeProgress) {
      const { currentQuestion: saved, selectedAnswer: savedAnswer, correctAnswers: savedCorrect, showFeedback: savedFeedback } = location.state.resumeProgress;
      setCurrentQuestion(saved);
      setSelectedAnswer(savedAnswer);
      setCorrectAnswers(savedCorrect);
      setShowFeedback(savedFeedback);
      // Clear localStorage after restoring
      localStorage.removeItem(`lessonProgress_${topicId}`);
    } else {
      // Fallback to localStorage if location.state is not available
      const savedProgress = localStorage.getItem(`lessonProgress_${topicId}`);
      if (savedProgress) {
        const { currentQuestion: saved, selectedAnswer: savedAnswer, correctAnswers: savedCorrect, showFeedback: savedFeedback } = JSON.parse(savedProgress);
        setCurrentQuestion(saved);
        setSelectedAnswer(savedAnswer);
        setCorrectAnswers(savedCorrect);
        setShowFeedback(savedFeedback);
        localStorage.removeItem(`lessonProgress_${topicId}`);
      }
    }
  }, [location.state, topicId]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
  
    setShowFeedback(true);
    setAnsweredQuestions(prev => prev + 1);
  
    if (selectedAnswer === question.correctAnswer) {
      // toca som de acerto
      correctSound.currentTime = 0;
      correctSound.play().catch(() => {}); // evita erro se o navegador bloquear
  
      setCorrectAnswers(prev => prev + 1);
      toast.success("Correto! 🎉", {
        description: "+10 XP",
      });
    } else {
      // toca som de erro
      wrongSound.currentTime = 0;
      wrongSound.play().catch(() => {}); // idem acima
  
      toast.error("Ops! Tente novamente", {
        description: "Revise a explicação abaixo",
      });
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Save progress to database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const xpEarned = correctAnswers * 10;
      
      // Get current profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const newXP = profile.xp + xpEarned;
        const newLevel = Math.floor(newXP / 300) + 1;

        // Update profile
        await supabase
          .from("profiles")
          .update({
            xp: newXP,
            level: newLevel,
            last_active: new Date().toISOString(),
          })
          .eq("id", session.user.id);

        // Update daily progress
        await updateDailyProgress(xpEarned);

        // Update or insert topic progress
        const currentTopicId = parseInt(topicId || "1");
        const { data: existingProgress } = await supabase
          .from("topic_progress")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("topic_id", currentTopicId)
          .maybeSingle();

        if (existingProgress) {
          await supabase
            .from("topic_progress")
            .update({
              lessons_completed: existingProgress.lessons_completed + 1,
            })
            .eq("id", existingProgress.id);
        } else {
          await supabase
            .from("topic_progress")
            .insert({
              user_id: session.user.id,
              topic_id: currentTopicId,
              lessons_completed: 1,
            });
        }
      }

      // Get track_id from topic
      const { data: topicData } = await supabase
        .from("topics")
        .select("track_id")
        .eq("id", parseInt(topicId || "1"))
        .single();

      // Navigate to lesson complete screen
      navigate("/lesson-complete", { 
        state: { 
          xpEarned, 
          trackId: topicData?.track_id || 1 
        } 
      });
    }
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
          <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                // obtém o tópico atual
                const { data: topic } = await supabase
                  .from("topics")
                  .select("track_id")
                  .eq("id", parseInt(topicId))
                  .single();

                if (topic?.track_id) {
                  navigate(`/topics/${topic.track_id}`);
                } else {
                  navigate("/dashboard"); // fallback
                }
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Progress value={progress} className="h-3" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {currentQuestion + 1}/{questions.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const progress = {
                  currentQuestion,
                  selectedAnswer,
                  correctAnswers,
                  showFeedback,
                };
                // Save to localStorage as backup
                localStorage.setItem(`lessonProgress_${topicId}`, JSON.stringify(progress));
                navigate(`/theory/${topicId}`, { 
                  state: { 
                    returnToLesson: true,
                    lessonProgress: progress
                  }
                });
              }}
            >
              📘 Revisar teoria
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="animate-slide-in-up">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectOption = index === question.correctAnswer;
                const showCorrect = showFeedback && isCorrectOption;
                const showIncorrect = showFeedback && isSelected && !isCorrect;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showFeedback}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                      isSelected && !showFeedback
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : showCorrect
                        ? "border-success bg-success/10 animate-success-bounce"
                        : showIncorrect
                        ? "border-destructive bg-destructive/10"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{option}</span>
                      {showCorrect && (
                        <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 ml-2" />
                      )}
                      {showIncorrect && (
                        <XCircle className="w-6 h-6 text-destructive flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div
                className={`mt-6 p-4 rounded-xl animate-slide-in-up ${
                  isCorrect ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                <p className="font-medium text-foreground mb-2">
                  {isCorrect ? "✓ Excelente!" : "✗ Não é bem assim..."}
                </p>
                <p className="text-sm text-muted-foreground">{question.explanation}</p>
              </div>
            )}

            <div className="mt-8">
              {!showFeedback ? (
                <Button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  Verificar Resposta
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {currentQuestion < questions.length - 1
                    ? "Próxima Pergunta"
                    : "Finalizar Lição"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {answeredQuestions > 0 && (
          <div className="mt-6 flex justify-center gap-4 text-sm text-muted-foreground">
            <span>Acertos: {correctAnswers}</span>
            <span>•</span>
            <span>
              Taxa: {Math.round((correctAnswers / answeredQuestions) * 100)}%
            </span>
          </div>
        )}
      </main>
    </div>
  );
};

export default Lesson;
