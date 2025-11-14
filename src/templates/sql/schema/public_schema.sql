-- Create public schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Set search path to public
SET search_path TO public;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password VARCHAR(500) NOT NULL,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default admin user if not exists
-- Default password is 'admin@123' (hashed with bcrypt, cost factor 10)
INSERT INTO public.users (role, name, email, password, active)
VALUES (
    'admin',
    'Admin',
    'admin@example.com',
    '$2b$12$OYTClY.f48N7XNZd50kCDOfFXiGPmEpPnZ9pcBhI9zxcGDKpagHlu', -- admin@123
    true
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres; -- Replace with your database user if different
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres; -- Replace with your database user if different
