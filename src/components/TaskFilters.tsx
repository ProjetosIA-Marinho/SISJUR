import React from 'react';
import { Search, Filter, Calendar, Tag, User, FileText, ChevronDown, ChevronUp, X, CheckSquare, Layers } from 'lucide-react';
import { TaskStatus, TaskPriority, Task } from '../types';
import { TEAM, USER_ME } from '../data';
import { cn } from '../lib/utils';
import { CustomSelect } from './CustomSelect';

const documentTypeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'Ofício', label: 'Ofício' },
  { value: 'Estudo', label: 'Estudo' },
  { value: 'E-mail', label: 'E-mail' },
  { value: 'Portaria', label: 'Portaria' },
  { value: 'IPM', label: 'IPM' },
  { value: 'APF', label: 'APF' },
  { value: 'Sindicância', label: 'Sindicância' },
  { value: 'Demanda Judicial', label: 'Demanda Judicial' },
  { value: 'Armamento', label: 'Armamento' },
  { value: 'Outros', label: 'Outros' },
];

const priorityOptions = [
  { value: '', label: 'Qualquer prioridade' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

const statusOptions = [
  { value: '', label: 'Qualquer status' },
  { value: 'not-started', label: 'Não Iniciada' },
  { value: 'in-progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluída' },
  { value: 'delayed', label: 'Atrasada' },
  { value: 'suspended', label: 'Suspensa' },
];

const assigneeOptions = [
  { value: '', label: 'Qualquer membro' },
  { value: USER_ME.id, label: `${USER_ME.name} (Eu)`, avatar: USER_ME.avatar },
  ...TEAM.map(member => ({
    value: member.id,
    label: member.name,
    avatar: member.avatar
  }))
];


interface TaskFiltersProps {
  filters?: any;
  onFilterChange: (filters: any) => void;
  bulkEditMode: boolean;
  onBulkEditToggle: () => void;
  tasks?: Task[];
}

export function TaskFilters({ filters: filtersProp, onFilterChange, bulkEditMode, onBulkEditToggle, tasks = [] }: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [filters, setFilters] = React.useState({
    search: '',
    sigadOfRec: '',
    origem: '',
    sigadOfExp: '',
    destination: '',
    documentType: '',
    status: '',
    priority: '',
    assignee: '',
    entryDate: '',
    dueDate: '',
    tags: '',
    year: '',
  });

  React.useEffect(() => {
    if (filtersProp) {
      setFilters(prev => ({
        ...prev,
        ...filtersProp
      }));
    }
  }, [filtersProp]);

  const years = React.useMemo(() => {
    const yearsSet = new Set<string>();
    tasks.forEach(task => {
      if (task.year) {
        yearsSet.add(task.year);
      } else if (task.entryDate) {
        const yr = task.entryDate.split('-')[0];
        if (yr && yr.length === 4) yearsSet.add(yr);
      }
    });
    // Add defaults
    ['2026', '2025', '2024'].forEach(y => yearsSet.add(y));
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [tasks]);

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = {
      search: '',
      sigadOfRec: '',
      origem: '',
      sigadOfExp: '',
      destination: '',
      documentType: '',
      status: '',
      priority: '',
      assignee: '',
      entryDate: '',
      dueDate: '',
      tags: '',
      year: '',
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <div className="space-y-4 animate-fade-in relative z-30 !overflow-visible">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-grow min-w-[300px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Busca full-text em títulos, descrições e observações..."
            value={filters.search}
            onChange={e => handleChange('search', e.target.value)}
            className="w-full bg-[#ffffff] dark:bg-slate-950 text-[#94a3b8] dark:text-slate-400 backdrop-blur-md border border-surface-container-high dark:border-slate-800 rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-primary shadow-sm text-sm font-bold transition-all"
          />
        </div>

        <button 
          onClick={onBulkEditToggle}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all shadow-md",
            bulkEditMode 
              ? "bg-secondary-container text-on-secondary-container scale-105 border-2 border-secondary" 
              : "bg-white text-on-surface-variant border border-surface-container-high hover:bg-surface-container dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300"
          )}
        >
          <CheckSquare size={18} />
          Bulk Edit
        </button>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all shadow-md",
            isExpanded ? "bg-primary text-on-primary" : "bg-white text-on-surface-variant border border-surface-container-high hover:bg-surface-container dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300"
          )}
        >
          <Filter size={18} />
          Filtros Combinados
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="glass-card p-8 rounded-[2.5rem] border-white/60 shadow-xl space-y-8 animate-fade-in relative z-40 !overflow-visible">
          <div className="flex justify-between items-center pb-4 border-b border-surface-container-high">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Layers size={20} className="text-secondary" />
              Critérios de Pesquisa Avançada
            </h3>
            <button onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest text-error hover:underline flex items-center gap-1">
              <X size={14} /> Limpar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* SIGAD Group */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Sigad Of Rec</label>
              <input 
                type="text" 
                value={filters.sigadOfRec}
                onChange={e => handleChange('sigadOfRec', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Origem</label>
              <input 
                type="text" 
                value={filters.origem}
                onChange={e => handleChange('origem', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Sigad Of Exp</label>
              <input 
                type="text" 
                value={filters.sigadOfExp}
                onChange={e => handleChange('sigadOfExp', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>
            <CustomSelect
              label="Documento"
              value={filters.documentType}
              options={documentTypeOptions}
              onChange={val => handleChange('documentType', val)}
              className="py-1"
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Destino</label>
              <input 
                type="text" 
                value={filters.destination}
                onChange={e => handleChange('destination', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>

            {/* People Group */}
            <CustomSelect
              label="Responsável"
              value={filters.assignee}
              options={assigneeOptions}
              onChange={val => handleChange('assignee', val)}
              className="py-1"
            />
            <CustomSelect
              label="Status"
              value={filters.status}
              options={statusOptions}
              onChange={val => handleChange('status', val)}
              className="py-1"
            />
            <CustomSelect
              label="Prioridade"
              value={filters.priority}
              options={priorityOptions}
              onChange={val => handleChange('priority', val)}
              className="py-1"
            />

            {/* Dates Group */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Data de Entrada</label>
              <input 
                type="date" 
                value={filters.entryDate}
                onChange={e => handleChange('entryDate', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Prazo</label>
              <input 
                type="date" 
                value={filters.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Tags</label>
              <input 
                type="text" 
                value={filters.tags}
                onChange={e => handleChange('tags', e.target.value)}
                placeholder="Ex: design, bug"
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold"
              />
            </div>
            <CustomSelect
              label="Ano"
              value={filters.year}
              options={[{ value: '', label: 'Qualquer ano' }, ...years.map(yr => ({ value: yr, label: yr }))]}
              onChange={val => handleChange('year', val)}
              className="py-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
