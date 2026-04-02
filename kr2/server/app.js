const express = require("express");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const port = 3001;

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
    if (
      req.method === "POST" ||
      req.method === "PATCH" ||
      req.method === "PUT"
    ) {
      console.log("Body", req.body);
    }
  });
  next();
});

// ─── Хранилища ───────────────────────────────────────────────────────────────

let products = [
  {
    id: nanoid(6),
    title: "Футболка",
    category: "Одежда",
    description: "В составе мерсеризированный хлопок",
    price: 2999,
  },
  {
    id: nanoid(6),
    title: "Кроссовки Nike",
    category: "Обувь",
    description: "Классические белые кроссовки",
    price: 8990,
  },
  {
    id: nanoid(6),
    title: "Джинсы",
    category: "Одежда",
    description: "Slim fit, хлопок 98%",
    price: 4599,
  },
];

// roles: "user" | "seller" | "admin"
const users = [];
const refreshTokens = new Set();

// ─── Утилиты ─────────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN },
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── Middleware ───────────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

// POST /api/auth/register — Гость
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password, role } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res
      .status(400)
      .json({ error: "email, first_name, last_name, password are required" });
  }
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const allowedRoles = ["user", "seller", "admin"];
  const assignedRole = allowedRoles.includes(role) ? role : "user";

  const newUser = {
    id: nanoid(6),
    email,
    first_name,
    last_name,
    role: assignedRole,
    blocked: false,
    hashedPassword: await hashPassword(password),
  };
  users.push(newUser);
  const { hashedPassword, ...safe } = newUser;
  res.status(201).json(safe);
});

// POST /api/auth/login — Гость
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.blocked) return res.status(403).json({ error: "User is blocked" });

  const ok = await verifyPassword(password, user.hashedPassword);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const access_token = generateAccessToken(user);
  const refresh_token = generateRefreshToken(user);
  refreshTokens.add(refresh_token);
  res.json({ access_token, refresh_token });
});

// POST /api/auth/refresh — Гость
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: "refreshToken is required" });
  if (!refreshTokens.has(refreshToken))
    return res.status(401).json({ error: "Invalid refresh token" });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// GET /api/auth/me — Пользователь+
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { hashedPassword, ...safe } = user;
  res.json(safe);
});

// ─── Users — Администратор ────────────────────────────────────────────────────

// GET /api/users
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
  res.json(users.map(({ hashedPassword, ...u }) => u));
});

// GET /api/users/:id
app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { hashedPassword, ...safe } = user;
    res.json(safe);
  },
);

// PUT /api/users/:id
app.put(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { first_name, last_name, email, role, password } = req.body;
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (email) user.email = email;
    if (role && ["user", "seller", "admin"].includes(role)) user.role = role;
    if (password) user.hashedPassword = await hashPassword(password);

    const { hashedPassword, ...safe } = user;
    res.json(safe);
  },
);

// DELETE /api/users/:id — блокировка
app.delete(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.blocked = true;
    res.json({ message: "User blocked", id: user.id });
  },
);

// ─── Products ─────────────────────────────────────────────────────────────────

// GET /api/products — Пользователь+
app.get(
  "/api/products",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  (req, res) => {
    res.json(products);
  },
);

// GET /api/products/:id — Пользователь+
app.get(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["user", "seller", "admin"]),
  (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  },
);

// POST /api/products — Продавец+
app.post(
  "/api/products",
  authMiddleware,
  roleMiddleware(["seller", "admin"]),
  (req, res) => {
    const { title, category, description, price } = req.body;
    if (!title || !category || !description || !price) {
      return res
        .status(400)
        .json({ error: "title, category, description, price are required" });
    }
    const newProduct = {
      id: nanoid(6),
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      price: Number(price),
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
  },
);

// PUT /api/products/:id — Продавец+
app.put(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["seller", "admin"]),
  (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const { title, category, description, price } = req.body;
    if (title) product.title = title.trim();
    if (category) product.category = category.trim();
    if (description) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    res.json(product);
  },
);

// DELETE /api/products/:id — Администратор
app.delete(
  "/api/products/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  (req, res) => {
    const exists = products.some((p) => p.id === req.params.id);
    if (!exists) return res.status(404).json({ error: "Product not found" });
    products = products.filter((p) => p.id !== req.params.id);
    res.status(204).send();
  },
);

app.listen(port, () => {
  console.log(`Server launched on http://localhost:${port}`);
});
