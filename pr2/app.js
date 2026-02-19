const express = require("express");
const app = express();
const port = 3000;

let goods = [
  { id: 1, name: "Телевизор", price: 45000 },
  { id: 2, name: "Персональный компьютер", price: 80000 },
  { id: 3, name: "Смартфон нового поколения", price: 50000 },
  { id: 4, name: "Станция дистанционного управления домом", price: 12000 },
  { id: 5, name: "Графический планшет", price: 25000 },
  { id: 6, name: "Наушники внутриканальные", price: 7000 },
];

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Main page");
});

//CRUD

//create
app.post("/goods", (req, res) => {
  const { name, price } = req.body;

  const newGood = {
    id: goods.length + 1,
    name,
    price,
  };

  goods.push(newGood);
  res.status(201).json(newGood);
});

//read
app.get("/goods", (req, res) => {
  res.json(goods);
});

//read-by-id
app.get("/goods/:id", (req, res) => {
  let good = goods.find((g) => g.id == req.params.id);
  res.json(good);
});

//update
app.patch("/goods/:id", (req, res) => {
  const good = goods.find((g) => g.id == req.params.id);
  const { name, price } = req.body;
  if (name !== undefined) good.name = name;
  if (price !== undefined) good.price = price;
  res.json(good);
});

//delete
app.delete("/goods/:id", (req, res) => {
  goods = goods.filter((g) => g.id !== req.params.id);
});

app.listen(port, () => {
  console.log(`Server launched on http://localhost:${port}`);
});
