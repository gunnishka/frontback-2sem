const express = require("express");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const app = express();
const port = 3000;
const JWT_SECRET = "access_secret";
const ACCESS_EXPIRES_IN = "15m";
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API AUTH",
      version: "1.0.0",
      description: "Простое API для изучения авторизации",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Локальный сервер",
      },
    ],
  },
  apis: ["./app.js"],
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара
 *         title:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *       example:
 *         id: "abc123"
 *         title: "Nike Air Force 1"
 *         category: "Классика"
 *         description: "Классические белые кроссовки с чёрным Swoosh."
 *         price: 8990
 */

let products = [
  {
    id: nanoid(6),
    title: "Футболка",
    category: "Одежда",
    desciption: "В составе мерсеризированный хлопок",
    price: 2999,
  },
  {
    id: nanoid(6),
    title: "Футболка",
    category: "Одежда",
    desciption: "В составе мерсеризированный хлопок",
    price: 2999,
  },
  {
    id: nanoid(6),
    title: "Футболка",
    category: "Одежда",
    desciption: "В составе мерсеризированный хлопок",
    price: 2999,
  },
  {
    id: nanoid(6),
    title: "Футболка",
    category: "Одежда",
    desciption: "В составе мерсеризированный хлопок",
    price: 2999,
  },
];

let users = [];

function findUserOr404(email, res) {
  const user = users.find((u) => u.email === email);
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return null;
  }
  return user;
}

function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: "product not found" });
    return null;
  }
  return product;
}

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function AuthMiddleware(req, res, next) {
  const header = req.headers.authorization || "";

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

app.get("/api/auth/me", AuthMiddleware, (req, res) => {
  const userId = req.user.sub;

  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status.json({
      error: "User not found",
    });
  }

  res.json({
    id: user.id,
    email: user.email,
  });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Создает нового пользователя с хэшированным паролем
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivanov1998@mail.ru
 *               first_name:
 *                 type: string
 *                 example: Ivan
 *               last_name:
 *                 type: string
 *                 example: Ivanov
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Успешная регистрация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 12ab3c
 *                 email:
 *                   type: string
 *                   example: ivanov1998@mail.ru
 *                 first_name:
 *                   type: string
 *                   example: Ivan
 *                 last_name:
 *                   type: string
 *                   example: Ivanov
 *                 hashedPassword:
 *                   type: string
 *                   example: $2b$10$kO6Hq7ZKfV4cPzGm8u7mEuR7r4Xx2p9mP0q3t1yZbCq9Lh5a8b1QW
 *       400:
 *         description: Некорректные данные
 */

app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !first_name || !last_name || !password) {
    return res
      .status(400)
      .json({ error: "email, first_name, last_name, password are required!" });
  }
  const newUser = {
    id: nanoid(6),
    email: email,
    first_name: first_name,
    last_name: last_name,
    hashedPassword: await hashPassword(password),
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Проверяет логин и пароль пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivanov1998@mail.ru
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authentication successful"
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = findUserOr404(email, res);
  if (!user) return;

  const isAuthenthicated = await verifyPassword(password, user.hashedPassword);
  if (!isAuthenthicated) {
    res.status(401).json({ error: "not authenthicated" });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
    },
  );

  res.json({
    accessToken,
  });
});

/**
 * @swagger
 * /api/products:
 *  post:
 *    summary: Создать новый товар
 *    tags: [Products]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Product'
 *    responses:
 *      201:
 *        description: Товар успешно создан
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Product'
 */

// POST /api/products
app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;
  const newProduct = {
    id: nanoid(6),
    title: title.trim(),
    category: category.trim(),
    description: description.trim(),
    price: Number(price),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *  get:
 *    summary: Получить список всех товаров
 *    tags: [Products]
 *    responses:
 *      200:
 *        description: Список товаров успешно получен
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Product'
 */

// GET /api/products
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *  get:
 *    summary: Получить товар по ID
 *    tags: [Products]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Уникальный идентификатор товара
 *    responses:
 *      200:
 *        description: Товар успешно получен
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Product'
 *      404:
 *        description: Товар не найден
 */

// GET /api/products/:id
app.get("/api/products/:id", AuthMiddleware, (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *  patch:
 *    summary: Обновить товар по ID
 *    tags: [Products]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Уникальный идентификатор товара
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/Product'
 *    responses:
 *      200:
 *        description: Товар успешно обновлён
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Product'
 *      400:
 *        description: Нечего обновлять
 *      404:
 *        description: Товар не найден
 */

// PATCH /api/products/:id
app.patch("/api/products/:id", AuthMiddleware, (req, res) => {
  const id = req.params.id;
  const product = findProductOr404(id, res);
  if (!product) return;
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }
  const { title, category, description, price } = req.body;
  if (title !== undefined) product.title = title.trim();
  if (category !== undefined) product.category = category.trim();
  if (description !== undefined) product.description = description.trim();
  if (price !== undefined) product.price = Number(price);
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *  delete:
 *    summary: Удалить товар по ID
 *    tags: [Products]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Уникальный идентификатор товара
 *    responses:
 *      204:
 *        description: Товар успешно удалён
 *      404:
 *        description: Товар не найден
 */

// DELETE /api/products/:id
app.delete("/api/products/:id", AuthMiddleware, (req, res) => {
  const id = req.params.id;
  const exists = products.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: "Product not found" });
  products = products.filter((p) => p.id !== id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server launched on http://localhost:${port}`);
  console.log(`Swagger ui is on http://localhost:${port}/api-docs`);
});
