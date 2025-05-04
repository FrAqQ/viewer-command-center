
-- Enable Row Level Security on all tables
ALTER TABLE public.slaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Create a user roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = $1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for user_roles table
CREATE POLICY "Admins can manage all roles"
    ON public.user_roles
    USING (public.is_admin());

-- RLS Policies for slaves table
CREATE POLICY "Admins and operators can view slaves"
    ON public.slaves
    FOR SELECT
    USING (public.has_role('admin') OR public.has_role('operator') OR public.has_role('viewer'));

CREATE POLICY "Admins and operators can insert/update slaves"
    ON public.slaves
    FOR INSERT
    WITH CHECK (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Admins and operators can update slaves"
    ON public.slaves
    FOR UPDATE
    USING (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Only admins can delete slaves"
    ON public.slaves
    FOR DELETE
    USING (public.is_admin());

-- RLS Policies for viewers table
CREATE POLICY "All authenticated users can view viewers"
    ON public.viewers
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and operators can insert/update viewers"
    ON public.viewers
    FOR INSERT
    WITH CHECK (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Admins and operators can update viewers"
    ON public.viewers
    FOR UPDATE
    USING (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Only admins can delete viewers"
    ON public.viewers
    FOR DELETE
    USING (public.is_admin());

-- RLS Policies for proxies table
CREATE POLICY "All authenticated users can view proxies"
    ON public.proxies
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and operators can insert proxies"
    ON public.proxies
    FOR INSERT
    WITH CHECK (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Admins and operators can update proxies"
    ON public.proxies
    FOR UPDATE
    USING (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Only admins can delete proxies"
    ON public.proxies
    FOR DELETE
    USING (public.is_admin());

-- RLS Policies for commands table
CREATE POLICY "All authenticated users can view commands"
    ON public.commands
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and operators can insert commands"
    ON public.commands
    FOR INSERT
    WITH CHECK (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Admins and operators can update commands"
    ON public.commands
    FOR UPDATE
    USING (public.has_role('admin') OR public.has_role('operator'));

CREATE POLICY "Only admins can delete commands"
    ON public.commands
    FOR DELETE
    USING (public.is_admin());

-- RLS Policies for logs table
CREATE POLICY "All authenticated users can view logs"
    ON public.logs
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert logs"
    ON public.logs
    FOR INSERT
    WITH CHECK (true); -- Allow insert from system processes

CREATE POLICY "Only admins can delete logs"
    ON public.logs
    FOR DELETE
    USING (public.is_admin());

-- Create functions for logging viewer events automatically
CREATE OR REPLACE FUNCTION log_viewer_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO public.logs (level, source, message, details)
        VALUES (
            CASE 
                WHEN NEW.status = 'error' THEN 'error'
                WHEN NEW.status = 'stopped' THEN 'info'
                ELSE 'info'
            END,
            'system',
            CASE 
                WHEN NEW.status = 'error' THEN 'Viewer error: ' || COALESCE(NEW.error, 'Unknown error')
                WHEN NEW.status = 'stopped' THEN 'Viewer stopped'
                WHEN NEW.status = 'running' THEN 'Viewer started'
                ELSE 'Viewer status changed to ' || NEW.status
            END,
            jsonb_build_object(
                'viewerId', NEW.id,
                'url', NEW.url,
                'oldStatus', OLD.status,
                'newStatus', NEW.status,
                'slaveId', NEW.slave_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function for logging proxy validation failures
CREATE OR REPLACE FUNCTION log_proxy_failure()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.valid = true AND NEW.valid = false THEN
        INSERT INTO public.logs (level, source, message, details)
        VALUES (
            'warning',
            'system',
            'Proxy validation failed',
            jsonb_build_object(
                'proxyId', NEW.id,
                'address', NEW.address,
                'port', NEW.port,
                'failCount', NEW.fail_count
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS viewers_status_trigger ON public.viewers;
CREATE TRIGGER viewers_status_trigger
AFTER UPDATE ON public.viewers
FOR EACH ROW
EXECUTE FUNCTION log_viewer_status_change();

DROP TRIGGER IF EXISTS proxies_validation_trigger ON public.proxies;
CREATE TRIGGER proxies_validation_trigger
AFTER UPDATE ON public.proxies
FOR EACH ROW
EXECUTE FUNCTION log_proxy_failure();

-- Add a screenshot column to viewers if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'viewers' 
        AND column_name = 'screenshot'
    ) THEN
        ALTER TABLE public.viewers ADD COLUMN screenshot TEXT;
    END IF;
END
$$;
