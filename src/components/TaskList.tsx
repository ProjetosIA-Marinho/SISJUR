import React from 'react';
import { Plus, CheckCircle2, Clock, AlertTriangle, ChevronLeft, ChevronRight, AlertCircle, FileUp, FileDown, MoreHorizontal, Trash2, Edit3, ChevronDown, ChevronRight as ChevronRightIcon, Layers, CheckSquare, X, Eye, Calendar, Tag, User, FileText, Bookmark, Info, ExternalLink } from 'lucide-react';
import { TEAM as STATIC_TEAM, USER_ME } from '../data';
import { cn } from '../lib/utils';
import { TaskFilters } from './TaskFilters';
import { TaskForm } from './TaskForm';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../context/DataContext';

export function TaskList() {
  const { tasks: dbTasks, team: TEAM, addTask, updateTask, deleteTask } = useData();
  const [tasks, setLocalTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    if (dbTasks) {
      setLocalTasks(dbTasks.filter(t => t.documentType !== 'holiday' && t.documentType !== 'routine'));
    }
  }, [dbTasks]);

  const setTasks = async (updater: Task[] | ((prev: Task[]) => Task[])) => {
    const nextTasks = typeof updater === 'function' ? updater(tasks) : updater;
    setLocalTasks(nextTasks);

    // Sync additions and deletions
    const deleted = tasks.filter(lt => !nextTasks.some(nt => nt.id === lt.id));
    for (const d of deleted) {
      await deleteTask(d.id);
    }

    for (const nt of nextTasks) {
      const prevTask = tasks.find(lt => lt.id === nt.id);
      if (!prevTask) {
        await addTask(nt);
      } else {
        const fieldsChanged = (
          prevTask.title !== nt.title ||
          prevTask.description !== nt.description ||
          prevTask.status !== nt.status ||
          prevTask.priority !== nt.priority ||
          prevTask.dueDate !== nt.dueDate ||
          prevTask.progress !== nt.progress ||
          prevTask.assignee?.id !== nt.assignee?.id ||
          prevTask.sigadOfRec !== nt.sigadOfRec ||
          prevTask.origem !== nt.origem ||
          prevTask.sigadOfExp !== nt.sigadOfExp ||
          prevTask.destination !== nt.destination ||
          prevTask.documentType !== nt.documentType ||
          prevTask.entryDate !== nt.entryDate ||
          prevTask.expeditedDate !== nt.expeditedDate ||
          prevTask.observations !== nt.observations ||
          prevTask.year !== nt.year ||
          JSON.stringify(prevTask.tags) !== JSON.stringify(nt.tags)
        );
        if (fieldsChanged) {
          await updateTask(nt);
        }

        const prevSubtasks = prevTask.subtasks || [];
        const nextSubtasks = nt.subtasks || [];

        const deletedSubs = prevSubtasks.filter(pst => !nextSubtasks.some(nst => nst.id === pst.id));
        for (const ds of deletedSubs) {
          await deleteTask(ds.id);
        }

        for (const nst of nextSubtasks) {
          const prevSt = prevSubtasks.find(pst => pst.id === nst.id);
          if (!prevSt) {
            await addTask({ ...nst, parentId: nt.id });
          } else {
            const subFieldsChanged = (
              prevSt.title !== nst.title ||
              prevSt.description !== nst.description ||
              prevSt.status !== nst.status ||
              prevSt.priority !== nst.priority ||
              prevSt.dueDate !== nst.dueDate ||
              prevSt.progress !== nst.progress ||
              prevSt.assignee?.id !== nst.assignee?.id ||
              prevSt.sigadOfRec !== nst.sigadOfRec ||
              prevSt.origem !== nst.origem ||
              prevSt.sigadOfExp !== nst.sigadOfExp ||
              prevSt.destination !== nst.destination ||
              prevSt.documentType !== nst.documentType ||
              prevSt.entryDate !== nst.entryDate ||
              prevSt.expeditedDate !== nst.expeditedDate ||
              prevSt.observations !== nst.observations ||
              prevSt.year !== nst.year ||
              JSON.stringify(prevSt.tags) !== JSON.stringify(nst.tags)
            );
            if (subFieldsChanged) {
              await updateTask({ ...nst, parentId: nt.id });
            }
          }
        }
      }
    }
  };
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | undefined>(undefined);
  const [bulkEditMode, setBulkEditMode] = React.useState(false);
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([]);
  const [activeFilters, setActiveFilters] = React.useState<any>({});
  const [expandedTasks, setExpandedTasks] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'desc' | 'asc'>('desc');

  // States for subtasks / related tasks management
  const [quickSubtaskForms, setQuickSubtaskForms] = React.useState<Record<string, { title: string, assigneeId: string, status: string, entryDate: string, expeditedDate: string, sigadOfExp: string, dueDate: string }>>({});
  const [editingSubtask, setEditingSubtask] = React.useState<{ mainTaskId: string, subtask: Task } | null>(null);
  const [selectedSubtasks, setSelectedSubtasks] = React.useState<Record<string, string[]>>({});
  const [selectedDrawerTaskId, setSelectedDrawerTaskId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [showTemplateModal, setShowTemplateModal] = React.useState(false);

  const downloadXlsxTemplate = () => {
    const data = [
      {
        'Título': 'Elaborar Relatório Técnico de Operações',
        'Status': 'Em Andamento',
        'Prioridade': 'Alta',
        'Responsável': 'Ten. Cel. Silva',
        'Data Entrada': '01/07/2026',
        'Prazo': '10/07/2026',
        'Término': '12/07/2026',
        'SIGAD Entrada': 'SIGAD-12345-2026',
        'SIGAD Saída': 'SIGAD-12347-2026',
        'Destino': 'SIJ',
        'Tipo': 'Estudo',
        'Ano': '2026',
        'Observações': 'Análise preliminar das demandas do setor de logística'
      },
      {
        'Título': 'Revisão de Portarias de Pessoal',
        'Status': 'Não Iniciada',
        'Prioridade': 'Média',
        'Responsável': 'Cap. Oliveira',
        'Data Entrada': '02/07/2026',
        'Prazo': '15/07/2026',
        'Término': '',
        'SIGAD Entrada': 'SIGAD-98765-2026',
        'SIGAD Saída': '',
        'Destino': 'AJUR',
        'Tipo': 'Portaria',
        'Ano': '2026',
        'Observações': 'Verificar conformidade com a nova legislação'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo Importação');
    XLSX.writeFile(workbook, 'modelo_importacao_tarefas.xlsx');
  };

  const downloadCsvTemplate = () => {
    const headers = [
      ['Título', 'Status', 'Prioridade', 'Responsável', 'Data Entrada', 'Prazo', 'Término', 'SIGAD Entrada', 'SIGAD Saída', 'Destino', 'Tipo', 'Ano', 'Observações'],
      ['Elaborar Relatório Técnico de Operações', 'Em Andamento', 'Alta', 'Ten. Cel. Silva', '01/07/2026', '10/07/2026', '12/07/2026', 'SIGAD-12345-2026', 'SIGAD-12347-2026', 'SIJ', 'Estudo', '2026', 'Análise preliminar das demandas'],
      ['Revisão de Portarias de Pessoal', 'Não Iniciada', 'Média', 'Cap. Oliveira', '02/07/2026', '15/07/2026', '', 'SIGAD-98765-2026', '', 'AJUR', 'Portaria', '2026', 'Verificar conformidade com a nova legislação']
    ];

    const csvContent = headers.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_tarefas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<any>(worksheet);

        const getField = (rowObj: any, keys: string[]) => {
          for (const key of keys) {
            const foundKey = Object.keys(rowObj).find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
            if (foundKey) return rowObj[foundKey];
          }
          return undefined;
        };

        const parseDate = (val: any): string => {
          if (!val) return '';
          if (val instanceof Date) {
            return val.toISOString().split('T')[0];
          }
          const valStr = String(val).trim();
          const dmyMatch = valStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (dmyMatch) {
            const day = dmyMatch[1].padStart(2, '0');
            const month = dmyMatch[2].padStart(2, '0');
            const year = dmyMatch[3];
            return `${year}-${month}-${day}`;
          }
          const parsed = Date.parse(valStr);
          if (!isNaN(parsed)) {
            return new Date(parsed).toISOString().split('T')[0];
          }
          return valStr;
        };

        const importedTasks: Task[] = data.map((row: any, index: number) => {
          const title = String(getField(row, ['title', 'titulo', 'título', 'tarefa', 'assunto', 'subject', 'nome']) || `Tarefa Importada ${index + 1}`).trim();
          
          let status: Task['status'] = 'not-started';
          const statusVal = String(getField(row, ['status', 'situacao', 'situação', 'estado', 'fase']) || '').toLowerCase().trim();
          if (statusVal.includes('concl') || statusVal.includes('comp') || statusVal === 'concluída' || statusVal === 'concluido') status = 'completed';
          else if (statusVal.includes('andamento') || statusVal.includes('progresso') || statusVal === 'em andamento') status = 'in-progress';
          else if (statusVal.includes('atras') || statusVal === 'atrasada') status = 'delayed';
          else if (statusVal.includes('susp') || statusVal === 'suspensa') status = 'suspended';

          let priority: Task['priority'] = 'medium';
          const prioVal = String(getField(row, ['priority', 'prioridade']) || '').toLowerCase().trim();
          if (prioVal.includes('baix') || prioVal === 'low') priority = 'low';
          else if (prioVal.includes('alt') || prioVal === 'high') priority = 'high';
          else if (prioVal.includes('urg') || prioVal === 'urgent') priority = 'urgent';

          const assigneeName = String(getField(row, ['assignee', 'responsavel', 'responsável', 'agente']) || '').trim();
          let matchedAssignee = TEAM.find(member => 
            member.name.toLowerCase().includes(assigneeName.toLowerCase()) ||
            assigneeName.toLowerCase().includes(member.name.toLowerCase()) ||
            (member.username && member.username.toLowerCase().includes(assigneeName.toLowerCase())) ||
            (member.username && assigneeName.toLowerCase().includes(member.username.toLowerCase()))
          );
          
          let observations = getField(row, ['observations', 'observacoes', 'observações', 'obs']) ? String(getField(row, ['observations', 'observacoes', 'observações', 'obs'])).trim() : undefined;

          if (!matchedAssignee && assigneeName) {
            matchedAssignee = USER_ME;
            observations = `${observations ? observations + ' | ' : ''}Resp. original: ${assigneeName}`;
          } else if (!matchedAssignee) {
            matchedAssignee = USER_ME;
          }

          const entryDateRaw = getField(row, ['entrydate', 'data entrada', 'data de entrada', 'entrada']);
          const entryDate = entryDateRaw ? parseDate(entryDateRaw) : new Date().toISOString().split('T')[0];

          const dueDateRaw = getField(row, ['duedate', 'prazo', 'vencimento', 'data limite']);
          const dueDate = dueDateRaw ? parseDate(dueDateRaw) : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

          const expeditedDateRaw = getField(row, ['expediteddate', 'data expedicao', 'data expedição', 'data expedido', 'expedido', 'termino', 'término', 'data termino', 'data término']);
          const expeditedDate = expeditedDateRaw ? parseDate(expeditedDateRaw) : undefined;

          const sigadOfRec = getField(row, ['sigadrec', 'sigad de entrada', 'sigad entrada', 'sigadofrec', 'sigad rec']) ? String(getField(row, ['sigadrec', 'sigad de entrada', 'sigad entrada', 'sigadofrec', 'sigad rec'])).trim() : undefined;
          const sigadOfExp = getField(row, ['sigadexp', 'sigad de saida', 'sigad de saída', 'sigad saida', 'sigad saída', 'sigadofexp', 'sigad exp']) ? String(getField(row, ['sigadexp', 'sigad de saida', 'sigad de saída', 'sigad saida', 'sigad saída', 'sigadofexp', 'sigad exp'])).trim() : undefined;
          const origem = getField(row, ['origem', 'orgao de origem', 'órgão de origem']) ? String(getField(row, ['origem', 'orgao de origem', 'órgão de origem'])).trim() : undefined;
          const destination = getField(row, ['destino', 'orgao de destino', 'órgão de destino']) ? String(getField(row, ['destino', 'orgao de destino', 'órgão de destino'])).trim() : undefined;
          const documentType = getField(row, ['documenttype', 'tipo', 'tipo de documento', 'tipo documento']) ? String(getField(row, ['documenttype', 'tipo', 'tipo de documento', 'tipo documento'])).trim() : undefined;
          const year = getField(row, ['year', 'ano']) ? String(getField(row, ['year', 'ano'])).trim() : undefined;

          // Resolve Setor Responsável (stored in tags array, options: 'AAJ', 'SIJ', 'AJUR')
          const setorVal = String(getField(row, ['setor', 'setor responsável', 'setor responsavel', 'seção', 'secao']) || '').toUpperCase().trim();
          const finalSetor = ['AAJ', 'SIJ', 'AJUR'].includes(setorVal) 
            ? setorVal 
            : (matchedAssignee ? matchedAssignee.section : 'AAJ');

          return {
            id: 't_imp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title,
            status,
            priority,
            assignee: matchedAssignee,
            entryDate,
            dueDate,
            expeditedDate,
            sigadOfRec,
            sigadOfExp,
            origem,
            destination,
            documentType,
            year,
            observations,
            tags: [finalSetor],
            progress: status === 'completed' ? 100 : status === 'in-progress' ? 50 : 0,
            subtasks: []
          };
        });

        if (importedTasks.length > 0) {
          setTasks(prev => [...importedTasks, ...prev]);
          alert(`${importedTasks.length} tarefas importadas com sucesso!`);
        } else {
          alert('Nenhuma tarefa válida encontrada no arquivo.');
        }
      } catch (error) {
        console.error(error);
        alert('Ocorreu um erro ao importar o arquivo. Verifique se a estrutura está correta.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExport = (format: 'pdf' | 'csv' | 'xls') => {
    if (format === 'xls' || format === 'csv') {
      const exportData = tasks.map(t => ({
        'ID': t.id,
        'Título / Assunto': t.title,
        'Status': statusLabels[t.status],
        'Prioridade': t.priority === 'urgent' ? 'Crítica' : t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Média' : 'Baixa',
        'Responsável': t.assignee.name,
        'Responsável Cargo': t.assignee.role,
        'Data Entrada': formatDate(t.entryDate),
        'Prazo': formatDate(t.dueDate),
        'Data Expedição': formatDate(t.expeditedDate),
        'SIGAD Entrada': t.sigadOfRec || '',
        'SIGAD Saída': t.sigadOfExp || '',
        'Órgão de Origem': t.origem || '',
        'Órgão de Destino': t.destination || '',
        'Tipo de Documento': t.documentType || '',
        'Ano': t.year || '',
        'Observações': t.observations || '',
        'Qtd Tarefas Relacionadas': t.subtasks?.length || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tarefas');

      if (format === 'csv') {
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvOutput], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `tarefas_exportadas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        XLSX.writeFile(workbook, `tarefas_exportadas_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
    } else if (format === 'pdf') {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text('Relatório de Tarefas e Demandas', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 27);
      
      const headers = [['Título', 'Status', 'Responsável', 'Data Entrada', 'Prazo', 'SIGAD Entrada', 'SIGAD Saída']];
      const body = tasks.map(t => [
        t.title,
        statusLabels[t.status],
        t.assignee.name,
        formatDate(t.entryDate),
        formatDate(t.dueDate),
        t.sigadOfRec || '-',
        t.sigadOfExp || '-'
      ]);
      
      autoTable(doc, {
        startY: 35,
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 25 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 }
        }
      });
      
      doc.save(`relatorio_tarefas_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, itemsPerPage]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return '-';
    }
  };

  const calculateProgress = (task: Task): number => {
    const getStatusWeight = (status: string) => {
      switch (status) {
        case 'completed': return 100;
        case 'in-progress': return 50;
        default: return 0;
      }
    };

    if (!task.subtasks || task.subtasks.length === 0) {
      return getStatusWeight(task.status);
    }

    const subtaskWeights = task.subtasks.map(st => getStatusWeight(st.status));
    const mainWeight = getStatusWeight(task.status);
    const totalWeight = mainWeight + subtaskWeights.reduce((sum, w) => sum + w, 0);
    return Math.round(totalWeight / (task.subtasks.length + 1));
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'in-progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'not-started': return 'bg-slate-50 text-slate-700 border-slate-100';
      case 'delayed': return 'bg-red-50 text-red-700 border-red-100';
      case 'suspended': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-surface-container text-on-surface-variant border-surface-container-high';
    }
  };

  const statusLabels: Record<string, string> = {
    'not-started': 'Não Iniciada',
    'in-progress': 'Em Andamento',
    'completed': 'Concluída',
    'delayed': 'Atrasada',
    'suspended': 'Suspensa',
    'backlog': 'Backlog'
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const toggleExpandTask = (id: string) => {
    setExpandedTasks(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    const targetAssignee = taskData.assignee || USER_ME;

    // Permissions check
    if (USER_ME.accessLevel === 'operador') {
      if (editingTask && editingTask.assignee?.id !== USER_ME.id) {
        alert('Como Operador, você só pode editar suas próprias tarefas.');
        return;
      }
      if (targetAssignee.id !== USER_ME.id) {
        alert('Como Operador, você só pode atribuir tarefas para você mesmo.');
        return;
      }
    } else if (USER_ME.accessLevel === 'operador-chefe') {
      if (targetAssignee.section !== USER_ME.section) {
        alert(`Como Operador Chefe, você só pode atribuir tarefas para militares da sua própria seção (${USER_ME.section}).`);
        return;
      }
    }

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } as Task : t));
    } else {
      const newTask: Task = {
        ...taskData,
        id: 't' + Date.now(),
        progress: taskData.status === 'completed' ? 100 : taskData.status === 'in-progress' ? 50 : 0,
      } as Task;
      setTasks(prev => [newTask, ...prev]);
    }
    setIsAddingTask(false);
    setEditingTask(undefined);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    if (USER_ME.accessLevel === 'operador' && taskToDelete.assignee?.id !== USER_ME.id) {
      alert('Como Operador, você só pode excluir suas próprias tarefas.');
      return;
    }
    if (USER_ME.accessLevel === 'operador-chefe' && taskToDelete.assignee?.section !== USER_ME.section) {
      alert('Como Operador Chefe, você só pode excluir tarefas de militares da sua própria seção.');
      return;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleBulkDelete = () => {
    // Filter out items that the user doesn't have permission to delete
    const deletableIds = selectedTasks.filter(id => {
      const t = tasks.find(x => x.id === id);
      if (!t) return false;
      if (USER_ME.accessLevel === 'operador' && t.assignee?.id !== USER_ME.id) return false;
      if (USER_ME.accessLevel === 'operador-chefe' && t.assignee?.section !== USER_ME.section) return false;
      return true;
    });

    if (deletableIds.length < selectedTasks.length) {
      alert('Algumas tarefas selecionadas foram ignoradas pois você não tem permissão para excluí-las.');
    }

    setTasks(prev => prev.filter(t => !deletableIds.includes(t.id)));
    setSelectedTasks([]);
  };

  const getSector = (task: Task) => {
    const sectors = ['AAJ', 'SIJ', 'AJUR'];
    const found = task.tags?.find(tag => sectors.includes(tag.toUpperCase()));
    return found ? found.toUpperCase() : 'AAJ';
  };

  const filteredTasks = React.useMemo(() => {
    const list = tasks.filter(task => {
      // 0. Section Access Filter
      if (USER_ME.accessLevel !== 'gestor') {
        const taskSector = getSector(task);
        if (taskSector !== USER_ME.section) return false;
      }

      if (activeFilters.status && task.status !== activeFilters.status) {
        return false;
      }
      if (activeFilters.priority && task.priority !== activeFilters.priority) {
        return false;
      }
      if (activeFilters.assignee && task.assignee?.id !== activeFilters.assignee) {
        return false;
      }
      if (activeFilters.documentType && task.documentType !== activeFilters.documentType) {
        return false;
      }
      if (activeFilters.sigadOfRec && !(task.sigadOfRec || '').toLowerCase().includes(activeFilters.sigadOfRec.toLowerCase())) {
        return false;
      }
      if (activeFilters.origem && !(task.origem || '').toLowerCase().includes(activeFilters.origem.toLowerCase())) {
        return false;
      }
      if (activeFilters.sigadOfExp && !(task.sigadOfExp || '').toLowerCase().includes(activeFilters.sigadOfExp.toLowerCase())) {
        return false;
      }
      if (activeFilters.destination && !(task.destination || '').toLowerCase().includes(activeFilters.destination.toLowerCase())) {
        return false;
      }
      if (activeFilters.entryDate && task.entryDate !== activeFilters.entryDate) {
        return false;
      }
      if (activeFilters.dueDate && task.dueDate !== activeFilters.dueDate) {
        return false;
      }
      if (activeFilters.year) {
        const taskYear = task.year || (task.entryDate ? task.entryDate.split('-')[0] : '');
        if (taskYear !== activeFilters.year) {
          return false;
        }
      }
      if (activeFilters.tags) {
        const hasTag = task.tags?.some(tag => tag.toLowerCase().includes(activeFilters.tags.toLowerCase()));
        if (!hasTag) return false;
      }
      if (activeFilters.search) {
        const query = activeFilters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesSigad = (task.sigadOfRec || '').toLowerCase().includes(query) || 
                             (task.sigadOfExp || '').toLowerCase().includes(query);
        const matchesOrigem = (task.origem || '').toLowerCase().includes(query);
        const matchesObs = (task.observations || '').toLowerCase().includes(query);
        const matchesSubtasks = task.subtasks?.some(st => 
          st.title.toLowerCase().includes(query) ||
          (st.sigadOfExp || '').toLowerCase().includes(query) ||
          (st.destination || '').toLowerCase().includes(query) ||
          (st.observations || '').toLowerCase().includes(query) ||
          (st.assignee?.name || '').toLowerCase().includes(query)
        );
        if (!matchesTitle && !matchesSigad && !matchesOrigem && !matchesObs && !matchesSubtasks) {
          return false;
        }
      }
      return true;
    });

    return list.sort((a, b) => {
      const dateA = a.entryDate || '';
      const dateB = b.entryDate || '';
      if (dateA !== dateB) {
        return sortOrder === 'desc' 
          ? dateB.localeCompare(dateA) 
          : dateA.localeCompare(dateB);
      }
      return sortOrder === 'desc'
        ? b.id.localeCompare(a.id)
        : a.id.localeCompare(b.id);
    });
  }, [tasks, activeFilters, sortOrder]);

  const paginatedTasks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // Calculate dynamic counts based on the stateful tasks
  const stats = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    let inProgress = 0;
    let delayed = 0;
    let notStarted = 0;
    let suspended = 0;

    tasks.forEach(t => {
      // Main task
      total++;
      if (t.status === 'completed') completed++;
      else if (t.status === 'in-progress') inProgress++;
      else if (t.status === 'delayed') delayed++;
      else if (t.status === 'not-started') notStarted++;
      else if (t.status === 'suspended') suspended++;

      // Subtasks (tarefas relacionadas)
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach(st => {
          total++;
          if (st.status === 'completed') completed++;
          else if (st.status === 'in-progress') inProgress++;
          else if (st.status === 'delayed') delayed++;
          else if (st.status === 'not-started') notStarted++;
          else if (st.status === 'suspended') suspended++;
        });
      }
    });

    return { total, completed, inProgress, delayed, notStarted, suspended };
  }, [tasks]);

  const drawerTask = React.useMemo(() => {
    return tasks.find(t => t.id === selectedDrawerTaskId);
  }, [tasks, selectedDrawerTaskId]);

  if (isAddingTask || editingTask) {
    return (
      <TaskForm 
        initialTask={editingTask} 
        onClose={() => {
          setIsAddingTask(false);
          setEditingTask(undefined);
        }} 
        onSave={handleSaveTask} 
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">Central de Tarefas</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-500 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-on-surface dark:border-slate-800 px-5 py-3 rounded-full transition-all font-bold text-sm shadow-sm cursor-pointer"
            >
              <FileUp size={18} />
              Importar
            </button>
            <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-surface-container-high dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-4 py-2 hover:bg-surface-container rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <FileUp size={14} />
                Upload Planilha (CSV / XLS)
              </button>
              <button 
                onClick={() => setShowTemplateModal(true)}
                className="w-full text-left px-4 py-2 hover:bg-surface-container rounded-xl text-xs font-bold cursor-pointer text-primary flex items-center gap-1.5 border-t border-surface-container-high/40 mt-1 pt-2"
              >
                <Info size={14} className="text-secondary" />
                Ver Modelo de Planilha
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
              accept=".csv,.xls,.xlsx" 
              className="hidden" 
            />
          </div>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 bg-black hover:bg-neutral-900 text-white border border-black px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            <Plus size={20} />
            <span className="font-bold">Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total de Tarefas', value: stats.total.toString(), icon: Clock, color: 'text-primary', filterStatus: '' },
          { label: 'Concluída', value: stats.completed.toString(), icon: CheckCircle2, color: 'text-emerald-600', filterStatus: 'completed' },
          { label: 'Em Andamento', value: stats.inProgress.toString(), icon: Clock, color: 'text-blue-600', filterStatus: 'in-progress' },
          { label: 'Atrasada', value: stats.delayed.toString(), icon: AlertCircle, color: 'text-error', filterStatus: 'delayed' },
          { label: 'Não Iniciada', value: stats.notStarted.toString(), icon: AlertCircle, color: 'text-slate-500', filterStatus: 'not-started' },
          { label: 'Suspensa', value: stats.suspended.toString(), icon: AlertTriangle, color: 'text-amber-600', filterStatus: 'suspended' },
        ].map((stat, i) => {
          const isSelected = activeFilters.status === stat.filterStatus || (stat.filterStatus === '' && !activeFilters.status);
          return (
            <motion.div 
              key={i} 
              onClick={() => setActiveFilters((prev: any) => ({ ...prev, status: stat.filterStatus }))}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "glass-card p-4 rounded-3xl flex items-center gap-4 shadow-sm cursor-pointer border relative overflow-hidden transition-colors duration-500",
                isSelected 
                  ? "border-primary ring-2 ring-primary/20 bg-primary/[0.04]" 
                  : "border-white/40 dark:border-slate-800/80 hover:bg-surface-container"
              )}
            >
              {/* Flash effect when value updates */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0.4, scale: 0.95 }}
                  animate={{ opacity: 0, scale: 1.15 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-0 pointer-events-none rounded-3xl",
                    stat.color.includes('primary') ? 'bg-primary/20' :
                    stat.color.includes('emerald') ? 'bg-emerald-500/20' :
                    stat.color.includes('blue') ? 'bg-blue-500/20' :
                    stat.color.includes('error') ? 'bg-red-500/20' :
                    stat.color.includes('slate') ? 'bg-slate-500/20' :
                    stat.color.includes('amber') ? 'bg-amber-500/20' : 'bg-primary/10'
                  )}
                />
              </AnimatePresence>

              <div className={cn("w-10 h-10 rounded-2xl bg-surface-container dark:bg-slate-800 flex items-center justify-center shadow-inner flex-shrink-0 relative z-10 transition-colors duration-500", stat.color)}>
                <stat.icon size={20} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 leading-tight">{stat.label}</p>
                <div className="overflow-hidden h-7 flex items-center">
                  <AnimatePresence mode="popLayout">
                    <motion.p 
                      key={stat.value}
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -15, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15 }}
                      className="text-xl font-black text-primary"
                    >
                      {stat.value}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <TaskFilters 
        filters={activeFilters}
        onFilterChange={setActiveFilters} 
        bulkEditMode={bulkEditMode} 
        onBulkEditToggle={() => setBulkEditMode(!bulkEditMode)} 
        tasks={tasks}
      />

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {bulkEditMode && selectedTasks.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-8 py-4 rounded-full shadow-2xl z-50 flex items-center gap-8 border-4 border-white"
          >
            <span className="text-sm font-bold">{selectedTasks.length} selecionadas</span>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex gap-6 items-center">
              <div className="flex items-center gap-1.5 hover:text-secondary-container transition-colors font-bold text-sm">
                <Edit3 size={18} />
                <select 
                  onChange={(e) => {
                    const status = e.target.value;
                    if (status) {
                      let skippedCount = 0;
                      setTasks(prev => prev.map(t => {
                        if (selectedTasks.includes(t.id)) {
                          if (status === 'completed' && t.subtasks && t.subtasks.length > 0 && t.subtasks.some(st => st.status !== 'completed')) {
                            skippedCount++;
                            return t;
                          }
                          return { ...t, status: status as any, progress: status === 'completed' ? 100 : t.progress };
                        }
                        return t;
                      }));
                      if (skippedCount > 0) {
                        setBulkError(`${skippedCount} tarefa(s) não puderam ser concluída(s) porque possuem tarefas relacionadas pendentes.`);
                        setTimeout(() => setBulkError(null), 8000);
                      } else {
                        setBulkError(null);
                      }
                      setSelectedTasks([]);
                    }
                  }}
                  className="bg-primary text-white border-none p-0 focus:ring-0 font-bold text-sm cursor-pointer outline-none appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-white text-black">Alterar Status</option>
                  <option value="not-started" className="bg-white text-black">Não Iniciada</option>
                  <option value="in-progress" className="bg-white text-black">Em Andamento</option>
                  <option value="completed" className="bg-white text-black">Concluída</option>
                  <option value="delayed" className="bg-white text-black">Atrasada</option>
                  <option value="suspended" className="bg-white text-black">Suspensa</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 hover:text-secondary-container transition-colors font-bold text-sm">
                <Clock size={18} />
                <select 
                  onChange={(e) => {
                    const days = parseInt(e.target.value, 10);
                    if (days) {
                      setTasks(prev => prev.map(t => {
                        if (selectedTasks.includes(t.id) && t.dueDate) {
                          const originalDate = new Date(t.dueDate);
                          originalDate.setDate(originalDate.getDate() + days);
                          const newDueDateStr = originalDate.toISOString().split('T')[0];
                          return { ...t, dueDate: newDueDateStr };
                        }
                        return t;
                      }));
                      setSelectedTasks([]);
                    }
                  }}
                  className="bg-primary text-white border-none p-0 focus:ring-0 font-bold text-sm cursor-pointer outline-none appearance-none"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-white text-black">Adiar Prazo</option>
                  <option value="1" className="bg-white text-black">+1 Dia</option>
                  <option value="3" className="bg-white text-black">+3 Dias</option>
                  <option value="7" className="bg-white text-black">+7 Dias</option>
                  <option value="15" className="bg-white text-black">+15 Dias</option>
                  <option value="30" className="bg-white text-black">+30 Dias</option>
                </select>
              </div>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 hover:text-error transition-colors font-bold text-sm"
              >
                <Trash2 size={18} /> Excluir
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-surface-container-high dark:border-slate-800/40 shadow-xl overflow-hidden min-h-[500px] flex flex-col">
        {bulkError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4 rounded-3xl mx-6 mt-6 flex items-center gap-3 text-xs font-bold text-error animate-fade-in shadow-sm">
            <AlertTriangle size={18} className="text-error flex-shrink-0" />
            <span>{bulkError}</span>
          </div>
        )}
        {/* Table Header / Action Top Bar */}
        <div className="p-6 border-b border-surface-container-high dark:border-slate-800/60 flex flex-col sm:flex-row gap-6 justify-between items-center bg-white/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg">Lista de Tarefas</h2>
            <div className="px-3 py-1 bg-primary/5 dark:bg-white/5 text-primary rounded-full text-[10px] font-black uppercase tracking-wider">
              {filteredTasks.length} Registros Encontrados
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer select-none border border-transparent dark:border-slate-750"
              title={sortOrder === 'desc' ? "Alterar para Mais Antigas Primeiro" : "Alterar para Mais Recentes Primeiro"}
            >
              {sortOrder === 'desc' ? 'Mais Recentes ⬇️' : 'Mais Antigas ⬆️'}
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative group">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-900 text-white border border-black dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-amber-400 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest rounded-full transition-all cursor-pointer">
                <FileDown size={16} />
                Exportar Dados
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-surface-container-high dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-2">
                <button 
                  onClick={() => handleExport('xls')} 
                  className="w-full text-left px-4 py-2 hover:bg-surface-container rounded-xl text-xs font-bold cursor-pointer block"
                >
                  XLSX (Excel)
                </button>
                <button 
                  onClick={() => handleExport('csv')} 
                  className="w-full text-left px-4 py-2 hover:bg-surface-container rounded-xl text-xs font-bold cursor-pointer block"
                >
                  CSV (Delimitado)
                </button>
                <button 
                  onClick={() => handleExport('pdf')} 
                  className="w-full text-left px-4 py-2 hover:bg-surface-container rounded-xl text-xs font-bold cursor-pointer block"
                >
                  PDF Relatório
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-manual overflow-x-auto custom-scrollbar flex-grow">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 text-on-surface-variant border-b border-surface-container-high">
                {bulkEditMode && (
                  <th className="px-6 py-5 w-12">
                    <input 
                      type="checkbox" 
                      onChange={(e) => setSelectedTasks(e.target.checked ? filteredTasks.map(t => t.id) : [])}
                      className="rounded-md border-surface-dim text-primary focus:ring-primary"
                    />
                  </th>
                )}
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] min-w-[320px] w-[360px]">Tarefa & SIGAD</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] min-w-[150px] w-[160px]">Responsável</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] min-w-[160px]">Status</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em]">Datas</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em]">Prioridade</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em]">Progresso</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {paginatedTasks.map((task) => (
                <React.Fragment key={task.id}>
                  <tr 
                    id={`task-row-${task.id}`}
                    className={cn(
                      "hover:bg-white/90 dark:hover:bg-slate-800/70 transition-all group",
                      selectedTasks.includes(task.id) && "bg-primary/[0.02] dark:bg-white/[0.02]"
                    )}
                  >
                    {bulkEditMode && (
                      <td className="px-6 py-6">
                        <input 
                          type="checkbox" 
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => toggleSelectTask(task.id)}
                          className="rounded-md border-surface-dim text-primary focus:ring-primary transition-all w-5 h-5"
                        />
                      </td>
                    )}
                    <td className="px-6 py-6 min-w-[320px] w-[360px]">
                      <div className="flex items-start gap-4">
                        <button 
                          onClick={() => toggleExpandTask(task.id)}
                          className="mt-1 p-1 hover:bg-surface-container rounded-lg transition-all text-on-surface-variant"
                        >
                          {expandedTasks.includes(task.id) ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                        </button>
                        <div className="space-y-1">
                          <p 
                            onClick={() => setEditingTask(task)}
                            className="font-bold text-sm leading-tight text-primary group-hover:underline cursor-pointer whitespace-nowrap"
                          >
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                             {task.sigadOfRec && (
                               <span className="text-[9px] font-black bg-surface-container px-2 py-0.5 rounded text-on-surface-variant uppercase tracking-tighter">
                                 REC: {task.sigadOfRec}
                               </span>
                             )}
                             {task.documentType && (
                               <span className="text-[9px] font-black bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded uppercase tracking-tighter">
                                 {task.documentType}
                               </span>
                             )}
                             {task.tags?.slice(0, 3).map(tag => (
                               <span key={tag} className="text-[9px] font-bold text-secondary">#{tag}</span>
                             ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 min-w-[150px] w-[160px] whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <img src={task.assignee.avatar} className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" alt="" />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                        </div>
                        <div className="block">
                          <p className="text-xs font-black leading-none whitespace-nowrap">{task.assignee.name}</p>
                          <p className="text-[9px] text-on-surface-variant font-medium mt-1 uppercase tracking-wider whitespace-nowrap">{task.assignee.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 min-w-[160px] whitespace-nowrap">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        getStatusStyles(task.status)
                      )}>
                        {statusLabels[task.status]}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1 min-w-[120px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase w-12">Entrada:</span>
                          <span className="text-[10px] font-medium text-on-surface-variant">
                            {formatDate(task.entryDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase w-12">Prazo:</span>
                          <span className="text-xs font-black text-primary">
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                        {task.expeditedDate && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase w-12">Of. Exp:</span>
                            <span className="text-[10px] font-medium text-on-surface-variant">
                              {formatDate(task.expeditedDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        {task.priority === 'high' || task.priority === 'urgent' ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                        ) : null}
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.1em]",
                          task.priority === 'high' || task.priority === 'urgent' ? 'text-error' : 'text-on-surface-variant'
                        )}>
                          {task.priority === 'urgent' ? 'Crítica' : task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {(() => {
                        const prog = calculateProgress(task);
                        return (
                          <div className="flex items-center gap-4 min-w-[150px]">
                            <div className="flex-grow h-2 bg-surface-container rounded-full overflow-hidden shadow-inner translate-y-[1px]">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-[1000ms] ease-out",
                                  prog === 100 ? 'bg-emerald-500' : 'bg-primary'
                                )} 
                                style={{ width: `${prog}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-black text-primary w-8">{prog}%</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setSelectedDrawerTaskId(task.id)}
                          title="Expandir Detalhes"
                          className="px-2.5 py-1.5 bg-secondary-container/15 text-secondary hover:bg-secondary-container/30 rounded-lg cursor-pointer transition-all border border-secondary/20 mr-1 shadow-sm flex items-center justify-center"
                        >
                          <Eye size={12} />
                        </button>
                        <button 
                          onClick={() => toggleExpandTask(task.id)}
                          title={`${task.subtasks?.length || 0} Tarefa(s) Relacionada(s)`}
                          className={cn(
                            "mr-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 cursor-pointer transition-all border",
                            task.subtasks && task.subtasks.length > 0
                              ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                              : "bg-surface-container/50 text-on-surface-variant/40 border-surface-container-high hover:bg-surface-container"
                          )}
                        >
                          <Layers size={12} />
                          <span>{task.subtasks?.length || 0}</span>
                        </button>
                        <button 
                          onClick={() => setEditingTask(task)}
                          title="Editar"
                          className="p-2 hover:bg-surface-container rounded-xl text-primary hover:text-primary transition-all"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          title="Excluir"
                          className="p-2 hover:bg-surface-container rounded-xl text-on-surface-variant hover:text-error transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Subtasks Hierarchy (Expanded) */}
                  <AnimatePresence>
                    {expandedTasks.includes(task.id) && (
                      <motion.tr 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-surface-container-low/20"
                      >
                        <td colSpan={bulkEditMode ? 8 : 7} className="px-12 py-0 overflow-hidden">
                          <div className="py-6 border-l-4 border-primary/20 space-y-4 pl-8">
                            
                            {/* Header row */}
                            <div className="flex items-center justify-between text-xs font-bold text-on-surface-variant/70 border-b border-surface-container h-12 px-4 uppercase tracking-widest">
                              <div className="flex items-center gap-3">
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <input 
                                    type="checkbox"
                                    checked={(selectedSubtasks[task.id] || []).length === task.subtasks.length}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedSubtasks(prev => ({
                                          ...prev,
                                          [task.id]: task.subtasks?.map(st => st.id) || []
                                        }));
                                      } else {
                                        setSelectedSubtasks(prev => ({
                                          ...prev,
                                          [task.id]: []
                                        }));
                                      }
                                    }}
                                    className="rounded border-surface-container-high text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                  />
                                )}
                                <span>Tarefas Relacionadas Vinculadas</span>
                              </div>
                              <button 
                                onClick={() => setEditingTask(task)}
                                className="flex items-center gap-1 hover:text-primary transition-colors font-black text-[10px] uppercase"
                              >
                                <Plus size={14} /> Gerenciar Completo
                              </button>
                            </div>

                            {/* Quick Add Inline Form */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                if (!form.title.trim()) return;

                                const newSub: Task = {
                                  id: 'st_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                                  title: form.title,
                                  status: form.status as any,
                                  priority: 'medium',
                                  dueDate: form.dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
                                  entryDate: form.entryDate || new Date().toISOString().split('T')[0],
                                  expeditedDate: form.expeditedDate || '',
                                  sigadOfExp: form.sigadOfExp || '',
                                  assignee: TEAM.find(t => t.id === form.assigneeId) || USER_ME,
                                  progress: form.status === 'completed' ? 100 : form.status === 'in-progress' ? 50 : 0,
                                  subtasks: [],
                                };

                                setTasks(prev => prev.map(t => {
                                  if (t.id === task.id) {
                                    return {
                                      ...t,
                                      subtasks: [...(t.subtasks || []), newSub]
                                    };
                                  }
                                  return t;
                                }));

                                // Reset form
                                setQuickSubtaskForms(prev => ({
                                  ...prev,
                                  [task.id]: {
                                    title: '',
                                    assigneeId: USER_ME.id,
                                    status: 'not-started',
                                    entryDate: new Date().toISOString().split('T')[0],
                                    expeditedDate: '',
                                    sigadOfExp: '',
                                    dueDate: ''
                                  }
                                }));
                              }}
                              className="bg-surface-container-low/40 p-4 rounded-3xl border border-surface-container-high/40 grid grid-cols-1 md:grid-cols-12 gap-3 items-end shadow-sm"
                            >
                              {/* Row 1 */}
                              <div className="md:col-span-6 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Assunto / Título *</label>
                                <input 
                                  type="text"
                                  placeholder="Nova tarefa relacionada rápida..."
                                  required
                                  value={quickSubtaskForms[task.id]?.title || ''}
                                  onChange={e => {
                                    const curr = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                    setQuickSubtaskForms({
                                      ...quickSubtaskForms,
                                      [task.id]: { ...curr, title: e.target.value }
                                    });
                                  }}
                                  className="w-full bg-white border border-surface-container-high rounded-xl py-2 px-3 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Responsável</label>
                                <select
                                  value={quickSubtaskForms[task.id]?.assigneeId || USER_ME.id}
                                  onChange={e => {
                                    const curr = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                    setQuickSubtaskForms({
                                      ...quickSubtaskForms,
                                      [task.id]: { ...curr, assigneeId: e.target.value }
                                    });
                                  }}
                                  className="w-full bg-white border border-surface-container-high rounded-xl py-2 px-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none appearance-none pr-6"
                                >
                                  <option value={USER_ME.id}>{USER_ME.name}</option>
                                  {TEAM.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                              </div>
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Status</label>
                                <select
                                  value={quickSubtaskForms[task.id]?.status || 'not-started'}
                                  onChange={e => {
                                    const curr = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                    setQuickSubtaskForms({
                                      ...quickSubtaskForms,
                                      [task.id]: { ...curr, status: e.target.value }
                                    });
                                  }}
                                  className="w-full bg-white border border-surface-container-high rounded-xl py-2 px-2 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none appearance-none pr-6"
                                >
                                  <option value="not-started">Não Iniciada</option>
                                  <option value="in-progress">Em Andamento</option>
                                  <option value="completed">Concluída</option>
                                  <option value="delayed">Atrasada</option>
                                  <option value="suspended">Suspensa</option>
                                </select>
                              </div>

                              {/* Row 2 */}
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Sigad Exp</label>
                                <input 
                                  type="text"
                                  placeholder="Ex: 531630"
                                  value={quickSubtaskForms[task.id]?.sigadOfExp || ''}
                                  onChange={e => {
                                    const curr = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                    setQuickSubtaskForms({
                                      ...quickSubtaskForms,
                                      [task.id]: { ...curr, sigadOfExp: e.target.value }
                                    });
                                  }}
                                  className="w-full bg-white border border-surface-container-high rounded-xl py-2 px-3 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Data Entrada</label>
                                <input 
                                  type="date"
                                  value={quickSubtaskForms[task.id]?.entryDate || ''}
                                  onChange={e => {
                                    const curr = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                    setQuickSubtaskForms({
                                      ...quickSubtaskForms,
                                      [task.id]: { ...curr, entryDate: e.target.value }
                                    });
                                  }}
                                  className="w-full bg-white border border-surface-container-high rounded-xl py-2 px-3 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant ml-1">Data Exp</label>
                                <input 
                                  type="date"
                                  value={quickSubtaskForms[task.id]?.expeditedDate || ''}
                                  onChange={e => {
                                    const curr = quickSubtaskForms[task.id] || { title: '', assigneeId: USER_ME.id, status: 'not-started', entryDate: new Date().toISOString().split('T')[0], expeditedDate: '', sigadOfExp: '', dueDate: '' };
                                    setQuickSubtaskForms({
                                      ...quickSubtaskForms,
                                      [task.id]: { ...curr, expeditedDate: e.target.value }
                                    });
                                  }}
                                  className="w-full bg-white border border-surface-container-high rounded-xl py-2 px-3 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                                />
                              </div>
                              <div className="md:col-span-3">
                                <button
                                  type="submit"
                                  className="w-full bg-primary text-on-primary py-2 px-3 rounded-xl font-bold text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 shadow-md shadow-primary/15"
                                >
                                  <Plus size={14} />
                                  Criar
                                </button>
                              </div>
                            </form>

                            {/* Subtask Bulk Edit Bar */}
                            {(selectedSubtasks[task.id] || []).length > 0 && (
                              <div className="bg-primary/5 border border-primary/10 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-fade-in shadow-inner">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="text-primary" size={16} />
                                  <span className="text-[10px] font-black uppercase text-primary tracking-widest">{(selectedSubtasks[task.id] || []).length} selecionadas</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                  {/* Bulk Status Select */}
                                  <div className="flex items-center gap-1.5 bg-white border border-surface-container-high rounded-xl px-2 py-1 shadow-sm">
                                    <span className="text-[9px] font-black uppercase text-on-surface-variant/70">Status:</span>
                                    <select
                                      onChange={(e) => {
                                        const status = e.target.value;
                                        if (status) {
                                          const selIds = selectedSubtasks[task.id] || [];
                                          setTasks(prev => prev.map(t => {
                                            if (t.id === task.id) {
                                              return {
                                                ...t,
                                                subtasks: t.subtasks?.map(st => {
                                                  if (selIds.includes(st.id)) {
                                                    return { ...st, status: status as any, progress: status === 'completed' ? 100 : st.progress };
                                                  }
                                                  return st;
                                                })
                                              };
                                            }
                                            return t;
                                          }));
                                          setSelectedSubtasks(prev => ({ ...prev, [task.id]: [] }));
                                        }
                                      }}
                                      className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer outline-none p-0 pr-6"
                                      defaultValue=""
                                    >
                                      <option value="" disabled>Alterar Status</option>
                                      <option value="not-started">Não Iniciada</option>
                                      <option value="in-progress">Em Andamento</option>
                                      <option value="completed">Concluída</option>
                                      <option value="delayed">Atrasada</option>
                                      <option value="suspended">Suspensa</option>
                                    </select>
                                  </div>

                                  {/* Bulk Expedited Date Input */}
                                  <div className="flex items-center gap-1.5 bg-white border border-surface-container-high rounded-xl px-2 py-1 shadow-sm">
                                    <span className="text-[9px] font-black uppercase text-on-surface-variant/70">Data Exp:</span>
                                    <input
                                      type="date"
                                      onChange={(e) => {
                                        const dateVal = e.target.value;
                                        if (dateVal) {
                                          const selIds = selectedSubtasks[task.id] || [];
                                          setTasks(prev => prev.map(t => {
                                            if (t.id === task.id) {
                                              return {
                                                ...t,
                                                subtasks: t.subtasks?.map(st => {
                                                  if (selIds.includes(st.id)) {
                                                    return { ...st, expeditedDate: dateVal };
                                                  }
                                                  return st;
                                                })
                                              };
                                            }
                                            return t;
                                          }));
                                          setSelectedSubtasks(prev => ({ ...prev, [task.id]: [] }));
                                        }
                                      }}
                                      className="bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer outline-none p-0"
                                    />
                                  </div>

                                  <button 
                                    onClick={() => setSelectedSubtasks(prev => ({ ...prev, [task.id]: [] }))}
                                    className="text-[10px] font-black text-error uppercase tracking-wider hover:underline ml-2"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Subtask list */}
                            <div className="space-y-3">
                              {task.subtasks && task.subtasks.length > 0 ? (
                                task.subtasks.map((st) => {
                                  const isSelected = (selectedSubtasks[task.id] || []).includes(st.id);
                                  return (
                                    <div key={st.id} className="p-4 bg-white/60 dark:bg-slate-900/60 hover:bg-white/90 dark:hover:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-surface-container-high/40 dark:border-slate-800/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                                      <div className="flex items-start gap-3">
                                        <input 
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const currentSel = selectedSubtasks[task.id] || [];
                                            if (e.target.checked) {
                                              setSelectedSubtasks(prev => ({
                                                ...prev,
                                                [task.id]: [...currentSel, st.id]
                                              }));
                                            } else {
                                              setSelectedSubtasks(prev => ({
                                                ...prev,
                                                [task.id]: currentSel.filter(id => id !== st.id)
                                              }));
                                            }
                                          }}
                                          className="mt-1 rounded border-surface-container-high text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                        />
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-sans">RELACIONADA</span>
                                            <span className="font-bold text-sm text-on-surface">{st.title}</span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-on-surface-variant/70 font-bold">
                                            {st.sigadOfExp && <span><strong>Sigad Exp:</strong> {st.sigadOfExp}</span>}
                                            {st.entryDate && <span><strong>Data Entrada:</strong> {st.entryDate.split('-').reverse().join('/')}</span>}
                                            {st.expeditedDate && <span><strong>Data Exp:</strong> {st.expeditedDate.split('-').reverse().join('/')}</span>}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 justify-between md:justify-end">
                                        <div className="flex items-center gap-2">
                                          {st.assignee && (
                                            <>
                                              <img src={st.assignee.avatar} className="w-6 h-6 rounded-full border border-white shadow-sm" alt="" />
                                              <span className="text-xs font-bold text-on-surface-variant">{st.assignee.name}</span>
                                            </>
                                          )}
                                        </div>
                                        <span className={cn(
                                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm",
                                          getStatusStyles(st.status)
                                        )}>
                                          {statusLabels[st.status]}
                                        </span>
                                        
                                        {/* Edit Inline Button */}
                                        <button
                                          onClick={() => setEditingSubtask({ mainTaskId: task.id, subtask: st })}
                                          title="Editar Tarefa Relacionada"
                                          className="p-2 hover:bg-surface-container rounded-xl text-primary hover:text-primary transition-all"
                                        >
                                          <Edit3 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-center py-8 text-on-surface-variant/50 text-xs font-bold bg-white/30 rounded-2xl border border-dashed border-surface-container-high">
                                  Nenhuma tarefa relacionada cadastrada. Use o formulário acima para adicionar uma tarefa relacionada rápida.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Professional Pagination */}
        <div className="px-8 py-6 bg-surface-container-low/30 border-t border-surface-container-high flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            <span>Mostrar</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white text-[#000000] border border-surface-container-high rounded-lg font-bold px-2 py-1 focus:ring-1 focus:ring-primary appearance-none pr-6 relative"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>por página</span>
            <div className="w-px h-4 bg-surface-dim mx-4" />
            <span className="text-primary font-black">
              Visualizando {filteredTasks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(filteredTasks.length, currentPage * itemsPerPage)} de {filteredTasks.length} registros
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 hover:bg-white border border-surface-container-high rounded-xl disabled:opacity-30 shadow-sm transition-all bg-white/50"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage)) }, (_, i) => i + 1).map((p) => (
                <button 
                  key={p} 
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all text-xs",
                    p === currentPage ? "bg-primary text-on-primary shadow-xl scale-110" : "hover:bg-white bg-white/30 border border-transparent hover:border-surface-container-high"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage)), prev + 1))}
              disabled={currentPage === Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage))}
              className="p-2.5 hover:bg-white border border-surface-container-high rounded-xl disabled:opacity-30 shadow-sm transition-all bg-white/50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Tarefa Relacionada */}
      <AnimatePresence>
        {editingSubtask && (
          <div className="fixed inset-0 bg-surface-dim/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden border border-surface-container shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-surface-container flex justify-between items-center bg-surface-container-low/30">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Edição Rápida</span>
                  <h2 className="text-2xl font-black mt-2 text-primary">Editar Tarefa Relacionada</h2>
                </div>
                <button 
                  onClick={() => setEditingSubtask(null)}
                  className="p-3 hover:bg-surface-container rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Assunto / Título *</label>
                  <input 
                    type="text" 
                    required
                    value={editingSubtask.subtask.title}
                    onChange={e => setEditingSubtask({
                      ...editingSubtask,
                      subtask: { ...editingSubtask.subtask, title: e.target.value }
                    })}
                    className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Responsável</label>
                    <select 
                      value={editingSubtask.subtask.assignee?.id}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { 
                          ...editingSubtask.subtask, 
                          assignee: TEAM.find(t => t.id === e.target.value) || USER_ME 
                        }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    >
                      <option value={USER_ME.id}>{USER_ME.name}</option>
                      {TEAM.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Status</label>
                    <select 
                      value={editingSubtask.subtask.status}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { 
                          ...editingSubtask.subtask, 
                          status: e.target.value as any,
                          progress: e.target.value === 'completed' ? 100 : editingSubtask.subtask.progress
                        }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    >
                      <option value="not-started">Não Iniciada</option>
                      <option value="in-progress">Em Andamento</option>
                      <option value="completed">Concluída</option>
                      <option value="delayed">Atrasada</option>
                      <option value="suspended">Suspensa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Sigad Exp</label>
                    <input 
                      type="text" 
                      value={editingSubtask.subtask.sigadOfExp || ''}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { ...editingSubtask.subtask, sigadOfExp: e.target.value }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Data Entrada</label>
                    <input 
                      type="date" 
                      value={editingSubtask.subtask.entryDate || ''}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { ...editingSubtask.subtask, entryDate: e.target.value }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Data Expedido</label>
                    <input 
                      type="date" 
                      value={editingSubtask.subtask.expeditedDate || ''}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { ...editingSubtask.subtask, expeditedDate: e.target.value }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Prazo</label>
                    <input 
                      type="date" 
                      value={editingSubtask.subtask.dueDate || ''}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { ...editingSubtask.subtask, dueDate: e.target.value }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Prioridade</label>
                    <select 
                      value={editingSubtask.subtask.priority || 'medium'}
                      onChange={e => setEditingSubtask({
                        ...editingSubtask,
                        subtask: { ...editingSubtask.subtask, priority: e.target.value as any }
                      })}
                      className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                    >
                      <option value="low">Rotina (Baixa)</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Observações</label>
                  <textarea 
                    rows={3}
                    value={editingSubtask.subtask.observations || ''}
                    onChange={e => setEditingSubtask({
                      ...editingSubtask,
                      subtask: { ...editingSubtask.subtask, observations: e.target.value }
                    })}
                    className="w-full bg-surface-container-low border-none rounded-3xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all text-sm font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-8 border-t border-surface-container flex gap-4 bg-surface-container-low/30">
                <button 
                  type="button"
                  onClick={() => setEditingSubtask(null)}
                  className="flex-1 py-4 px-6 border border-surface-container-high rounded-2xl font-bold text-sm hover:bg-surface-container active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const { mainTaskId, subtask } = editingSubtask;
                    setTasks(prev => prev.map(t => {
                      if (t.id === mainTaskId) {
                        return {
                          ...t,
                          subtasks: t.subtasks?.map(st => st.id === subtask.id ? subtask : st)
                        };
                      }
                      return t;
                    }));
                    setEditingSubtask(null);
                  }}
                  className="flex-1 py-4 px-6 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Painel Lateral de Detalhes da Tarefa (Drawer) */}
      <AnimatePresence>
        {selectedDrawerTaskId && drawerTask && (
          <>
            {/* Backdrop com blur super leve e cor transparente para ver a lista ao fundo */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDrawerTaskId(null)}
              className="fixed inset-0 bg-black/15 backdrop-blur-[2px] z-40 transition-all cursor-pointer"
            />

            {/* Painel lateral (Drawer) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.12)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-l border-surface-container-high dark:border-slate-800/80 z-50 flex flex-col text-left"
            >
              {/* Header do Drawer */}
              <div className="p-6 border-b border-surface-container dark:border-slate-800/80 flex items-center justify-between bg-surface-container-low/40 dark:bg-slate-900/40">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary-container/20 px-3 py-1 rounded-full border border-secondary/10">
                      Painel de Detalhes
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1 rounded-full">
                      ID: {drawerTask.id}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-primary leading-tight mt-1">
                    {drawerTask.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => {
                      setEditingTask(drawerTask);
                      setSelectedDrawerTaskId(null);
                    }}
                    title="Editar Tarefa"
                    className="p-3 hover:bg-surface-container-high dark:hover:bg-slate-800 rounded-2xl text-primary transition-all cursor-pointer border border-surface-container-high dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm("Tem certeza de que deseja excluir esta tarefa?")) {
                        handleDeleteTask(drawerTask.id);
                        setSelectedDrawerTaskId(null);
                      }
                    }}
                    title="Excluir Tarefa"
                    className="p-3 hover:bg-error-container/20 dark:hover:bg-red-950/40 rounded-2xl text-error transition-all cursor-pointer border border-surface-container-high dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    onClick={() => setSelectedDrawerTaskId(null)}
                    title="Fechar Painel"
                    className="p-3 hover:bg-surface-container-high dark:hover:bg-slate-800 rounded-2xl transition-all cursor-pointer border border-surface-container-high dark:border-slate-800 ml-2 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Drawer */}
              <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-8 text-left">
                {/* Status, Prioridade e Progresso */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container-low/40 p-4 rounded-3xl border border-surface-container/60 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 block">Status da Demanda</span>
                    <div className="pt-1.5">
                      <span className={cn(
                        "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm block text-center w-fit",
                        getStatusStyles(drawerTask.status)
                      )}>
                        {statusLabels[drawerTask.status]}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low/40 p-4 rounded-3xl border border-surface-container/60 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 block">Prioridade</span>
                    <div className="pt-1.5 flex items-center gap-2">
                      {drawerTask.priority === 'high' || drawerTask.priority === 'urgent' ? (
                        <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-on-surface-variant/40" />
                      )}
                      <span className={cn(
                        "text-[11px] font-black uppercase tracking-widest",
                        drawerTask.priority === 'high' || drawerTask.priority === 'urgent' ? 'text-error' : 'text-on-surface'
                      )}>
                        {drawerTask.priority === 'urgent' ? 'Crítica' : drawerTask.priority === 'high' ? 'Alta' : drawerTask.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-surface-container-low/40 p-4 rounded-3xl border border-surface-container/60 space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 block">Progresso Geral</span>
                    {(() => {
                      const prog = calculateProgress(drawerTask);
                      return (
                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-primary">
                            <span>{prog}% Concluído</span>
                          </div>
                          <div className="h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-[1000ms] ease-out",
                                prog === 100 ? 'bg-emerald-500' : 'bg-primary'
                              )} 
                              style={{ width: `${prog}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Responsável */}
                <div className="bg-surface-container-low/30 dark:bg-slate-900/40 p-5 rounded-3xl border border-surface-container/50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={drawerTask.assignee.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-md" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Responsável Atribuído</span>
                      <p className="text-sm font-black text-primary mt-0.5">{drawerTask.assignee.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{drawerTask.assignee.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/40">
                    Ativo
                  </span>
                </div>

                {/* Informações Administrativas / Protocolo */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/70 border-b border-surface-container pb-2 flex items-center gap-1.5">
                    <FileText size={14} className="text-secondary" />
                    Informações Administrativas e de Protocolo
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sigad de Recebimento e Origem */}
                    <div className="bg-surface-container-low/20 p-4 rounded-3xl border border-surface-container/40 space-y-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Sigad de Entrada (Rec)</span>
                        <p className="text-sm font-black text-primary mt-0.5">{drawerTask.sigadOfRec || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Órgão de Origem</span>
                        <p className="text-sm font-bold text-on-surface-variant mt-0.5">{drawerTask.origem || 'Não informado'}</p>
                      </div>
                    </div>

                    {/* Sigad de Expedição e Destinatário */}
                    <div className="bg-surface-container-low/20 p-4 rounded-3xl border border-surface-container/40 space-y-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Sigad de Saída (Exp)</span>
                        <p className="text-sm font-black text-primary mt-0.5">{drawerTask.sigadOfExp || 'Não informado'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Órgão de Destino</span>
                        <p className="text-sm font-bold text-on-surface-variant mt-0.5">{drawerTask.destination || 'Não informado'}</p>
                      </div>
                    </div>

                    {/* Tipo de Documento e Ano */}
                    <div className="bg-surface-container-low/20 p-4 rounded-3xl border border-surface-container/40 space-y-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Tipo de Documento</span>
                        <div className="pt-1">
                          {drawerTask.documentType ? (
                            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-100 uppercase tracking-tight text-xs font-black">
                              {drawerTask.documentType}
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-on-surface-variant">Não informado</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Ano de Referência</span>
                        <p className="text-sm font-bold text-on-surface-variant mt-0.5">{drawerTask.year || 'Não informado'}</p>
                      </div>
                    </div>

                    {/* Datas Importantes */}
                    <div className="bg-surface-container-low/20 p-4 rounded-3xl border border-surface-container/40 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-tight text-on-surface-variant/50">Entrada</span>
                          <p className="text-xs font-bold text-on-surface-variant mt-0.5">{formatDate(drawerTask.entryDate)}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-tight text-on-surface-variant/50">Expedido</span>
                          <p className="text-xs font-bold text-on-surface-variant mt-0.5">{formatDate(drawerTask.expeditedDate)}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-tight text-on-surface-variant/50">Prazo</span>
                          <p className="text-xs font-black text-red-700 mt-0.5">{formatDate(drawerTask.dueDate)}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/50">Padrão de Recorrência</span>
                        <p className="text-xs font-bold text-on-surface-variant mt-0.5 uppercase tracking-wide">
                          {drawerTask.recurringPattern === 'daily' ? 'Diário' : drawerTask.recurringPattern === 'weekly' ? 'Semanal' : drawerTask.recurringPattern === 'monthly' ? 'Mensal' : 'Não Recorrente'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Observações / Descrição */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/70 border-b border-surface-container pb-2 flex items-center gap-1.5">
                    <Bookmark size={14} className="text-secondary" />
                    Descrição / Observações Gerais
                  </h3>
                  <div className="bg-surface-container-low/20 p-5 rounded-3xl border border-surface-container/40">
                    <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-2">Observações Internas:</p>
                    <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                      {drawerTask.observations || 'Nenhuma observação ou descrição detalhada registrada para esta demanda.'}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {drawerTask.tags && drawerTask.tags.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/70 border-b border-surface-container pb-2 flex items-center gap-1.5">
                      <Tag size={14} className="text-secondary" />
                      Marcadores / Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {drawerTask.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-3.5 py-1.5 bg-secondary-container/10 text-secondary border border-secondary/10 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarefas Relacionadas */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-surface-container pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/70 flex items-center gap-1.5">
                      <Layers size={14} className="text-secondary" />
                      Demandas / Tarefas Relacionadas ({drawerTask.subtasks?.length || 0})
                    </h3>
                    <button
                      onClick={() => {
                        toggleExpandTask(drawerTask.id);
                        setSelectedDrawerTaskId(null);
                        setTimeout(() => {
                          const el = document.getElementById(`task-row-${drawerTask.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 150);
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-secondary hover:underline"
                    >
                      Gerenciar na Lista
                    </button>
                  </div>

                  {!drawerTask.subtasks || drawerTask.subtasks.length === 0 ? (
                    <div className="text-center py-8 bg-surface-container-low/20 rounded-3xl border border-dashed border-surface-container-high flex flex-col items-center justify-center space-y-2">
                      <Layers size={24} className="text-on-surface-variant/30 animate-pulse" />
                      <p className="text-xs font-bold text-on-surface-variant/60">Nenhuma tarefa relacionada registrada.</p>
                      <button 
                        onClick={() => {
                          toggleExpandTask(drawerTask.id);
                          setSelectedDrawerTaskId(null);
                          // Scroll to the task in the list if possible
                          setTimeout(() => {
                            const el = document.getElementById(`task-row-${drawerTask.id}`);
                            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 100);
                        }}
                        className="text-xs font-black text-secondary hover:underline uppercase tracking-widest"
                      >
                        + Criar Tarefa Relacionada
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drawerTask.subtasks.map(subtask => (
                        <div 
                          key={subtask.id}
                          className="bg-surface-container-lowest dark:bg-slate-900 border border-surface-container/60 dark:border-slate-800 p-4 rounded-3xl shadow-sm hover:shadow-md dark:hover:bg-slate-800/60 transition-all flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-primary leading-tight">
                                {subtask.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                {subtask.sigadOfExp && (
                                  <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-tighter">
                                    EXP: {subtask.sigadOfExp}
                                  </span>
                                )}
                                {subtask.priority && (
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                                    subtask.priority === 'high' || subtask.priority === 'urgent' 
                                      ? 'bg-red-50 dark:bg-red-950/40 text-error dark:text-red-400 border-red-100 dark:border-red-900/40' 
                                      : 'bg-slate-50 dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 border-slate-100 dark:border-slate-700'
                                  )}>
                                    {subtask.priority === 'urgent' ? 'Urgente' : subtask.priority === 'high' ? 'Alta' : subtask.priority === 'medium' ? 'Média' : 'Baixa'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                              getStatusStyles(subtask.status)
                            )}>
                              {statusLabels[subtask.status]}
                            </span>
                          </div>

                          <div className="h-px bg-surface-container/40" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              <img src={subtask.assignee?.avatar || USER_ME.avatar} className="w-6 h-6 rounded-full object-cover border" alt="" />
                              <div>
                                <p className="text-[10px] font-black text-on-surface leading-none">{subtask.assignee?.name || USER_ME.name}</p>
                                <p className="text-[8px] text-on-surface-variant/70 leading-none mt-0.5 uppercase tracking-wider">{subtask.assignee?.role || USER_ME.role}</p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-0.5 text-[10px] md:text-right text-on-surface-variant font-medium">
                              {subtask.entryDate && (
                                <p>Entrada: <span className="font-bold">{formatDate(subtask.entryDate)}</span></p>
                              )}
                              {subtask.expeditedDate && (
                                <p>Expedido: <span className="font-bold">{formatDate(subtask.expeditedDate)}</span></p>
                              )}
                              {subtask.dueDate && (
                                <p>Prazo: <span className="font-bold text-red-700">{formatDate(subtask.dueDate)}</span></p>
                              )}
                            </div>
                          </div>

                          {subtask.observations && (
                            <div className="bg-surface-container-low/30 p-2.5 rounded-2xl text-[11px] text-on-surface-variant/80 border border-surface-container-high/40">
                              <span className="font-bold block uppercase tracking-wider text-[8px] text-on-surface-variant/50">Observações:</span>
                              {subtask.observations}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-container-low">
                            <button
                              onClick={() => setEditingSubtask({ mainTaskId: drawerTask.id, subtask })}
                              className="text-[10px] font-black text-secondary hover:underline uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 size={12} />
                              Editar Rápido
                            </button>
                            <span className="text-on-surface-variant/30">|</span>
                            <button
                              onClick={() => {
                                if (confirm("Deseja mesmo excluir esta tarefa relacionada?")) {
                                  setTasks(prev => prev.map(t => {
                                    if (t.id === drawerTask.id) {
                                      return {
                                        ...t,
                                        subtasks: t.subtasks?.filter(st => st.id !== subtask.id) || []
                                      };
                                    }
                                    return t;
                                  }));
                                }
                              }}
                              className="text-[10px] font-black text-error hover:underline uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé do Drawer */}
              <div className="p-6 border-t border-surface-container bg-surface-container-low/40 flex gap-3">
                <button 
                  onClick={() => setSelectedDrawerTaskId(null)}
                  className="flex-1 py-4 px-6 border border-surface-container-high rounded-2xl font-bold text-sm hover:bg-surface-container active:scale-[0.98] transition-all cursor-pointer text-center bg-white"
                >
                  Fechar Visualização
                </button>
                <button 
                  onClick={() => {
                    setEditingTask(drawerTask);
                    setSelectedDrawerTaskId(null);
                  }}
                  className="flex-1 py-4 px-6 bg-primary text-on-primary rounded-2xl font-bold text-sm shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
                >
                  Editar Dados Principais
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Modelo de Planilha */}
      <AnimatePresence>
        {showTemplateModal && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplateModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-6 bottom-6 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[680px] md:h-auto max-h-[92vh] bg-white rounded-[2.5rem] shadow-2xl z-50 overflow-hidden flex flex-col border border-surface-container"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-surface-container flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-primary">Modelos de Planilha de Importação</h2>
                    <p className="text-xs text-on-surface-variant font-medium">Estrutura oficial para evitar conflitos na inserção em lote</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-grow text-sm">
                <div className="space-y-2">
                  <p className="font-bold text-slate-800">
                    Insira tarefas em lote de forma simplificada!
                  </p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Nossa ferramenta de importação reconhece colunas em português e inglês de arquivos <strong>Excel (.xlsx)</strong>, <strong>CSV</strong> ou <strong>Google Planilhas</strong>. Siga a estrutura de cabeçalhos descrita abaixo para garantir que seus dados sejam lidos corretamente.
                  </p>
                </div>

                {/* Google Sheets Link Alert */}
                <div className="bg-primary/[0.03] border border-primary/20 p-4 rounded-3xl flex items-start gap-3">
                  <div className="text-primary mt-0.5 flex-shrink-0">
                    <ExternalLink size={16} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Planilha Modelo no Google Sheets</h4>
                    <p className="text-xs text-on-surface-variant/90 leading-relaxed">
                      Criamos um modelo oficial pronto para uso no Google Sheets. Basta acessar o link abaixo, criar uma cópia na sua conta Google Drive, preencher seus dados, fazer o download como Excel (.xlsx) ou CSV e importá-lo aqui!
                    </p>
                    <div className="pt-2">
                      <a 
                        href="https://docs.google.com/spreadsheets/d/1BfS_uR1f6WzP9D8n4z32R7gH_Q6wXpYlX9u8vW_gA4s/copy" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
                      >
                        Criar Cópia no Google Sheets
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Colunas do Modelo */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Campos do Formulário (Cabeçalhos Recomendados)</h4>
                  <div className="border border-surface-container rounded-2xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-on-surface-variant border-b border-surface-container font-black uppercase tracking-wider text-[9px]">
                          <th className="p-3">Coluna (PT-BR)</th>
                          <th className="p-3">Coluna (EN)</th>
                          <th className="p-3">Status / Valores aceitos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container text-on-surface-variant/90 font-medium">
                        <tr>
                          <td className="p-3 font-bold text-primary">Título</td>
                          <td className="p-3">Title, Tarefa, Assunto</td>
                          <td className="p-3 text-slate-500">Qualquer texto descritivo (Obrigatório)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Status</td>
                          <td className="p-3">Status, Situação</td>
                          <td className="p-3 text-slate-500">"Não Iniciada", "Em Andamento", "Concluída", "Atrasada", "Suspensa"</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Prioridade</td>
                          <td className="p-3">Priority, Prioridade</td>
                          <td className="p-3 text-slate-500">"Baixa", "Média", "Alta", "Urgente"</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Responsável</td>
                          <td className="p-3">Assignee, Responsável</td>
                          <td className="p-3 text-slate-500">Nome do militar (Ex: Ten. Cel. Silva, Cap. Oliveira)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Data Entrada</td>
                          <td className="p-3">EntryDate, Entrada</td>
                          <td className="p-3 text-slate-500">Formato AAAA-MM-DD</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Prazo</td>
                          <td className="p-3">DueDate, Prazo, Vencimento</td>
                          <td className="p-3 text-slate-500">Formato AAAA-MM-DD</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">SIGAD Entrada</td>
                          <td className="p-3">SigadRec, SIGAD Entrada</td>
                          <td className="p-3 text-slate-500">Número do SIGAD de entrada (opcional)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">SIGAD Saída</td>
                          <td className="p-3">SigadExp, SIGAD Saída</td>
                          <td className="p-3 text-slate-500">Número do SIGAD de saída (opcional)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Tipo</td>
                          <td className="p-3">DocumentType, Tipo Documento</td>
                          <td className="p-3 text-slate-500">"Ofício", "Estudo", "Portaria", "E-mail", "APF", "Sindicância", etc.</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Término</td>
                          <td className="p-3">ExpeditedDate, Término, Data Término, Expedido</td>
                          <td className="p-3 text-slate-500">Formato AAAA-MM-DD (opcional)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Destino</td>
                          <td className="p-3">Destination, Destino, Órgão Destino</td>
                          <td className="p-3 text-slate-500">Destino da tarefa/ofício (opcional)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-bold text-primary">Observações</td>
                          <td className="p-3">Observations, Obs, Observações</td>
                          <td className="p-3 text-slate-500">Informações complementar (opcional)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Baixar localmente */}
                <div className="space-y-3 pt-2">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Ou Baixe o Modelo em Arquivo Local:</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={downloadXlsxTemplate}
                      className="flex-1 py-3 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded-2xl font-bold text-xs transition-all border border-emerald-200/50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText size={16} />
                      Baixar Modelo Excel (.xlsx)
                    </button>
                    <button 
                      onClick={downloadCsvTemplate}
                      className="flex-1 py-3 px-4 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-2xl font-bold text-xs transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileDown size={16} />
                      Baixar Modelo CSV (.csv)
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-surface-container bg-slate-50/50 flex gap-3 justify-end flex-shrink-0">
                <button 
                  onClick={() => setShowTemplateModal(false)}
                  className="py-3 px-6 bg-primary text-on-primary rounded-2xl font-bold text-xs shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
                >
                  Entendi, ir para Importação
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
