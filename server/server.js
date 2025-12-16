const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===== DATA =====
const STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];
const prices = {};
STOCKS.forEach(s => prices[s] = +(100 + Math.random() * 200).toFixed(2));

const users = new Map();

// ===== API ROUTES (FIRST) =====
app.get("/api/stocks", (req, res) => {
  res.json(STOCKS);
});

app.get("/api/prices", (req, res) => {
  res.json(prices);
});

// ===== SOCKET =====
io.on("connection", socket => {
  socket.on("login", email => {
    users.set(socket.id, { email, subs: new Set() });
  });

  socket.on("subscribe", ticker => {
    const user = users.get(socket.id);
    if (!user) return;
    user.subs.add(ticker);
    socket.join(ticker);
    socket.emit("price", { ticker, price: prices[ticker] });
  });

  socket.on("unsubscribe", ticker => {
    const user = users.get(socket.id);
    if (!user) return;
    user.subs.delete(ticker);
    socket.leave(ticker);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
  });
});

// ===== PRICE UPDATES =====
setInterval(() => {
  STOCKS.forEach(t => {
    prices[t] = +(prices[t] + (Math.random() - 0.5) * 2).toFixed(2);
    io.to(t).emit("price", { ticker: t, price: prices[t] });
  });
}, 1000);

// ===== SERVE FRONTEND (LAST) =====
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// ===== START =====
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("Server running on", PORT));
