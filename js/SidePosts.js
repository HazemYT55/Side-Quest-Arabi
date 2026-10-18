import { supabase, currentUser } from './app.js';

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

  await supabase.from('posts').insert({ content, media_url: mediaUrl, media_type: mediaType, author_name: currentUser });
  
  document.getElementById('post-content').value = '';
  document.getElementById('post-media').value = '';
}

export function renderPost(post) {
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

export async function initFeed() {
  const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(30);
  if (data) data.forEach(renderPost);

  supabase.channel('feed').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, 
    (payload) => renderPost(payload.new)).subscribe();
}