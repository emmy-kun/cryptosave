// Change this to your backend URL when deployed.
// For local development, leave it as localhost.
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://YOUR-BACKEND-URL.onrender.com";

function setLoading(state) {
  const spinner = document.getElementById("spinner");
  const btnText = document.getElementById("btnText");
  const loginBtn = document.getElementById("loginBtn");

  if (!spinner || !btnText || !loginBtn) return;

  if (state) {
    spinner.classList.remove("hidden");
    btnText.textContent = "Sending Code...";
    loginBtn.disabled = true;
  } else {
    spinner.classList.add("hidden");
    btnText.textContent = "Sign In";
    loginBtn.disabled = false;
  }
}

// LOGIN
async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please fill all fields.");
    return;
  }

  setLoading(true);

  try {
    // Save username for dashboard greeting
    localStorage.setItem("user", username);

    const response = await fetch(`${API_URL}/api/send-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    setLoading(false);

    if (data.success) {
      document.getElementById("verificationModal").classList.remove("hidden");
    } else {
      alert("Failed to send verification code.");
    }
  } catch (err) {
    console.error(err);

    setLoading(false);

    alert("Unable to contact server.");
  }
}

// VERIFY CODE
async function verifyCode() {
  const code = document.getElementById("verificationCode").value.trim();

  const errorBox = document.getElementById("verificationError");

  if (code.length !== 6) {
    errorBox.textContent = "Please enter a valid 6-digit code.";
    errorBox.classList.remove("hidden");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/verify-code`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        code,
      }),
    });

    const text = await response.text();

    console.log("SERVER RESPONSE:", text);

    const data = JSON.parse(text);

    if (data.success) {
      localStorage.setItem("loggedIn", "true");

      window.location.href = "dashboard.html";
    } else {
      errorBox.textContent = data.message || "Incorrect verification code.";

      errorBox.classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);

    errorBox.textContent = "Server error.";

    errorBox.classList.remove("hidden");
  }
}

// CLOSE MODAL
function closeVerificationModal() {
  document.getElementById("verificationModal").classList.add("hidden");

  document.getElementById("verificationCode").value = "";

  const errorBox = document.getElementById("verificationError");

  errorBox.classList.add("hidden");

  errorBox.textContent = "";
}
