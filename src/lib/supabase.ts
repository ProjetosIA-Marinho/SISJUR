import { createClient } from '@supabase/supabase-js';
import { Task, User, Project } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing from environment variables.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Map database column names to camelCase for Task
export function mapTaskFromDb(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date || '',
    assignee: row.users ? {
      id: row.users.id,
      name: row.users.name,
      role: row.users.role,
      avatar: row.users.avatar,
      online: row.users.online,
      accessLevel: row.users.access_level,
      section: row.users.section
    } : {
      id: 'unknown',
      name: 'Unknown',
      role: '',
      avatar: '',
      online: false,
      accessLevel: 'operador',
      section: 'AAJ'
    },
    progress: row.progress || 0,
    sigadOfRec: row.sigad_of_rec || '',
    origem: row.origem || '',
    sigadOfExp: row.sigad_of_exp || '',
    destination: row.destination || '',
    documentType: row.document_type || '',
    entryDate: row.entry_date || '',
    expeditedDate: row.expedited_date || '',
    observations: row.observations || '',
    year: row.year || '',
    tags: row.tags || [],
    parentId: row.parent_id || undefined,
    isTemplate: row.is_template || false,
    recurringPattern: row.recurring_pattern || 'none',
    commentsCount: row.comments_count || 0,
    attachmentsCount: row.attachments_count || 0,
    subtasks: []
  };
}

export function mapTaskToDb(task: Partial<Task>): any {
  const dbObj: any = {};
  if (task.id !== undefined) dbObj.id = task.id;
  if (task.title !== undefined) dbObj.title = task.title;
  if (task.description !== undefined) dbObj.description = task.description;
  if (task.status !== undefined) dbObj.status = task.status;
  if (task.priority !== undefined) dbObj.priority = task.priority;
  if (task.dueDate !== undefined) dbObj.due_date = task.dueDate;
  if (task.assignee !== undefined) dbObj.assignee_id = task.assignee.id;
  if (task.progress !== undefined) dbObj.progress = task.progress;
  if (task.sigadOfRec !== undefined) dbObj.sigad_of_rec = task.sigadOfRec;
  if (task.origem !== undefined) dbObj.origem = task.origem;
  if (task.sigadOfExp !== undefined) dbObj.sigad_of_exp = task.sigadOfExp;
  if (task.destination !== undefined) dbObj.destination = task.destination;
  if (task.documentType !== undefined) dbObj.document_type = task.documentType;
  if (task.entryDate !== undefined) dbObj.entry_date = task.entryDate;
  if (task.expeditedDate !== undefined) dbObj.expedited_date = task.expeditedDate;
  if (task.observations !== undefined) dbObj.observations = task.observations;
  if (task.year !== undefined) dbObj.year = task.year;
  if (task.tags !== undefined) dbObj.tags = task.tags;
  if (task.parentId !== undefined) dbObj.parent_id = task.parentId;
  if (task.isTemplate !== undefined) dbObj.is_template = task.isTemplate;
  if (task.recurringPattern !== undefined) dbObj.recurring_pattern = task.recurringPattern;
  if (task.commentsCount !== undefined) dbObj.comments_count = task.commentsCount;
  if (task.attachmentsCount !== undefined) dbObj.attachments_count = task.attachmentsCount;
  return dbObj;
}

export function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    avatar: row.avatar,
    online: row.online,
    accessLevel: row.access_level,
    section: row.section,
    username: row.username,
    password: row.password,
    createdBy: row.created_by
  };
}

export function mapUserToDb(user: User): any {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    online: user.online,
    access_level: user.accessLevel,
    section: user.section,
    username: user.username,
    password: user.password,
    created_by: user.createdBy
  };
}

