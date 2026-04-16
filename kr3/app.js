const contentDiv = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");

const socket = io("http://localhost:3001");

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("Service Worker или PushManager недоступны");
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("Service Worker готов:", registration);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        "BFUnc-SbivI0zUllPmYBL564xvLEQF4_7rm6_JGu8AcHSkl6abf_sFkMnh118d2XTHkzM1WLU4wbwChBlyB5aZI",
      ),
    });
    console.log("Подписка создана:", subscription);
    const response = await fetch("http://localhost:3001/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Подписка на push отправлена на сервер");
  } catch (err) {
    console.error("Ошибка подписки на push:", err);
    alert("Ошибка при подписке на уведомления: " + err.message);
  }
}

async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch("http://localhost:3001/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
    console.log("Отписка выполнена");
  }
}

function showSystemNotification(title, options) {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.showNotification(title, options);
  });
}

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;
    // Если загружена главная страница, инициализируем функционал заметок
    if (page === "home") {
      initNotes();
    }
  } catch (err) {
    contentDiv.innerHTML = `<p class="is-center text-error">Ошибка загрузки страницы.</p>`;
    console.error(err);
  }
}
homeBtn.addEventListener("click", () => {
  setActiveButton("home-btn");
  loadContent("home");
});
aboutBtn.addEventListener("click", () => {
  setActiveButton("about-btn");
  loadContent("about");
});

// Загружаем главную страницу при старте
loadContent("home");

// Функционал заметок (localStorage)
function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const reminderForm = document.getElementById("reminder-form");
  const reminderText = document.getElementById("reminder-text");
  const reminderTime = document.getElementById("reminder-time");
  const list = document.getElementById("notes-list");

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    list.innerHTML = notes
      .map((note) => {
        let reminderInfo = "";
        if (note.reminder) {
          const date = new Date(note.reminder);
          reminderInfo = `<br><small>!!! Напоминание: 
${date.toLocaleString()}</small>`;
        }
        return `<li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            ${note.text}${reminderInfo}
          </div>
          <button class="delete-btn button error" data-id="${note.id}" style="padding: 0.25rem 0.75rem; font-size: 0.9rem;">Удалить</button>
        </li>`;
      })
      .join("");
    // Добавляем обработчики для кнопок удаления
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.dataset.id);
        deleteNote(id);
      });
    });
  }

  function deleteNote(id) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const updatedNotes = notes.filter((note) => note.id !== id);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
    loadNotes();
  }
  function addNote(text, reminderTimestamp = null) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const newNote = { id: Date.now(), text, reminder: reminderTimestamp };
    notes.push(newNote);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();
    // Отправляем событие на сервер (только если есть напоминание)
    if (reminderTimestamp) {
      socket.emit("newReminder", {
        id: newNote.id,
        text: text,
        reminderTime: reminderTimestamp,
      });
    } else {
      // Можно оставить старый эмит для уведомлений о новых заметках
      socket.emit("newTask", { text, timestamp: Date.now() });
    }
  }
  // Обработка обычной заметки
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      addNote(text);
      input.value = "";
    }
  });
  // Обработка заметки с напоминанием
  reminderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = reminderText.value.trim();
    const datetime = reminderTime.value;
    if (text && datetime) {
      const timestamp = new Date(datetime).getTime();
      if (timestamp > Date.now()) {
        addNote(text, timestamp);
        reminderText.value = "";
        reminderTime.value = "";
      } else {
        alert("Дата напоминания должна быть в будущем");
      }
    }
  });
  loadNotes();
}

// Регистрация Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered");
      const enableBtn = document.getElementById("enable-push");
      const disableBtn = document.getElementById("disable-push");
      if (enableBtn && disableBtn) {
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          enableBtn.style.display = "none";
          disableBtn.style.display = "inline-block";
        }
        enableBtn.addEventListener("click", async () => {
          if (Notification.permission === "denied") {
            alert(
              "Уведомления запрещены. Разрешите их в  настройках браузера.",
            );
            return;
          }
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
              alert("Необходимо разрешить уведомления.");
              return;
            }
          }
          await subscribeToPush();
          enableBtn.style.display = "none";
          disableBtn.style.display = "inline-block";
        });
        disableBtn.addEventListener("click", async () => {
          await unsubscribeFromPush();
          disableBtn.style.display = "none";
          enableBtn.style.display = "inline-block";
        });
      }
    } catch (err) {
      console.log("SW registration failed:", err);
    }
  });
}

socket.on("taskAdded", (task) => {
  console.log("Задача от другого клиента:", task);

  if (Notification.permission === "granted") {
    showSystemNotification("Новая задача", {
      body: task.text,
      icon: "/icons/favicon-128x128.png",
      badge: "/icons/favicon-64x64.png",
      tag: `task-${task.id || Date.now()}`,
    });
  }
});

// Обработчик для напоминаний
socket.on("reminderTriggered", (reminder) => {
  console.log("Напоминание от сервера:", reminder);

  if (Notification.permission === "granted") {
    showSystemNotification("🔔 НАПОМИНАНИЕ", {
      body: reminder.text,
      icon: "/icons/favicon-128x128.png",
      badge: "/icons/favicon-64x64.png",
      requireInteraction: true,
      tag: `reminder-${reminder.id}`,
      data: {
        reminderId: reminder.id,
      },
      actions: [
        {
          action: "snooze",
          title: "Отложить на 5 минут",
        },
      ],
    });
  }
});
