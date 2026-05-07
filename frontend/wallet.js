let currentTotal = 0;
let depositAddress = "";
let hidden = localStorage.getItem("hideBalance") === "true";

const API_URL = "http://localhost:5000";

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const nav = document.getElementById("nav-wallet");
    if (nav) nav.classList.add("nav-active");

    loadWallet();
    setupHamburger();
    setupToggleBalance();
});

/* =========================
   WALLET DATA
========================= */
async function loadWallet() {
    try {
        const res = await fetch(`${API_URL}/portfolio`);
        const data = await res.json();

        const assetsDiv = document.getElementById("walletAssets");
        const countEl = document.getElementById("assetCount");

        if (!assetsDiv) return;

        assetsDiv.innerHTML = "";

        let total = 0;
        let count = 0;

        const prices = {
            bitcoin: 65000,
            ethereum: 3500,
            usdt: 1,
            solana: 150
        };

        const logos = {
            bitcoin: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
            ethereum: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
            usdt: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
            solana: "https://assets.coingecko.com/coins/images/4128/large/solana.png"
        };

        if (data.assets) {
            Object.keys(data.assets).forEach(key => {
                const amount = Number(data.assets[key]) || 0;
                if (amount <= 0) return;

                const value = amount * (prices[key] || 1);

                total += value;
                count++;

                const el = document.createElement("div");
                el.className = "wallet-row";

                el.innerHTML = `
                    <div class="wallet-left">
                        <img src="${logos[key] || ''}" />
                        <div>
                            <h4>${key.toUpperCase()}</h4>
                            <small>${amount}</small>
                        </div>
                    </div>
                    <div class="wallet-right">
                        <strong>$${value.toFixed(2)}</strong>
                    </div>
                `;

                assetsDiv.appendChild(el);
            });
        }

        currentTotal = total;
        updateBalanceUI();

        if (countEl) countEl.innerText = count;

    } catch (err) {
        console.log("Wallet error:", err);
    }
}

/* =========================
   LOAD DEPOSIT ADDRESS (FIXED)
========================= */
async function loadDepositAddress() {
    try {
        const res = await fetch(`${API_URL}/api/deposit-address`);
        const data = await res.json();

        const address = data.address || "No address set";

        const dashboardEl = document.getElementById("depositWalletAddress");
        const walletEl = document.getElementById("externalPaymentAddress");

        if (dashboardEl) dashboardEl.value = address;
        if (walletEl) walletEl.value = address;

        depositAddress = address;

    } catch (err) {
        console.log("Deposit address load failed:", err);
    }
}

/* =========================
   COPY (FIXED RELIABLE)
========================= */
function copyDepositAddress() {

    const input = document.getElementById("depositWalletAddress");

    if (!input) {
        alert("Input not found");
        return;
    }

    const value = input.value;

    if (!value) {
        alert("No address found");
        return;
    }

    navigator.clipboard.writeText(value)
    .then(() => {
        alert("Copied successfully");
    })
    .catch((err) => {
        console.log(err);

        input.select();
        input.setSelectionRange(0, 99999);

        document.execCommand("copy");

        alert("Copied successfully");
    });
}

function copyExternalPaymentAddress() {

    const input = document.getElementById("externalPaymentAddress");

    if (!input) {
        alert("Address field not found");
        return;
    }

    const value = input.value;

    if (!value || value === "Loading...") {
        alert("No address available");
        return;
    }

    navigator.clipboard.writeText(value)
        .then(() => {
            alert("Copied successfully");
        })
        .catch(() => {

            input.select();
            input.setSelectionRange(0, 99999);

            document.execCommand("copy");

            alert("Copied successfully");
        });
}

/* =========================
   BALANCE UI
========================= */
function updateBalanceUI() {
    const totalEl = document.getElementById("walletTotal");

    if (!totalEl) return;

    totalEl.innerText = hidden ? "****" : `$${currentTotal.toFixed(2)}`;
}

/* =========================
   TOGGLE
========================= */
function setupToggleBalance() {
    const toggleBtn = document.getElementById("toggleBalance");

    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        hidden = !hidden;
        localStorage.setItem("hideBalance", hidden);
        updateBalanceUI();
    });
}

/* =========================
   HAMBURGER
========================= */
function setupHamburger() {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }
}

/* =========================
   MODALS (FIXED — NO DUPLICATES)
========================= */
function openDeposit() {
    document.getElementById("depositModal").style.display = "flex";
    loadDepositAddress();
}

function closeDeposit() {
    document.getElementById("depositModal").style.display = "none";
}

function openWithdraw() {
    document.getElementById("withdrawModal").style.display = "flex";
}

function closeWithdraw() {
    document.getElementById("withdrawModal").style.display = "none";
}

/* =========================
   WITHDRAW FLOW (FIXED)
========================= */
function openWithdrawAccess() {
    document.getElementById("withdrawAccessModal").style.display = "flex";
}

function closeWithdrawAccess() {
    document.getElementById("withdrawAccessModal").style.display = "none";
}

/* INTERNAL PAY */
function payInternal() {
    showLoader();

    setTimeout(() => {
        hideLoader();
        closeWithdrawAccess();
        alert("Unable to verify beneficiary withdrawal path");
    }, 1500);
}

/* EXTERNAL PAYMENT (FIXED SINGLE VERSION) */
async function openExternalPayment() {
    showLoader();

    await loadDepositAddress();

    setTimeout(() => {
        hideLoader();
        document.getElementById("externalPaymentModal").style.display = "flex";
    }, 800);
}

function closeExternalPayment() {
    document.getElementById("externalPaymentModal").style.display = "none";
}

/* =========================
   LOADER
========================= */
function showLoader() {
    document.getElementById("globalLoader").style.display = "flex";
}

function hideLoader() {
    document.getElementById("globalLoader").style.display = "none";
}

/* =========================
   TOAST
========================= */
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);

    setTimeout(() => {
        toast.classList.remove("show");
        toast.remove();
    }, 2000);
}

/* =========================
   LOGOUT
========================= */
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}