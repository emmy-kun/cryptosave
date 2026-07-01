const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:5000"
        : "https://cryptosave.onrender.com";

function setLoading(state) {

    const spinner = document.getElementById("spinner");
    const btnText = document.getElementById("btnText");
    const loginBtn = document.getElementById("loginBtn");

    if (state) {

        spinner.classList.remove("hidden");
        btnText.textContent = "Signing In...";
        loginBtn.disabled = true;

    } else {

        spinner.classList.add("hidden");
        btnText.textContent = "Sign In";
        loginBtn.disabled = false;

    }

}

function openVerificationModal() {

    document
        .getElementById("verificationModal")
        .classList
        .remove("hidden");

    document
        .getElementById("verificationCode")
        .value = "";

    document
        .getElementById("verificationError")
        .classList
        .add("hidden");

}

function closeVerificationModal() {

    document
        .getElementById("verificationModal")
        .classList
        .add("hidden");

}

async function requestVerificationCode() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    if (!username || !password) {

        alert("Please fill all fields.");
        return;

    }

    setLoading(true);

    try {

        const response = await fetch(
            `${API_URL}/api/auth/request-code`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error || "Failed to send verification code."
            );

        }

        localStorage.setItem("pendingUser", username);

        openVerificationModal();

    } catch (err) {

        alert(err.message);

    }

    setLoading(false);

}

async function verifyCode() {

    const code =
        document.getElementById("verificationCode").value.trim();

    if (!code) {

        document
            .getElementById("verificationError")
            .textContent = "Please enter the verification code.";

        document
            .getElementById("verificationError")
            .classList
            .remove("hidden");

        return;

    }

    try {

        const response = await fetch(
            `${API_URL}/api/auth/verify-code`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            document
                .getElementById("verificationError")
                .textContent =
                data.error || "Invalid verification code.";

            document
                .getElementById("verificationError")
                .classList
                .remove("hidden");

            return;

        }

        const username =
            localStorage.getItem("pendingUser");

        localStorage.setItem(
            "user",
            username
        );

        localStorage.setItem(
            "loggedIn",
            "true"
        );

        localStorage.removeItem("pendingUser");

        window.location.href =
            "dashboard.html";

    } catch (err) {

        alert(err.message);

    }

}