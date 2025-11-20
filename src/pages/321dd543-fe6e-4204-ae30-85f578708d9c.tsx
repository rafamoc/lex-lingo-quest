import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RefreshCw, Save } from "lucide-react";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  xp: number;
  level: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar usuários");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", selectedUserId);
    if (error) toast.error("Erro ao salvar alterações");
    else toast.success("Alterações salvas!");
    setSaving(false);
  };

  const handleReset = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    if (
      !confirm(
        "Tem certeza que deseja resetar este usuário para o estado de avanço até 'Compensação'?"
      )
    )
      return;

    setResetting(true);
    try {
      // 1️⃣ Limpa progresso anterior
      await Promise.all([
        supabase.from("topic_progress").delete().eq("user_id", selectedUserId),
        supabase.from("daily_progress").delete().eq("user_id", selectedUserId),
        supabase.from("module_progress").delete().eq("user_id", selectedUserId),
      ]);

      // 2️⃣ Atualiza o perfil com XP/nível simulando o progresso real
      const totalXP = 5100;
      const newLevel = 18; // ajustável
      const streakDays = 7;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          xp: totalXP,
          level: newLevel,
          streak: streakDays,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUserId);
      if (profileError) throw profileError;

      // 3️⃣ Marca todas as skills de 1–22 como concluídas
      const completedTopicIds = Array.from({ length: 22 }, (_, i) => i + 1);
      for (const topicId of completedTopicIds) {
        const { error } = await supabase.from("topic_progress").upsert(
          {
            user_id: selectedUserId,
            topic_id: topicId,
            lessons_completed: 10,
            theory_completed: true,
            theory_skipped: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,topic_id" }
        );
        if (error) throw error;
      }

      // 4️⃣ Cria o progresso da skill “Compensação” (id 23)
      const { error: compError } = await supabase.from("topic_progress").upsert(
        {
          user_id: selectedUserId,
          topic_id: 23,
          lessons_completed: 0,
          theory_completed: false,
          theory_skipped: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,topic_id" }
      );
      if (compError) throw compError;

      // 5️⃣ Aguarda sincronização e finaliza
      await new Promise((r) => setTimeout(r, 1200));
      toast.success("Usuário resetado para o estado pré-Compensação!");
      await loadProfiles();
    } catch (err) {
      console.error("Erro ao resetar usuário:", err);
      toast.error("Erro ao resetar usuário");
    } finally {
      setResetting(false);
    }
  };

  const selectedUser = profiles.find((p) => p.id === selectedUserId);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              Painel de Administração – Usuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="user-select">Selecionar Usuário</Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                  >
                    <SelectTrigger id="user-select" className="w-full">
                      <SelectValue placeholder="Escolha um usuário..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50 max-h-[300px]">
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.email || "Usuário"} (Lvl {profile.level} –{" "}
                          {profile.xp} XP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <>
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-6 space-y-3">
                        <h3 className="text-xl font-bold text-foreground">
                          {selectedUser.name || "Usuário sem nome"}
                        </h3>
                        <p className="text-muted-foreground">
                          {selectedUser.email}
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Nível
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              {selectedUser.level}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">XP</p>
                            <p className="text-lg font-semibold text-foreground">
                              {selectedUser.xp}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={saving || resetting}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleReset}
                        disabled={saving || resetting}
                        variant="destructive"
                        className="flex-1"
                      >
                        {resetting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resetando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Resetar Usuário
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {!selectedUserId && (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecione um usuário para editar
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
