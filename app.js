import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = '';

// ================= 1. AUTHENTICATION & UI =================
window.switchAuth = function(mode) {
  document.getElementById('auth-username').classList.toggle('hidden', mode === 'login');
  document.getElementById('auth-btn').innerText = mode === 'login' ? 'Login' : 'Create Account';
  document.getElementById('auth-btn').setAttribute('onclick', mode === 'login' ? 'logIn()' : 'signUp()');
  
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
}

window.signUp = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value;

  if (!email || !password || !username) return alert("Please fill all fields!");

  const { error } = await supabase.auth.signUp({
    email, password, options: { data: { display_name: username } }
  });

  if (error) alert("Sign up error: " + error.message);
  else { alert("Account created! Please log in."); switchAuth('login'); }
}

window.logIn = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login error: " + error.message);
  } else {
    currentUser = data.user.user_metadata.display_name || email.split('@')[0];
    showApp();
  }
}

window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

function showApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  initChat();
  initFeed();
}

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user.user_metadata.display_name || session.user.email.split('@')[0];
    showApp();
  }
});

window.switchView = function(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab[data-view]').forEach(t => t.classList.remove('active'));
  document.getElementById(`view-${viewName}`).classList.add('active');
  document.querySelector(`.nav-tab[data-view="${viewName}"]`).classList.add('active');
}

// ================= 2. CHAT LOGIC =================
window.sendMessage = async function() {
  const input = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content) return;
  
  input.value = ''; 
  
  const { error } = await supabase.from('messages').insert({ 
    content: content, 
    sender_name: currentUser 
  });
  
  if (error) {
    console.error(error);
    alert("Failed to send. Check console for details.");
  }
}

function renderMessage(msg) {
  const box = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `message ${msg.sender_name === currentUser ? 'mine' : ''}`;
  div.innerHTML = `
    <div class="meta">${msg.sender_name} · ${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    <div>${msg.content}</div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function initChat() {
  const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
  if (data) data.forEach(renderMessage);

  supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => renderMessage(payload.new)).subscribe();
}

document.getElementById('chat-input').addEventListener('keypress', (e) => { 
  if (e.key === 'Enter') sendMessage(); 
});

// ================= 3. FEED LOGIC =================
window.createPost = async function() {
  const content = document.getElementById('post-content').value.trim();
  const file = document.getElementById('post-media').files[0];
  if (!content && !file) return; 

  let mediaUrl = null;
  let mediaType = 'none';

  if (file) {
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('post-media').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
      mediaUrl = data.publicUrl;
      mediaType = file.type.startsWith('image') ? 'image' : 'video';
    } else {
      alert("Media upload failed. Did you create the 'post-media' public bucket?");
      return;
    }
  }

  await supabase.from('posts').insert({ 
    content, media_url: mediaUrl, media_type: mediaType, author_name: currentUser 
  });
  
  document.getElementById('post-content').value = '';
  document.getElementById('post-media').value = '';
}

function renderPost(post) {
  const feed = document.getElementById('posts-feed');
  const div = document.createElement('div');
  div.className = 'post';
  let mediaHtml = '';
  if (post.media_url && post.media_type === 'image') mediaHtml = `<img src="${post.media_url}">`;
  if (post.media_url && post.media_type === 'video') mediaHtml = `<video src="${post.media_url}" controls></video>`;
  
  div.innerHTML = `
    <div class="post-author">${post.author_name}</div>
    <div class="post-content">${post.content || ''}</div>
    ${mediaHtml}
    <div class="post-time">${new Date(post.created_at).toLocaleString()}</div>
  `;
  feed.prepend(div);
}

async function initFeed() {
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
  if (data) data.forEach(renderPost);

  supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
    (payload) => renderPost(payload.new)).subscribe();
}