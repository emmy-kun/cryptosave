function setLoading(state) {
    const spinner = document.getElementById("spinner");
    const btnText = document.getElementById("btnText");
    const loginBtn = document.getElementById("loginBtn");

    if (!spinner || !btnText || !loginBtn) return;

    if (state) {
        spinner.classList.remove("hidden");
        btnText.textContent = "Signing in...";
        loginBtn.disabled = true;
    } else {
        spinner.classList.add("hidden");
        btnText.textContent = "Sign In";
        loginBtn.disabled = false;
    }
}

function login() {
    setLoading(true);

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    setTimeout(() => {

        if (username && password) {

            // ✅ SAVE USER CORRECTLY
            localStorage.setItem("user", username);

            // optional: store login state
            localStorage.setItem("loggedIn", "true");

            window.location.href = "dashboard.html";

        } else {
            alert("Please fill all fields");
        }

        setLoading(false);

    }, 1200);
}