const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://cryptosave.onrender.com";

document.getElementById("nav-transactions").classList.add("nav-active");

/* =========================
   STATE
========================= */
let allTransactions = [];
let currentFilter = "all";

/* =========================
   LOAD TRANSACTIONS
========================= */
async function loadTransactions() {
    try {
        const res = await fetch(`${API_URL}/portfolio`);
        const data = await res.json();

        allTransactions = Array.isArray(data.transactions)
            ? data.transactions.reverse()
            : [];

        renderTransactions();

    } catch (err) {
        console.log("Transaction error:", err);
    }
}

/* =========================
   RENDER TRANSACTIONS
========================= */
function renderTransactions() {
    const table = document.getElementById("allTransactions");

    if (!table) return;

    table.innerHTML = "";

    let filtered = allTransactions;

    if (currentFilter !== "all") {
        filtered = allTransactions.filter(tx =>
            (tx.type || "").toLowerCase() === currentFilter
        );
    }

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="4">No transactions found</td>
            </tr>
        `;
        return;
    }

    filtered.forEach(tx => {
        const row = document.createElement("tr");

        const statusClass =
            tx.status === "Completed"
                ? "status-complete"
                : "status-pending";

        row.innerHTML = `
            <td>${tx.date || "-"}</td>
            <td>${tx.type || "-"}</td>
            <td>$${tx.amount || 0}</td>
            <td>
                <span class="${statusClass}">
                    ${tx.status || "-"}
                </span>
            </td>
        `;

        table.appendChild(row);
    });
}

/* =========================
   FILTER BUTTONS
========================= */
function filterTransactions(type, event) {
    currentFilter = type;

    document.querySelectorAll(".tx-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (event) {
        event.target.classList.add("active");
    }

    renderTransactions();
}

/* =========================
   HAMBURGER TOGGLE
========================= */
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });
}

/* =========================
   INIT
========================= */
loadTransactions();