import { supabase, currentUser } from './app.js';

// --- MAIN TEAM CHAT ---
export async function initChat() {
  const { data } = await supabase.from('messages').select('*').is('receiver_name', null).order('created_at', { ascending: true }).limit(50);
  if (data) data.forEach(renderMessage);

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
  await supabase.from('messages').insert({ content, sender_name: currentUser });
}

function renderMessage(msg) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${msg.sender_name === currentUser ? 'mine' : ''}`;
  
  const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  div.innerHTML = `
    ${msg.sender_name !== currentUser ? `<div class="meta">${msg.sender_name}</div>` : ''}
    <div>${msg.content} <span class="time">${time}</span></div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// --- PRIVATE CHAT ---
let currentReceiver = '';

export function openPrivateChat(receiverName) {
  currentReceiver = receiverName;
  document.getElementById('app-title').innerText = receiverName;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-private-chat').classList.add('active');
  
  const box = document.getElementById('private-chat-messages');
  box.innerHTML = ''; 

  supabase.from('messages').select('*')
    .or(`and(sender_name.eq.${currentUser},receiver_name.eq.${receiverName}),and(sender_name.eq.${receiverName},receiver_name.eq.${currentUser})`)
    .order('created_at', { ascending: true })
    .then(({ data }) => {
      if (data) data.forEach(msg => renderPrivateMessage(msg));
    });
}

export function renderPrivateMessage(msg) {
  const box = document.getElementById('private-chat-messages');
  if(!box) return;
  const div = document.createElement('div');
  div.className = `message ${msg.sender_name === currentUser ? 'mine' : ''}`;
  
  const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  div.innerHTML = `
    ${msg.sender_name !== currentUser ? `<div class="meta">${msg.sender_name}</div>` : ''}
    <div>${msg.content} <span class="time">${time}</span></div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

window.sendPrivateMessage = async function() {
  const input = document.getElementById('private-chat-input');
  const content = input.value.trim();
  if (!content || !currentReceiver) return;
  input.value = ''; 
  await supabase.from('messages').insert({ content, sender_name: currentUser, receiver_name: currentReceiver });
}

document.getElementById('private-chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPrivateMessage(); });

supabase.channel('private_chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
  (payload) => {
    const msg = payload.new;
    if (msg.receiver_name && (msg.sender_name === currentUser || msg.receiver_name === currentUser)) {
      if ((msg.sender_name === currentReceiver && msg.receiver_name === currentUser) || 
          (msg.sender_name === currentUser && msg.receiver_name === currentReceiver)) {
        renderPrivateMessage(msg);
      }
    }
  }).subscribe();