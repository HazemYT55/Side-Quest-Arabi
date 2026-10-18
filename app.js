import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = '';
let currentEmail = '';

// ================= 1. PHONE UI =================
function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const clockElement = document.querySelector('.time');
  if (clockElement) {
    clockElement.innerText = `${h<10?'0'+h:h}:${m<10?'0'+m:m}`;
  }
}
setInterval(updateClock, 1000); updateClock();

window.openApp = function(appName) {
  document.getElementById('home-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${appName}`).classList.add('active');
  
  if (appName === 'chat') document.getElementById('app-title').innerText = 'Side Chat';
  else if (appName === 'posts') document.getElementById('app-title').innerText = 'Side Posts';
  else if (appName === 'contacts') document.getElementById('app-title').innerText = 'Contacts';
  else document.getElementById('app-title').innerText = 'Settings';
}

window.goHome = function() {
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('home-screen').classList.add('active');
}

// ================= 2. AUTH & INVITE CODES =================
window.switchAuth = function(mode) {
  const isLogin = mode === 'login';
  document.getElementById('auth-username').classList.toggle('hidden', isLogin);
  document.getElementById('auth-code').classList.toggle('hidden', isLogin);
  document.getElementById('auth-btn').innerText = isLogin ? 'Login' : 'Sign Up';
  document.getElementById('auth-btn').setAttribute('onclick', isLogin ? 'logIn()' : 'signUp()');
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
}

window.signUp = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value;
  const code = document.getElementById('auth-code').value;

  if (!email || !password || !username || !code) return alert("Please fill all fields!");

  if (code !== "SQ-TEAM-2026") {
    return alert("Invalid Invite Code! Check your email.");
  }

  const { error } = await supabase.auth.signUp({
    email, password, options: { data: { display_name: username } }
  });

  if (error) alert("Sign up error: " + error.message);
  else { alert("Account created! You can now log in."); switchAuth('login'); }
}

window.logIn = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login error: " + error.message);
  } else {
    currentUser = data.user.user_metadata.display_name || email.split('@')[0];
    currentEmail = data.user.email;
    showApp();
  }
}

function showApp() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('home-screen').classList.add('active');
  
  document.getElementById('settings-username').innerText = currentUser;
  document.getElementById('settings-email').innerText = currentEmail;
  
  const savedWall = localStorage.getItem('sq_wallpaper') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
  document.getElementById('phone-wallpaper').style.backgroundImage = `url('${savedWall}')`;
  document.getElementById('wallpaper-input').value = savedWall;

  initChat();
  initFeed();
  loadContacts();
}

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user.user_metadata.display_name || session.user.email.split('@')[0];
    currentEmail = session.user.email;
    showApp();
  }
});

window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

// ================= 3. CONTACTS LOGIC =================
function loadContacts() {
  const list = document.getElementById('contacts-list');
  
  // Note: Right now this is a demo list. To make it real, we would fetch all users from Supabase.
  const demoContacts = [
    { name: "Moaz", phone: "+966 54 060 3175", initial: "M" },
    { name: "Omar (3omar 7assan)", phone: "+966 591429043", initial: "O" },
    { name: "Hazem", phone: "Admin", initial: "H" }
  ];

  list.innerHTML = '';
  demoContacts.forEach(contact => {
    const div = document.createElement('div');
    div.className = 'contact-item';
    div.onclick = () => alert(`Opening chat with ${contact.name}... (Private chat coming soon)`);
    div.innerHTML = `
      <div class="contact-avatar">${contact.initial}</div>
      <div class="contact-info">
        <h4>${contact.name}</h4>
        <p>${contact.phone}</p>
      </div>
    `;
    list.appendChild(div);
  });
}

// ================= 4. SETTINGS =================
window.saveWallpaper = function() {
  const url = document.getElementById('wallpaper-input').value.trim();
  if (!url) return;
  localStorage.setItem('sq_wallpaper', url);
  document.getElementById('phone-wallpaper').style.backgroundImage = `url('${url}')`;
  alert("Wallpaper saved!");
}

// ================= 5. SIDE CHAT =================
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

// ================= 6. SIDE POSTS =================
window.createPost = async function() {
  const content = document.getElementById('post-content').value.trim();
  const file = document.getElementById('post-media').files[0];
  const errorDiv = document.getElementById('upload-error');
  errorDiv.innerText = ''; 

  if (!content && !file) return; 

  let mediaUrl = null;
  let mediaType = 'none';

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      errorDiv.innerText = "Error: File is too large! Max size is 10MB.";
      return;
    }

    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('post-media').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
      mediaUrl = data.publicUrl;
      mediaType = file.type.startsWith('image') ? 'image' : 'video';
    } else {
      errorDiv.innerText = "Media upload failed. Check bucket rules.";
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