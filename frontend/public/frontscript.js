

// document.addEventListener("DOMContentLoaded", () => {
//   const loginButton = document.getElementById("login");
//   const getStartedBtn = document.getElementById("getStartedBtn");

//   // Check if user is logged in
//   fetch("/user-info")
//       .then(res => res.json())
//       .then(data => {
//           if (data.loggedIn) {
//               loginButton.textContent = "Logout";

//               // Handle logout
//               loginButton.addEventListener("click", () => {
//                   fetch("/logout", {
//                       method: "POST",
//                       credentials: "include" // Make sure cookies are included in the request
//                   })
//                   .then(res => res.json())
//                   .then(data => {
//                       if (data.message === "Logged out successfully") {
//                           window.location.reload(); // Refresh the page to update UI
//                       }
//                   });
//               });

//               // Handle Get Started
//               getStartedBtn.addEventListener("click", () => {
//                   if (data.role === "Helper") {
//                       window.location.href = "/helper-dashboard";
//                   } else {
//                       window.location.href = "/jobs";
//                   }
//               });
//           } else {
//               loginButton.textContent = "Login";

//               // Handle Login
//               loginButton.addEventListener("click", () => {
//                   window.location.href = "/login";
//               });

//               // Redirect "Get Started" to login if not logged in
//               getStartedBtn.addEventListener("click", () => {
//                   window.location.href = "/login";
//               });
//           }
//       })
//       .catch(err => {
//           console.error("Error checking login status:", err);
//       });
// });

// const urlParams = new URLSearchParams(window.location.search);
// const success = urlParams.get('success');

// // Show alert based on the result
// if (success === 'true') {
//     alert('Email sent successfully!');
// } else if (success === 'false') {
//     alert('Failed to send email. Please try again.');
// }

// // Clear query parameters from the URL
// window.history.replaceState({}, document.title, window.location.pathname);




document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.getElementById("login");
    const getStartedBtn = document.getElementById("getStartedBtn");

    // Check if user is logged in
    fetch("/user-info")
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          // If user is logged in
          loginButton.textContent = "Logout";

          // Handle Logout with Confirmation Prompt
          loginButton.addEventListener("click", () => {
            const confirmLogout = confirm("Do you really want to log out?");
            if (confirmLogout) {
              fetch("/logout", {
                method: "POST",
                credentials: "include" // Include cookies
              })
                .then(res => res.json())
                .then(data => {
                  if (data.message === "Logged out successfully") {
                    alert(data.message); // Show alert
                    window.location.reload(); // Refresh page
                  }
                })
                .catch(err => {
                  console.error("Error during logout:", err);
                  alert("Logout failed. Please try again.");
                });
            }
          });

          // Handle Get Started for logged-in users
          getStartedBtn.addEventListener("click", () => {
            if (data.role === "Helper") {
              window.location.href = "/helper-dashboard";
            } else {
              window.location.href = "/jobs";
            }
          });

        } else {
          // If user is NOT logged in
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

    // Email Sent Status Alerts
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');

    if (success === 'true') {
      alert('Email sent successfully!');
    } else if (success === 'false') {
      alert('Failed to send email. Please try again.');
    }

    // Clear query parameters from URL
    window.history.replaceState({}, document.title, window.location.pathname);
  });

