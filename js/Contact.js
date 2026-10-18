import { supabase, currentUser } from './app.js';
import { openPrivateChat } from './SideChat.js';

export async function loadContacts() {
  const list = document.getElementById('contacts-list');
  list.innerHTML = '<p style="color:#888; text-align:center;">Search for a friend above to start chatting.</p>';
}

window.addFriend = async function() {
  const email = document.getElementById('friend-search').value.trim().toLowerCase();
  const list = document.getElementById('contacts-list');
  
  if (!email) return alert("Please enter an email.");

  // Search for the user in the database
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, email, avatar_url')
    .eq('email', email)
    .single();

  if (error || !data) {
    alert("User not found! Make sure they have created an account.");
    return;
  }

  if (data.display_name === currentUser) {
    alert("You can't add yourself!");
    return;
  }

  // Show the found user
  list.innerHTML = `
    <div class="contact-item" onclick="openPrivateChat('${data.display_name}')">
      <div class="contact-avatar" style="background-image:url('${data.avatar_url || 'https://ui-avatars.com/api/?name=' + data.display_name}'); background-size:cover;"></div>
      <div class="contact-info">
        <h4>${data.display_name}</h4>
        <p>${data.email}</p>
      </div>
    </div>
  `;
  document.getElementById('friend-search').value = '';
}