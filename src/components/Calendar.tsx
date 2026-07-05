import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Users, Calendar as CalendarIcon, AlertTriangle, X, Check } from 'lucide-react';
import { USER_ME } from '../data';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataContext';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface CalendarEvent {
  id: string;
  title: string;
  dueDate: string;
  assigneeId: string | null;
  type: 'task' | 'routine' | 'holiday';
  priority?: 'high' | 'medium' | 'low' | 'urgent';
}

export function Calendar() {
  const { tasks: TASKS, team: TEAM } = useData();
  
  // Start the calendar in July 2026 since most mock tasks are dated for July 2026
  const [currentDate, setCurrentDate] = React.useState(new Date(2026, 6, 1));
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'year'>('month');
  const [selectedMainMember, setSelectedMainMember] = React.useState<string[]>([]);

  // Calendar Event States
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>([]);

  React.useEffect(() => {
    if (TEAM && TEAM.length > 0) {
      setSelectedMainMember(TEAM.filter(m => {
        if (USER_ME.accessLevel !== 'gestor') {
          return m.section === USER_ME.section;
        }
        return true;
      }).map(m => m.id));
    }
  }, [TEAM]);

  React.useEffect(() => {
    if (TASKS) {
      setCalendarEvents(TASKS.map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate || '',
        assigneeId: t.assignee?.id || null,
        type: 'task',
        priority: t.priority
      })));
    }
  }, [TASKS]);

  // Modal creation states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [newType, setNewType] = React.useState<'task' | 'routine' | 'holiday'>('task');
  const [newPriority, setNewPriority] = React.useState<'high' | 'medium' | 'low'>('medium');
  const [newAssigneeId, setNewAssigneeId] = React.useState<string>(() => {
    const defaultList = TEAM.filter(m => {
      if (USER_ME.accessLevel !== 'gestor') {
        return m.section === USER_ME.section;
      }
      return true;
    });
    return defaultList[0]?.id || TEAM[0].id;
  });
  const [newDateStr, setNewDateStr] = React.useState('');

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Today's date comparison helper
  const today = new Date();
  const isToday = (dateToCheck: Date) => {
    return today.getDate() === dateToCheck.getDate() && 
           today.getMonth() === dateToCheck.getMonth() && 
           today.getFullYear() === dateToCheck.getFullYear();
  };

  // Helper to format date object to YYYY-MM-DD
  const formatDateString = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // 1. Month View Calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const monthGridDays = [];
  
  for (let i = 0; i < firstDayIndex; i++) {
    monthGridDays.push({ num: null, date: null, tasks: [] });
  }

  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const dateString = formatDateString(dayDate);
    
    // Find matching tasks / events for this day
    const dayTasks = calendarEvents.filter(event => {
      if (event.dueDate !== dateString) return false;
      if (event.type === 'holiday') return true; // Holidays are always shown
      if (!event.assigneeId) return false;
      return selectedMainMember.includes(event.assigneeId);
    });

    monthGridDays.push({
      num: d,
      date: dayDate,
      tasks: dayTasks
    });
  }

  // 2. Week View Calculation
  const currentDayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDayOfWeek);
  const weekGridDays = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
    const dateString = formatDateString(dayDate);

    const dayTasks = calendarEvents.filter(event => {
      if (event.dueDate !== dateString) return false;
      if (event.type === 'holiday') return true;
      if (!event.assigneeId) return false;
      return selectedMainMember.includes(event.assigneeId);
    });

    weekGridDays.push({
      num: dayDate.getDate(),
      date: dayDate,
      tasks: dayTasks
    });
  }

  // Navigation Logic
  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear() + 1, prev.getMonth(), 1));
    }
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear() - 1, prev.getMonth(), 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleMember = (id: string) => {
    setSelectedMainMember(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  // Open modal pre-filling date
  const openCreateModal = (dateObj?: Date) => {
    if (dateObj) {
      setNewDateStr(formatDateString(dateObj));
    } else {
      setNewDateStr(formatDateString(currentDate));
    }
    setNewTitle('');
    setNewType('task');
    setNewPriority('medium');
    setIsModalOpen(true);
  };

  // Save new event to state
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDateStr) return;

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle,
      dueDate: newDateStr,
      type: newType,
      assigneeId: newType === 'holiday' ? null : newAssigneeId,
      priority: newType === 'task' ? newPriority : undefined
    };

    setCalendarEvents(prev => [...prev, newEvent]);
    setIsModalOpen(false);
  };

  // Count active tasks/events visible in selected filters
  const visibleTasksCount = calendarEvents.filter(event => {
    if (!event.dueDate) return false;
    if (event.type !== 'holiday' && event.assigneeId && !selectedMainMember.includes(event.assigneeId)) return false;
    
    const [y, m, d] = event.dueDate.split('-').map(Number);
    if (viewMode === 'month') {
      return y === year && (m - 1) === month;
    } else if (viewMode === 'week') {
      const taskDate = new Date(y, m - 1, d);
      const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    } else {
      return y === year;
    }
  }).length;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 animate-fade-in text-left relative">
      {/* Sidebar - Fixed ideal width (320px) */}
      <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
        <div className="glass-card rounded-[2.5rem] p-6 shadow-md border-white/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-black text-sm uppercase tracking-wider text-primary">Efetivo</h2>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#755b00] bg-[#ffd666]/30 dark:bg-[#ffd666]/15 dark:text-[#ffd666] px-2 py-0.5 rounded-md">
              Filtro
            </div>
          </div>
          <div className="space-y-3.5">
            {TEAM.filter(m => {
              if (USER_ME.accessLevel !== 'gestor') {
                return m.section === USER_ME.section;
              }
              return true;
            }).map((member) => (
              <label 
                key={member.id} 
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low dark:hover:bg-slate-900/30 transition-all cursor-pointer group border border-transparent",
                  selectedMainMember.includes(member.id) 
                    ? "bg-white dark:bg-slate-800/60 border-surface-container-high dark:border-slate-800/80 shadow-sm" 
                    : "bg-surface-container-low/40 dark:bg-slate-900/10 border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <input 
                  type="checkbox" 
                  checked={selectedMainMember.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="rounded border-surface-dim text-primary focus:ring-primary h-4 w-4 transition-all cursor-pointer"
                />
                <img src={member.avatar} className="w-9 h-9 rounded-full object-cover shadow-sm border border-surface-container-high" alt="" />
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-black truncate leading-none text-primary">{member.name}</p>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wider mt-1 truncate">{member.role}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-[2.5rem] bg-[#1a1a1a] dark:bg-slate-950 text-white dark:text-slate-100 relative overflow-hidden group shadow-lg border border-surface-container-high dark:border-slate-800">
          <CalendarIcon className="absolute -bottom-8 -right-8 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform" />
          <div className="relative z-10">
            <h3 className="font-bold text-lg mb-2">Resumo Geral</h3>
            <p className="text-xs font-medium text-white/70 mb-6 leading-tight">
              {visibleTasksCount} {visibleTasksCount === 1 ? 'evento agendado' : 'eventos agendados'} para este período com os filtros atuais.
            </p>
            <div className="text-[10px] uppercase font-black tracking-widest text-[#ffd666] bg-[#ffd666]/10 inline-block px-3 py-1.5 rounded-xl">
              Agenda Atualizada
            </div>
          </div>
        </div>
      </aside>

      {/* Main Calendar Content */}
      <section className="flex-grow flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-primary">
              {viewMode === 'year' ? `${year}` : `${monthNames[month]} ${year}`}
            </h1>
            <div className="flex bg-surface-container-high dark:bg-slate-900 rounded-full p-1 shadow-inner border border-surface-container-high dark:border-slate-800">
              <button 
                onClick={handlePrev}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all active:scale-90 shadow-none hover:shadow-sm cursor-pointer text-primary"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={handleNext}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all active:scale-90 shadow-none hover:shadow-sm cursor-pointer text-primary"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button 
              onClick={goToToday}
              className="px-6 py-2 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 text-on-surface font-bold text-xs rounded-full hover:shadow-md transition-all active:scale-95 cursor-pointer text-primary"
            >
              Hoje
            </button>
          </div>
          
          <div className="flex items-center gap-1 bg-surface-container-high dark:bg-slate-900 rounded-full p-1 border border-surface-container-high dark:border-slate-800">
            {[
              { id: 'month', label: 'Mês' },
              { id: 'week', label: 'Semana' },
              { id: 'year', label: 'Ano' }
            ].map((v) => (
              <button 
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
                className={cn(
                  "px-6 py-1.5 text-xs font-black rounded-full transition-all cursor-pointer",
                  viewMode === v.id
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-white/50 dark:hover:bg-slate-800/50"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Switcher */}
        {viewMode === 'month' && (
          <div className="glass-card rounded-[2.5rem] border-white/60 shadow-lg overflow-hidden flex-grow flex flex-col">
            <div className="grid grid-cols-7 bg-surface-container-low/50 border-b border-surface-container-high dark:border-slate-800">
              {days.map(d => (
                <div key={d} className="py-4 text-center text-on-surface-variant font-black text-[10px] uppercase tracking-widest">{d}</div>
              ))}
            </div>

            <div className="flex-grow grid grid-cols-7 overflow-y-auto custom-scrollbar">
              {monthGridDays.map((day, i) => {
                const dayIsToday = day.date !== null && isToday(day.date);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[130px] p-3 border-r border-b border-surface-container-low dark:border-slate-800/50 transition-all group flex flex-col relative",
                      day.num === null ? "bg-surface-container-low/20 dark:bg-slate-950/10" : "hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-inner",
                      dayIsToday && "bg-secondary-container/5 dark:bg-yellow-500/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-xs font-bold",
                        dayIsToday 
                          ? "flex items-center justify-center w-6 h-6 bg-primary text-on-primary dark:bg-white dark:text-black rounded-full -mt-0.5 -ml-0.5" 
                          : "text-on-surface-variant/50 group-hover:text-primary transition-colors"
                      )}>
                        {day.num}
                      </span>
                      {day.date && (
                        <button 
                          onClick={() => openCreateModal(day.date!)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 bg-surface-container hover:bg-primary hover:text-white rounded transition-all cursor-pointer"
                          title="Adicionar evento neste dia"
                        >
                          <Plus size={12} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-grow overflow-y-auto max-h-[90px] custom-scrollbar">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl text-[9px] font-black border-l-4 truncate shadow-sm cursor-pointer hover:translate-x-0.5 transition-all flex flex-col gap-0.5",
                            task.type === 'holiday' 
                              ? "bg-purple-500/10 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-500"
                              : task.type === 'routine'
                              ? "bg-blue-500/10 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-500"
                              : task.priority === 'urgent' || task.priority === 'high'
                              ? "bg-red-500/10 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-600 dark:border-red-500"
                              : task.priority === 'medium'
                              ? "bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-600 dark:border-amber-500"
                              : "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-600 dark:border-emerald-500"
                          )}
                          title={`${task.title} [${task.type.toUpperCase()}] ${task.assigneeId ? ` - Resp: ${TEAM.find(m => m.id === task.assigneeId)?.name}` : ''}`}
                        >
                          <div className="truncate">{task.title}</div>
                          {task.type !== 'holiday' && task.assigneeId && (
                            <div className="text-[8px] opacity-75 font-bold truncate">
                              Resp: {TEAM.find(m => m.id === task.assigneeId)?.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="glass-card rounded-[2.5rem] border-white/60 shadow-lg overflow-hidden flex-grow flex flex-col">
            <div className="grid grid-cols-7 bg-surface-container-low/50 border-b border-surface-container-high dark:border-slate-800">
              {days.map(d => (
                <div key={d} className="py-4 text-center text-on-surface-variant font-black text-[10px] uppercase tracking-widest">{d}</div>
              ))}
            </div>

            <div className="flex-grow grid grid-cols-7">
              {weekGridDays.map((day, i) => {
                const dayIsToday = isToday(day.date);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "min-h-[300px] p-4 border-r border-surface-container-low dark:border-slate-800/50 transition-all hover:bg-white/80 dark:hover:bg-slate-800/80 flex flex-col group relative",
                      dayIsToday && "bg-secondary-container/5 dark:bg-yellow-500/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={cn(
                        "text-sm font-black",
                        dayIsToday 
                          ? "flex items-center justify-center w-7 h-7 bg-primary text-on-primary dark:bg-white dark:text-black rounded-full" 
                          : "text-on-surface-variant"
                      )}>
                        {day.num}
                      </span>
                      <button 
                        onClick={() => openCreateModal(day.date)}
                        className="opacity-0 group-hover:opacity-100 p-1 bg-surface-container hover:bg-primary hover:text-white rounded transition-all cursor-pointer"
                        title="Adicionar evento"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="space-y-2 flex-grow overflow-y-auto custom-scrollbar">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "px-3 py-2 rounded-2xl text-[10px] font-black border-l-4 shadow-sm cursor-pointer hover:translate-x-1 transition-all flex flex-col gap-1",
                            task.type === 'holiday' 
                              ? "bg-purple-500/10 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-500"
                              : task.type === 'routine'
                              ? "bg-blue-500/10 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-500"
                              : task.priority === 'urgent' || task.priority === 'high'
                              ? "bg-red-500/10 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-600 dark:border-red-500"
                              : task.priority === 'medium'
                              ? "bg-amber-500/10 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-600 dark:border-amber-500"
                              : "bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-600 dark:border-emerald-500"
                          )}
                          title={`${task.title} [${task.type.toUpperCase()}] ${task.assigneeId ? ` - Resp: ${TEAM.find(m => m.id === task.assigneeId)?.name}` : ''}`}
                        >
                          <div className="leading-snug">{task.title}</div>
                          {task.type !== 'holiday' && task.assigneeId && (
                            <div className="text-[8px] opacity-75 font-bold">
                              Responsável: {TEAM.find(m => m.id === task.assigneeId)?.name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'year' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto flex-grow custom-scrollbar max-h-[600px]">
            {monthNames.map((mName, mIdx) => {
              const monthTasks = calendarEvents.filter(event => {
                if (!event.dueDate) return false;
                if (event.type !== 'holiday' && event.assigneeId && !selectedMainMember.includes(event.assigneeId)) return false;
                const [y, m] = event.dueDate.split('-').map(Number);
                return y === year && (m - 1) === mIdx;
              });

              return (
                <div 
                  key={mIdx}
                  onClick={() => {
                    setCurrentDate(new Date(year, mIdx, 1));
                    setViewMode('month');
                  }}
                  className="glass-card p-6 rounded-[2rem] hover:border-primary/60 hover:scale-[1.02] cursor-pointer transition-all flex flex-col justify-between min-h-[120px] shadow-sm border border-surface-container-high dark:border-slate-800"
                >
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-primary">{mName}</h3>
                    <p className="text-[10px] text-on-surface-variant font-bold mt-1 uppercase tracking-widest">{year}</p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-[10px] font-bold text-on-surface-variant">Eventos</span>
                    <span className={cn(
                      "text-xs font-black px-2.5 py-1 rounded-full",
                      monthTasks.length > 0 
                        ? "bg-primary text-on-primary dark:bg-white dark:text-black" 
                        : "bg-surface-container-high text-on-surface-variant/50"
                    )}>
                      {monthTasks.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => openCreateModal()}
        className="fixed bottom-10 right-10 w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-40 cursor-pointer"
      >
        <Plus size={32} />
        <span className="absolute right-20 bg-primary text-on-primary px-5 py-3 rounded-2xl text-sm font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap shadow-xl">
          Novo Evento
        </span>
      </button>

      {/* Create Event Dialog Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl text-left"
            >
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-surface-container-high dark:border-slate-800">
                <h3 className="font-black text-base uppercase tracking-wider text-primary">Novo Evento</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-5">
                {/* Event Type selection buttons */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Tipo de Evento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'task', label: 'Tarefa' },
                      { id: 'routine', label: 'Rotina' },
                      { id: 'holiday', label: 'Feriado' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewType(t.id as any)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                          newType === t.id
                            ? "bg-primary text-on-primary border-primary shadow-sm"
                            : "bg-surface-container dark:bg-slate-800 text-on-surface-variant border-transparent hover:bg-surface-container-high"
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Título do Evento</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Parecer Técnico ou Feriado Municipal"
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Data</label>
                  <input
                    type="date"
                    required
                    value={newDateStr}
                    onChange={e => setNewDateStr(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                {/* Priority Selection (Only for Tasks) */}
                {newType === 'task' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Prioridade</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'high', label: 'Alta', color: 'border-red-500 text-red-500' },
                        { id: 'medium', label: 'Média', color: 'border-amber-500 text-amber-500' },
                        { id: 'low', label: 'Baixa', color: 'border-emerald-500 text-emerald-500' }
                      ].map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewPriority(p.id as any)}
                          className={cn(
                            "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                            newPriority === p.id
                              ? "bg-surface-container-high dark:bg-slate-800 font-black border-current " + p.color
                              : "bg-surface-container dark:bg-slate-800 text-on-surface-variant border-transparent hover:bg-surface-container-high"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignee Selection (For Tasks and Routines) */}
                {newType !== 'holiday' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Responsável</label>
                    <select
                      value={newAssigneeId}
                      onChange={e => setNewAssigneeId(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      {TEAM.filter(m => {
                        if (USER_ME.accessLevel !== 'gestor') {
                          return m.section === USER_ME.section;
                        }
                        return true;
                      }).map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-surface-container-high dark:border-slate-800 text-on-surface-variant font-bold text-xs rounded-2xl hover:bg-surface-container transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:opacity-90 transition-all cursor-pointer text-center shadow-lg shadow-primary/10"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
