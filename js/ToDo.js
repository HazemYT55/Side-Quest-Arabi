import { supabase, currentEmail } from './app.js';

export async function loadTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  
  const { data } = await supabase.from('todos').select('*').eq('user_email', currentEmail).order('created_at', { ascending: false });
  
  if (data) {
    data.forEach(todo => {
      const div = document.createElement('div');
      div.className = 'todo-item';
      div.innerHTML = `
        <div class="todo-checkbox ${todo.is_completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id}, ${todo.is_completed})">✓</div>
        <div class="todo-text ${todo.is_completed ? 'completed' : ''}">${todo.task}</div>
      `;
      list.appendChild(div);
    });
  }
}

window.addTodo = async function() {
  const input = document.getElementById('todo-input');
  const task = input.value.trim();
  if (!task) return;
  
  input.value = '';
  await supabase.from('todos').insert({ task, user_email: currentEmail });
  loadTodos();
}

window.toggleTodo = async function(id, currentStatus) {
  await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
  loadTodos();
}