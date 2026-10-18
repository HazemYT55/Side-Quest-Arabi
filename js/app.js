import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export let currentUser = '';
export let currentEmail = '';
export let currentUserId = '';
export let currentAvatar = 'https://ui-avatars.com/api/?name=User&background=random';

// 1. CLOCK
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

// 2. NAVIGATION
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
window.switchWaTab = function(tab) {
  document.querySelectorAll('.wa-tab-content').forEach(t => t.classList.add('hidden'));
  document.getElementById(`wa-tab-${tab}`).classList.remove('hidden');
  document.querySelectorAll('.wa-bottom-nav div').forEach(d => d.classList.remove('active'));
  if(tab === 'chats') document.querySelectorAll('.wa-bottom-nav div')[0].classList.add('active');
  if(tab === 'calls') document.querySelectorAll('.wa-bottom-nav div')[1].classList.add('active');
}
window.switchXTab = function(tab) {
  document.querySelectorAll('#view-posts .feed-box').forEach(f => f.classList.add('hidden'));
  document.querySelectorAll('.x-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.x-bottom-nav div').forEach(t => t.classList.remove('active'));
  if(tab === 'home') {
    document.getElementById('x-home-feed').classList.remove('hidden');
    document.querySelectorAll('.x-tab')[0].classList.add('active');
    document.querySelectorAll('.x-bottom-nav div')[0].classList.add('active');
  } else if(tab === 'search') {
    document.getElementById('x-search-feed').classList.remove('hidden');
    document.querySelectorAll('.x-tab')[1].classList.add('active');
    document.querySelectorAll('.x-bottom-nav div')[1].classList.add('active');
  } else if(tab === 'notif') {
    document.getElementById('x-notif-feed').classList.remove('hidden');
    document.querySelectorAll('.x-bottom-nav div')[2].classList.add('active');
  } else if(tab === 'msg') {
    document.getElementById('x-msg-feed').classList.remove('hidden');
    document.querySelectorAll('.x-bottom-nav div')[3].classList.add('active');
  }
}
window.toggleWaMenu = () => document.getElementById('wa-menu').classList.toggle('hidden');
window.openXPostModal = () => document.getElementById('x-post-modal').classList.add('active');
window.closeXPostModal = () => document.getElementById('x-post-modal').classList.remove('active');
window.backToChatList = function() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-chat').classList.add('active');
}
window.openTeamChat = function() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-team-chat').classList.add('active');
}

// 3. AUTH
window.switchAuth = function(mode) {
  const isLogin = mode === 'login';
  document.getElementById('auth-username').classList.toggle('hidden', isLogin);
  document.getElementById('auth-btn').innerText = isLogin ? 'Login' : 'Sign Up';
  document.getElementById('auth-btn').setAttribute('onclick', isLogin ? 'logIn()' : 'signUp()');
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-signup').classList.toggle('active', !isLogin);
  document.getElementById('auth-error').innerText = '';
}
window.signUp = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value.trim();
  const errorEl = document.getElementById('auth-error');
  errorEl.innerText = '';

  if (!email || !password || !username) return errorEl.innerText = "Please fill all fields.";
  if (password.length < 6) return errorEl.innerText = "Password must be at least 6 characters.";

  const btn = document.getElementById('auth-btn');
  btn.innerText = "Creating...";

  const { data, error } = await supabase.auth.signUp({
    email: email, password: password, options: { data: { display_name: username, username: username } }
  });

  if (error) {
    errorEl.innerText = error.message;
    btn.innerText = "Sign Up";
  } else {
    loginSuccess(data);
  }
}
window.logIn = async function() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  errorEl.innerText = '';

  if (!email || !password) return errorEl.innerText = "Please enter email and password.";

  const btn = document.getElementById('auth-btn');
  btn.innerText = "Logging in...";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.innerText = error.message;
    btn.innerText = "Login";
  } else {
    loginSuccess(data);
  }
}

