-- Add theory tracking fields to topic_progress
ALTER TABLE public.topic_progress 
ADD COLUMN theory_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN theory_skipped BOOLEAN NOT NULL DEFAULT false;

-- Create theory_sections table to store theory content
CREATE TABLE public.theory_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theory_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can view theory sections
CREATE POLICY "Anyone can view theory sections" 
ON public.theory_sections 
FOR SELECT 
USING (true);