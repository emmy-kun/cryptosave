const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// stores active verification codes
const verificationCodes = new Map();

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(code) {

    const result = await resend.emails.send({

        from: "onboarding@resend.dev",

        to: ADMIN_EMAIL,

        subject: "Crypto Save Login Verification",

        html: `
            <div style="font-family:Arial;padding:20px">

                <h2>Crypto Save</h2>

                <p>Your verification code is:</p>

                <h1 style="
                    letter-spacing:8px;
                    font-size:42px;
                    color:#0ea5e9;
                ">
                    ${code}
                </h1>

                <p>
                    This code expires in 10 minutes.
                </p>

            </div>
        `
    });

    console.log(result);

}

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
   LOGIN VERIFICATION
========================= */

app.post("/api/auth/request-code", async (req, res) => {

    try {

        const code = generateCode();

        verificationCodes.set("admin", {
            code,
            expires: Date.now() + 10 * 60 * 1000
        });

        await sendVerificationEmail(code);

        res.json({
            success: true
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            error: "Failed to send verification code"
        });

    }

});


app.post("/api/auth/verify-code", (req, res) => {

    const { code } = req.body;

    const record = verificationCodes.get("admin");

    if (!record) {

        return res.status(400).json({
            success: false,
            error: "No verification code found"
        });

    }

    if (Date.now() > record.expires) {

        verificationCodes.delete("admin");

        return res.status(400).json({
            success: false,
            error: "Verification code expired"
        });

    }

    if (record.code !== code) {

        return res.status(400).json({
            success: false,
            error: "Invalid verification code"
        });

    }

    verificationCodes.delete("admin");

    res.json({
        success: true
    });

});

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

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

console.log("ENV CHECK:", process.env.MONGO_URI);