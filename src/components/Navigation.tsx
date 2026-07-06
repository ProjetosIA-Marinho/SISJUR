import React from 'react';
import { LayoutDashboard, Columns3, ListTodo, GanttChartSquare, Calendar as CalendarIcon, BarChart3, Settings, Search, Bell, Menu, Sun, Moon, Users, LogOut } from 'lucide-react';
import { ViewType, User } from '../types';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';
import logoImage from '../login_logo.png';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  user: User;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Navigation({ currentView, onViewChange, user, theme, onThemeToggle }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { team } = useData();

  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate dynamic notifications based on user's tasks
  const notifications = React.useMemo(() => {
    const list: { id: string; text: string; time: string; type: 'warning' | 'info' | 'success' }[] = [];
    
    // Task-based notifications
    const myTasks = team.filter(t => t.assignee?.id === user.id);
    myTasks.forEach(t => {
      if (t.status === 'delayed') {
        list.push({
          id: `del-${t.id}`,
          text: `Tarefa atrasada: "${t.title}"`,
          time: 'Atrasado',
          type: 'warning'
        });
      } else if (t.status === 'in-progress' && t.dueDate) {
        const today = new Date();
        const due = new Date(t.dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 2) {
          list.push({
            id: `due-${t.id}`,
            text: `Prazo próximo (${diffDays} dias): "${t.title}"`,
            time: 'Prazo próximo',
            type: 'info'
          });
        }
      }
    });

    // Default welcome notification if empty
    if (list.length === 0) {
      list.push({
        id: 'welcome',
        text: `Bem-vindo de volta, ${user.name}! Nenhuma pendência urgente no momento.`,
        time: 'Agora',
        type: 'success'
      });
    }

    return list;
  }, [team, user]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tarefas', icon: ListTodo },
    { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
    { id: 'reports', label: 'Efetivo', icon: Users },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-container-high transition-all">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src={logoImage} className="w-9 h-9 rounded-full object-cover shadow-md" alt="SISJUR-AFA Logo" />
          <span className="font-black text-base tracking-tight text-primary hidden sm:inline">SISJUR-AFA</span>
        </div>
        
        {/* Center Side: Centered Navigation Tabs */}
        <nav className="hidden md:flex items-center justify-center gap-3 flex-grow mx-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={cn(
                "px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-transparent cursor-pointer",
                currentView === item.id 
                  ? "bg-primary text-on-primary shadow-md shadow-primary/15 scale-105" 
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
              )}
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative hidden lg:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="pl-10 pr-4 py-2 bg-surface-container-low rounded-full border-none focus:ring-2 focus:ring-secondary-container w-48 xl:w-64 text-sm transition-all text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          {/* Online Members Avatars Stack */}
          <div className="hidden md:flex items-center -space-x-2 mr-2">
            {team.filter(m => m.online).slice(0, 4).map(m => (
              <div key={m.id} className="relative group cursor-pointer" title={`${m.name} está online`}>
                <img 
                  src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`;
                  }}
                  alt={m.name} 
                  className="w-7 h-7 rounded-full border-2 border-surface-container-lowest dark:border-slate-900 object-cover hover:scale-110 hover:z-10 transition-all shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-surface-container-lowest dark:border-slate-900"></span>
              </div>
            ))}
            {team.filter(m => m.online).length > 4 && (
              <div className="w-7 h-7 rounded-full bg-surface-container-high dark:bg-slate-800 text-on-surface-variant flex items-center justify-center text-[9px] font-black border-2 border-surface-container-lowest dark:border-slate-900 shadow-sm">
                +{team.filter(m => m.online).length - 4}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button 
              onClick={onThemeToggle}
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all duration-300"
              title={theme === 'dark' ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {theme === 'dark' ? <Sun size={20} className="text-amber-400 rotate-0 transition-transform duration-500" /> : <Moon size={20} className="text-slate-700 -rotate-12 transition-transform duration-500" />}
            </button>
            <div ref={notifRef} className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all relative cursor-pointer"
                title="Notificações"
              >
                <Bell size={20} />
                {notifications.some(n => n.id !== 'welcome') && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest animate-pulse"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-surface-container-high dark:border-slate-800 p-4 z-50 text-left animate-fade-in">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-surface-container-high dark:border-slate-800">
                    <h3 className="font-black text-xs uppercase tracking-wider text-primary">Notificações</h3>
                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {notifications.length} Alertas
                    </span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 rounded-2xl bg-surface-container-low/50 dark:bg-slate-800/40 border border-transparent hover:border-primary/10 transition-all flex gap-3 items-start">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          n.type === 'warning' ? 'bg-error' : n.type === 'info' ? 'bg-blue-500' : 'bg-emerald-500'
                        )} />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold leading-snug text-slate-850 dark:text-slate-200">{n.text}</p>
                          <span className="text-[9px] text-on-surface-variant/60 font-medium block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button 
              onClick={() => onViewChange('settings')}
              className={cn(
                "p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors",
                currentView === 'settings' && "text-primary bg-surface-container"
              )}
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={async () => {
                localStorage.removeItem('is_authenticated');
                localStorage.removeItem('user_me');
                try {
                  await supabase.auth.signOut();
                } catch (e) {
                  console.error('Error signing out:', e);
                }
                window.location.href = window.location.origin + window.location.pathname;
              }}
              className="p-2 text-on-surface-variant hover:bg-surface-container hover:text-error rounded-full transition-colors cursor-pointer"
              title="Sair do Sistema"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="w-px h-6 bg-surface-container-high mx-1 hidden sm:block"></div>

          <button 
            onClick={() => onViewChange('settings')}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-surface-container-high group-hover:border-secondary transition-all flex items-center justify-center">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                }}
                alt={user.name} 
                style={{ transform: `scale(${(user as any).avatarZoom ? (user as any).avatarZoom / 100 : 1})` }}
                className="w-full h-full object-cover transition-transform"
              />
            </div>
          </button>

          <button 
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-surface-container-high bg-surface-container-lowest py-4 px-4 space-y-2 animate-fade-in">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onViewChange(item.id as ViewType);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full px-4 py-3 rounded-xl font-medium text-left flex items-center gap-3 transition-all",
                currentView === item.id 
                  ? "bg-primary text-on-primary" 
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
