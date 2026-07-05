import React from 'react';
import { GanttChartSquare, Plus, Filter, Search, ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import { PROJECTS, TEAM } from '../data';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Timeline() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 2 + i);
    return {
      day: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      date: d.getDate(),
      full: d.toLocaleDateString('pt-BR')
    };
  });

  return (
    <div className="space-y-8 animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Cronograma de Projetos</h1>
          <p className="text-on-surface-variant">Setembro 2024 • {PROJECTS.length} projetos ativos</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Taxa de Entrega</p>
            <p className="text-3xl font-bold text-primary">78%</p>
          </div>
          <div className="w-px h-10 bg-surface-container-high" />
          <button className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full hover:scale-105 transition-all shadow-lg">
            <Plus size={20} />
            <span className="font-bold">Novo Projeto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-grow">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl shadow-sm min-h-[300px]">
            <h3 className="font-bold text-lg mb-6">Equipe Ativa</h3>
            <div className="space-y-4">
              {TEAM.slice(0, 3).map((member) => (
                <div key={member.id} className="flex items-center gap-4 p-3 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/60 dark:border-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer">
                  <div className="relative">
                    <img src={member.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                    {member.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">{member.name}</p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-1">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl shadow-sm bg-primary-container text-on-primary relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Clock size={160} />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-2">Próxima Entrega</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-6">Fase 2 - MVP</p>
              
              <div className="space-y-4">
                <h4 className="text-xl font-bold leading-tight">Release de Segurança</h4>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold">02</span>
                    <span className="text-[10px] font-bold opacity-60 uppercase">Dias</span>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-bold">14</span>
                    <span className="text-[10px] font-bold opacity-60 uppercase">Horas</span>
                  </div>
                </div>
                <button className="w-full bg-secondary-container text-on-secondary-container py-3 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all mt-2">
                  Abrir Checklist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="col-span-12 lg:col-span-9 glass-card rounded-[2rem] flex flex-col overflow-hidden border-white/60">
          <div className="p-6 border-b border-surface-container-high dark:border-slate-800/60 flex justify-between items-center bg-white/40 dark:bg-slate-900/40">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-bold">
                <span className="text-on-surface-variant">Setembro 2024</span>
              </div>
              <div className="flex bg-surface-container rounded-xl p-1">
                <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-800 shadow-sm">Dia</button>
                <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant">Semana</button>
                <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant">Mês</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2.5 border border-surface-container-high dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <Filter size={18} />
              </button>
              <button className="p-2.5 border border-surface-container-high dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-auto custom-scrollbar">
            <div className="min-w-[900px]">
              <div className="flex border-b border-surface-container-low h-14 items-center px-6 bg-surface-container-low/30">
                <div className="w-64 shrink-0 font-bold text-xs uppercase tracking-widest text-on-surface-variant">Atividade</div>
                <div className="flex-grow flex justify-around text-[10px] font-bold tracking-widest uppercase text-on-surface-variant/60">
                  {days.map((d, i) => (
                    <span key={i}>{d.day} {d.date}</span>
                  ))}
                </div>
              </div>

              <div className="relative p-6 space-y-8 min-h-[400px]" style={{
                backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: 'calc((100% - 256px) / 7) 100%',
                backgroundPosition: '256px 0'
              }}>
                <div className="absolute left-[256px] top-0 bottom-0 w-0.5 bg-secondary-container/40 z-10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">HOJE</div>
                </div>

                {[
                  { title: 'Design Interface SaaS', sub: 'Equipe UI/UX', start: 5, width: 45, color: 'bg-primary', progress: 85, users: [TEAM[0], TEAM[3]] },
                  { title: 'Integração de API', sub: 'Time Backend', start: 30, width: 35, color: 'bg-secondary-container', progress: 40, users: [TEAM[1]], alert: true },
                  { title: 'Migração de Dados', sub: 'Infraestrutura', start: 55, width: 40, color: 'bg-surface-container-high', progress: 0, users: [TEAM[2]], status: 'Inicia em 3 dias' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center group relative">
                    <div className="w-64 shrink-0 pr-6">
                      <h4 className="font-bold text-sm leading-tight text-primary">{row.title}</h4>
                      <p className="text-[10px] font-semibold text-on-surface-variant/70 uppercase tracking-wider">{row.sub}</p>
                    </div>
                    <div className="flex-grow h-11 relative">
                      <motion.div 
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                        className={cn(
                          "absolute h-full rounded-full flex items-center px-5 gap-3 shadow-sm border border-black/5 hover:scale-[1.02] hover:shadow-xl transition-all cursor-pointer overflow-hidden",
                          row.color,
                          row.color === 'bg-primary' ? 'text-white' : 'text-on-surface'
                        )}
                        style={{ left: `${row.start}%`, width: `${row.width}%`, transformOrigin: 'left' }}
                      >
                        {row.color === 'bg-primary' && (
                          <div className="absolute inset-y-0 left-0 bg-white/10" style={{ width: `${row.progress}%` }} />
                        )}
                        
                        <span className="text-[10px] font-black uppercase tracking-widest relative z-10 whitespace-nowrap">
                          {row.status || `Progresso: ${row.progress}%`}
                        </span>
                        
                        {row.alert && <Info size={14} className="text-secondary ml-auto relative z-10" />}
                        
                        <div className="flex -space-x-2 ml-auto relative z-10">
                          {row.users.map((u, ui) => (
                            <img key={ui} src={u.avatar} className="w-6 h-6 rounded-full border-2 border-white/20 object-cover" alt="" />
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
