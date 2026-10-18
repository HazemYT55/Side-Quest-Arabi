import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://jkjcrymbeezztllymflb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Tjmc0Y5d4m-ax275t5HjkA_1W0aOiLt'; 
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export let currentUser = '';
export let currentEmail = '';

// Clock
function updateClock() {
  try {
    const now = new Date();
    let h = now.getHours(), m = now.getMinutes();
    const clockElement = document.querySelector('.time');
    if (clockElement) clockElement.innerText = `${h<10?'0'+h:h}:${m<10?'0'+m:m}`;
  } catch (e) {}
}
setInterval(updateClock, 1000); updateClock();

// Navigation
window.openApp = function(appName) {
  document.getElementById('home-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${appName}`).classList.add('active');
  
  const titles = { chat: 'Side Chat', posts: 'Side Posts', contacts: 'Contacts', settings: 'Settings' };
  document.getElementById('app-title').innerText = titles[appName] || 'App';
}

window.goHome = function() {
  document.getElementById('app-screen').classList.remove('active');
  document.getElementById('home-screen').classList.add('active');
}

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
    
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    document.getElementById('settings-username').innerText = currentUser;
    document.getElementById('settings-email').innerText = currentEmail;
    
    const savedWall = localStorage.getItem('sq_wallpaper') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
    document.getElementById('phone-wallpaper').style.backgroundImage = `url('${savedWall}')`;
    document.getElementById('wallpaper-input').value = savedWall;

    // Load Module scripts
    import('./SideChat.js').then(m => m.initChat());
    import('./SidePosts.js').then(m => m.initFeed());
    import('./Contact.js').then(m => m.loadContacts());
  }
}

window.logout = async function() {
  await supabase.auth.signOut();
  location.reload();
}

window.saveWallpaper = function() {
  const url = document.getElementById('wallpaper-input').value.trim();
  if (!url) return;
  localStorage.setItem('sq_wallpaper', url);
  document.getElementById('phone-wallpaper').style.backgroundImage = `url('${url}')`;
  alert("Wallpaper saved!");
}

// Auto Login
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    currentUser = session.user.user_metadata.display_name || session.user.email.split('@')[0];
    currentEmail = session.user.email;
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('home-screen').classList.add('active');
    document.getElementById('settings-username').innerText = currentUser;
    document.getElementById('settings-email').innerText = currentEmail;
    
    const savedWall = localStorage.getItem('sq_wallpaper') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
    document.getElementById('phone-wallpaper').style.backgroundImage = `url('${savedWall}')`;
    document.getElementById('wallpaper-input').value = savedWall;

    import('./SideChat.js').then(m => m.initChat());
    import('./SidePosts.js').then(m => m.initFeed());
    import('./Contact.js').then(m => m.loadContacts());
  }
});