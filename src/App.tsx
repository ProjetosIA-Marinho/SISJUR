import React from 'react';
import { ViewType } from './types';
import { USER_ME } from './data';
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

export default function App() {
  const [currentView, setCurrentView] = React.useState<ViewType>('dashboard');
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('is_authenticated') === 'true';
    }
    return false;
  });

  const [activeUser, setActiveUser] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_me');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return USER_ME;
  });

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

  if (!isAuthenticated) {
    return (
      <Login 
        onLoginSuccess={(user) => {
          setActiveUser(user);
          setIsAuthenticated(true);
          window.location.reload();
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

