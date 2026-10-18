import { supabase, currentUser, currentAvatar } from './app.js';

window.createPost = async function() {
  const content = document.getElementById('post-content').value.trim();
  const file = document.getElementById('post-media').files[0];
  if (!content && !file) return; 

  let mediaUrl = null;
  let mediaType = 'none';

  if (file) {
    if (file.size > 10 * 1024 * 1024) return alert("Error: File is too large! Max size is 10MB.");
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('post-media').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('post-media').getPublicUrl(fileName);
      mediaUrl = data.publicUrl;
      mediaType = file.type.startsWith('image') ? 'image' : 'video';
    }
  }

  // Save the post with the current avatar
  await supabase.from('posts').insert({ 
    content, 
    media_url: mediaUrl, 
    media_type: mediaType, 
    author_name: currentUser,
    avatar_url: currentAvatar 
  });
  
  document.getElementById('post-content').value = '';
  document.getElementById('post-media').value = '';
  document.getElementById('file-chosen').innerText = '';
  closeXPostModal();
}

export function renderPost(post) {
  const feed = document.getElementById('posts-feed');
  const div = document.createElement('div');
  div.className = 'post';
  
  let mediaHtml = '';
  if (post.media_url && post.media_type === 'image') mediaHtml = `<img src="${post.media_url}">`;
  if (post.media_url && post.media_type === 'video') mediaHtml = `<video src="${post.media_url}" controls></video>`;
  
  const time = new Date(post.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric' });
  const pfp = post.avatar_url || `https://ui-avatars.com/api/?name=${post.author_name}&background=random`;
  
  div.innerHTML = `
    <div class="post-avatar" style="background-image:url('${pfp}'); background-size:cover; background-position:center;"></div>
    <div class="post-body">
      <div class="post-header">
        <span class="post-author">${post.author_name}</span>
        <span>@${post.author_name.replace(/\s+/g, '').toLowerCase()} · ${time}</span>
      </div>
      <div class="post-content">${post.content || ''}</div>
      ${mediaHtml}
      <div class="post-actions-row">
        <span>💬 0</span> <span>🔁 0</span> <span>❤️ 0</span> <span>📊 0</span> <span>📤</span>
      </div>
    </div>
  `;
  feed.prepend(div);
}

// --- WORKING X SEARCH ---
window.searchUsers = async function() {
  const query = document.getElementById('x-search-input').value.trim();
  const resultsDiv = document.getElementById('x-search-results');
  
  if(!query) {
    resultsDiv.innerHTML = '<p style="color:#71767b; text-align:center; padding:20px;">Type a name to search for users.</p>';
    return;
  }

  // Search by BOTH display_name and username
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, username, email, avatar_url')
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);

  if (error) {
    console.error(error);
    resultsDiv.innerHTML = `<p style="color:#f4212e; text-align:center; padding:20px;">Error: ${error.message}</p>`;
    return;
  }

  resultsDiv.innerHTML = '';
  if (data.length === 0) {
    resultsDiv.innerHTML = '<p style="color:#71767b; text-align:center; padding:20px;">No users found.</p>';
    return;
  }

  data.forEach(user => {
    const div = document.createElement('div');
    div.className = 'post';
    const pfp = user.avatar_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=random`;
    
    // Clicking a user starts a private chat with them!
    div.onclick = () => import('./SideChat.js').then(m => m.openPrivateChat(user.display_name));
    div.style.cursor = 'pointer';

    div.innerHTML = `
      <div class="post-avatar" style="background-image:url('${pfp}'); background-size:cover; background-position:center;"></div>
      <div class="post-body">
        <div class="post-author">${user.display_name}</div>
        <div style="color:#71767b; font-size:14px;">@${user.username || user.display_name}</div>
      </div>
    `;
    resultsDiv.appendChild(div);
  });
}

export async function initFeed() {
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
  if (data) data.forEach(renderPost);

  supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
    (payload) => renderPost(payload.new)).subscribe();
}