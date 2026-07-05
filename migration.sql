-- 1. Criar a tabela profiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  access_level TEXT CHECK (access_level IN ('gestor', 'operador-chefe', 'operador')),
  section TEXT CHECK (section IN ('AAJ', 'SIJ', 'AJUR')),
  avatar TEXT,
  username TEXT UNIQUE,
  online BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Criar a tabela de log de auditoria
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS em tasks e projects
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 4. Função Helper SQL para obter privilégios
CREATE OR REPLACE FUNCTION public.get_my_access_level()
RETURNS TEXT SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT access_level FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_my_section()
RETURNS TEXT SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT section FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql;

-- 5. Políticas RLS para a tabela profiles
CREATE POLICY "Gestores podem fazer tudo em profiles" ON public.profiles
  FOR ALL USING (public.get_my_access_level() = 'gestor');

CREATE POLICY "Operadores-chefe podem ver profiles de sua seção e os que criaram" ON public.profiles
  FOR SELECT USING (
    public.get_my_access_level() = 'operador-chefe' AND (
      section = public.get_my_section() OR created_by = auth.uid()
    )
  );

CREATE POLICY "Operadores-chefe podem atualizar profiles de sua seção" ON public.profiles
  FOR UPDATE USING (
    public.get_my_access_level() = 'operador-chefe' AND section = public.get_my_section()
  );

CREATE POLICY "Qualquer usuário autenticado pode ver seu próprio perfil" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Qualquer usuário autenticado pode atualizar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- 6. Políticas RLS para a tabela tasks
CREATE POLICY "Gestores podem fazer tudo em tasks" ON public.tasks
  FOR ALL USING (public.get_my_access_level() = 'gestor');

CREATE POLICY "Operadores-chefe podem gerenciar tasks de militares de sua seção" ON public.tasks
  FOR ALL USING (
    public.get_my_access_level() = 'operador-chefe' AND (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id::text = tasks.assignee_id AND profiles.section = public.get_my_section()
      )
    )
  );

CREATE POLICY "Operadores podem ver e editar suas próprias tasks" ON public.tasks
  FOR ALL USING (
    assignee_id = auth.uid()::text
  );

-- 7. Trigger para criar o profile automaticamente ao cadastrar um usuário no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, access_level, section, avatar, username, online, created_by)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Novo Militar'),
    coalesce(new.raw_user_meta_data->>'role', 'Operador'),
    coalesce(new.raw_user_meta_data->>'access_level', 'operador'),
    coalesce(new.raw_user_meta_data->>'section', 'AAJ'),
    coalesce(new.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1535713875002?w=100&h=100&fit=crop&q=80'),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    true,
    nullif(new.raw_user_meta_data->>'created_by', '')::uuid
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Trigger para logar alterações em perfis (Auditoria)
CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, target_table, details)
  VALUES (
    auth.uid(),
    TG_OP,
    'profiles',
    jsonb_build_object(
      'old_access_level', OLD.access_level,
      'new_access_level', NEW.access_level,
      'old_section', OLD.section,
      'new_section', NEW.section,
      'target_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_changed
  AFTER UPDATE OF access_level, section ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.log_profile_changes();
