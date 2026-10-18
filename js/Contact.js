import { supabase } from './app.js';
import { openPrivateChat } from './SideChat.js';

export function loadContacts() {
  const list = document.getElementById('contacts-list');
  
  // We use the demo list here to avoid exposing user emails. 
  // In a real app, you would query Supabase for all users.
  const contacts = [
    { name: "Moaz", phone: "+966 54 060 3175", initial: "M" },
    { name: "Omar", phone: "+966 591429043", initial: "O" },
    { name: "Hazem", phone: "Admin", initial: "H" }
  ];

  list.innerHTML = '';
  contacts.forEach(contact => {
    const div = document.createElement('div');
    div.className = 'contact-item';
    // Clicking opens the private chat!
    div.onclick = () => openPrivateChat(contact.name);
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