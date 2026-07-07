import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, mapTaskFromDb, mapTaskToDb, mapUserFromDb, mapUserToDb } from '../lib/supabase';
import { Task, User, Project } from '../types';
import { TEAM as mockTeam, TASKS as mockTasks, PROJECTS as mockProjects, USER_ME } from '../data';

interface DataContextType {
  tasks: Task[];
  team: User[];
  projects: Project[];
  loading: boolean;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getLocalData = <T,>(key: string, defaultValue: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return defaultValue;
  }
};

const setLocalData = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing localStorage:', e);
  }
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)) {
      return;
    }

    let channel: any = null;
    let lastUserId: string | null = null;

    // Helper to start tracking presence
    const setupPresence = (userId: string) => {
      if (channel && lastUserId === userId) return;

      if (channel) {
        console.log('Presence: unsubscribing from old channel for user', lastUserId);
        channel.unsubscribe();
        channel = null;
      }

      console.log('Presence: setting up new channel for user', userId);
      lastUserId = userId;
      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log('Presence: sync event received. State:', state);
          const onlineIds = Object.keys(state);
          console.log('Presence: online user IDs:', onlineIds);
          setOnlineUsers(onlineIds);
        })
        .subscribe(async (status: string, err?: any) => {
          console.log('Presence: subscription status change:', status, err || '');
          if (status === 'SUBSCRIBED') {
            console.log('Presence: successfully subscribed. Tracking presence...');
            const trackResult = await channel.track({
              online_at: new Date().toISOString(),
            });
            console.log('Presence: track result:', trackResult);
          }
        });
    };

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
            const mapped = mapUserFromDb(data);
            setCurrentUser(mapped);
            setupPresence(session.user.id);
          }
        });
      }
    });

    // Listen for auth changes to update presence tracking
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          const mapped = mapUserFromDb(data);
          setCurrentUser(mapped);
          setupPresence(session.user.id);
        }
      } else {
        if (channel) {
          channel.unsubscribe();
          channel = null;
        }
        setCurrentUser(null);
        setOnlineUsers([]);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  const refreshAll = async () => {
    setLoading(true);
    let success = false;

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        // Fetch Users from profiles table
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*');
        
        if (usersError) throw usersError;
        const mappedUsers = (usersData || []).map(mapUserFromDb);

        // Fetch Tasks referencing profiles as users alias (with pagination to bypass 1000-row limit)
        let allTasksData: any[] = [];
        let start = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: chunk, error: tasksError } = await supabase
            .from('tasks')
            .select('*, users:profiles!assignee_id(*)')
            .range(start, start + limit - 1);
          
          if (tasksError) throw tasksError;

          if (chunk && chunk.length > 0) {
            allTasksData = [...allTasksData, ...chunk];
            start += limit;
            if (chunk.length < limit) {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        const allTasks = allTasksData.map(mapTaskFromDb);

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

        setTeam(mappedUsers.length > 0 ? mappedUsers : mockTeam);
        setTasks(rootTasks.length > 0 ? rootTasks : mockTasks);
        setProjects(mappedProjects.length > 0 ? mappedProjects : mockProjects);
        success = true;
      } catch (err) {
        console.error('Error fetching data from Supabase, falling back to localStorage:', err);
      }
    }

    if (!success) {
      // Fallback to localStorage
      const localTeam = getLocalData('sisjur_team', mockTeam);
      const localTasks = getLocalData('sisjur_tasks', mockTasks);
      const localProjects = getLocalData('sisjur_projects', mockProjects);

      // Save initial defaults if not already present in localStorage
      if (!localStorage.getItem('sisjur_team')) setLocalData('sisjur_team', localTeam);
      if (!localStorage.getItem('sisjur_tasks')) setLocalData('sisjur_tasks', localTasks);
      if (!localStorage.getItem('sisjur_projects')) setLocalData('sisjur_projects', localProjects);

      setTeam(localTeam);
      setTasks(localTasks);
      setProjects(localProjects);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const addTask = async (task: Task) => {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const dbTask = mapTaskToDb(task);
        const { error } = await supabase
          .from('tasks')
          .insert(dbTask);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to add task to Supabase, saving to localStorage:', err);
      }
    }

    const localTasks = getLocalData<Task[]>('sisjur_tasks', mockTasks);
    if (!localTasks.some(t => t.id === task.id)) {
      localTasks.push(task);
      setLocalData('sisjur_tasks', localTasks);
    }
    await refreshAll();
  };

  const updateTask = async (task: Task) => {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const dbTask = mapTaskToDb(task);
        const { error } = await supabase
          .from('tasks')
          .update(dbTask)
          .eq('id', task.id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update task in Supabase, saving to localStorage:', err);
      }
    }

    const localTasks = getLocalData<Task[]>('sisjur_tasks', mockTasks);
    const updatedTasks = localTasks.map(t => t.id === task.id ? { ...t, ...task } : t);
    setLocalData('sisjur_tasks', updatedTasks);
    await refreshAll();
  };

  const deleteTask = async (id: string) => {
    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete task from Supabase, removing from localStorage:', err);
      }
    }

    const localTasks = getLocalData<Task[]>('sisjur_tasks', mockTasks);
    const updatedTasks = localTasks.filter(t => t.id !== id);
    setLocalData('sisjur_tasks', updatedTasks);
    await refreshAll();
  };

  const updateUser = async (user: User) => {
    // 1. Optimistically update local team state immediately
    setTeam(prevTeam => {
      const newTeam = prevTeam.map(u => u.id === user.id ? { ...u, ...user } : u);
      setLocalData('sisjur_team', newTeam);
      return newTeam;
    });

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
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
              refreshAll();
            }
          });
      } catch (e) {
        console.warn('Erro ao atualizar no Supabase:', e);
      }
    }
  };

  const deleteUser = async (id: string) => {
    const storedTeam = localStorage.getItem('sisjur_team');
    const localTeamData = storedTeam ? JSON.parse(storedTeam) : mockTeam;
    const updatedTeam = localTeamData.filter((u: User) => u.id !== id);
    setLocalData('sisjur_team', updatedTeam);
    setTeam(updatedTeam);

    if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);
        if (error) console.error('Error deleting user from profiles in Supabase:', error);
      } catch (err) {
        console.error('Supabase connection failed during user deletion:', err);
      }
    }
    await refreshAll();
  };

  const activeTeam = React.useMemo(() => {
    let updatedTeam = [...team];

    // Ensure the current user is included in the team list so they show up as online
    if (currentUser) {
      const hasMe = updatedTeam.some(member => member.id === currentUser.id);
      if (!hasMe) {
        updatedTeam.push(currentUser);
      }
    }

    const isSupabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    if (!isSupabaseEnabled) {
      return updatedTeam;
    }

    return updatedTeam.map(member => {
      const isMe = currentUser ? member.id === currentUser.id : false;
      const isOnline = onlineUsers.includes(member.id) || isMe;
      return {
        ...member,
        online: isOnline
      };
    });
  }, [team, onlineUsers, currentUser]);

  return (
    <DataContext.Provider value={{ tasks, team: activeTeam, projects, loading, addTask, updateTask, deleteTask, updateUser, deleteUser, refreshAll }}>
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
