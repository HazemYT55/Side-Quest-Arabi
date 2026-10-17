import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ✅ Your actual project URL
const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';

// ⚠️ PASTE YOUR FULL "PUBLISHABLE KEY" HERE (Make sure there are no spaces)
// It starts with sb_publishable_...
const SUPABASE_ANON_KEY = 'PASTE_YOUR_KEY_HERE'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = localStorage.getItem('sq_user') || '';

// === 1. LOGIN SYSTEM (No passwords, just a name) ===
window.setUser = function() {
  const name = document.getElementById('name-input').value.trim();
  if(!name) return alert("Please enter a name!");
  
  currentUser = name;
  localStorage.setItem('sq_user', name); // Remembers you if you refresh
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  initApp();
}

// Check if already logged in
if(currentUser) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'flex';
  initApp();
}

// === 2. TABS ===
document.querySelectorAll('.tab[data-view]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.view}-view`).classList.add('active');
  });
});

// === 3. CHAT (WhatsApp) ===
const chatMessagesEl = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

function renderMessage(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.sender_name === currentUser ? 'mine' : ''}`;
  div.innerHTML = `
    <div class="meta">${msg.sender_name} · ${new Date(msg.created_at).toLocaleTimeString()}</div>
    <div>${msg.content}</div>
  `;
  chatMessagesEl.appendChild(div);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

window.sendMessage = async function() {
  const content = chatInput.value.trim();
  if (!content) return;
  
  chatInput.value = ''; // clear input immediately
  
  const { error } = await supabase.from('messages').insert({ 
    content: content, 
    sender_name: currentUser 
  });
  
  if (error) {
    console.error("Error sending message:", error);
    alert("Failed to send message. Did you run the SQL?");
  }
}

chatInput.addEventListener('keypress', (e) => { 
  if (e.key === 'Enter') sendMessage(); 
});

// === 4. POSTS (X) ===
const postsFeed = document.getElementById('posts-feed');
const postContent = document.getElementById('post-content');
const postMedia = document.getElementById('post-media');

function renderPost(post) {
  const div = document.createElement('div');
  div.className = 'post';
  let mediaHtml = '';
  if (post.media_url && post.media_type === 'image') mediaHtml = `<img src="${post.media_url}">`;
  if (post.media_url && post.media_type === 'video') mediaHtml = `<video src="${post.media_url}" controls></video>`;
  
  div.innerHTML = `
    <div class="author">${post.author_name}</div>
    <div class="content">${post.content || ''}</div>
    ${mediaHtml}
    <div class="meta" style="font-size:12px;color:#888;">${new Date(post.created_at).toLocaleString()}</div>
  `;
  postsFeed.prepend(div);
}

window.createPost = async function() {
  const content = postContent.value.trim();
  const file = postMedia.files[0];
  
  if (!content && !file) return; // Don't post empty things

  let mediaUrl = null;
  let mediaType = 'none';

  if (file) {
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('post-media').upload(fileName, file);
    
    if (!uploadError) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
      mediaUrl = data.publicUrl;
      mediaType = file.type.startsWith('image') ? 'image' : 'video';
    } else {
      alert("Media upload failed. Did you create the public bucket?");
    }
  }

  const { error } = await supabase.from('posts').insert({ 
    content, 
    media_url: mediaUrl, 
    media_type: mediaType, 
    author_name: currentUser 
  });
  
  if (!error) {
    postContent.value = '';
    postMedia.value = '';
  }
}

// === 5. INIT & LIVE UPDATES ===
async function initApp() {
  // Load old messages
  const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
  if (msgs) msgs.forEach(renderMessage);

  // Load old posts
  const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
  if (posts) posts.forEach(renderPost);

  // Listen for new ones coming in (Realtime)
  supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => renderMessage(payload.new)).subscribe();

  supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
    (payload) => renderPost(payload.new)).subscribe();
}