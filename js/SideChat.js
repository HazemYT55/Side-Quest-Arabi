import { supabase, currentUser, currentEmail, currentAvatar } from './app.js';

// --- MAIN TEAM CHAT ---
export async function initChat() {
  if (!currentUser) {
    setTimeout(initChat, 500);
    return;
  }

  // INSTANT LOAD: We use the Join to get the PFP in the same request
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(avatar_url)')
    .is('receiver_name', null)
    .order('created_at', { ascending: true })
    .limit(50);
    
  if (data) data.forEach(renderMessage);

  // Listen for new messages
  supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    async (payload) => {
      if (!payload.new.receiver_name) {
        // Get the PFP for the new message instantly
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('username', payload.new.sender_name)
          .single();
          
        renderMessage({ ...payload.new, profiles: profile });
      }
    }).subscribe();
}

window.sendMessage = async function() {
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content || !currentUser) return;
  
  // Clear input instantly so it feels fast
  input.value = ''; 
  
  await supabase.from('messages').insert({ 
    content, 
    sender_name: currentUser
  });
}

function renderMessage(msg) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  
  const isMe = msg.sender_name === currentUser;
  div.className = `message ${isMe ? 'mine' : ''}`;
  
  const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  // Grab the PFP from the joined data instantly
  const pfp = msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender_name}&background=random`;
  
  div.innerHTML = `
    <div style="display:flex; gap:8px; align-items:flex-end; ${isMe ? 'flex-direction: row-reverse;' : ''}">
      <div style="width:30px; height:30px; border-radius:50%; background-image:url('${pfp}'); background-size:cover; background-position:center; flex-shrink:0;"></div>
      <div style="flex:1;">
        ${!isMe ? `<div class="meta">${msg.sender_name}</div>` : ''}
        <div>${msg.content} <span class="time">${time}</span></div>
      </div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

document.getElementById('chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// --- PRIVATE CHAT ---
let currentReceiver = '';

export function openPrivateChat(receiverName) {
  currentReceiver = receiverName;
  document.getElementById('private-chat-name').innerText = receiverName;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-private-chat').classList.add('active');
  
  const box = document.getElementById('private-chat-messages');
  box.innerHTML = ''; 

  // INSTANT LOAD for Private Chat
  supabase.from('messages').select('*, profiles(avatar_url)')
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
  
  const isMe = msg.sender_name === currentUser;
  div.className = `message ${isMe ? 'mine' : ''}`;
  
  const time = new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const pfp = msg.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender_name}&background=random`;
  
  div.innerHTML = `
    <div style="display:flex; gap:8px; align-items:flex-end; ${isMe ? 'flex-direction: row-reverse;' : ''}">
      <div style="width:30px; height:30px; border-radius:50%; background-image:url('${pfp}'); background-size:cover; background-position:center; flex-shrink:0;"></div>
      <div style="flex:1;">
        ${!isMe ? `<div class="meta">${msg.sender_name}</div>` : ''}
        <div>${msg.content} <span class="time">${time}</span></div>
      </div>
    </div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

window.sendPrivateMessage = async function() {
  const input = document.getElementById('private-chat-input');
  const content = input.value.trim();
  if (!content || !currentReceiver || !currentUser) return;
  input.value = ''; 
  await supabase.from('messages').insert({ 
    content, 
    sender_name: currentUser, 
    receiver_name: currentReceiver
  });
}

document.getElementById('private-chat-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendPrivateMessage(); });