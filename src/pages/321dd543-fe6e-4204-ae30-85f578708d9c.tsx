import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, RefreshCw, Save } from "lucide-react";

interface Profile {
  id: string;
  xp: number;
  level: number;
  streak: number;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  
  const [editData, setEditData] = useState({
    xp: 0,
    level: 1,
    streak: 0,
  });

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
      console.error("Error loading profiles:", error);
      toast.error("Erro ao carregar usuários");
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = profiles.find(p => p.id === userId);
    if (user) {
      setEditData({
        xp: user.xp,
        level: user.level,
        streak: user.streak,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        xp: editData.xp,
        level: editData.level,
        streak: editData.streak,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedUserId);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao salvar alterações");
    } else {
      toast.success("Alterações salvas com sucesso!");
      await loadProfiles();
    }
    setSaving(false);
  };

  const handleReset = async () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    if (!confirm("Tem certeza que deseja resetar completamente este usuário? Esta ação não pode ser desfeita.")) {
      return;
    }

    setResetting(true);

    try {
      // Reset profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          xp: 0,
          level: 1,
          streak: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUserId);

      if (profileError) throw profileError;

      // Delete topic progress
      const { error: topicError } = await supabase
        .from("topic_progress")
        .delete()
        .eq("user_id", selectedUserId);

      if (topicError) throw topicError;

      // Delete daily progress
      const { error: dailyError } = await supabase
        .from("daily_progress")
        .delete()
        .eq("user_id", selectedUserId);

      if (dailyError) throw dailyError;

      // Delete module progress
      const { error: moduleError } = await supabase
        .from("module_progress")
        .delete()
        .eq("user_id", selectedUserId);

      if (moduleError) throw moduleError;

      toast.success("Usuário resetado com sucesso!");
      
      // Reload data
      await loadProfiles();
      setEditData({
        xp: 0,
        level: 1,
        streak: 0,
      });
    } catch (error) {
      console.error("Error resetting user:", error);
      toast.error("Erro ao resetar usuário");
    }

    setResetting(false);
  };

  const selectedUser = profiles.find(p => p.id === selectedUserId);

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
                {/* User Selection */}
                <div className="space-y-2">
                  <Label htmlFor="user-select">Selecionar Usuário</Label>
                  <Select value={selectedUserId} onValueChange={handleUserSelect}>
                    <SelectTrigger id="user-select" className="w-full">
                      <SelectValue placeholder="Escolha um usuário..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.id} (Level {profile.level}, {profile.xp} XP)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <>
                    {/* User Info */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong>ID:</strong> {selectedUser.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Criado em:</strong> {new Date(selectedUser.created_at).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Última atividade:</strong> {selectedUser.last_active ? new Date(selectedUser.last_active).toLocaleString('pt-BR') : 'Nunca'}
                      </p>
                    </div>

                    {/* Edit Form */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="xp">XP</Label>
                        <Input
                          id="xp"
                          type="number"
                          value={editData.xp}
                          onChange={(e) => setEditData({ ...editData, xp: parseInt(e.target.value) || 0 })}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="level">Nível</Label>
                        <Input
                          id="level"
                          type="number"
                          value={editData.level}
                          onChange={(e) => setEditData({ ...editData, level: parseInt(e.target.value) || 1 })}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="streak">Streak</Label>
                        <Input
                          id="streak"
                          type="number"
                          value={editData.streak}
                          onChange={(e) => setEditData({ ...editData, streak: parseInt(e.target.value) || 0 })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
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
                            Salvar Alterações
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
