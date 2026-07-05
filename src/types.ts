export type ViewType = 'dashboard' | 'kanban' | 'tasks' | 'timeline' | 'calendar' | 'reports' | 'settings';

export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'suspended' | 'backlog';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type AccessLevel = 'gestor' | 'operador-chefe' | 'operador';
export type SectionType = 'AAJ' | 'SIJ' | 'AJUR';

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  online?: boolean;
  accessLevel: AccessLevel;
  section: SectionType;
  username?: string;
  password?: string;
  createdBy?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee: User;
  progress: number;
  
  // New fields for professional task management
  sigadOfRec?: string;
  origem?: string;
  sigadOfExp?: string;
  destination?: string;
  documentType?: string;
  entryDate?: string;
  expeditedDate?: string;
  observations?: string;
  year?: string;
  tags?: string[];
  
  // Hierarchy
  parentId?: string;
  subtasks?: Task[];
  
  // Recurrence
  isTemplate?: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'none';

  commentsCount?: number;
  attachmentsCount?: number;
}

export interface Project {
  id: string;
  name: string;
  team: User[];
  progress: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'on-hold';
}
