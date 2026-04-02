const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

let users = [
  { id: 1, name: "Иван", email: "ivan@example.com", phone: "+7-900-1234567" },
  { id: 2, name: "Мария", email: "maria@example.com", phone: "+7-900-2345678" },
  { id: 3, name: "Петр", email: "petr@example.com", phone: "+7-900-3456789" },
];

app.use(express.json());
app.use(cors({
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// USERS API

// GET all users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// GET user by ID
app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id == req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// CREATE user
app.post("/api/users", (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const newUser = {
    id: Math.max(...users.map(u => u.id), 0) + 1,
    name,
    email,
    phone: phone || "",
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// UPDATE user
app.patch("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id == req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { name, email, phone } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;

  res.json(user);
});

// DELETE user
app.delete("/api/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id == req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const deletedUser = users.splice(index, 1);
  res.json(deletedUser[0]);
});

app.listen(port, () => {
  console.log(`Server launched on http://localhost:${port}`);
});
