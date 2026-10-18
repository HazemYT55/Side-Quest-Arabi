import { supabase, currentUser, currentAvatar } from './app.js';

export async function initChat() {
  // Get messages
  const { data } = await supabase.from('messages').select('*').is('receiver_name', null).order('created_at', { ascending: true }).limit(50);
  if (data) data.forEach(renderMessage);

  // Real-time listener
  supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => {
      if (!payload.new.receiver_name) renderMessage(payload.new);
    }).subscribe();
}

window.sendMessage = async function() {
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content) return;
  input.value = ''; 
  
  // Sending with the global currentAvatar
  await supabase.from('messages').insert({ 
    content, 
    sender_name: currentUser, 
    avatar_url: currentAvatar 
  });
}

function renderMessage(msg) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${msg.sender_name === currentUser ? 'mine' : ''}`;
  const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  // If avatar_url is empty, show initials
  const pfp = msg.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender_name}&background=random`;
  
  div.innerHTML = `
    <div style="display:flex; gap:8px; align-items:flex-end; ${msg.sender_name === currentUser ? 'flex-direction: row-reverse;' : ''}">
      <div style="width:30px; height:30px; border-radius:50%; background-image:url('${pfp}'); background-size:cover; background-position:center; flex-shrink:0;"></div>
      <div style="flex:1;">
        ${msg.sender_name !== currentUser ? `<div class="meta">${msg.sender_name}</div>` : ''}
        <div>${msg.content} <span class="time">${time}</span></div>
      </div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });