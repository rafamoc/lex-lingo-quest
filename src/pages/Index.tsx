import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, BookOpen, Trophy, Zap, Target, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Lições Curtas",
      description: "Aprenda em sessões de 5-10 minutos, perfeito para o seu dia a dia",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Gamificação",
      description: "Ganhe XP, conquiste medalhas e acompanhe seu progresso",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Feedback Instantâneo",
      description: "Aprenda com seus erros através de explicações detalhadas",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Conteúdo Focado",
      description: "Material direto ao ponto para concursos e OAB",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Aprendizado Efetivo",
      description: "Método comprovado de repetição espaçada",
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Totalmente Gratuito",
      description: "Acesso completo ao conteúdo sem custo",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6 animate-bounce-subtle">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Scale className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 animate-slide-in-up">
            Aprenda Direito das Obrigações
            <span className="block text-primary mt-2">de forma gamificada</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-in-up">
            Domine o Direito Civil com lições interativas, curtas e divertidas. 
            Perfeito para estudantes e concurseiros que querem aprender de forma eficiente.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in-up">
            <Button
              size="lg"
              className="text-lg h-14 px-8 font-semibold"
              onClick={() => navigate("/auth")}
            >
              Começar Agora Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg h-14 px-8 font-semibold"
            >
              Como Funciona
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Por que escolher o LexLingo?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary/50"
            >
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Como funciona?
        </h2>
        
        <div className="space-y-8">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Escolha seu módulo
              </h3>
              <p className="text-muted-foreground">
                Comece pelos fundamentos ou escolha tópicos específicos do Direito das Obrigações
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Complete as lições
              </h3>
              <p className="text-muted-foreground">
                Responda perguntas de múltipla escolha e receba feedback instantâneo com explicações detalhadas
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Ganhe XP e evolua
              </h3>
              <p className="text-muted-foreground">
                Acumule pontos de experiência, mantenha sua sequência diária e desbloqueie novos módulos
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="text-lg h-14 px-8 font-semibold"
            onClick={() => navigate("/auth")}
          >
            Começar a Aprender Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Scale className="w-5 h-5" />
            <span className="font-semibold">LexLingo</span>
            <span>•</span>
            <span>Aprenda Direito de forma gamificada</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
