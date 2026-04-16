const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const reminders = new Map();

const vapidKeys = {
  publicKey:
    "BFUnc-SbivI0zUllPmYBL564xvLEQF4_7rm6_JGu8AcHSkl6abf_sFkMnh118d2XTHkzM1WLU4wbwChBlyB5aZI",
  privateKey: "qj3fsWKNHe2Yuw5ogEc8Mv2NfckY0RFFGZtf4CUcab8",
};

webpush.setVapidDetails(
  "mailto:emilganiev06@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "..")));

let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("Клиент подключён:", socket.id);
  // Обработка события 'newTask' от клиента
  socket.on("newTask", (task) => {
    console.log("Новая задача получена:", task);
    // Рассылаем событие всем подключённым клиентам, включая отправителя
    io.emit("taskAdded", task);
  });
  socket.on("disconnect", () => {
    console.log("Клиент отключён:", socket.id);
  });
  socket.on("newReminder", (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();
    if (delay <= 0) {
      console.log("Ошибка: время напоминания в прошлом");
      return;
    }
    console.log(
      `Напоминание ${id} установлено на ${new Date(reminderTime).toLocaleString()}`,
    );
    // Сохраняем таймер
    const timeoutId = setTimeout(() => {
      console.log(`Отправляю напоминание через WebSocket: ${text}`);
      // Отправляем напоминание всем подключённым клиентам через WebSocket
      io.emit("reminderTriggered", { id, text, reminderTime });
      // Удаляем напоминание из хранилища после отправки
      reminders.delete(id);
    }, delay);
    reminders.set(id, { timeoutId, text, reminderTime });
    console.log(`Всего активных напоминаний: ${reminders.size}`);
  });
});

app.post("/subscribe", (req, res) => {
  console.log("Новая подписка получена:", req.body.endpoint);
  subscriptions.push(req.body);
  console.log(`Всего подписок: ${subscriptions.length}`);
  res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  console.log("Отписка:", endpoint);
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  console.log(`Всего подписок: ${subscriptions.length}`);
  res.status(200).json({ message: "Подписка удалена" });
});

app.post("/snooze", (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);
  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: "Reminder not found" });
  }
  const reminder = reminders.get(reminderId);
  // Отменяем предыдущий таймер
  clearTimeout(reminder.timeoutId);
  // Устанавливаем новый через 5 минут (300 000 мс)
  const newDelay = 5 * 60 * 1000;
  const newReminderTime = Date.now() + newDelay;
  const newTimeoutId = setTimeout(() => {
    console.log(
      `Отправляю отложенное напоминание через WebSocket: ${reminder.text}`,
    );
    io.emit("reminderTriggered", {
      id: reminderId,
      text: reminder.text,
      reminderTime: newReminderTime,
    });
    reminders.delete(reminderId);
  }, newDelay);
  // Обновляем хранилище
  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: newReminderTime,
  });
  console.log(
    `Напоминание ${reminderId} отложено до ${new Date(newReminderTime).toLocaleString()}`,
  );
  res.status(200).json({ message: "Reminder snoozed for 5 minutes" });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
