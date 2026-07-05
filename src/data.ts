import { Task, User, Project } from './types';

let activeUserInMemory: User | null = null;

export const setActiveUserInMemory = (user: User | null) => {
  activeUserInMemory = user;
};

export const getInitialUser = (): User => {
  if (activeUserInMemory) {
    return activeUserInMemory;
  }
  return {
    id: 'unknown',
    name: 'Carregando...',
    role: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002?w=100&h=100&fit=crop&q=80',
    online: false,
    accessLevel: 'operador',
    section: 'AAJ'
  };
};

export const USER_ME: User = {
  get id() { return getInitialUser().id; },
  get name() { return getInitialUser().name; },
  get role() { return getInitialUser().role; },
  get avatar() { return getInitialUser().avatar; },
  get online() { return getInitialUser().online; },
  get accessLevel() { return getInitialUser().accessLevel; },
  get section() { return getInitialUser().section; },
  get username() { return getInitialUser().username; },
  get password() { return getInitialUser().password; }
} as User;

export const TEAM: User[] = [
  {
    id: 'u1',
    name: 'Ana Martins',
    role: 'Chefe da Seção SIJ',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80',
    online: true,
    accessLevel: 'operador-chefe',
    section: 'SIJ'
  },
  {
    id: 'u2',
    name: 'Carlos Mendes',
    role: 'Operador SIJ',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80',
    online: false,
    accessLevel: 'operador',
    section: 'SIJ'
  },
  {
    id: 'u3',
    name: 'Julia Costa',
    role: 'Chefe da Seção AJUR',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80',
    online: true,
    accessLevel: 'operador-chefe',
    section: 'AJUR'
  },
  {
    id: 'u4',
    name: 'Lucas Ferreira',
    role: 'Operador AAJ',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80',
    online: true,
    accessLevel: 'operador',
    section: 'AAJ'
  }
];

export const TASKS: Task[] = [
  {
    id: 't1',
    title: 'Parecer Técnico sobre Sindicância Administrativa',
    description: 'Análise preliminar de legalidade e mérito das provas produzidas.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-07-15',
    assignee: TEAM[0],
    progress: 65,
    tags: ['AAJ', 'Sindicância', 'Jurídico'],
    sigadOfRec: '525923',
    origem: 'GSD',
    sigadOfExp: '531630',
    destination: 'AFA - Comando',
    documentType: 'Ofício',
    entryDate: '2026-07-01',
    expeditedDate: '',
    observations: 'Necessita análise urgente de documentação complementar.',
    year: '2026',
    subtasks: []
  },
  {
    id: 't2',
    title: 'Revisão de Portaria de Homologação de Contrato',
    description: 'Verificação de cláusulas econômico-financeiras e prazos.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-07-10',
    assignee: TEAM[1],
    progress: 100,
    tags: ['SIJ', 'Contrato', 'Portaria'],
    sigadOfRec: '512849',
    origem: 'DIRENS',
    sigadOfExp: '521471',
    destination: 'SREG',
    documentType: 'Portaria',
    entryDate: '2026-06-25',
    expeditedDate: '2026-07-05',
    observations: 'Portaria publicada em boletim interno.',
    year: '2025',
    subtasks: []
  },
  {
    id: 't3',
    title: 'Análise de Mandado de Segurança - Liminar',
    description: 'Defesa prévia da união em face do ato de desligamento de cadete.',
    status: 'delayed',
    priority: 'urgent',
    dueDate: '2026-07-02',
    assignee: TEAM[2],
    progress: 30,
    tags: ['AJUR', 'Judicial', 'Liminar'],
    sigadOfRec: '532911',
    origem: 'JMU',
    sigadOfExp: '',
    destination: 'Seção de Pessoal',
    documentType: 'Demanda Judicial',
    entryDate: '2026-06-28',
    expeditedDate: '',
    observations: 'Aguardando informações urgentes da seção de saúde.',
    year: '2026',
    subtasks: []
  },
  {
    id: 't4',
    title: 'Instrução Provisória de IPM nº 22/2026',
    description: 'Inquérito Policial Militar instaurado por extravio de material.',
    status: 'not-started',
    priority: 'low',
    dueDate: '2026-07-20',
    assignee: TEAM[3],
    progress: 0,
    tags: ['AAJ', 'IPM', 'Instrução'],
    sigadOfRec: '540112',
    origem: 'DIRENS',
    sigadOfExp: '',
    destination: 'Encarregado',
    documentType: 'IPM',
    entryDate: '2026-07-03',
    expeditedDate: '',
    observations: 'Aguardando designação oficial do escrivão.',
    year: '2024',
    subtasks: []
  },
  {
    id: 't5',
    title: 'Análise de Contrato de Licitação de Tecnologia',
    description: 'Parecer sobre a legalidade do edital de licitação.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-10-15',
    assignee: TEAM[0],
    progress: 40,
    tags: ['AJUR', 'Contrato', 'Licitação'],
    sigadOfRec: '542110',
    origem: 'DIRENS',
    sigadOfExp: '',
    destination: 'Seção de Compras',
    documentType: 'Ofício',
    entryDate: '2025-09-01',
    expeditedDate: '',
    observations: 'Cláusula de propriedade intelectual precisa ser ajustada.',
    year: '2025',
    subtasks: []
  },
  {
    id: 't6',
    title: 'Revisão Legal de Regulamento de Concurso Interno',
    description: 'Análise do edital do exame de admissão interno.',
    status: 'completed',
    priority: 'medium',
    dueDate: '2024-05-20',
    assignee: TEAM[1],
    progress: 100,
    tags: ['SIJ', 'Concurso', 'Regulamento'],
    sigadOfRec: '501223',
    origem: 'AFA - Comando',
    sigadOfExp: '502331',
    destination: 'Seção de Ensino',
    documentType: 'Portaria',
    entryDate: '2024-04-10',
    expeditedDate: '2024-05-15',
    observations: 'Tudo de acordo com as normas vigentes.',
    year: '2024',
    subtasks: []
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Redesign Plataforma',
    team: TEAM.slice(0, 3),
    progress: 78,
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    status: 'active'
  }
];
