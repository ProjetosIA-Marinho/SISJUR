import React from 'react';
import { MoreHorizontal, Plus, Calendar as CalendarIcon, MessageCircle, Paperclip, Edit2, CheckCircle2 } from 'lucide-react';
import { TEAM } from '../data';
import { TaskStatus, Task } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useData } from '../context/DataContext';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'not-started', label: 'Não Iniciada', color: 'bg-outline-variant' },
  { id: 'in-progress', label: 'Em Andamento', color: 'bg-secondary-container' },
  { id: 'delayed', label: 'Atrasada', color: 'bg-red-400' },
  { id: 'completed', label: 'Concluída', color: 'bg-emerald-500' },
];

export function KanbanBoard() {
  const { tasks } = useData();

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-error-container text-on-error-container dark:bg-red-950/50 dark:text-red-400';
      case 'high': return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400';
      case 'medium': return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400';
      case 'low': return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  const priorityLabels: Record<string, string> = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Quadro Kanban Estratégico</h1>
          <p className="text-on-surface-variant max-w-xl">Gerencie fluxos de trabalho e prioridades da equipe com clareza.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10">
            <Plus size={20} />
            Novo Card
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 rounded-full font-bold hover:bg-surface-container transition-all">
            Filtrar
          </button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar flex-grow min-h-0">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80 flex flex-col gap-6">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-3">
                <div className={cn("w-2 h-6 rounded-full", column.color)} />
                <h3 className="font-bold text-lg">{column.label}</h3>
                <span className="bg-surface-container px-2.5 py-0.5 rounded-lg text-xs font-bold text-on-surface-variant">
                  {tasks.filter(t => t.status === column.id).length}
                </span>
              </div>
              <button className="text-surface-dim hover:text-primary transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            <div className="flex-grow flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
              {tasks.filter(t => t.status === column.id).map((task, index) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "glass-card p-5 rounded-3xl group cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 transition-all border-white/80",
                    task.status === 'completed' && "opacity-70 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      getPriorityStyles(task.priority)
                    )}>
                      {priorityLabels[task.priority]}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-surface-container rounded-lg transition-all text-on-surface-variant">
                      <Edit2 size={14} />
                    </button>
                  </div>

                  <h4 className={cn(
                    "font-bold text-on-surface leading-tight mb-2",
                    task.status === 'completed' && "line-through text-on-surface-variant"
                  )}>
                    {task.title}
                  </h4>
                  
                  {task.description && (
                    <p className="text-on-surface-variant text-sm line-clamp-2 mb-6">
                      {task.description}
                    </p>
                  )}

                  {task.status === 'in-progress' && (
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-surface-container-low">
                    <div className="flex -space-x-2">
                      <img 
                        src={task.assignee.avatar} 
                        alt={task.assignee.name} 
                        title={task.assignee.name}
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3 text-on-surface-variant/60">
                      {task.commentsCount && (
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          <span className="text-[10px] font-bold">{task.commentsCount}</span>
                        </div>
                      )}
                      {task.attachmentsCount && (
                        <div className="flex items-center gap-1">
                          <Paperclip size={14} />
                          <span className="text-[10px] font-bold">{task.attachmentsCount}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {task.status === 'completed' ? (
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                          <CalendarIcon size={14} />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-tight">
                          {task.status === 'completed' ? 'FEITO' : task.dueDate.split('-').slice(1).reverse().join('/')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <button className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-surface-container rounded-[2rem] text-on-surface-variant hover:border-primary hover:text-primary transition-all group active:scale-95">
                <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                <span className="font-bold text-sm tracking-tight">Adicionar Item</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
