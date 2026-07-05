import React from 'react';
import { Plus, ChevronDown, UserPlus, Filter, Shield, FileText, Scale, Send, File, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { USER_ME } from '../data';
import { User, Task } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import { useData } from '../context/DataContext';
import { supabase, mapUserToDb } from '../lib/supabase';

export function Reports() {
  const [activeTab, setActiveTab] = React.useState<'aaj' | 'sij' | 'ajur'>(() => {
    if (USER_ME.accessLevel !== 'gestor') {
      return USER_ME.section.toLowerCase() as any;
    }
    return 'aaj';
  });
  const [accessFilter, setAccessFilter] = React.useState<'todos' | 'admin' | 'militar'>('todos');
  const [statusFilter, setStatusFilter] = React.useState<'todos' | 'ativos' | 'ausentes'>('todos');

  const { tasks: TASKS, team: TEAM, refreshAll } = useData();

  // Stateful team array to support toggling user profile active status
  const [localTeam, setLocalTeam] = React.useState<User[]>([]);

  React.useEffect(() => {
    setLocalTeam(TEAM);
  }, [TEAM]);

  // UI Dropdowns state
  const [showAccessDropdown, setShowAccessDropdown] = React.useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = React.useState(false);

  // New User Form Modal States
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState('');
  const [newUserAccess, setNewUserAccess] = React.useState<'gestor' | 'operador-chefe' | 'operador'>('operador');
  const [newUserSection, setNewUserSection] = React.useState<'AAJ' | 'SIJ' | 'AJUR'>(USER_ME.section);
  const [newUserOnline, setNewUserOnline] = React.useState(true);
  const [newUserAvatar, setNewUserAvatar] = React.useState<string>('');
  const [newUserUsername, setNewUserUsername] = React.useState('');
  const [newUserPassword, setNewUserPassword] = React.useState('');

  const newUserFileRef = React.useRef<HTMLInputElement | null>(null);

  const handleNewUserAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setNewUserAvatar(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClose = () => {
      setShowAccessDropdown(false);
      setShowStatusDropdown(false);
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const totalMembers = localTeam.length;

  const handleToggleStatus = (memberId: string) => {
    const member = localTeam.find(m => m.id === memberId);
    if (!member) return;

    if (USER_ME.accessLevel === 'operador') {
      alert('Como Operador, você só possui permissão para editar dados do seu próprio perfil nas configurações.');
      return;
    }
    if (USER_ME.accessLevel === 'operador-chefe' && member.section !== USER_ME.section) {
      alert(`Como Operador Chefe, você só pode alterar o status de militares da sua própria seção (${USER_ME.section}).`);
      return;
    }

    supabase.from('profiles').update({ online: !member.online }).eq('id', memberId).then(() => {
      refreshAll();
    });
  };

  const openAddUserModal = () => {
    if (USER_ME.accessLevel === 'operador') {
      alert('Como Operador, você não tem permissão para cadastrar novos usuários.');
      return;
    }
    setNewUserName('');
    setNewUserRole('');
    setNewUserAccess('operador');
    setNewUserSection(USER_ME.section);
    setNewUserOnline(true);
    setNewUserAvatar('');
    setNewUserUsername('');
    setNewUserPassword('');
    setIsAddUserOpen(true);
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserRole.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      alert('Por favor, preencha todos os campos do formulário.');
      return;
    }

    // Validação de senha: mínimo de 8 caracteres e pelo menos 1 número
    const passwordRegex = /^(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(newUserPassword)) {
      alert('A senha deve conter no mínimo 8 caracteres e pelo menos 1 número.');
      return;
    }

    try {
      const email = newUserUsername.includes('@') 
        ? newUserUsername 
        : `${newUserUsername.toLowerCase().trim()}@sisjur.afa`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: newUserPassword,
        options: {
          data: {
            name: newUserName,
            role: newUserRole,
            access_level: newUserAccess,
            section: newUserSection,
            online: newUserOnline,
            avatar: newUserAvatar || `https://images.unsplash.com/photo-1535713875002?w=100&h=100&fit=crop&q=80`,
            username: newUserUsername.toLowerCase().trim(),
            created_by: USER_ME.id
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      alert(`Usuário cadastrado com sucesso!`);
      await refreshAll();
      setIsAddUserOpen(false);
    } catch (err: any) {
      console.error('Erro ao cadastrar usuário via Supabase:', err);
      alert(`Falha ao cadastrar usuário: ${err.message}`);
    }
  };

  // Filter tabs based on section access
  const visibleTabs = [
    { id: 'aaj', label: 'AAJ' },
    { id: 'sij', label: 'SIJ' },
    { id: 'ajur', label: 'AJUR' }
  ].filter(tab => {
    if (USER_ME.accessLevel !== 'gestor') {
      return tab.id === USER_ME.section.toLowerCase();
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in text-left relative">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2 border-b border-surface-container-high dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-primary">Gestão de Efetivo</h1>
            <span className="bg-[#ffd666]/20 text-[#755b00] dark:bg-[#ffd666]/10 dark:text-[#ffd666] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {totalMembers} Militares
            </span>
          </div>
          <p className="text-on-surface-variant mt-2 font-medium">Gerencie os militares, atribuições e disponibilidade do seu efetivo.</p>
        </div>
        
        {USER_ME.accessLevel !== 'operador' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openAddUserModal();
            }}
            className="flex items-center gap-2 bg-primary text-on-primary hover:opacity-90 px-6 py-3 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Novo Usuário</span>
          </button>
        )}
      </section>

      {/* Filter and Tabs Bar */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-20">
        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Access Level Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowAccessDropdown(!showAccessDropdown);
                setShowStatusDropdown(false);
              }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              <Filter size={14} />
              Nível: {accessFilter === 'todos' ? 'Todos' : accessFilter === 'admin' ? 'Administrador' : 'Militar'}
              <ChevronDown size={14} />
            </button>
            {showAccessDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 rounded-2xl shadow-xl z-30 py-2">
                {[
                  { id: 'todos', label: 'Todos Níveis' },
                  { id: 'admin', label: 'Administrador' },
                  { id: 'militar', label: 'Militar' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAccessFilter(opt.id as any)}
                    className="w-full text-left px-4 py-2 hover:bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Status Dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
                setShowAccessDropdown(false);
              }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold shadow-sm text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Status: {statusFilter === 'todos' ? 'Todos' : statusFilter === 'ativos' ? 'Ativos' : 'Inativos'}
              <ChevronDown size={14} />
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 rounded-2xl shadow-xl z-30 py-2">
                {[
                  { id: 'todos', label: 'Todos Status' },
                  { id: 'ativos', label: 'Ativos (Online)' },
                  { id: 'ausentes', label: 'Inativos (Offline)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id as any)}
                    className="w-full text-left px-4 py-2 hover:bg-surface-container text-xs font-bold text-on-surface cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Tabs (AAJ, SIJ, AJUR) */}
        <div className="flex gap-4 border-l border-surface-container-high dark:border-slate-800 pl-4 py-1.5 text-xs font-black uppercase tracking-wider">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-1.5 rounded-full transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-[#ffd666]/30 text-[#765c00] dark:bg-[#ffd666]/20 dark:text-[#ffd666] font-black"
                  : "text-on-surface-variant hover:text-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid content - Full width cards layout, no sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {localTeam.filter(m => {
          // 1. Sector Tab Filter
          if (activeTab === 'aaj' && m.section !== 'AAJ') return false;
          if (activeTab === 'sij' && m.section !== 'SIJ') return false;
          if (activeTab === 'ajur' && m.section !== 'AJUR') return false;

          // 2. Access Level Filter
          const isAdmin = m.accessLevel === 'gestor' || m.accessLevel === 'operador-chefe';
          if (accessFilter === 'admin' && !isAdmin) return false;
          if (accessFilter === 'militar' && isAdmin) return false;

          // 3. Status Filter
          if (statusFilter === 'ativos' && !m.online) return false;
          if (statusFilter === 'ausentes' && m.online) return false;

          return true;
        }).map((member) => {
          const memberTasks = TASKS.filter(t => t.assignee?.id === member.id);
          const total = memberTasks.length;
          const completed = memberTasks.filter(t => t.status === 'completed').length;
          const inProgress = memberTasks.filter(t => t.status === 'in-progress').length;
          const notStarted = memberTasks.filter(t => t.status === 'not-started').length;
          const delayed = memberTasks.filter(t => t.status === 'delayed').length;
          const suspended = memberTasks.filter(t => t.status === 'suspended').length;

          // Group by document type
          const docTypeMap: Record<string, number> = {};
          memberTasks.forEach(t => {
            if (t.documentType) {
              docTypeMap[t.documentType] = (docTypeMap[t.documentType] || 0) + 1;
            }
          });

          return (
            <div key={member.id} className="glass-card p-6 rounded-[2.5rem] flex flex-col justify-between hover:border-primary/50 transition-all shadow-md group">
              <div className="space-y-6">
                {/* Header Profile */}
                <div className="flex items-center gap-4">
                  <img src={member.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-surface-container-high dark:border-slate-800 shadow-sm" alt="" />
                  <div>
                    <h4 className="font-black text-sm text-primary leading-snug">{member.name}</h4>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">{member.role}</p>
                    {/* Active profile status button */}
                    <button 
                      onClick={() => handleToggleStatus(member.id)}
                      className={cn(
                        "flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full border transition-all text-[9px] font-black uppercase tracking-wider cursor-pointer",
                        member.online 
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20" 
                          : "bg-neutral-500/15 text-neutral-600 border-neutral-500/30 hover:bg-neutral-500/20"
                      )}
                      title="Clique para alternar o status do perfil"
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", member.online ? "bg-emerald-500 animate-pulse" : "bg-neutral-400")} />
                      {member.online ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                </div>

                {/* Tasks & Status Wrapper */}
                <div className="bg-surface-container-lowest/40 dark:bg-slate-900/20 p-4 rounded-[2rem] border border-surface-container-high/40 dark:border-slate-800/40 space-y-4">
                  {/* 1. Workload Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                      <span>Carga de Trabalho</span>
                      <span className="text-primary">{total} {total === 1 ? 'tarefa' : 'tarefas'}</span>
                    </div>
                    {total > 0 ? (
                      <div className="h-2.5 w-full bg-surface-container-high dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                        {completed > 0 && (
                          <div style={{ width: `${(completed / total) * 100}%` }} className="bg-primary dark:bg-white h-full transition-all duration-500" title={`Concluídas: ${completed}`} />
                        )}
                        {inProgress > 0 && (
                          <div style={{ width: `${(inProgress / total) * 100}%` }} className="bg-[#ffd666] h-full transition-all duration-500" title={`Em Andamento: ${inProgress}`} />
                        )}
                        {notStarted > 0 && (
                          <div style={{ width: `${(notStarted / total) * 100}%` }} className="bg-[#8c8c8c] h-full transition-all duration-500" title={`Não Iniciadas: ${notStarted}`} />
                        )}
                        {delayed > 0 && (
                          <div style={{ width: `${(delayed / total) * 100}%` }} className="bg-red-500 h-full transition-all duration-500" title={`Atrasadas: ${delayed}`} />
                        )}
                        {suspended > 0 && (
                          <div style={{ width: `${(suspended / total) * 100}%` }} className="bg-orange-400 h-full transition-all duration-500" title={`Suspensas: ${suspended}`} />
                        )}
                      </div>
                    ) : (
                      <div className="h-2.5 w-full bg-surface-container-high dark:bg-slate-800 rounded-full shadow-inner flex items-center justify-center">
                        <span className="text-[9px] text-on-surface-variant/40 font-bold">Sem tarefas atribuídas</span>
                      </div>
                    )}
                  </div>

                  {/* 2. Legend and Donut Chart Side-by-Side */}
                  <div className="flex items-center justify-start gap-12 pt-3 border-t border-surface-container-high/30 dark:border-slate-800/30">
                    {/* Left: Status Legends */}
                    <div className="flex flex-col gap-1.5 text-[8.5px] font-black uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-primary dark:text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-white" />
                        Concluídas: {completed}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-[#b58b00] dark:text-[#ffd666]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffd666]" />
                        Em Andamento: {inProgress}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8c8c8c]" />
                        Não Iniciadas: {notStarted}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Atrasadas: {delayed}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap text-orange-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        Suspensas: {suspended}
                      </span>
                    </div>

                    {/* Right: Enlarged Donut Chart */}
                    <div className="w-[120px] h-[120px] relative flex items-center justify-center flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={
                              total > 0 
                                ? [
                                    { name: 'Concluídas', value: completed, color: 'var(--color-primary)' },
                                    { name: 'Em Andamento', value: inProgress, color: '#ffd666' },
                                    { name: 'Não Iniciadas', value: notStarted, color: '#8c8c8c' },
                                    { name: 'Atrasadas', value: delayed, color: '#ef4444' },
                                    { name: 'Suspensas', value: suspended, color: '#fb923c' }
                                  ].filter(item => item.value > 0)
                                : [{ name: 'Sem tarefas', value: 1, color: '#e5e7eb' }]
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={45}
                            paddingAngle={total > 0 ? 3 : 0}
                            dataKey="value"
                          >
                            {total > 0 ? (
                              [
                                { name: 'Concluídas', value: completed, color: 'var(--color-primary)' },
                                { name: 'Em Andamento', value: inProgress, color: '#ffd666' },
                                { name: 'Não Iniciadas', value: notStarted, color: '#8c8c8c' },
                                { name: 'Atrasadas', value: delayed, color: '#ef4444' },
                                { name: 'Suspensas', value: suspended, color: '#fb923c' }
                              ].filter(item => item.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))
                            ) : (
                              <Cell fill="var(--color-outline-variant)" opacity={0.3} />
                            )}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-sm font-black leading-none text-primary">{total}</span>
                        <span className="text-[7px] uppercase font-bold tracking-widest text-on-surface-variant leading-none mt-0.5">Total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Types Section */}
                <div className="mt-6 pt-5 border-t border-surface-container/50 dark:border-slate-800/50">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 pb-2 border-b border-surface-container-high dark:border-slate-800/80">
                    Tipos de Documentos
                  </h5>
                  <div className="space-y-4">
                    {Object.entries(docTypeMap).map(([type, count]) => {
                      const typeTasks = memberTasks.filter(t => t.documentType === type);
                      const typeCompleted = typeTasks.filter(t => t.status === 'completed').length;
                      
                      let IconComponent = File;
                      const lowerType = type.toLowerCase();
                      if (lowerType.includes('ofício')) IconComponent = FileText;
                      else if (lowerType.includes('portaria')) IconComponent = Shield;
                      else if (lowerType.includes('judicial') || lowerType.includes('mandado')) IconComponent = Scale;
                      else if (lowerType.includes('despacho')) IconComponent = Send;

                      return (
                        <div key={type} className="flex items-center gap-3.5 animate-fade-in">
                          {/* Circular Icon Container */}
                          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container dark:bg-slate-800 text-primary dark:text-white border border-surface-container-high dark:border-slate-700 shadow-sm flex-shrink-0">
                            <IconComponent size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight text-primary">{type}</p>
                            <p className="text-[10px] text-on-surface-variant/80 font-medium">
                              {count} {count === 1 ? 'processo' : 'processos'} • {typeCompleted} concluído(s)
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(docTypeMap).length === 0 && (
                      <p className="text-[10px] italic font-bold tracking-widest text-on-surface-variant/40 uppercase py-2">
                        Nenhum documento
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* New Member Dashed FAB Card */}
        {USER_ME.accessLevel !== 'operador' && (
          <div 
            onClick={() => openAddUserModal()}
            className="rounded-[2.5rem] border-2 border-dashed border-surface-container-highest dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-low/40 dark:hover:bg-slate-900/40 transition-all group min-h-[180px] h-full"
          >
            <div className="w-12 h-12 rounded-full border border-surface-container-highest dark:border-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-white dark:bg-slate-900 shadow-sm">
              <Plus className="text-on-surface-variant group-hover:text-primary transition-colors" size={24} />
            </div>
            <h4 className="font-black text-sm text-primary leading-tight">Novo Usuário</h4>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1 font-bold">Clique para enviar convite</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-surface-container-high dark:border-slate-800 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl text-left"
            >
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-surface-container-high dark:border-slate-800">
                <h3 className="font-black text-base uppercase tracking-wider text-primary">Novo Usuário</h3>
                <button 
                  onClick={() => setIsAddUserOpen(false)}
                  className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitNewUser} className="space-y-5">
                {/* Photo Preview & Selection */}
                <div className="flex flex-col items-center gap-3 pb-2 border-b border-surface-container-high/40 dark:border-slate-800/40">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-surface-container bg-surface-container flex items-center justify-center">
                    {newUserAvatar ? (
                      <img src={newUserAvatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <UserPlus className="text-on-surface-variant/40" size={28} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => newUserFileRef.current?.click()}
                    className="px-4 py-1.5 border border-surface-container-high dark:border-slate-800 text-on-surface-variant font-bold text-[9px] uppercase tracking-wider rounded-xl hover:bg-surface-container cursor-pointer"
                  >
                    Selecionar Foto
                  </button>
                  <input
                    type="file"
                    ref={newUserFileRef}
                    onChange={handleNewUserAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* User Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    placeholder="Ex: Ten. Cel. Rodrigo Silva"
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Função / Cargo</label>
                  <input
                    type="text"
                    required
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    placeholder="Ex: Analista de Sindicâncias"
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Access Level */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Nível de Acesso</label>
                  <select
                    value={newUserAccess}
                    onChange={e => setNewUserAccess(e.target.value as any)}
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="operador">Operador</option>
                    {USER_ME.accessLevel === 'gestor' && (
                      <option value="gestor">Gestor AAJ</option>
                    )}
                    <option value="operador-chefe">Operador Chefe</option>
                  </select>
                </div>

                {/* Section selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Seção Militar</label>
                  {USER_ME.accessLevel === 'gestor' ? (
                    <select
                      value={newUserSection}
                      onChange={e => setNewUserSection(e.target.value as any)}
                      className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="AAJ">AAJ</option>
                      <option value="SIJ">SIJ</option>
                      <option value="AJUR">AJUR</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={newUserSection}
                      className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 opacity-60 border-none rounded-2xl text-sm text-on-surface"
                    />
                  )}
                </div>

                {/* Login / Username */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Login / Usuário</label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={e => setNewUserUsername(e.target.value)}
                    placeholder="Nome de usuário para login"
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Senha</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="Defina uma senha"
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Status Inicial</label>
                  <select
                    value={String(newUserOnline)}
                    onChange={e => setNewUserOnline(e.target.value === 'true')}
                    className="w-full px-4 py-3 bg-surface-container dark:bg-slate-800 border-none rounded-2xl text-sm text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>

                {/* Action buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="flex-1 py-3 border border-surface-container-high dark:border-slate-800 text-on-surface-variant font-bold text-xs rounded-2xl hover:bg-surface-container transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-2xl hover:opacity-90 transition-all cursor-pointer text-center shadow-lg shadow-primary/10"
                  >
                    Cadastrar
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
