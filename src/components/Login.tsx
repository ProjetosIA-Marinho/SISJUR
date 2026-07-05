import React from 'react';
import { Shield, Lock, User, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import bgImage from '../login_bg.png';
import logoImage from '../login_logo.png';
import { supabase, mapUserFromDb } from '../lib/supabase';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  theme: 'light' | 'dark';
}

export function Login({ onLoginSuccess, theme }: LoginProps) {
  // Login Form States
  const [loginUsername, setLoginUsername] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const email = loginUsername.includes('@') 
        ? loginUsername 
        : `${loginUsername.toLowerCase().trim()}@sisjur.afa`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });

      if (authError) {
        throw authError;
      }

      if (authData?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        const matchedUser = mapUserFromDb(profileData);
        onLoginSuccess(matchedUser);
        return;
      }
    } catch (err: any) {
      console.error('Falha na autenticação via Supabase:', err);
      alert('Usuário ou senha incorretos ou erro de conexão.');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-cover bg-center transition-colors duration-300"
      style={theme === 'dark' ? {
        background: 'radial-gradient(circle at top right, #1e1b4b 0%, #0f172a 50%, #020617 100%)'
      } : {
        backgroundImage: `url(${bgImage})`
      }}
    >
      {/* Dark theme blend mask overlay */}
      <div className="absolute inset-0 bg-transparent dark:bg-slate-950/20 pointer-events-none transition-colors duration-300" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-[3rem] border border-white/60 dark:border-slate-800/60 p-8 sm:p-12 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src={logoImage} className="w-28 h-28 rounded-full object-cover mb-4 border-none outline-none overflow-hidden filter drop-shadow-md" alt="SISJUR-AFA Logo" />
          <h2 className="text-3xl font-black tracking-tight text-primary">SISJUR-AFA</h2>
          <p className="text-on-surface-variant font-medium mt-1.5 text-sm">Sistema de Controle e Gestão de Demandas Jurídicas</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleLoginSubmit} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant ml-2">Login / Usuário</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input
                type="text"
                required
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="Seu usuário ou email"
                className="w-full pl-12 pr-6 py-4 bg-surface-container dark:bg-slate-800/60 border-none rounded-[1.5rem] text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/30 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant ml-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-12 pr-12 py-4 bg-surface-container dark:bg-slate-800/60 border-none rounded-[1.5rem] text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/30 font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-primary transition-colors cursor-pointer flex items-center justify-center"
                title={showPassword ? "Ocultar Senha" : "Mostrar Senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/10 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-8 cursor-pointer"
          >
            <span>Entrar no Sistema</span>
            <ChevronRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