// 4. LOGIN SUCCESS
async function loginSuccess(data) {
  try {
    currentUser = data.user.user_metadata?.display_name || data.user.email.split('@')[0];
    currentEmail = data.user.email.split('@')[0];
    currentUserId = data.user.id;
    
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
    
    if (profile) {
      if(profile.bio) document.getElementById('settings-bio').innerText = profile.bio;
      if(profile.avatar_url) {
        currentAvatar = profile.avatar_url; 
        document.getElementById('profile-avatar').style.backgroundImage = `url('${currentAvatar}')`;
        document.getElementById('profile-avatar').innerText = ''; 
      }
    }

    document.getElementById('settings-username').innerText = currentUser;
    const savedWall = localStorage.getItem('sq_wallpaper') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
    document.getElementById('phone-wallpaper').style.backgroundImage = `url('${savedWall}')`;

    import('./SideChat.js').then(m => m.initChat());
    import('./SidePosts.js').then(m => m.initFeed());
    import('./Contact.js').then(m => m.loadContacts());

  } catch (error) {
    console.error(error);
    alert("Error loading app: " + error.message);
    document.getElementById('auth-btn').innerText = "Login";
  }
}
window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

// 5. PROFILE & SETTINGS
window.openEditProfile = function() {
  document.getElementById('edit-profile-modal').classList.add('active');
  document.getElementById('edit-bio').value = document.getElementById('settings-bio').innerText;
}
window.closeEditProfile = function() {
  document.getElementById('edit-profile-modal').classList.remove('active');
}

function compressImage(file, maxWidth = 200, maxHeight = 200) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', 0.8);
      };
    };
  });
}

window.saveProfile = async function() {
  const bio = document.getElementById('edit-bio').value.trim();
  const avatarFile = document.getElementById('edit-avatar').files[0];
  let newAvatarUrl = null;

  if (avatarFile) {
    const compressedBlob = await compressImage(avatarFile, 200, 200);
    const fileName = `avatar-${currentUserId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('post-media').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
    
    if (!error) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
      newAvatarUrl = data.publicUrl;
      currentAvatar = newAvatarUrl; 
      document.getElementById('profile-avatar').style.backgroundImage = `url('${currentAvatar}')`;
      document.getElementById('profile-avatar').innerText = ''; 
    } else {
      alert("Error uploading image: " + error.message);
      return;
    }
  }

  const updates = { bio };
  if (newAvatarUrl) updates.avatar_url = newAvatarUrl;

  await supabase.from('profiles').update(updates).eq('id', currentUserId);
  document.getElementById('settings-bio').innerText = bio;
  closeEditProfile();
}

// 6. THEMES & WALLPAPER
window.uploadWallpaper = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;
    localStorage.setItem('sq_wallpaper', base64Image);
    document.getElementById('phone-wallpaper').style.backgroundImage = `url('${base64Image}')`;
  };
  reader.readAsDataURL(file);
}
window.openThemeModal = () => document.getElementById('theme-modal').classList.add('active');
window.closeThemeModal = () => document.getElementById('theme-modal').classList.remove('active');
window.setTheme = function(theme) {
  localStorage.setItem('sq_theme', theme);
  applyTheme(theme);
  closeThemeModal();
}
function applyTheme(theme) {
  if (theme === 'light') document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
}
const savedTheme = localStorage.getItem('sq_theme') || 'dark';
applyTheme(savedTheme);

window.showPrivacy = function() {
  alert("Privacy Settings:\n- Last Seen: Everyone\n- Profile Photo: Everyone\n- About: Everyone");
}

window.addEmoji = function() {
  const input = document.activeElement.id === 'private-chat-input' ? document.getElementById('private-chat-input') : document.getElementById('chat-input');
  input.value += '😊';
}
window.uploadChatMedia = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if(file) alert(`You selected ${file.name}. (Media sharing coming soon!)`);
  };
  input.click();
}
window.recordVoice = function() {
  alert("Voice recording coming soon!");
}

// 8. AUTO-LOGIN ON REFRESH
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    loginSuccess(session);
  }
});