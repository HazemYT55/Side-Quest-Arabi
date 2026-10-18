import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export let currentUser = '';
export let currentEmail = '';
export let currentUserId = '';

// Clock
function updateClock() {
  try {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date-display');
    if (clockEl) clockEl.innerText = `${h<10?'0'+h:h}:${m<10?'0'+m:m}`;
    if (dateEl) dateEl.innerText = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch (e) {}
}
setInterval(updateClock, 1000); updateClock();

// Navigation
window.openApp = function(appName) {
  document.getElementById('home-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${appName}`).classList.add('active');
  
  if(appName === 'todo') import('./Todo.js').then(m => m.loadTodos());
}
window.goHome = function() {
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('home-screen').classList.add('active');
}

// WA Menu
window.toggleWaMenu = function() {
  document.getElementById('wa-menu').classList.toggle('hidden');
}

// X Tabs
window.switchXTab = function(tab) {
  document.querySelectorAll('.x-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.x-bottom-nav div').forEach(t => t.classList.remove('active'));
  
  if(tab === 'home') {
    document.getElementById('x-home-feed').classList.remove('hidden');
    document.getElementById('x-search-feed').classList.add('hidden');
    document.querySelectorAll('.x-tab')[0].classList.add('active');
    document.querySelectorAll('.x-bottom-nav div')[0].classList.add('active');
  } else {
    document.getElementById('x-home-feed').classList.add('hidden');
    document.getElementById('x-search-feed').classList.remove('hidden');
    document.querySelectorAll('.x-tab')[1].classList.add('active');
    document.querySelectorAll('.x-bottom-nav div')[1].classList.add('active');
  }
}

// Auth
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
  if (code !== "SQ-TEAM-2026") return alert("Invalid Invite Code!");

  const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: username } } });
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
    currentUserId = data.user.id;
    
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    document.getElementById('settings-username').innerText = currentUser;
    
    // Load Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
    if (profile) {
      if(profile.bio) document.getElementById('settings-bio').innerText = profile.bio;
      if(profile.avatar_url) document.getElementById('profile-avatar').style.backgroundImage = `url('${profile.avatar_url}')`;
    }

    import('./SideChat.js').then(m => m.initChat());
    import('./SidePosts.js').then(m => m.initFeed());
    import('./Contact.js').then(m => m.loadContacts());
  }
}

window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

window.backToChatList = function() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-chat').classList.add('active');
}
window.openTeamChat = function() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-team-chat').classList.add('active');
}

// X Post Modal
window.openXPostModal = () => document.getElementById('x-post-modal').classList.add('active');
window.closeXPostModal = () => document.getElementById('x-post-modal').classList.remove('active');

// Profile Editing
window.openEditProfile = function() {
  document.getElementById('edit-profile-modal').classList.add('active');
  document.getElementById('edit-bio').value = document.getElementById('settings-bio').innerText;
}
window.closeEditProfile = function() {
  document.getElementById('edit-profile-modal').classList.remove('active');
}
window.saveProfile = async function() {
  const bio = document.getElementById('edit-bio').value.trim();
  const avatarFile = document.getElementById('edit-avatar').files[0];
  let avatarUrl = null;

  if (avatarFile) {
    const fileName = `avatar-${currentUserId}.${avatarFile.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('post-media').upload(fileName, avatarFile, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
      avatarUrl = data.publicUrl;
      document.getElementById('profile-avatar').style.backgroundImage = `url('${avatarUrl}')`;
    }
  }

  const updates = { bio };
  if (avatarUrl) updates.avatar_url = avatarUrl;

  await supabase.from('profiles').update(updates).eq('id', currentUserId);
  
  document.getElementById('settings-bio').innerText = bio;
  closeEditProfile();
}

// Realtime Listener for Private Messages (to update the WhatsApp List)
supabase.channel('whatsapp_list').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
  (payload) => {
    const msg = payload.new;
    if (msg.receiver_name === currentUser && msg.sender_name !== currentUser) {
      import('./SideChat.js').then(m => m.addToChatList(msg.sender_name));
    }
  }).subscribe();