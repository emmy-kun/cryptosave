const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
console.log("RUNNING FILE:", __filename);

const { Resend } = require("resend");

console.log("API KEY:", process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

// temporary code storage
let verificationCode = null;
let codeExpires = null;
const app = express();

/* =========================
   MIDDLEWARE
========================= */

// FIXED CORS (more production-safe)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// FIX: removed risky __dirname static exposure
// If you are NOT serving frontend from backend, you should NOT use express.static(__dirname)
// app.use(express.static(__dirname));

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

app.post("/api/send-code", async (req, res) => {
    try {

        verificationCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        codeExpires = Date.now() + 5 * 60 * 1000;

        console.log("Generated Code:", verificationCode);

        const result = await resend.emails.send({
            from: "Crypto Save <onboarding@resend.dev>",
            to: process.env.VERIFICATION_EMAIL,
            subject: "EmCryptoSave Login Verification",
            html: `
                <h2>EmCryptoSave Login Verification</h2>

                <p>A user is requesting to log in.</p>

                <p>Your verification code is:</p>

                <h1 style="font-size:40px;color:#00ff88;">
                    ${verificationCode}
                </h1>

                <p>This code expires in 5 minutes.</p>
            `
        });

        console.log(result);

        res.json({
            success: true
        });

    } catch (err) {

        console.error("RESEND ERROR:");
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
});

console.log("✅ /api/send-code route loaded");

app.post("/api/verify-code", (req, res) => {

    const { code } = req.body;

    if (!verificationCode) {

        return res.json({
            success: false,
            message: "No verification code."
        });

    }

    if (Date.now() > codeExpires) {

        verificationCode = null;

        return res.json({
            success: false,
            message: "Code expired."
        });

    }

    if (code !== verificationCode) {

        return res.json({
            success: false,
            message: "Invalid code."
        });

    }

    verificationCode = null;

    res.json({
        success: true
    });

});

app.get("/hello", (req, res) => {
    res.json({
        message: "Hello from Express"
    });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

console.log("ENV CHECK:", process.env.MONGO_URI);