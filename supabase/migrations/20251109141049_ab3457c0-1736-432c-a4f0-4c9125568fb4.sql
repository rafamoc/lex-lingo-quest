-- Create tracks table (Trilhas de Aprendizado)
CREATE TABLE public.tracks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topics table (Tópicos)
CREATE TABLE public.topics (
  id SERIAL PRIMARY KEY,
  track_id INTEGER NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  total_lessons INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table (Lições)
CREATE TABLE public.lessons (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create topic_progress table (substitui module_progress)
CREATE TABLE public.topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id INTEGER NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can read tracks, topics, lessons
CREATE POLICY "Anyone can view tracks" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Anyone can view lessons" ON public.lessons FOR SELECT USING (true);

-- RLS Policies - Users can manage their own progress
CREATE POLICY "Users can view their own progress" ON public.topic_progress 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.topic_progress 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.topic_progress 
  FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_topic_progress_updated_at
  BEFORE UPDATE ON public.topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 7 tracks
INSERT INTO public.tracks (title, description, icon, order_index) VALUES
('Fundamentos das Obrigações', 'Conceitos básicos do Direito das Obrigações', 'BookOpen', 1),
('Classificação das Obrigações', 'Tipos e categorias de obrigações', 'CheckCircle2', 2),
('Modalidades das Obrigações', 'Diferentes formas de prestação', 'Scale', 3),
('Obrigações Plurais', 'Obrigações com múltiplos sujeitos', 'Users', 4),
('Transmissão de Obrigações', 'Transferência de direitos e deveres', 'ArrowRightLeft', 5),
('Adimplemento e Extinção', 'Cumprimento e término das obrigações', 'CheckCheck', 6),
('Inadimplemento', 'Descumprimento e suas consequências', 'AlertTriangle', 7);

-- Insert topics for each track
-- Track 1: Fundamentos das Obrigações
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(1, 'Conceitos Básicos', 'Introdução aos fundamentos do Direito das Obrigações', 1, 10),
(1, 'Sujeito', 'Partes envolvidas nas relações obrigacionais', 2, 10),
(1, 'Objeto', 'O que deve ser prestado na obrigação', 3, 10),
(1, 'Prestação', 'A atividade devida pelo devedor', 4, 10),
(1, 'Adimplemento', 'O cumprimento das obrigações', 5, 10);

-- Track 2: Classificação das Obrigações
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(2, 'Simples/Compostas', 'Obrigações com uma ou mais prestações', 1, 10),
(2, 'Meio/Fim', 'Obrigações de meio e de resultado', 2, 10);

-- Track 3: Modalidades das Obrigações
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(3, 'Obrigações de Dar', 'Prestações que consistem em dar algo', 1, 10),
(3, 'Obrigações de Fazer', 'Prestações que consistem em fazer algo', 2, 10),
(3, 'Obrigações de Não Fazer', 'Prestações que consistem em abstenções', 3, 10);

-- Track 4: Obrigações Plurais
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(4, 'Divisíveis', 'Obrigações que podem ser divididas', 1, 10),
(4, 'Indivisíveis', 'Obrigações que não podem ser divididas', 2, 10),
(4, 'Alternativas', 'Obrigações com prestações alternativas', 3, 10),
(4, 'Facultativas', 'Obrigações com faculdade de substituição', 4, 10),
(4, 'Solidárias', 'Obrigações com solidariedade entre partes', 5, 10);

-- Track 5: Transmissão de Obrigações
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(5, 'Cessão de Crédito', 'Transferência do direito de crédito', 1, 10),
(5, 'Assunção de Dívida', 'Transferência da obrigação de pagar', 2, 10);

-- Track 6: Adimplemento e Extinção
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(6, 'Consignação', 'Depósito judicial ou extrajudicial', 1, 10),
(6, 'Subrogação', 'Substituição do credor', 2, 10),
(6, 'Imputação', 'Determinação de qual dívida está sendo paga', 3, 10),
(6, 'Dação em Pagamento', 'Entrega de coisa diversa da devida', 4, 10),
(6, 'Novação', 'Criação de nova obrigação extinguindo a anterior', 5, 10),
(6, 'Compensação', 'Extinção de dívidas recíprocas', 6, 10);

-- Track 7: Inadimplemento
INSERT INTO public.topics (track_id, title, description, order_index, total_lessons) VALUES
(7, 'Disposições Gerais', 'Conceitos básicos do inadimplemento', 1, 10),
(7, 'Mora', 'Atraso no cumprimento da obrigação', 2, 10),
(7, 'Perdas e Danos', 'Indenização pelo descumprimento', 3, 10),
(7, 'Juros', 'Remuneração pelo atraso', 4, 10),
(7, 'Cláusula Penal', 'Penalidade pré-fixada para o inadimplemento', 5, 10);