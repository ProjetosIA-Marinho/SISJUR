import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, AlertCircle, Users, CheckCircle2, MoreHorizontal, 
  ArrowRight, Clock, Filter, Search, Shield, FileText, 
  CheckCircle, ListTodo, ClipboardList, Layers, AlertTriangle, HelpCircle,
  Scale, MessageSquare, Send, File, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { USER_ME } from '../data';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';

export function Dashboard() {
  const { tasks: TASKS, team: TEAM } = useData();
  const [selectedYear, setSelectedYear] = React.useState<string>('Todos');
  const [memberSearch, setMemberSearch] = React.useState('');

  // State for KPI card task list modal
  const [cardModalData, setCardModalData] = React.useState<{
    type: 'prazos' | 'ativas' | 'totais' | 'concluidas';
    title: string;
    subtitle: string;
    tasks: typeof TASKS;
  } | null>(null);

  // Year filter logic (dynamically computed from tasks)
  const years = React.useMemo(() => {
    const yearsSet = new Set<string>();
    TASKS.forEach(task => {
      if (task.year) {
        yearsSet.add(task.year);
      } else if (task.entryDate) {
        const yr = task.entryDate.split('-')[0];
        if (yr && yr.length === 4) yearsSet.add(yr);
      }
    });
    // Add default options if not present
    ['2026', '2025', '2024'].forEach(y => yearsSet.add(y));
    return ['Todos', ...Array.from(yearsSet).sort((a, b) => b.localeCompare(a))];
  }, [TASKS]);

  // Helper to extract sector
  const getSector = (task: typeof TASKS[0]) => {
    const sectors = ['AAJ', 'SIJ', 'AJUR'];
    const found = task.tags?.find(tag => sectors.includes(tag.toUpperCase()));
    return found ? found.toUpperCase() : 'AAJ';
  };

  // Filter root tasks based on selected year and section access
  const rootFilteredTasks = TASKS.filter(task => {
    if (task.documentType === 'holiday' || task.documentType === 'routine') return false;
    if (USER_ME.accessLevel !== 'gestor') {
      const taskSector = getSector(task);
      if (taskSector !== USER_ME.section) return false;
    }
    if (selectedYear === 'Todos') return true;
    const taskYear = task.year || (task.entryDate ? task.entryDate.split('-')[0] : '');
    return taskYear === selectedYear;
  });

  // Flatten tasks + subtasks so subtasks are included in all Dashboard metrics
  const filteredTasks = React.useMemo(() => {
    const list: typeof TASKS = [];
    rootFilteredTasks.forEach(task => {
      list.push(task);
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach(st => {
          list.push({
            ...st,
            tags: (st.tags && st.tags.length > 0) ? st.tags : task.tags
          });
        });
      }
    });
    return list;
  }, [rootFilteredTasks]);

  // Calculate dynamic metrics
  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const activeTasks = totalTasks - completedTasks;
  const urgentTasks = filteredTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  // Sector distribution computation
  const sectorCounts = { AAJ: 0, SIJ: 0, AJUR: 0 };
  filteredTasks.forEach(task => {
    const sec = getSector(task);
    if (sec in sectorCounts) {
      sectorCounts[sec as keyof typeof sectorCounts]++;
    }
  });

  const sectorChartData = [
    { name: 'AAJ', value: sectorCounts.AAJ, color: 'var(--color-secondary)' }, 
    { name: 'SIJ', value: sectorCounts.SIJ, color: 'var(--color-outline)' }, 
    { name: 'AJUR', value: sectorCounts.AJUR, color: 'var(--color-primary)' } 
  ];

  // Document type counts
  const docTypeCounts: Record<string, number> = {};
  filteredTasks.forEach(task => {
    const type = task.documentType || 'Outro';
    docTypeCounts[type] = (docTypeCounts[type] || 0) + 1;
  });

  // Priority counts
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  filteredTasks.forEach(task => {
    if (task.priority in priorityCounts) {
      priorityCounts[task.priority as keyof typeof priorityCounts]++;
    }
  });

  // Status counts
  const statusCounts = {
    'not-started': 0,
    'in-progress': 0,
    'completed': 0,
    'delayed': 0,
    'suspended': 0,
    'backlog': 0
  };
  filteredTasks.forEach(task => {
    if (task.status in statusCounts) {
      statusCounts[task.status as keyof typeof statusCounts]++;
    }
  });

  // Filtered members list based on search and section access
  const filteredMembers = TEAM.filter(member => {
    if (USER_ME.accessLevel !== 'gestor') {
      if (member.section !== USER_ME.section) return false;
    }
    return member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      member.role.toLowerCase().includes(memberSearch.toLowerCase());
  });

  // Tasks created per day computation
  const tasksByDay: Record<string, number> = {};
  filteredTasks.forEach(task => {
    if (task.entryDate) {
      const [y, m, d] = task.entryDate.split('-');
      const formattedDate = `${d}/${m}`;
      tasksByDay[formattedDate] = (tasksByDay[formattedDate] || 0) + 1;
    }
  });

  const dailyTasksChartData = Object.entries(tasksByDay)
    .map(([date, count]) => {
      const currentYear = new Date().getFullYear();
      const [day, month] = date.split('/').map(Number);
      const matchingTask = filteredTasks.find(t => {
        if (!t.entryDate) return false;
        const [y, m, d] = t.entryDate.split('-');
        return Number(d) === day && Number(m) === month;
      });
      const year = matchingTask ? Number(matchingTask.year || currentYear) : currentYear;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.getDay();
      return { date, quantidade: count, dayOfWeek };
    })
    .sort((a, b) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });

  // Weekly distribution calculation
  const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
  filteredTasks.forEach(task => {
    if (task.entryDate) {
      const [y, m, d] = task.entryDate.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const dayOfWeek = dateObj.getDay();
      weeklyCounts[dayOfWeek]++;
    }
  });

  const weeklyChartData = [
    { name: 'D', quantidade: weeklyCounts[0], dayOfWeek: 0, fullName: 'Domingo' },
    { name: 'S', quantidade: weeklyCounts[1], dayOfWeek: 1, fullName: 'Segunda-feira' },
    { name: 'T', quantidade: weeklyCounts[2], dayOfWeek: 2, fullName: 'Terça-feira' },
    { name: 'Q', quantidade: weeklyCounts[3], dayOfWeek: 3, fullName: 'Quarta-feira' },
    { name: 'Q', quantidade: weeklyCounts[4], dayOfWeek: 4, fullName: 'Quinta-feira' },
    { name: 'S', quantidade: weeklyCounts[5], dayOfWeek: 5, fullName: 'Sexta-feira' },
    { name: 'S', quantidade: weeklyCounts[6], dayOfWeek: 6, fullName: 'Sábado' },
  ];

  const handleCardClick = (type: 'prazos' | 'ativas' | 'totais' | 'concluidas') => {
    if (type === 'prazos') {
      const prazosTasks = (filteredTasks || []).filter(t => {
        if (t.status === 'completed') return false;
        if (t.priority === 'urgent' || t.priority === 'high' || t.status === 'delayed') return true;
        if (t.dueDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const parts = t.dueDate.split('-').map(Number);
          if (parts.length === 3) {
            const due = new Date(parts[0], parts[1] - 1, parts[2]);
            due.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 5) return true;
          }
        }
        return false;
      });
      setCardModalData({
        type: 'prazos',
        title: 'Tarefas com Prazos Próximos e Urgentes',
        subtitle: `${prazosTasks.length} tarefa(s) requerem atenção ou têm prazo crítico/alto`,
        tasks: prazosTasks
      });
    } else if (type === 'ativas') {
      const ativasList = (filteredTasks || []).filter(t => t.status !== 'completed');
      setCardModalData({
        type: 'ativas',
        title: 'Tarefas Ativas em Andamento',
        subtitle: `${ativasList.length} tarefa(s) ativas cadastradas`,
        tasks: ativasList
      });
    } else if (type === 'totais') {
      setCardModalData({
        type: 'totais',
        title: 'Todas as Tarefas Cadastradas',
        subtitle: `${(filteredTasks || []).length} tarefa(s) totais registradas`,
        tasks: filteredTasks || []
      });
    } else if (type === 'concluidas') {
      const concluidasList = (filteredTasks || []).filter(t => t.status === 'completed');
      setCardModalData({
        type: 'concluidas',
        title: 'Tarefas Concluídas',
        subtitle: `${concluidasList.length} tarefa(s) finalizadas com sucesso`,
        tasks: concluidasList
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section with Year Filter */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-surface-container-high dark:border-slate-800">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">Bem-vindo, {USER_ME.name}</h1>
          <p className="text-on-surface-variant">Sistema Jurídico da Academia da Força Aérea — Gestão e controle de processos.</p>
        </div>
        
        {/* Year Filter Pills */}
        <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-full p-1.5 border border-surface-container-high dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 px-3 text-on-surface-variant font-bold text-xs uppercase tracking-wider border-r border-surface-container-high dark:border-slate-800 pr-4 mr-2">
            <Filter size={14} className="text-primary" />
            Ano
          </div>
          <div className="flex gap-1">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-black transition-all",
                  selectedYear === year
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Cards (Dynamic values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            type: 'ativas' as const,
            label: 'Tarefas Ativas', 
            value: activeTasks.toString().padStart(2, '0'), 
            trend: 'Em andamento', 
            icon: ListTodo, 
            color: 'text-blue-600 dark:text-blue-400', 
            bg: 'bg-white/70 dark:bg-slate-900/60' 
          },
          { 
            type: 'prazos' as const,
            label: 'Prazos Próximos', 
            value: urgentTasks.toString().padStart(2, '0'), 
            trend: 'Crítico/Alto', 
            icon: AlertCircle, 
            color: 'text-error dark:text-red-400', 
            bg: 'bg-white/70 dark:bg-slate-900/60' 
          },
          { 
            type: 'totais' as const,
            label: 'Tarefas Totais', 
            value: totalTasks.toString().padStart(2, '0'), 
            trend: 'Cadastradas', 
            icon: ClipboardList, 
            color: 'text-indigo-600 dark:text-indigo-400', 
            bg: 'bg-secondary-container dark:bg-slate-800' 
          },
          { 
            type: 'concluidas' as const,
            label: 'Tarefas Concluídas', 
            value: completedTasks.toString().padStart(2, '0'), 
            trend: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% Conclusão`, 
            icon: CheckCircle2, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'bg-white/70 dark:bg-slate-900/60' 
          },
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleCardClick(card.type)}
            className={cn(
              "glass-card p-6 rounded-[2rem] flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg border border-white/50 dark:border-slate-800/50 cursor-pointer group",
              card.bg
            )}
          >
            <div className="flex justify-between items-start">
              <span className={cn("font-bold text-[10px] uppercase tracking-widest group-hover:text-primary transition-colors", card.bg.includes('secondary') ? 'text-on-secondary-container/70 dark:text-slate-300' : 'text-on-surface-variant/90 dark:text-slate-400')}>
                {card.label}
              </span>
              <card.icon size={20} className={card.bg.includes('secondary') ? 'text-on-secondary-container dark:text-amber-400' : card.color} />
            </div>
            <div className="mt-5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-on-surface tracking-tight">{card.value}</span>
                <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10", card.color)}>
                  {card.trend}
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Ver lista &rarr;
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts: Demandas Criadas por Dia & Setor Responsável */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Demandas Semanais */}
        <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-between border border-white/50 dark:border-slate-800/50 lg:col-span-8">
          <div>
            <div className="flex flex-col mb-8">
              <h4 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                Demandas Semanais
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">Volume de novos processos criados por dia da semana ({selectedYear})</p>
            </div>

            <div className="h-[220px] w-full">
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.3} />
                    <XAxis 
                      dataKey="fullName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }} 
                      dy={10} 
                      tickFormatter={(value) => {
                        if (value === 'Domingo') return 'D';
                        if (value === 'Segunda-feira') return 'S';
                        if (value === 'Terça-feira') return 'T';
                        if (value === 'Quarta-feira') return 'Q';
                        if (value === 'Quinta-feira') return 'Q';
                        if (value === 'Sexta-feira') return 'S';
                        if (value === 'Sábado') return 'S';
                        return value;
                      }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'var(--color-on-surface-variant)' }} 
                      allowDecimals={false}
                    />
                    <Tooltip 
                      labelFormatter={(label, items) => items[0]?.payload?.fullName || label}
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: '1px solid var(--color-outline-variant)', 
                        backgroundColor: 'var(--color-surface-container-lowest)', 
                        color: 'var(--color-on-surface)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Bar 
                      dataKey="quantidade" 
                      fill="var(--color-chart-weekday)" 
                      radius={[10, 10, 10, 10]} 
                      barSize={8} 
                      name="Demandas" 
                    >
                      {weeklyChartData.map((entry, index) => {
                        let fillVal = 'var(--color-chart-weekday)';
                        if (entry.dayOfWeek === 0 || entry.dayOfWeek === 6) {
                          fillVal = 'var(--color-chart-weekend)';
                        } else if (entry.dayOfWeek === 5) {
                          fillVal = 'var(--color-chart-highlight)';
                        }
                        return <Cell key={`cell-${index}`} fill={fillVal} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-on-surface-variant/75 font-bold italic">Nenhuma demanda cadastrada neste período.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-secondary-container/10 dark:bg-slate-800/20 rounded-2xl mt-8 border border-secondary-container/20">
            <span className="text-xs text-on-surface-variant">
              Média diária de <strong>{(filteredTasks.length / Math.max(1, dailyTasksChartData.length)).toFixed(1)}</strong> novas demandas cadastradas por dia com registro.
            </span>
          </div>
        </div>

        {/* Sector Responsável Distribution Chart */}
        <div className="rounded-[2rem] p-8 flex flex-col justify-between bg-white dark:bg-surface-container-lowest text-on-surface border border-surface-container-high dark:border-surface-container-high lg:col-span-4 shadow-xl">
          <div>
            <div className="flex flex-col mb-8">
              <h4 className="text-xl font-bold flex items-center gap-2">
                <Shield size={18} className="text-primary" />
                Distribuição por Setor Responsável
              </h4>
              <p className="text-xs text-on-surface-variant/75 mt-1">Carga de trabalho dividida entre AAJ, SIJ e AJUR ({selectedYear})</p>
            </div>

            <div className="h-[220px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '1rem',
                      border: '1px solid var(--color-outline-variant)',
                      backgroundColor: 'var(--color-surface-container-low)',
                      color: 'var(--color-on-surface)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-3xl font-black text-on-surface">{totalTasks}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/75">Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            {sectorChartData.map((d, i) => (
              <div key={i} className="flex justify-between items-center px-4 py-2 bg-surface-container/50 dark:bg-surface-container rounded-2xl border border-surface-container-high dark:border-surface-container-high">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-bold text-on-surface-variant">{d.name}</span>
                </div>
                <span className="text-xs font-black text-on-surface">
                  {totalTasks > 0 ? Math.round((d.value / totalTasks) * 100) : 0}% ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Resumes: Document Types, Priorities, Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Types Card */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between animate-fade-in">
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-surface-container-high dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-primary">Tipos de Documentos</h3>
            </div>
            
            <div className="space-y-4">
              {Object.keys(docTypeCounts).length === 0 ? (
                <p className="text-xs text-on-surface-variant py-4 text-center">Nenhum documento encontrado.</p>
              ) : (
                Object.entries(docTypeCounts).map(([type, count]) => {
                  const typeTasks = filteredTasks.filter(t => t.documentType === type);
                  const completedCount = typeTasks.filter(t => t.status === 'completed').length;
                  
                  // Dynamically resolve icon
                  let IconComponent = File;
                  const lowerType = type.toLowerCase();
                  if (lowerType.includes('ofício')) IconComponent = FileText;
                  else if (lowerType.includes('portaria')) IconComponent = Shield;
                  else if (lowerType.includes('judicial') || lowerType.includes('mandado')) IconComponent = Scale;
                  else if (lowerType.includes('despacho')) IconComponent = Send;
                  
                  return (
                    <div key={type} className="flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-3.5">
                        {/* Circular Icon Container */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-container dark:bg-slate-800 text-primary dark:text-white border border-surface-container-high dark:border-slate-700 shadow-sm">
                          <IconComponent size={18} />
                        </div>
                        
                        <div>
                          <p className="text-xs font-bold leading-tight text-primary">
                            {type}
                          </p>
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            {count} {count === 1 ? 'processo' : 'processos'} • {completedCount} concluído(s)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Priorities Card */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between animate-fade-in">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-surface-container-high dark:border-slate-800">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                <AlertTriangle size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary">Níveis de Prioridade</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: 'urgent', label: 'Urgente', count: priorityCounts.urgent, color: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bgLight: 'bg-red-500/10 dark:bg-red-500/20' },
                { key: 'high', label: 'Alta', count: priorityCounts.high, color: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bgLight: 'bg-orange-500/10 dark:bg-orange-500/20' },
                { key: 'medium', label: 'Média', count: priorityCounts.medium, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bgLight: 'bg-amber-500/10 dark:bg-amber-500/20' },
                { key: 'low', label: 'Rotina (Baixa)', count: priorityCounts.low, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bgLight: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
              ].map(item => {
                const percent = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                return (
                  <div key={item.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-surface-container-low dark:hover:bg-slate-900/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("w-2 h-2 rounded-full", item.color)} />
                      <span className="text-xs font-bold text-on-surface">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full", item.bgLight, item.text)}>
                        {item.count} {item.count === 1 ? 'tarefa' : 'tarefas'}
                      </span>
                      <span className="text-xs font-black w-8 text-right text-on-surface-variant">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desempenho por Membro Card */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between shadow-xl animate-fade-in">
          <div>
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-surface-container-high dark:border-slate-800">
              <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-600 dark:text-yellow-400">
                <Users size={18} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-primary">Desempenho por Membro</h3>
            </div>
            
            <div className="space-y-6">
              {filteredMembers.map((member) => {
                const mainTasksForMember = filteredTasks.filter(t => t.assignee?.id === member.id);
                const subTasksForMember: typeof TASKS[0][] = [];
                filteredTasks.forEach(t => {
                  if (t.subtasks && t.subtasks.length > 0) {
                    t.subtasks.forEach(st => {
                      if (st.assignee?.id === member.id) {
                        subTasksForMember.push(st);
                      }
                    });
                  }
                });
                const memberTasks = [...mainTasksForMember, ...subTasksForMember];
                const total = memberTasks.length;
                const completed = memberTasks.filter(t => t.status === 'completed').length;
                const inProgress = memberTasks.filter(t => t.status === 'in-progress').length;
                const others = total - completed - inProgress;

                return (
                  <div key={member.id} className="space-y-2">
                    {/* Header: Member Avatar + Name + Legend */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`;
                          }}
                          className="w-8 h-8 rounded-full object-cover border-2 border-surface-container-high dark:border-slate-800 shadow-sm" 
                          alt="" 
                        />
                        <div>
                          <p className="font-bold text-xs text-primary leading-tight">{member.name}</p>
                          <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">{member.role}</p>
                        </div>
                      </div>
                      
                      {/* Legend above the bar */}
                      <div className="flex gap-2.5 text-[8px] font-black uppercase tracking-widest text-on-surface-variant/85">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-white" />Concluídas: {completed}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ffd666]" />Em Andamento: {inProgress}</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8c8c8c]" />Outras: {others}</span>
                      </div>
                    </div>

                    {/* Bar + Total at the end */}
                    <div className="flex items-center gap-3">
                      {total > 0 ? (
                        <>
                          {/* Horizontal stacked bar */}
                          <div className="flex h-2 w-full bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex-grow">
                            {completed > 0 && (
                              <div 
                                style={{ width: `${(completed / total) * 100}%` }} 
                                className="bg-primary dark:bg-white transition-all duration-500" 
                                title={`Concluída: ${completed}`}
                              />
                            )}
                            {inProgress > 0 && (
                              <div 
                                style={{ width: `${(inProgress / total) * 100}%` }} 
                                className="bg-[#ffd666] transition-all duration-500" 
                                title={`Em Andamento: ${inProgress}`}
                              />
                            )}
                            {others > 0 && (
                              <div 
                                style={{ width: `${(others / total) * 100}%` }} 
                                className="bg-[#8c8c8c] dark:bg-slate-500 transition-all duration-500" 
                                title={`Outras: ${others}`}
                              />
                            )}
                          </div>
                          
                          {/* Total tasks at the end of the bar */}
                          <span className="text-[10px] font-black text-on-surface-variant shrink-0 bg-surface-container-high dark:bg-slate-800 px-2 py-0.5 rounded-md min-w-[28px] text-center">
                            {total}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant/65 font-bold italic py-1">Sem demandas atribuídas</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Card Tasks List Modal */}
      <AnimatePresence>
        {cardModalData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 rounded-[2.5rem] p-8 w-full max-w-3xl shadow-2xl text-left max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 mb-4 border-b border-surface-container-high dark:border-slate-800">
                <div>
                  <h3 className="font-black text-xl text-primary">
                    {cardModalData.title}
                  </h3>
                  <p className="text-xs font-medium text-on-surface-variant mt-1">
                    {cardModalData.subtitle}
                  </p>
                </div>
                <button 
                  onClick={() => setCardModalData(null)}
                  className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex-grow overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
                {cardModalData.tasks.length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center opacity-70">
                    <CheckCircle2 size={56} className="text-emerald-500 mb-3 stroke-[1.5]" />
                    <p className="text-base font-bold text-primary">Nenhuma tarefa encontrada nesta categoria</p>
                    <p className="text-xs text-on-surface-variant mt-1">Não há pendências a exibir no momento.</p>
                  </div>
                ) : (
                  cardModalData.tasks.map((task) => {
                    const assignee = task.assignee;
                    return (
                      <div
                        key={task.id}
                        className="p-4 rounded-2xl border border-surface-container-high dark:border-slate-800 bg-surface-container-low/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md"
                      >
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md text-white",
                              task.priority === 'urgent' ? "bg-red-600" :
                              task.priority === 'high' ? "bg-red-500" :
                              task.priority === 'medium' ? "bg-amber-500" :
                              "bg-emerald-500"
                            )}>
                              Prioridade {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                            </span>

                            <span className={cn(
                              "text-[9px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider",
                              task.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                              task.status === 'in-progress' ? "bg-blue-500/10 text-blue-600" :
                              task.status === 'delayed' ? "bg-red-500/10 text-red-600 animate-pulse" :
                              "bg-slate-500/10 text-slate-600"
                            )}>
                              {task.status === 'completed' ? 'Concluída' : task.status === 'in-progress' ? 'Em Andamento' : task.status === 'delayed' ? 'Atrasada' : 'Não Iniciada'}
                            </span>

                            {task.dueDate && (
                              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} /> Prazo: {task.dueDate.split('-').reverse().join('/')}
                              </span>
                            )}

                            {task.sigadOfRec && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                SIGAD REC: {task.sigadOfRec}
                              </span>
                            )}
                            {task.sigadOfExp && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                SIGAD EXP: {task.sigadOfExp}
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-sm text-primary leading-snug">
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {assignee && (
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-black/5 dark:border-white/5">
                              <img src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=random`} className="w-5 h-5 rounded-full object-cover" alt="" />
                              <span className="text-xs font-bold text-on-surface-variant">
                                {assignee.name} ({assignee.role})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
