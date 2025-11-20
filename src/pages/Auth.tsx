import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      authSchema.parse({ email, password });

      if (isLogin) {
        // ---- LOGIN ----
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Login realizado com sucesso!");
      } else {
        // ---- CADASTRO ----
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success("Conta criada com sucesso!");

        // Aguarda sessão e configura progresso inicial
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userId = session.user.id;

          try {
            // 1️⃣ Marca as trilhas 1–5 como concluídas
            const completedTopicIds = [
              // Trilha 1
              1, 2, 3, 4, 5,
              // Trilha 2
              6, 7,
              // Trilha 3
              8, 9, 10,
              // Trilha 4
              11, 12, 13, 14, 15,
              // Trilha 5
              16, 17
            ];

            for (const topicId of completedTopicIds) {
              await supabase
                .from("topic_progress")
                .upsert({
                  user_id: userId,
                  topic_id: topicId,
                  lessons_completed: 10, // marca todas as lições como concluídas
                  theory_completed: true,
                  theory_skipped: true,
                }, { onConflict: "user_id,topic_id" });
            }

            // 2️⃣ Cria progresso desbloqueado na trilha 6 (Compensação)
            await supabase
              .from("topic_progress")
              .upsert({
                user_id: userId,
                topic_id: 23, // Compensação
                lessons_completed: 0,
                theory_completed: false,
                theory_skipped: false,
              }, { onConflict: "user_id,topic_id" });

            toast.success("Progresso inicial configurado!");
          } catch (err) {
            console.error("Erro ao configurar progresso inicial:", err);
            toast.error("Erro ao preparar progresso inicial.");
          }
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">LexLingo</h1>
          </div>
          <CardTitle>{isLogin ? "Entrar" : "Criar Conta"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Entre para continuar seus estudos"
              : "Crie sua conta para começar a aprender"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Entre"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
