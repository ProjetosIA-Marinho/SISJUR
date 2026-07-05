import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, mapTaskFromDb, mapTaskToDb, mapUserFromDb, mapUserToDb } from '../lib/supabase';
import { Task, User, Project } from '../types';

interface DataContextType {
  tasks: Task[];
  team: User[];
  projects: Project[];
  loading: boolean;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshAll = async () => {
    try {
      setLoading(true);
      // Fetch Users from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*');
      
      if (usersError) throw usersError;
      const mappedUsers = (usersData || []).map(mapUserFromDb);

      setTeam(mappedUsers);

      // Fetch Tasks referencing profiles as users alias
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, users:profiles!assignee_id(*)');
      
      if (tasksError) throw tasksError;
      const allTasks = (tasksData || []).map(mapTaskFromDb);

      // Build task hierarchy
      const taskMap = new Map<string, Task>();
      allTasks.forEach(t => {
        t.subtasks = [];
        taskMap.set(t.id, t);
      });

      const rootTasks: Task[] = [];
      allTasks.forEach(t => {
        if (t.parentId && taskMap.has(t.parentId)) {
          const parent = taskMap.get(t.parentId);
          parent?.subtasks?.push(t);
        } else {
          rootTasks.push(t);
        }
      });
      setTasks(rootTasks);

      // Fetch Projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, project_team(user_id)');
      
      if (projectsError) throw projectsError;
      
      const mappedProjects: Project[] = (projectsData || []).map(p => {
        const teamIds = p.project_team?.map((pt: any) => pt.user_id) || [];
        const projectTeam = mappedUsers.filter(u => teamIds.includes(u.id));
        return {
          id: p.id,
          name: p.name,
          progress: p.progress,
          startDate: p.start_date,
          endDate: p.end_date,
          status: p.status,
          team: projectTeam
        };
      });
      setProjects(mappedProjects);
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const addTask = async (task: Task) => {
    const dbTask = mapTaskToDb(task);
    const { error } = await supabase
      .from('tasks')
      .insert(dbTask);
    if (error) {
      console.error('Error inserting task:', error);
      throw error;
    }
    // Update local state by refetching or manual insertion
    await refreshAll();
  };

  const updateTask = async (task: Task) => {
    const dbTask = mapTaskToDb(task);
    const { error } = await supabase
      .from('tasks')
      .update(dbTask)
      .eq('id', task.id);
    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
    await refreshAll();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
    await refreshAll();
  };

  const updateUser = async (user: User) => {
    // 1. Optimistically update local team state immediately
    setTeam(prevTeam => {
      const newTeam = [...prevTeam];
      const idx = newTeam.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        newTeam[idx] = { ...newTeam[idx], ...user };
      } else {
        newTeam.push(user);
      }
      return newTeam;
    });

    // 2. Update in Supabase in background (profiles table instead of users)
    try {
      const dbUser = mapUserToDb(user);
      supabase
        .from('profiles')
        .update(dbUser)
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating user in Supabase:', error);
          } else {
            // Re-fetch database state only after update succeeds
            refreshAll();
          }
        });
    } catch (e) {
      console.warn('Erro ao atualizar no Supabase:', e);
    }
  };

  return (
    <DataContext.Provider value={{ tasks, team, projects, loading, addTask, updateTask, deleteTask, updateUser, refreshAll }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
