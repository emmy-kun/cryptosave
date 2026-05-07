const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   MONGODB
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

/* =========================
   DEPOSIT ADDRESS (SINGLE)
========================= */
let depositAddress = "bc1qdefaultaddressxxxx";

/* =========================
   GET DEPOSIT ADDRESS
========================= */
app.get("/api/deposit-address", (req, res) => {
  res.json({ address: depositAddress });
});

/* =========================
   UPDATE DEPOSIT ADDRESS (ADMIN)
   FIXED ROUTE CONSISTENCY
========================= */
app.put("/api/admin/deposit-address", (req, res) => {
  const { address } = req.body || {};

  if (!address) {
    return res.status(400).json({ error: "Address required" });
  }

  depositAddress = address;

  res.json({
    message: "Deposit address updated successfully",
    address
  });
});

/* =========================
   PORTFOLIO MODEL
========================= */
const Portfolio = require("./models/portfolio");

/* =========================
   INIT PORTFOLIO
========================= */
app.get("/init", async (req, res) => {
  let data = await Portfolio.findOne();

  if (!data) {
    data = await Portfolio.create({
      assets: {
        bitcoin: 0.02,
        ethereum: 1,
        usdt: 500,
        solana: 5
      },
      transactions: []
    });
  }

  res.json(data);
});

/* =========================
   GET PORTFOLIO
========================= */
app.get("/portfolio", async (req, res) => {
  const data = await Portfolio.findOne().sort({ _id: -1 });

  if (!data) {
    return res.json({
      assets: {},
      transactions: []
    });
  }

  res.json(data);
});

/* =========================
   ADMIN UPDATE PORTFOLIO
========================= */
app.post("/clone-admin/update", async (req, res) => {
  const { assets, transactions } = req.body || {};

  let data = await Portfolio.findOne().sort({ _id: -1 });

  if (!data) {
    data = await Portfolio.create({ assets: {}, transactions: [] });
  }

  data.assets = data.assets || {};
  data.transactions = data.transactions || [];

  if (assets) {
    data.assets.bitcoin = (data.assets.bitcoin || 0) + (assets.bitcoin || 0);
    data.assets.ethereum = (data.assets.ethereum || 0) + (assets.ethereum || 0);
    data.assets.usdt = (data.assets.usdt || 0) + (assets.usdt || 0);
    data.assets.solana = (data.assets.solana || 0) + (assets.solana || 0);
  }

  if (Array.isArray(transactions)) {
    transactions.forEach(tx => {
      const index = data.transactions.findIndex(
        t => t.date === tx.date && t.amount === tx.amount && t.type === tx.type
      );

      if (index !== -1) {
        data.transactions[index].status = tx.status;
      } else {
        data.transactions.push(tx);
      }
    });
  }

  await data.save();

  res.json({
    message: "Portfolio updated",
    data
  });
});

/* =========================
   RESET DB (DEV ONLY)
========================= */
app.get("/reset", async (req, res) => {
  await Portfolio.deleteMany({});
  res.send("Database cleared");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

console.log("ENV CHECK:", process.env.MONGO_URI);