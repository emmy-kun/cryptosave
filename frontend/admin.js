async function updateAssets() {
  const btc = Number(document.getElementById("btc").value) || 0;
  const eth = Number(document.getElementById("eth").value) || 0;
  const usdt = Number(document.getElementById("usdt").value) || 0;
  const sol = Number(document.getElementById("sol").value) || 0;

  await fetch("http://localhost:5000/clone-admin/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      assets: {
        bitcoin: btc,
        ethereum: eth,
        usdt: usdt,
        solana: sol
      }
    })
  });

  alert("Assets updated");
}


/* =========================
   ADD TRANSACTION (FIXED)
========================= */
async function addTransaction() {
  const date = document.getElementById("date").value;
  const type = document.getElementById("type").value;
  const amount = Number(document.getElementById("amount").value);
  const status = document.getElementById("status").value;

  await fetch("http://localhost:5000/clone-admin/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transactions: [
        { date, type, amount, status }
      ]
    })
  });

  alert("Transaction added");
}


/* =========================
   UPDATE DEPOSIT ADDRESS
========================= */
async function addDepositAddress() {
  const address = document.getElementById("depositAddressInput").value;

  if (!address) {
    alert("Enter address");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/admin/deposit-address", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ address })
    });

    const data = await res.json();

    alert(data.message || "Updated");
  } catch (err) {
    console.log(err);
    alert("Failed to update address");
  }
}