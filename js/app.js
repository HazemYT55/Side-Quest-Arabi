import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ⚠️ YOUR SUPABASE CREDENTIALS
export const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// GLOBAL VARIABLES
export let currentUser = '';
export let currentEmail = '';
export let currentUserId = '';
export let currentAvatar = 'https://ui-avatars.com/api/?name=User&background=random';

// 1. SPLASH SCREEN
setTimeout(() => {
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';
}, 1500);

// 2. CLOCK
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

// 3. NAVIGATION
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

// 4. TABS & MENUS
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

window.toggleWaMenu = function() {
  document.getElementById('wa-menu').classList.toggle('hidden');
}
window.newGroupPrompt = function() {
  alert("New Group feature coming soon!");
  toggleWaMenu();
}

// 5. AUTHENTICATION (LOGIN/SIGNUP)
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

  if(!email || !password) return alert("Please enter email and password.");

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login error: " + error.message);
  } else {
    currentUser = data.user.user_metadata.display_name || email.split('@')[0];
    currentEmail = data.user.email;
    currentUserId = data.user.id;
    
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    
    // LOAD PROFILE (Bio & Avatar)
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUserId).single();
      if (profile) {
        if(profile.bio) document.getElementById('settings-bio').innerText = profile.bio;
        if(profile.avatar_url) {
          currentAvatar = profile.avatar_url; 
          document.getElementById('profile-avatar').style.backgroundImage = `url('${currentAvatar}')`;
          document.getElementById('profile-avatar').innerText = ''; 
        }
      }
    } catch(e) { console.log("Profile not loaded yet."); }
    
    document.getElementById('settings-username').innerText = currentUser;

    // Load saved wallpaper
    const savedWall = localStorage.getItem('sq_wallpaper') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
    document.getElementById('phone-wallpaper').style.backgroundImage = `url('${savedWall}')`;

    // Initialize other scripts
    import('./SideChat.js').then(m => m.initChat());
    import('./SidePosts.js').then(m => m.initFeed());
    import('./Contact.js').then(m => m.loadContacts());
  }
}

window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

// 6. CHAT NAVIGATION
window.backToChatList = function() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-chat').classList.add('active');
}
window.openTeamChat = function() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-team-chat').classList.add('active');
}

// 7. X POST MODAL
window.openXPostModal = () => document.getElementById('x-post-modal').classList.add('active');
window.closeXPostModal = () => document.getElementById('x-post-modal').classList.remove('active');

// 8. PROFILE EDITING & SETTINGS
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
  let newAvatarUrl = null;

  // Upload PFP
  if (avatarFile) {
    const fileName = `avatar-${currentUserId}-${Date.now()}.${avatarFile.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('post-media').upload(fileName, avatarFile);
    
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

  // Save changes to Database
  const updates = { bio };
  if (newAvatarUrl) updates.avatar_url = newAvatarUrl;

  await supabase.from('profiles').update(updates).eq('id', currentUserId);
  document.getElementById('settings-bio').innerText = bio;
  closeEditProfile();
}

// 9. WALLPAPER UPLOAD
window.uploadWallpaper = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;
    localStorage.setItem('sq_wallpaper', base64Image);
    document.getElementById('phone-wallpaper').style.backgroundImage = `url('${base64Image}')`;
    alert('Wallpaper updated!');
  };
  reader.readAsDataURL(file);
}

window.showPrivacy = function() {
  alert("Privacy Settings:\n- Last Seen: Everyone\n- Profile Photo: Everyone\n- About: Everyone\n\n(These can be customized in the next update!)");
}