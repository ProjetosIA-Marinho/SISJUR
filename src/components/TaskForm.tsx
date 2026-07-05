import React from 'react';
import { X, Save, Plus, Trash2, Paperclip, Calendar, ShieldCheck, FileText, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, User } from '../types';
import { USER_ME } from '../data';
import { cn } from '../lib/utils';
import { CustomSelect } from './CustomSelect';
import { useData } from '../context/DataContext';

const documentTypeOptions = [
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
  { value: 'low', label: 'Rotina (Baixa)' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const statusOptions = [
  { value: 'not-started', label: 'Não Iniciada' },
  { value: 'in-progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluída' },
  { value: 'delayed', label: 'Atrasada' },
  { value: 'suspended', label: 'Suspensa' },
];

interface TaskFormProps {
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  initialTask?: Partial<Task>;
}

export function TaskForm({ onClose, onSave, initialTask }: TaskFormProps) {
  const { team } = useData();

  const assigneeOptions = [
    { value: USER_ME.id, label: `${USER_ME.name} (Eu)`, avatar: USER_ME.avatar },
    ...team.filter(member => member.id !== USER_ME.id).map(member => ({
      value: member.id,
      label: member.name,
      avatar: member.avatar
    }))
  ];

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<Partial<Task>>({
    title: '',
    status: 'not-started',
    priority: 'low',
    dueDate: new Date().toISOString().split('T')[0],
    assignee: USER_ME,
    progress: 0,
    sigadOfRec: '',
    origem: '',
    sigadOfExp: '',
    destination: '',
    documentType: 'Ofício',
    entryDate: new Date().toISOString().split('T')[0],
    expeditedDate: '',
    observations: '',
    tags: ['AAJ'], // Default to 'AAJ' as Setor Responsável
    subtasks: [],
    ...initialTask
  });

  const [subtaskForm, setSubtaskForm] = React.useState<Partial<Task>>({
    title: '',
    status: 'not-started',
    priority: 'low',
    dueDate: new Date().toISOString().split('T')[0],
    assignee: USER_ME,
    sigadOfExp: '',
    destination: '',
    documentType: 'Ofício',
    entryDate: new Date().toISOString().split('T')[0],
    expeditedDate: '',
    observations: '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.status === 'completed' && formData.subtasks && formData.subtasks.length > 0) {
      const pendingSubtasks = formData.subtasks.filter(st => st.status !== 'completed');
      if (pendingSubtasks.length > 0) {
        setErrorMessage(
          `Não é possível alterar o status da tarefa principal para "Concluída" porque existem ${pendingSubtasks.length} tarefas relacionadas pendentes.`
        );
        return;
      }
    }
    setErrorMessage(null);
    onSave(formData);
  };

  const addSubtask = () => {
    if (subtaskForm.title) {
      const newSubtask: Task = {
        id: `st-${Date.now()}`,
        title: subtaskForm.title,
        status: subtaskForm.status || 'not-started',
        priority: subtaskForm.priority || 'low',
        dueDate: subtaskForm.dueDate || new Date().toISOString().split('T')[0],
        assignee: subtaskForm.assignee || USER_ME,
        progress: subtaskForm.status === 'completed' ? 100 : 0,
        sigadOfRec: '',
        origem: '',
        sigadOfExp: subtaskForm.sigadOfExp || '',
        destination: subtaskForm.destination || '',
        documentType: subtaskForm.documentType || 'Ofício',
        entryDate: subtaskForm.entryDate || new Date().toISOString().split('T')[0],
        expeditedDate: subtaskForm.expeditedDate || '',
        observations: subtaskForm.observations || '',
        year: new Date().getFullYear().toString(),
        tags: [],
        subtasks: []
      };
      setFormData({
        ...formData,
        subtasks: [...(formData.subtasks || []), newSubtask]
      });
      // Reset subtask form
      setSubtaskForm({
        title: '',
        status: 'not-started',
        priority: 'low',
        dueDate: new Date().toISOString().split('T')[0],
        assignee: USER_ME,
        sigadOfExp: '',
        destination: '',
        documentType: 'Ofício',
        entryDate: new Date().toISOString().split('T')[0],
        expeditedDate: '',
        observations: '',
      });
    }
  };

  const removeSubtask = (id: string) => {
    setFormData({
      ...formData,
      subtasks: formData.subtasks?.filter(st => st.id !== id)
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Cadastro de Tarefa</h2>
        <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-12 overflow-y-auto custom-scrollbar pr-4">
        
        {/* Dados do Documento Recebido */}
        <div className="glass-card p-8 rounded-[2rem] border-white/60 shadow-lg space-y-6 !overflow-visible relative z-30">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FileText size={20} className="text-secondary" />
            Dados do Documento Recebido
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Sigad Of Rec</label>
              <input 
                type="text" 
                value={formData.sigadOfRec || ''}
                onChange={e => setFormData({ ...formData, sigadOfRec: e.target.value })}
                placeholder="Ex: 525923"
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Origem</label>
              <input 
                type="text" 
                value={formData.origem || ''}
                onChange={e => setFormData({ ...formData, origem: e.target.value })}
                placeholder="Ex: GSD, DIRENS, JMU..."
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Assunto (Título)</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Digite o assunto ou título da tarefa..."
              className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end !overflow-visible relative z-30">
            <CustomSelect
              label="Tipo de Documento"
              value={formData.documentType || 'Ofício'}
              options={documentTypeOptions}
              onChange={val => setFormData({ ...formData, documentType: val })}
              variant="modal"
            />
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Data da Entrada</label>
              <input 
                type="date" 
                value={formData.entryDate}
                onChange={e => setFormData({ ...formData, entryDate: e.target.value, year: e.target.value ? e.target.value.split('-')[0] : formData.year })}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
              />
            </div>
          </div>
        </div>

        {/* Status, Responsabilidade & Prazos */}
        <div className="glass-card p-8 rounded-[2rem] border-white/60 shadow-lg space-y-6 !overflow-visible relative z-20">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Calendar size={20} className="text-secondary" />
            Status, Responsabilidade & Prazos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end !overflow-visible relative z-20">
            <CustomSelect
              label="Prioridade"
              value={formData.priority || 'low'}
              options={priorityOptions}
              onChange={val => setFormData({ ...formData, priority: val as TaskPriority })}
              variant="modal"
            />

            <CustomSelect
              label="Status"
              value={formData.status || 'not-started'}
              options={statusOptions}
              onChange={val => setFormData({ ...formData, status: val as TaskStatus })}
              variant="modal"
            />

            <CustomSelect
              label="Responsável"
              value={formData.assignee?.id || USER_ME.id}
              options={assigneeOptions}
              onChange={val => setFormData({ ...formData, assignee: team.find(t => t.id === val) || USER_ME })}
              variant="modal"
            />

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Prazo para Cumprimento</label>
              <input 
                type="date" 
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
              />
            </div>
          </div>
        </div>

        {/* Setor Responsável */}
        <div className="glass-card p-8 rounded-[2rem] border-white/60 shadow-lg space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck size={20} className="text-secondary" />
            Setor Responsável
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {['AAJ', 'SIJ', 'AJUR'].map((setor) => {
              const isSelected = formData.tags?.includes(setor);
              return (
                <button
                  key={setor}
                  type="button"
                  onClick={() => setFormData({ ...formData, tags: [setor] })}
                  className={cn(
                    "py-4 px-6 rounded-2xl font-black text-sm transition-all text-center border-2",
                    isSelected 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container hover:text-primary"
                  )}
                >
                  {setor}
                </button>
              );
            })}
          </div>
        </div>

        {/* Observações */}
        <div className="glass-card p-8 rounded-[2rem] border-white/60 shadow-lg space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Observações / Descrição</label>
            <textarea 
              rows={4}
              value={formData.observations || ''}
              onChange={e => setFormData({ ...formData, observations: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-3xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
              placeholder="Digite detalhes importantes ou observações..."
            />
          </div>

          <div className="flex items-center gap-2 p-4 border-2 border-dashed border-surface-container-high rounded-3xl text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer group">
            <Paperclip size={20} />
            <span className="text-sm font-bold">Anexar documentos ou checklists</span>
          </div>
        </div>

        {/* Tarefas Relacionadas */}
        <div className="glass-card p-8 rounded-[2rem] border-white/60 shadow-lg space-y-6 !overflow-visible relative z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Plus size={20} className="text-secondary" />
              Tarefas Relacionadas
            </h3>
            <span className="text-xs font-bold text-on-surface-variant/60 uppercase">
              {formData.subtasks?.length || 0} adicionadas
            </span>
          </div>
          
          {/* Form to Add Related Task - strictly requested fields */}
          <div className="space-y-4 bg-surface-container/30 p-6 rounded-3xl border border-white/40 !overflow-visible relative z-10">
            <h4 className="text-xs font-black uppercase tracking-wider text-secondary">Nova Tarefa Relacionada</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end !overflow-visible relative z-30">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Assunto / Título *</label>
                <input 
                  type="text" 
                  value={subtaskForm.title || ''}
                  onChange={e => setSubtaskForm({ ...subtaskForm, title: e.target.value })}
                  placeholder="Título da tarefa relacionada..."
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
              <CustomSelect
                label="Responsável"
                value={subtaskForm.assignee?.id || USER_ME.id}
                options={assigneeOptions}
                onChange={val => setSubtaskForm({ ...subtaskForm, assignee: team.find(t => t.id === val) || USER_ME })}
                className="py-1"
                variant="modal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end !overflow-visible relative z-20">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Sigad Exp</label>
                <input 
                  type="text"
                  value={subtaskForm.sigadOfExp || ''}
                  onChange={e => setSubtaskForm({ ...subtaskForm, sigadOfExp: e.target.value })}
                  placeholder="Ex: 531630"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
              <CustomSelect
                label="Tipo de Documento"
                value={subtaskForm.documentType || 'Ofício'}
                options={documentTypeOptions}
                onChange={val => setSubtaskForm({ ...subtaskForm, documentType: val })}
                className="py-1"
                variant="modal"
              />
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Destino</label>
                <input 
                  type="text"
                  value={subtaskForm.destination || ''}
                  onChange={e => setSubtaskForm({ ...subtaskForm, destination: e.target.value })}
                  placeholder="Ex: SREG, GSD..."
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end !overflow-visible relative z-10">
              <CustomSelect
                label="Status"
                value={subtaskForm.status || 'not-started'}
                options={statusOptions}
                onChange={val => setSubtaskForm({ ...subtaskForm, status: val as any })}
                className="py-1"
                variant="modal"
              />
              <CustomSelect
                label="Prioridade"
                value={subtaskForm.priority || 'low'}
                options={priorityOptions}
                onChange={val => setSubtaskForm({ ...subtaskForm, priority: val as any })}
                className="py-1"
                variant="modal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Data de Entrada</label>
                <input 
                  type="date"
                  value={subtaskForm.entryDate || ''}
                  onChange={e => setSubtaskForm({ ...subtaskForm, entryDate: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Prazo</label>
                <input 
                  type="date"
                  value={subtaskForm.dueDate || ''}
                  onChange={e => setSubtaskForm({ ...subtaskForm, dueDate: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Data Expedido</label>
                <input 
                  type="date"
                  value={subtaskForm.expeditedDate || ''}
                  onChange={e => setSubtaskForm({ ...subtaskForm, expeditedDate: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Observações</label>
              <textarea
                rows={2}
                value={subtaskForm.observations || ''}
                onChange={e => setSubtaskForm({ ...subtaskForm, observations: e.target.value })}
                placeholder="Observações adicionais..."
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-xs font-bold focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={addSubtask}
                className="bg-secondary text-on-secondary dark:bg-amber-400 dark:text-slate-950 py-3 px-6 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all text-xs flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar Tarefa Relacionada
              </button>
            </div>
          </div>

          {/* List of Added Related Tasks - show exactly the 6 requested fields: sigad exp, assunto, responsável, status, data entrada, data of exped */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {formData.subtasks?.map(st => (
              <div key={st.id} className="p-4 bg-surface-container rounded-2xl border border-white/40 space-y-2 group transition-all hover:border-primary/40">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-primary">{st.title}</span>
                    <span className="text-[9px] text-on-surface-variant uppercase tracking-wider">Tarefa Relacionada # {st.id.slice(-4)}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeSubtask(st.id)}
                    className="text-on-surface-variant hover:text-error transition-all p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10px] font-medium text-on-surface-variant/80 bg-white/20 p-3 rounded-xl">
                  <div>
                    <span className="font-bold">Assunto:</span> {st.title}
                  </div>
                  {st.sigadOfExp && (
                    <div>
                      <span className="font-bold">Sigad Exp:</span> {st.sigadOfExp}
                    </div>
                  )}
                  {st.assignee && (
                    <div>
                      <span className="font-bold">Responsável:</span> {st.assignee.name}
                    </div>
                  )}
                  {st.status && (
                    <div>
                      <span className="font-bold">Status:</span> {st.status === 'completed' ? 'Concluída' : st.status === 'in-progress' ? 'Em Andamento' : st.status === 'delayed' ? 'Atrasada' : st.status === 'suspended' ? 'Suspensa' : 'Não Iniciada'}
                    </div>
                  )}
                  {st.entryDate && (
                    <div>
                      <span className="font-bold">Data Entrada:</span> {st.entryDate.split('-').reverse().join('/')}
                    </div>
                  )}
                  {st.expeditedDate && (
                    <div>
                      <span className="font-bold">Data of Exped:</span> {st.expeditedDate.split('-').reverse().join('/')}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!formData.subtasks || formData.subtasks.length === 0) && (
              <p className="text-center py-4 text-xs font-medium text-on-surface-variant/40 italic">Nenhuma tarefa relacionada adicionada</p>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-50 text-error rounded-2xl flex items-center gap-3 font-bold text-xs border border-red-100 animate-fade-in">
            <AlertTriangle className="text-error flex-shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-5 rounded-3xl border-2 border-surface-container-high font-bold text-on-surface-variant hover:bg-surface-container transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 py-5 rounded-3xl bg-primary text-on-primary font-bold shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Salvar Registro
          </button>
        </div>
      </form>
    </div>
  );
}
