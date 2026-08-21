import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tovsacqwkvnqkoawzyly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdnNhY3F3a3ZucWtvYXd6eWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTk1MzQsImV4cCI6MjA5ODczNTUzNH0.3-_26ggDXthZw6PSO_6VFa5TXOTBqsobKnQCQZev1hQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  try {
    // 1. Fetch a valid parent task
    const { data: tasks, error: fetchError } = await supabase.from('tasks').select('id, title, assignee_id').limit(1);
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return;
    }
    
    if (!tasks || tasks.length === 0) {
      console.error('No tasks found');
      return;
    }

    const parentTask = tasks[0];
    console.log('Using parent task:', parentTask);

    // 2. Map task to DB format (same as DataContext)
    const dbObj = {
      id: crypto.randomUUID(),
      parent_id: parentTask.id,
      title: 'Test Subtask from Script',
      status: 'not-started',
      priority: 'medium',
      due_date: new Date().toISOString().split('T')[0],
      entry_date: new Date().toISOString().split('T')[0],
      expedited_date: '',
      sigad_of_rec: '',
      sigad_of_exp: '555016',
      destination: '',
      document_type: 'Ofício',
      assignee_id: parentTask.assignee_id, // valid UUID
      progress: 0,
      year: new Date().getFullYear().toString(),
      origem: '',
      observations: '',
      tags: [],
    };

    console.log('Attempting to insert:', dbObj);

    // 3. Insert
    const { data, error } = await supabase.from('tasks').insert([dbObj]);
    
    if (error) {
      console.error('INSERT FAILED:', error);
    } else {
      console.log('INSERT SUCCEEDED:', data);
    }
  } catch (err) {
    console.error('JS Error:', err);
  }
}

test();
