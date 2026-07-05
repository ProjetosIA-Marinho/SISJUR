import React from 'react';
import { LayoutDashboard, Columns3, ListTodo, GanttChartSquare, Calendar as CalendarIcon, BarChart3, Settings, Search, Bell, Menu, Sun, Moon, Users, LogOut } from 'lucide-react';
import { ViewType, User } from '../types';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';
import logoImage from '../login_logo.png';

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
                  src={m.avatar} 
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
            <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest"></span>
            </button>
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
              onClick={() => {
                localStorage.removeItem('is_authenticated');
                localStorage.removeItem('user_me');
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
                src={user.avatar} 
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
