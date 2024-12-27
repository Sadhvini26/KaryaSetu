

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login");
  const getStartedBtn = document.getElementById("getStartedBtn");

  // Check if user is logged in
  fetch("/user-info")
      .then(res => res.json())
      .then(data => {
          if (data.loggedIn) {
              loginButton.textContent = "Logout";

              // Handle logout
              loginButton.addEventListener("click", () => {
                  fetch("/logout", {
                      method: "POST",
                      credentials: "include" // Make sure cookies are included in the request
                  })
                  .then(res => res.json())
                  .then(data => {
                      if (data.message === "Logged out successfully") {
                          window.location.reload(); // Refresh the page to update UI
                      }
                  });
              });

              // Handle Get Started
              getStartedBtn.addEventListener("click", () => {
                  if (data.role === "Helper") {
                      window.location.href = "/helper-dashboard";
                  } else {
                      window.location.href = "/jobs";
                  }
              });
          } else {
              loginButton.textContent = "Login";

              // Handle Login
              loginButton.addEventListener("click", () => {
                  window.location.href = "/login";
              });

              // Redirect "Get Started" to login if not logged in
              getStartedBtn.addEventListener("click", () => {
                  window.location.href = "/login";
              });
          }
      })
      .catch(err => {
          console.error("Error checking login status:", err);
      });
});


