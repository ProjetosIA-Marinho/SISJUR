import React from 'react';
import { ViewType } from './types';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskList } from './components/TaskList';
import { Timeline } from './components/Timeline';
import { Calendar } from './components/Calendar';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AnimatePresence, motion } from 'motion/react';
import { Login } from './components/Login';
import { supabase, mapUserFromDb } from './lib/supabase';
import { setActiveUserInMemory } from './data';
import { useData } from './context/DataContext';

export default function App() {
  const { refreshAll } = useData();
  const [currentView, setCurrentView] = React.useState<ViewType>('dashboard');
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [loadingSession, setLoadingSession] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [activeUser, setActiveUser] = React.useState<any>(null);

  const updateActiveUser = (user: any) => {
    setActiveUser(user);
    setActiveUserInMemory(user);
  };

  React.useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            updateActiveUser(mapUserFromDb(data));
            setIsAuthenticated(true);
          }
          setLoadingSession(false);
        });
      } else {
        setLoadingSession(false);
      }
    });

    // 2. Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          updateActiveUser(mapUserFromDb(data));
          setIsAuthenticated(true);
          refreshAll();
        }
      } else {
        updateActiveUser(null);
        setIsAuthenticated(false);
        refreshAll();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'kanban': return <KanbanBoard />;
      case 'tasks': return <TaskList />;
      case 'timeline': return <Timeline />;
      case 'calendar': return <Calendar />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400 font-black text-xs tracking-widest uppercase">
        Carregando Sessão...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={async (user) => {
          updateActiveUser(user);
          setIsAuthenticated(true);
          await refreshAll();
        }}
        theme={theme}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-secondary-container selection:text-on-secondary-container">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={activeUser} 
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      
      <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              duration: 0.2
            }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-surface-container-high flex flex-col sm:flex-row justify-between items-center gap-4 text-on-surface-variant/60 font-medium bg-transparent">
        <p className="text-[10px] uppercase tracking-[0.2em]">© 2026 SISJUR-AFA • Sistema Jurídico da Academia da Força Aérea</p>
        <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
          <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
          <a href="#" className="hover:text-primary transition-colors">Termos</a>
          <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          <a href="#" className="hover:text-primary transition-colors">API</a>
        </div>
      </footer>
    </div>
  );
}

