document.addEventListener('DOMContentLoaded', () => {
  fetchUsers();

  const addUserForm = document.getElementById('add-user-form');
  const messageBox = document.getElementById('admin-message');

  // Add new user form submission
  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value;

    if (!username || !password || !role) {
      showMessage('⚠️ All fields are required.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        const errText = await response.text();
        showMessage(`❌ ${errText}`, 'error');
        return;
      }

      showMessage('✅ User added successfully!', 'success');
      addUserForm.reset();
      fetchUsers();
    } catch (err) {
      showMessage('❌ Error adding user.', 'error');
    }
  });
});

// Fetch users from server and populate the table
async function fetchUsers() {
  const userList = document.getElementById('user-list');
  userList.innerHTML = `<tr><td colspan="3">Loading users...</td></tr>`;

  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');

    const users = await res.json();

    if (!users.length) {
      userList.innerHTML = `<tr><td colspan="3">No users found.</td></tr>`;
      return;
    }

    userList.innerHTML = '';

    users.forEach(user => {
      const tr = document.createElement('tr');

      const tdUsername = document.createElement('td');
      tdUsername.textContent = user.username;

      const tdRole = document.createElement('td');
      tdRole.textContent = user.role;

      const tdAction = document.createElement('td');
      const deleteBtn = document.createElement('button');

      deleteBtn.textContent = '🗑️ Delete';
      deleteBtn.style.backgroundColor = '#dc3545';
      deleteBtn.style.color = 'white';
      deleteBtn.style.border = 'none';
      deleteBtn.style.padding = '5px 10px';
      deleteBtn.style.borderRadius = '5px';
      deleteBtn.style.cursor = 'pointer';

      deleteBtn.onclick = () => deleteUser(user.id);

      tdAction.appendChild(deleteBtn);

      tr.appendChild(tdUsername);
      tr.appendChild(tdRole);
      tr.appendChild(tdAction);

      userList.appendChild(tr);
    });
  } catch (err) {
    userList.innerHTML = `<tr><td colspan="3">Error loading users.</td></tr>`;
  }
}

// Delete user by ID
async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const response = await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      showMessage(`❌ ${errText}`, 'error');
      return;
    }

    showMessage('✅ User deleted.', 'success');
    fetchUsers();
  } catch (err) {
    showMessage('❌ Failed to delete user.', 'error');
  }
}

// Logout function
function logout() {
  fetch('/logout')
    .then(() => (window.location.href = '/login.html'))
    .catch(() => showMessage('❌ Logout failed.', 'error'));
}

// Show feedback messages
function showMessage(msg, type) {
  const box = document.getElementById('admin-message');
  box.textContent = msg;
  box.style.padding = '10px';
  box.style.marginTop = '15px';
  box.style.textAlign = 'center';
  box.style.borderRadius = '5px';
  box.style.fontWeight = 'bold';

  if (type === 'success') {
    box.style.color = '#155724';
    box.style.backgroundColor = '#d4edda';
    box.style.border = '1px solid #c3e6cb';
  } else {
    box.style.color = '#721c24';
    box.style.backgroundColor = '#f8d7da';
    box.style.border = '1px solid #f5c6cb';
  }

  setTimeout(() => {
    box.textContent = '';
    box.style = '';
  }, 5000);
}
