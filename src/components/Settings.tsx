import React from 'react';
import { User, Bell, Shield, SlidersHorizontal, Mail, BellRing, BarChart2, Lock, Smartphone, Monitor, ChevronRight, Edit2, Users, Eye, EyeOff, X } from 'lucide-react';
import { USER_ME } from '../data';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { supabase, mapUserToDb } from '../lib/supabase';
import { CustomSelect } from './CustomSelect';

const sectionOptions = [
  { value: 'AAJ', label: 'AAJ' },
  { value: 'SIJ', label: 'SIJ' },
  { value: 'AJUR', label: 'AJUR' },
];

const accessLevelOptions = [
  { value: 'gestor', label: 'Gestor AAJ' },
  { value: 'operador-chefe', label: 'Operador Chefe' },
  { value: 'operador', label: 'Operador' },
];

const statusOptions = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
];

export function Settings() {
  const [activeTab, setActiveTab] = React.useState('perfil');

  // Simulation form states
  const [name, setName] = React.useState(USER_ME.name);
  const [role, setRole] = React.useState(USER_ME.role);
  const [accessLevel, setAccessLevel] = React.useState(USER_ME.accessLevel);
  const [section, setSection] = React.useState(USER_ME.section);
  const [online, setOnline] = React.useState(USER_ME.online || false);
  const [avatar, setAvatar] = React.useState(USER_ME.avatar);
  const [avatarZoom, setAvatarZoom] = React.useState<number>((USER_ME as any).avatarZoom || 100);
  const [password, setPassword] = React.useState(USER_ME.password || '');

  const [emailNotif, setEmailNotif] = React.useState(() => {
    const saved = localStorage.getItem(`notif_email_${USER_ME.id}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [pushNotif, setPushNotif] = React.useState(() => {
    const saved = localStorage.getItem(`notif_push_${USER_ME.id}`);
    return saved !== null ? saved === 'true' : true;
  });
  const [weeklyNotif, setWeeklyNotif] = React.useState(() => {
    const saved = localStorage.getItem(`notif_weekly_${USER_ME.id}`);
    return saved !== null ? saved === 'true' : false;
  });

  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setSystemTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const { team: dbUsers, refreshAll, updateUser } = useData();
  const [editingUser, setEditingUser] = React.useState<any | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editRole, setEditRole] = React.useState('');
  const [editAccessLevel, setEditAccessLevel] = React.useState<'gestor' | 'operador-chefe' | 'operador'>('operador');
  const [editSection, setEditSection] = React.useState<'AAJ' | 'SIJ' | 'AJUR'>('AAJ');
  const [editUsername, setEditUsername] = React.useState('');
  const [editPassword, setEditPassword] = React.useState('');
  const [editAvatar, setEditAvatar] = React.useState('');
  const [editAvatarZoom, setEditAvatarZoom] = React.useState(100);
  const editFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          callback(dataUrl);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, (base64) => {
      setEditAvatar(base64);
    });
  };

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditRole(u.role || '');
    setEditAccessLevel(u.accessLevel || 'operador');
    setEditSection(u.section || 'AAJ');
    setEditUsername(u.username || '');
    setEditPassword(u.password || '');
    setEditAvatar(u.avatar || '');
    setEditAvatarZoom(u.avatarZoom || 100);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    
    const updatedUser = {
      ...editingUser,
      name: editName,
      role: editRole,
      accessLevel: editAccessLevel,
      section: editSection,
      username: editUsername,
      password: editPassword,
      avatar: editAvatar,
      avatarZoom: editAvatarZoom,
      createdBy: editingUser.createdBy || (USER_ME.accessLevel === 'operador-chefe' ? USER_ME.id : undefined)
    };

    if (updateUser) {
      updateUser(updatedUser);
    }

    setEditingUser(null);
  };

  const handleResetPassword = async (u: any) => {
    if (!u.username) {
      alert("Não é possível solicitar redefinição de senha para militares sem usuário/email cadastrado.");
      return;
    }
    const email = u.username.includes('@') ? u.username : `${u.username}@sisjur.afa`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      alert(`Erro ao solicitar redefinição: ${error.message}`);
    } else {
      alert(`Link de redefinição de senha enviado com sucesso para ${email}`);
    }
  };

  // Registered users list from database with default fallback
  const systemUsers = dbUsers.length > 0 ? dbUsers : [
    {
      username: 'admin',
      password: 'admin',
      id: 'me',
      name: 'Rodrigo Silva',
      role: 'Diretor AAJ',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80',
      online: true,
      accessLevel: 'gestor',
      section: 'AAJ'
    }
  ];

  const [visiblePasswords, setVisiblePasswords] = React.useState<string[]>([]);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, (base64) => {
      setAvatar(base64);
    });
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    ...(USER_ME.accessLevel === 'gestor' || USER_ME.accessLevel === 'operador-chefe'
      ? [{ id: 'usuarios', label: 'Usuários Cadastrados', icon: Users }]
      : []),
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'preferencias', label: 'Preferências', icon: SlidersHorizontal },
  ];

  const handleSave = async () => {
    try {
      if (password) {
        const { error: pwdError } = await supabase.auth.updateUser({ password });
        if (pwdError) {
          alert("Erro ao atualizar senha no Supabase Auth: " + pwdError.message);
          return;
        }
      }

      const updatedUser = {
        ...USER_ME,
        name,
        role,
        accessLevel,
        section,
        online,
        avatar,
        avatarZoom
      };

      if (updateUser) {
        await updateUser(updatedUser);
      }

      alert("Perfil atualizado com sucesso!");
    } catch (e: any) {
      console.error("Erro ao salvar perfil:", e);
      alert("Erro ao salvar perfil.");
    }
  };

  // Filter displayed users according to section access and createdBy
  const displayedUsers = systemUsers.filter(u => {
    if (u.id === USER_ME.id) return true;
    if (USER_ME.accessLevel === 'operador-chefe') {
      return u.createdBy === USER_ME.id;
    }
    if (USER_ME.accessLevel === 'operador') {
      return u.section === USER_ME.section;
    }
    return true;
  });

  return (
    <div className="animate-fade-in flex flex-col lg:flex-row gap-12 text-left">
      {/* Sidebar Nav */}
      <aside className="lg:w-72 flex-shrink-0">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-10">Configurações</h1>
        <nav className="flex flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-wider text-left transition-all flex items-center gap-4 cursor-pointer border border-transparent",
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/10"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
              )}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow max-w-5xl">
        {/* Profile / Simulator Section */}
        {activeTab === 'perfil' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-10 rounded-[2.5rem] border-white/60 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-12">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Perfil do Usuário</h2>
                <p className="text-on-surface-variant font-medium">Altere as configurações do seu perfil de usuário militar.</p>
              </div>
              <button 
                onClick={handleSave}
                className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold text-sm shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>

            <div className="flex flex-col xl:flex-row gap-16">
              <div className="flex flex-col items-center gap-6 shrink-0">
                <div className="relative w-40 h-40 group rounded-full overflow-hidden border-4 border-surface-container dark:border-slate-800 shadow-md">
                  <img 
                    src={avatar} 
                    alt="Profile" 
                    style={{ transform: `scale(${avatarZoom / 100})` }}
                    className="w-full h-full object-cover transition-transform"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-primary text-on-primary p-3 rounded-full shadow-2xl hover:scale-110 transition-transform border-4 border-white dark:border-slate-800 cursor-pointer z-10"
                    title="Alterar Foto de Perfil"
                  >
                    <Edit2 size={16} />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                {/* Zoom range slider */}
                <div className="w-40 flex flex-col gap-1.5 bg-surface-container-low dark:bg-slate-900/40 p-2.5 rounded-2xl border border-surface-container-high dark:border-slate-800/60 shadow-sm">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                    <span>Ajustar Zoom</span>
                    <span className="text-primary">{avatarZoom}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="250" 
                    value={avatarZoom} 
                    onChange={e => setAvatarZoom(Number(e.target.value))}
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest">{name}</p>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Usuário Logado</p>
                </div>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Nome Completo</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-surface-container-low/50 border border-surface-container-high dark:border-slate-800 rounded-[1.5rem] py-4 px-6 focus:ring-2 focus:ring-secondary-container focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold shadow-sm"
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Função / Cargo</label>
                  <input 
                    type="text" 
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full bg-surface-container-low/50 border border-surface-container-high dark:border-slate-800 rounded-[1.5rem] py-4 px-6 focus:ring-2 focus:ring-secondary-container focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold shadow-sm"
                  />
                </div>

                {/* Access Level */}
                <div className={cn("space-y-2 relative z-30 !overflow-visible", (USER_ME.accessLevel !== 'gestor' && USER_ME.accessLevel !== 'operador-chefe') && "opacity-65 pointer-events-none")}>
                  <CustomSelect
                    label={`Nível de Acesso ${USER_ME.accessLevel === 'operador' ? '(bloqueado)' : ''}`}
                    value={accessLevel}
                    options={accessLevelOptions}
                    onChange={val => setAccessLevel(val as any)}
                  />
                </div>

                {/* Section */}
                <div className="space-y-2 relative z-20 !overflow-visible">
                  <CustomSelect
                    label="Seção Militar"
                    value={section}
                    options={sectionOptions}
                    onChange={val => setSection(val as any)}
                  />
                </div>

                {/* Profile Status */}
                <div className={cn("space-y-2 relative z-10 !overflow-visible", (USER_ME.accessLevel !== 'gestor' && USER_ME.accessLevel !== 'operador-chefe') && "opacity-65 pointer-events-none")}>
                  <CustomSelect
                    label={`Status do Perfil ${USER_ME.accessLevel === 'operador' ? '(bloqueado)' : ''}`}
                    value={String(online)}
                    options={statusOptions}
                    onChange={val => setOnline(val === 'true')}
                  />
                </div>

                {/* Alterar Senha */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Alterar Senha</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Sua nova senha secreta"
                    className="w-full bg-surface-container-low/50 border border-surface-container-high dark:border-slate-800 rounded-[1.5rem] py-4 px-6 focus:ring-2 focus:ring-secondary-container focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Users Section */}
        {activeTab === 'usuarios' && (USER_ME.accessLevel === 'gestor' || USER_ME.accessLevel === 'operador-chefe' || USER_ME.accessLevel === 'operador') && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800/40 shadow-xl flex-grow"
          >
            <div className="mb-10">
              <h2 className="text-3xl font-black tracking-tight mb-2">Usuários Cadastrados</h2>
              <p className="text-on-surface-variant font-medium">
                Visualização e edição de dados pessoais e credenciais de login dos militares cadastrados {USER_ME.accessLevel === 'operador-chefe' || USER_ME.accessLevel === 'operador' ? `na seção ${USER_ME.section}` : 'no sistema'}.
              </p>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-high dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/70">
                    <th className="pb-4 pl-4">Militar</th>
                    <th className="pb-4">Função / Seção</th>
                    <th className="pb-4">Nível Acesso</th>
                    <th className="pb-4">Login / Usuário</th>
                    <th className="pb-4">Conexão</th>
                    <th className="pb-4 pr-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40 dark:divide-slate-800/40">
                  {displayedUsers.map((u) => {
                    return (
                      <tr key={u.id} className="hover:bg-surface-container-low/30 dark:hover:bg-slate-900/10 transition-colors text-xs font-bold text-primary">
                        <td className="py-4 pl-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-surface-container-high dark:border-slate-700 flex-shrink-0">
                            <img 
                              src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
                              }}
                              alt="" 
                              style={{ transform: `scale(${u.avatarZoom ? u.avatarZoom / 100 : 1})` }}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <span className="truncate max-w-[150px]">{u.name}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px]">{u.role}</span>
                            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">{u.section}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="bg-surface-container dark:bg-slate-800 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-on-surface-variant">
                            {u.accessLevel === 'gestor' ? 'Gestor AAJ' : u.accessLevel === 'operador-chefe' ? 'Operador Chefe' : 'Operador'}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-[11px] text-on-surface-variant">{u.username || 'n/a'}</td>
                        <td className="py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                            u.online 
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" 
                              : "bg-neutral-500/15 text-neutral-600 border-neutral-500/30"
                          )}>
                            <span className={cn("w-1 h-1 rounded-full", u.online ? "bg-emerald-500 animate-pulse" : "bg-neutral-400")} />
                            {u.online ? "Online" : "Offline"}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="p-2 hover:bg-surface-container dark:hover:bg-slate-800 rounded-full transition-all text-on-surface-variant hover:text-primary cursor-pointer inline-flex items-center justify-center"
                            title="Editar Militar"
                          >
                            <Edit2 size={14} />
                          </button>
                          {(USER_ME.accessLevel === 'gestor' || USER_ME.accessLevel === 'operador-chefe') && (
                            <button
                              onClick={() => handleResetPassword(u)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer"
                              title="Resetar Senha para 123456"
                            >
                              Resetar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {displayedUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs italic font-bold tracking-widest text-on-surface-variant/40 uppercase">
                        Nenhum usuário cadastrado encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Notifications Section */}
        {activeTab === 'notificacoes' && (
          <div className="glass-card p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800/40 shadow-lg">
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Preferências de Notificação</h2>
              <p className="text-on-surface-variant font-medium">Escolha como e quando deseja ser alertado sobre suas atividades.</p>
            </div>
    
            <div className="space-y-6">
              {[
                { 
                  title: 'E-mail', 
                  desc: 'Receba resumos de atividades importantes em sua caixa de entrada.', 
                  icon: Mail, 
                  checked: emailNotif,
                  onChange: (val: boolean) => {
                    setEmailNotif(val);
                    localStorage.setItem(`notif_email_${USER_ME.id}`, String(val));
                  }
                },
                { 
                  title: 'Push Notifications', 
                  desc: 'Alertas em tempo real no navegador ou dispositivo móvel.', 
                  icon: BellRing, 
                  checked: pushNotif,
                  onChange: (val: boolean) => {
                    setPushNotif(val);
                    localStorage.setItem(`notif_push_${USER_ME.id}`, String(val));
                  }
                },
                { 
                  title: 'Relatórios Semanais', 
                  desc: 'Compilado detalhado de performance e métricas de segunda-feira.', 
                  icon: BarChart2, 
                  checked: weeklyNotif,
                  onChange: (val: boolean) => {
                    setWeeklyNotif(val);
                    localStorage.setItem(`notif_weekly_${USER_ME.id}`, String(val));
                  }
                },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-surface-container-low/30 hover:bg-surface-container-low/50 transition-all border border-white/40 dark:border-slate-800/40 group">
                  <div className="flex gap-6 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm group-hover:scale-105 transition-transform">
                      <row.icon size={26} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-lg text-primary">{row.title}</p>
                      <p className="text-xs font-medium text-on-surface-variant leading-relaxed">{row.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={row.checked} 
                      onChange={e => row.onChange(e.target.checked)}
                    />
                    <div className="w-14 h-8 bg-surface-dim peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:start-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary transition-all"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Section */}
        {activeTab === 'seguranca' && (
          <div className="glass-card p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800/40 shadow-lg">
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Segurança e Acesso</h2>
              <p className="text-on-surface-variant font-medium">Controle as opções de segurança da sua conta.</p>
            </div>
    
            <div className="space-y-6">
              {[
                { title: 'Autenticação de Dois Fatores (2FA)', desc: 'Adicione uma camada extra de segurança ao seu login utilizando o celular.', icon: Smartphone, enabled: true },
                { title: 'Gerenciar Sessões Ativas', desc: 'Monitore os computadores e dispositivos móveis conectados à sua conta.', icon: Monitor, enabled: false },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-surface-container-low/30 hover:bg-surface-container-low/50 transition-all border border-white/40 dark:border-slate-800/40 group">
                  <div className="flex gap-6 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary-container shadow-sm group-hover:scale-105 transition-transform">
                      <row.icon size={26} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-lg text-primary">{row.title}</p>
                      <p className="text-xs font-medium text-on-surface-variant leading-relaxed">{row.desc}</p>
                    </div>
                  </div>
                  <button className="px-5 py-2.5 bg-surface-container-high dark:bg-slate-800 hover:bg-primary hover:text-on-primary transition-all text-xs font-black uppercase tracking-wider rounded-2xl cursor-pointer">
                    {row.enabled ? 'Desativar' : 'Configurar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences Section */}
        {activeTab === 'preferencias' && (
          <div className="glass-card p-10 rounded-[2.5rem] border-white/60 dark:border-slate-800/40 shadow-lg">
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight mb-2">Preferências do Sistema</h2>
              <p className="text-on-surface-variant font-medium">Personalize seu ambiente de trabalho.</p>
            </div>
    
            <div className="space-y-6">
              {/* Tema (Aparência) */}
              <div className="p-6 rounded-3xl bg-surface-container-low/30 border border-white/40 dark:border-slate-800/40 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-black text-lg text-primary">Tema do Sistema</p>
                    <p className="text-xs font-medium text-on-surface-variant">Selecione a aparência clara ou escura para a interface.</p>
                  </div>
                  <select 
                    value={systemTheme}
                    onChange={e => handleThemeChange(e.target.value as 'light' | 'dark')}
                    className="bg-surface-container dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                  >
                    <option value="light">Modo Claro</option>
                    <option value="dark">Modo Escuro</option>
                  </select>
                </div>
              </div>

              {/* Idioma */}
              <div className="p-6 rounded-3xl bg-surface-container-low/30 border border-white/40 dark:border-slate-800/40 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-black text-lg text-primary">Idioma Padrão</p>
                    <p className="text-xs font-medium text-on-surface-variant">Idioma de exibição do painel principal.</p>
                  </div>
                  <select className="bg-surface-container dark:bg-slate-800 border-none rounded-2xl px-5 py-3 text-sm font-bold text-primary focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer">
                    <option>Português (BR)</option>
                    <option>English (US)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl space-y-6 text-left"
          >
            <div className="flex justify-between items-center pb-4 border-b border-surface-container-high dark:border-slate-800/60">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Dados do Militar</h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-full transition-all text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 pb-4">
                <div className="relative w-28 h-28 group rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-md">
                  <img 
                    src={editAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80'} 
                    alt="Profile" 
                    style={{ transform: `scale(${editAvatarZoom / 100})` }}
                    className="w-full h-full object-cover transition-transform"
                  />
                  <button 
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 bg-primary text-on-primary p-2 rounded-full shadow-2xl hover:scale-110 transition-transform border-2 border-white dark:border-slate-800 cursor-pointer z-10"
                    title="Alterar Foto de Perfil"
                  >
                    <Edit2 size={12} />
                  </button>
                  <input 
                    type="file"
                    ref={editFileInputRef}
                    onChange={handleEditAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="w-40 flex flex-col gap-1">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                    <span>Zoom da Foto</span>
                    <span className="text-primary">{editAvatarZoom}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="250" 
                    value={editAvatarZoom} 
                    onChange={e => setEditAvatarZoom(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-2">Nome Completo</label>
                <input 
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-primary text-slate-850 dark:text-slate-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-2">Posto / Graduação / Função</label>
                <input 
                  type="text"
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-primary text-slate-850 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end !overflow-visible relative z-30">
                <CustomSelect
                  label="Nível de Acesso"
                  value={editAccessLevel}
                  options={accessLevelOptions}
                  onChange={val => setEditAccessLevel(val as any)}
                  className="py-1"
                  variant="modal"
                />
                <CustomSelect
                  label="Seção"
                  value={editSection}
                  options={sectionOptions}
                  onChange={val => setEditSection(val as any)}
                  className="py-1"
                  variant="modal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 items-end !overflow-visible relative z-20">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-2">Usuário / Login</label>
                  <input 
                    type="text"
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-primary text-slate-850 dark:text-slate-200"
                  />
                </div>
                <CustomSelect
                  label="Status da Conta"
                  value={String(editingUser?.online)}
                  options={statusOptions}
                  onChange={val => {
                    setEditingUser((prev: any) => ({ ...prev, online: val === 'true' }));
                  }}
                  className="py-1"
                  variant="modal"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setEditingUser(null)}
                className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-850 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSaveEdit}
                className="flex-1 py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 transition-all font-bold text-sm cursor-pointer"
              >
                Salvar Registro
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
