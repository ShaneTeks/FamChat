-- Add weather_widget column to messages table
-- This column stores weather widget data as JSONB for messages that include weather information

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS weather_widget JSONB;

-- Add comment to document the column
COMMENT ON COLUMN public.messages.weather_widget IS 'Weather widget data containing location, temperature, conditions, and styling information';
