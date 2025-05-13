let db;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotesDB', 1);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };

    request.onerror = (e) => reject(e);
  });
};

let currentEditingId = null;

const editNote = (id) => {
  const transaction = db.transaction(['notes'], 'readonly');
  const store = transaction.objectStore('notes');
  const request = store.get(id);

  request.onsuccess = () => {
    const note = request.result;
    document.getElementById('noteContent').value = note.content;
    currentEditingId = note.id;
    document.querySelector('button[onclick="saveNote()"]').textContent = 'Сохранить изменения';
    document.getElementById('noteContent').focus();
  };
};

const cancelEdit = () => {
  currentEditingId = null;
  document.getElementById('noteContent').value = '';
  document.querySelector('button[onclick="saveNote()"]').textContent = 'Добавить';
};

const saveNote = async () => {
  const content = document.getElementById('noteContent').value.trim();
  if (!content) {
    alert('Заметка не может быть пустой');
    return;
  }

  const note = {
    id: currentEditingId || Date.now(),
    content,
    created: new Date().toISOString()
  };

  const transaction = db.transaction(['notes'], 'readwrite');
  const store = transaction.objectStore('notes');
  store.put(note);

  cancelEdit();
  loadNotes();
};

const deleteNote = (id) => {
  const transaction = db.transaction(['notes'], 'readwrite');
  const store = transaction.objectStore('notes');
  store.delete(id);
  loadNotes();
};

const loadNotes = () => {
  const transaction = db.transaction(['notes'], 'readonly');
  const store = transaction.objectStore('notes');
  const request = store.getAll();

  request.onsuccess = () => {
    const notes = request.result.reverse();
    const notesList = document.getElementById('notesList');
    notesList.innerHTML = notes.map(note => `
      <div class="note-item">
        <div class="note-content">${note.content}</div>
        <div class="note-actions">
          <button class="edit-btn" onclick="editNote(${note.id})">✏️</button>
          <button class="delete-btn" onclick="deleteNote(${note.id})">🗑️</button>
        </div>
      </div>
    `).join('');
  };
};

document.getElementById('noteContent').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cancelEdit();
});

// Инициализация приложения
window.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  loadNotes();

  // Проверка онлайн-статуса
  const updateOnlineStatus = () => {
    document.getElementById('offlineStatus').style.display = 
      navigator.onLine ? 'none' : 'block';
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
});