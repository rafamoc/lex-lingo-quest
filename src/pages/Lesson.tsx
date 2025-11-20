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

/* ===============================
   QUESTION BANK (HARDCODED)
   =============================== */

// Questões para TODOS os tópicos (menos compensação)
const genericQuestions: Question[] = [
  {
    id: 1,
    question: "Qual das opções abaixo NÃO é uma fonte de obrigação no Direito Civil?",
    options: ["Contrato", "Ato ilícito", "Declaração de vontade unilateral", "Sentença penal condenatória"],
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

const compensacaoQuestions: Question[] = [
  {
    id: 101,
    question: "O que é compensação no Direito das Obrigações?",
    options: [
      "Modalidade de novação",
      "Forma de pagamento indireto que extingue obrigações recíprocas",
      "Redução proporcional da dívida mediante acordo",
      "Substituição do devedor por terceiro",
    ],
    correctAnswer: 1,
    explanation:
      "A compensação extingue obrigações quando duas pessoas são ao mesmo tempo credoras e devedoras entre si, funcionando como pagamento indireto.",
  },
  {
    id: 102,
    question: "Quais são os requisitos da compensação legal?",
    options: [
      "Dívidas vencidas, líquidas e de coisas fungíveis",
      "Acordo prévio entre as partes",
      "Origem contratual idêntica",
      "Autorização judicial",
    ],
    correctAnswer: 0,
    explanation:
      "A compensação legal exige créditos líquidos, vencidos e de coisas fungíveis (art. 368 do CC).",
  },
  {
    id: 103,
    question: "Qual situação abaixo representa compensação?",
    options: [
      "A paga R$ 500 para B no vencimento",
      "A perdoa a dívida de B",
      "A deve R$ 300 para B e B deve R$ 300 para A",
      "A transfere um crédito para C",
    ],
    correctAnswer: 2,
    explanation:
      "Se A e B são reciprocamente credores e devedores em valores equivalentes, ocorre compensação e ambas as dívidas se extinguem.",
  },

  // ---------------------------
  // NOVAS QUESTÕES (9)
  // ---------------------------

  {
    id: 104,
    question: "A compensação legal só ocorre quando as dívidas forem:",
    options: [
      "Prescritas, incertas e futuras",
      "Vencidas, líquidas e de coisas fungíveis",
      "Condicionais e ilíquidas",
      "De bens infungíveis",
    ],
    correctAnswer: 1,
    explanation:
      "A compensação legal exige dívidas vencidas, líquidas e de coisas fungíveis (art. 368 do CC).",
  },
  {
    id: 105,
    question:
      "Complete: a compensação pode ser aplicada a dívidas _______, líquidas e de bens _________.",
    options: [
      "vencidas — fungíveis",
      "líquidas — infungíveis",
      "prescritas — móveis",
      "condicionais — imóveis",
    ],
    correctAnswer: 0,
    explanation:
      "A compensação legal exige créditos vencidos, líquidos e de coisas fungíveis.",
  },
  {
    id: 106,
    question: "Qual tipo de compensação depende da vontade das partes?",
    options: [
      "Compensação legal",
      "Compensação convencional",
      "Compensação judicial",
      "Compensação extrajudicial",
    ],
    correctAnswer: 1,
    explanation:
      "A compensação convencional decorre de acordo entre as partes, mesmo quando não estão presentes todos os requisitos da compensação legal.",
  },
  {
    id: 107,
    question: "A compensação NÃO poderá ocorrer quando:",
    options: [
      "As dívidas forem de alimentos",
      "As dívidas forem vencidas e líquidas",
      "Ambas as dívidas forem de dinheiro",
      "As partes forem reciprocamente credoras",
    ],
    correctAnswer: 0,
    explanation:
      "O art. 373 do CC veda a compensação em obrigações de alimentos e outras de natureza especial.",
  },
  {
    id: 108,
    question: "Quando a compensação é declarada pelo juiz durante um processo, chama-se:",
    options: [
      "Compensação legal",
      "Compensação convencional",
      "Compensação judicial",
      "Compensação extrajudicial",
    ],
    correctAnswer: 2,
    explanation:
      "Na compensação judicial, a extinção das dívidas ocorre por decisão judicial ao reconhecer créditos recíprocos durante um processo.",
  },
  {
    id: 109,
    question:
      "Se A deve R$ 1.000 para B, e B deve R$ 700 para A, qual será o resultado após a compensação?",
    options: [
      "Ambas as dívidas se extinguem totalmente",
      "A ainda deverá R$ 300 para B",
      "B deverá R$ 300 para A",
      "Nenhuma compensação é possível",
    ],
    correctAnswer: 1,
    explanation:
      "A compensação extingue as dívidas até o limite da menor. Assim, extinguem-se R$ 700 e sobra um saldo de R$ 300 que A deve pagar a B.",
  },
  {
    id: 110,
    question: "A compensação pode ocorrer automaticamente, sem manifestação das partes?",
    options: [
      "Sim, na compensação legal",
      "Sim, sempre que houver dívidas recíprocas",
      "Não, nunca",
      "Somente com autorização judicial",
    ],
    correctAnswer: 0,
    explanation:
      "A compensação legal opera automaticamente, desde que presentes os requisitos do art. 368 do CC.",
  },
  {
    id: 111,
    question:
      "Qual das situações abaixo NÃO permite compensação, segundo o Código Civil?",
    options: [
      "Dívidas de jogo lícito",
      "Dívidas vencidas e líquidas",
      "Dívidas de alimentos",
      "Dívidas de dinheiro",
    ],
    correctAnswer: 2,
    explanation:
      "Dívidas de alimentos não podem ser compensadas (art. 373).",
  },
  {
    id: 112,
    question: "A compensação pode ser parcial?",
    options: [
      "Não, sempre extingue toda a dívida",
      "Sim, quando os valores das dívidas forem diferentes",
      "Sim, mas somente na compensação judicial",
      "Não, somente total",
    ],
    correctAnswer: 1,
    explanation:
      "Se os valores forem diferentes, a compensação extingue apenas até o limite da menor obrigação, restando saldo devedor (art. 369).",
  },
];


/* ===============================
   SELECT QUESTION SET BY TOPIC
   =============================== */
const getQuestionsFor = (topicId: number): Question[] => {
  if (topicId === 23) {
    return compensacaoQuestions; // somente compensação
  }
  return genericQuestions; // todos os demais tópicos
};

const Lesson = () => {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const location = useLocation();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);

  const topicIdNum = parseInt(topicId || "0");

  /* ===============================
      Load correct question bank
     =============================== */
  useEffect(() => {
    const chosen = getQuestionsFor(topicIdNum);
    setQuestions(chosen);
  }, [topicIdNum]);

  /* ===============================
      Restore lesson progress
     =============================== */
  useEffect(() => {
    if (location.state?.resumeProgress) {
      const saved = location.state.resumeProgress;

      setCurrentQuestion(saved.currentQuestion);
      setSelectedAnswer(saved.selectedAnswer);
      setCorrectAnswers(saved.correctAnswers);
      setShowFeedback(saved.showFeedback);

      localStorage.removeItem(`lessonProgress_${topicIdNum}`);
      return;
    }

    const savedLocal = localStorage.getItem(`lessonProgress_${topicIdNum}`);
    if (savedLocal) {
      const saved = JSON.parse(savedLocal);
      setCurrentQuestion(saved.currentQuestion);
      setSelectedAnswer(saved.selectedAnswer);
      setCorrectAnswers(saved.correctAnswers);
      setShowFeedback(saved.showFeedback);
      localStorage.removeItem(`lessonProgress_${topicIdNum}`);
    }
  }, [location.state, topicIdNum]);

  /* ===============================
      Auth check
     =============================== */
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate("/auth");
    };
    checkAuth();
  }, [navigate]);

  if (questions.length === 0) {
    return <div className="p-6 text-center">Carregando questões...</div>;
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isCorrect = selectedAnswer === question.correctAnswer;

  /* ===============================
      Handlers
     =============================== */
  const handleAnswerSelect = (index: number) => {
    if (!showFeedback) setSelectedAnswer(index);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;

    setShowFeedback(true);
    setAnsweredQuestions(prev => prev + 1);

    if (isCorrect) {
      correctSound.currentTime = 0;
      correctSound.play().catch(() => {});
      setCorrectAnswers(prev => prev + 1);

      toast.success("Correto! 🎉", {
        description: "+10 XP",
      });
    } else {
      wrongSound.currentTime = 0;
      wrongSound.play().catch(() => {});
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
      return;
    }
  
    // ========================
    // FINAL DA LIÇÃO
    // ========================
  
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate("/auth");
  
    const xpEarned = correctAnswers * 10;
  
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
  
    if (profile) {
      const newXP = profile.xp + xpEarned;
      const newLevel = Math.floor(newXP / 300) + 1;
  
      await supabase
        .from("profiles")
        .update({
          xp: newXP,
          level: newLevel,
          last_active: new Date().toISOString(),
        })
        .eq("id", session.user.id);
  
      await updateDailyProgress(xpEarned);
  
      const { data: existingProgress } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("topic_id", topicIdNum)
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
            topic_id: topicIdNum,
            lessons_completed: 1,
          });
      }
    }
  
    // 🔥 RESTAURADO: pegar o track_id para redirecionar corretamente
    const { data: topicData } = await supabase
      .from("topics")
      .select("track_id")
      .eq("id", topicIdNum)
      .single();
  
    navigate("/lesson-complete", {
      state: {
        xpEarned,
        trackId: topicData?.track_id ?? null,
      },
    });
  };
  



  /* ===============================
      UI
     =============================== */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
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

                localStorage.setItem(`lessonProgress_${topicIdNum}`, JSON.stringify(progress));

                navigate(`/theory/${topicIdNum}`, {
                  state: { returnToLesson: true, lessonProgress: progress },
                });
              }}
            >
              📘 Revisar teoria
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="animate-slide-in-up">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-8">{question.question}</h2>

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
                      <span className="font-medium">{option}</span>
                      {showCorrect && <CheckCircle2 className="w-6 h-6 text-success" />}
                      {showIncorrect && <XCircle className="w-6 h-6 text-destructive" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div
                className={`mt-6 p-4 rounded-xl ${
                  isCorrect ? "bg-success/10" : "bg-destructive/10"
                } animate-slide-in-up`}
              >
                <p className="font-medium mb-2">
                  {isCorrect ? "✓ Excelente!" : "✗ Não é bem assim..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {question.explanation}
                </p>
              </div>
            )}

            <div className="mt-8">
              {!showFeedback ? (
                <Button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswer === null}
                  className="w-full h-12 text-base font-semibold"
                >
                  Verificar Resposta
                </Button>
              ) : (
                <Button onClick={handleNextQuestion} className="w-full h-12 text-base font-semibold">
                  {currentQuestion < questions.length - 1 ? "Próxima Pergunta" : "Finalizar Lição"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

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
