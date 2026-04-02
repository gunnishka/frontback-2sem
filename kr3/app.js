// Элементы DOM
const form = document.getElementById("note-form");
const input = document.getElementById("note-input");
const list = document.getElementById("notes-list");

// Загрузка и отображение заметок
function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");

  list.innerHTML = notes
    .map(
      (note, index) => `
        <li style="display: flex; justify-content: space-between; align-items: center; 
                   padding: 10px 14px; margin-bottom: 8px; background: #f8f9fa; 
                   border-radius: 8px; border-left: 4px solid #4285f4;">
            <span style="flex: 1; font-size: 1.1em;">${note}</span>
            <button 
                class="delete-btn"
                data-index="${index}"
                style="background: #e74c3c; color: white; border: none; 
                       width: 32px; height: 32px; border-radius: 50%; 
                       cursor: pointer; font-size: 20px; line-height: 1; 
                       box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                ×
            </button>
        </li>
    `,
    )
    .join("");
}

// Добавление новой заметки
function addNote(text) {
  if (!text) return;
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.push(text);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

// Удаление заметки
function deleteNote(index) {
  const notes = JSON.parse(localStorage.getItem("notes") || "[]");
  notes.splice(index, 1);
  localStorage.setItem("notes", JSON.stringify(notes));
  loadNotes();
}

// Обработка формы
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  addNote(text);
  input.value = "";
});

// Удаление (делегирование событий)
list.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const index = parseInt(e.target.getAttribute("data-index"));
    if (confirm("Удалить эту заметку?")) {
      deleteNote(index);
    }
  }
});

// Первоначальная загрузка
loadNotes();

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ ServiceWorker зарегистрирован:", registration.scope);
    } catch (err) {
      console.error("❌ Ошибка регистрации ServiceWorker:", err);
    }
  });
}
