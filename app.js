import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
// ⚠️ MAKE SURE YOUR FULL KEY IS HERE
const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let currentUser = '';

// === 1. SIGN UP & LOGIN ===
window.signUp = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value;

  if (!email || !password || !username) return alert("Please fill all fields!");

  // Create the user in Supabase
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { display_name: username } // Saves their name!
    }
  });

  if (error) {
    alert("Sign up error: " + error.message);
  } else {
    alert("Account created! You can now log in.");
    // Switch to login tab automatically
    document.getElementById('tab-login').click();
  }
}

window.logIn = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login error: " + error.message);
  } else {
    // Get the display name they signed up with
    currentUser = data.user.user_metadata.display_name || email.split('@')[0];
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    initApp();
  }
}

window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

// Check if they are already logged in when they open the page
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user.user_metadata.display_name || session.user.email.split('@')[0];
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'flex';
    initApp();
  }
});


// === 2. TABS ===
document.querySelectorAll('.tab[data-view]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`${tab.dataset.view}-view`).classList.add('active');
  });
});

// === 3. CHAT ===
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
  
  chatInput.value = ''; 
  
  const { error } = await supabase.from('messages').insert({ 
    content: content, 
    sender_name: currentUser 
  });
  
  if (error) {
    console.error(error);
    alert("Failed to send. Check console.");
  }
}

chatInput.addEventListener('keypress', (e) => { 
  if (e.key === 'Enter') sendMessage(); 
});

// === 4. POSTS ===
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
  
  if (!content && !file) return; 

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
  const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(50);
  if (msgs) msgs.forEach(renderMessage);

  const { data: posts } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
  if (posts) posts.forEach(renderPost);

  supabase.channel('chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => renderMessage(payload.new)).subscribe();

  supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
    (payload) => renderPost(payload.new)).subscribe();
}
