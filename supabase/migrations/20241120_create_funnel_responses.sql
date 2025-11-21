-- Create funnel_responses table
CREATE TABLE IF NOT EXISTS public.funnel_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    step_data JSONB NOT NULL DEFAULT '{}',
    current_step INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_funnel_responses_user_id ON public.funnel_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_funnel_responses_completed ON public.funnel_responses(completed);
CREATE INDEX IF NOT EXISTS idx_funnel_responses_created_at ON public.funnel_responses(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.funnel_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anonymous users to create funnel responses
CREATE POLICY "Allow anonymous insert" ON public.funnel_responses
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own funnel responses
CREATE POLICY "Users can read own funnels" ON public.funnel_responses
    FOR SELECT USING (
        user_id = auth.uid() OR 
        user_id IS NULL
    );

-- Allow users to update their own funnel responses
CREATE POLICY "Users can update own funnels" ON public.funnel_responses
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        user_id IS NULL
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.funnel_responses TO anon;
GRANT SELECT, INSERT, UPDATE ON public.funnel_responses TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_funnel_responses_updated_at ON public.funnel_responses;
CREATE TRIGGER update_funnel_responses_updated_at
    BEFORE UPDATE ON public.funnel_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();