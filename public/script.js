document.addEventListener("DOMContentLoaded", () => {
  const fullNameInput = document.getElementById("full-name");
  const roleSelect = document.getElementById("role");
  const saveUserInfoBtn = document.getElementById("save-user-info");
  const checkinBtn = document.getElementById("checkin-btn");
  const checkoutBtn = document.getElementById("checkout-btn");
  const attendanceMessage = document.getElementById("attendance-message");
  const attendanceTableBody = document.querySelector("#attendance-table tbody");
  const savedMessage = document.getElementById("saved-message");
  const logoutBtn = document.getElementById("logout-btn");

  let user = JSON.parse(localStorage.getItem("user")) || null;
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

  // Restore user info
  if (user) {
    fullNameInput.value = user.name;
    roleSelect.value = user.role;
  }

  // Save user info
  saveUserInfoBtn.addEventListener("click", () => {
    const name = fullNameInput.value.trim();
    const role = roleSelect.value;

    if (!name || !role) {
      savedMessage.textContent = "Please enter your name and role.";
      savedMessage.style.color = "red";
      return;
    }

    user = { name, role };
    localStorage.setItem("user", JSON.stringify(user));
    savedMessage.textContent = "User info saved!";
    savedMessage.style.color = "green";
  });

  // Check In
  checkinBtn.addEventListener("click", () => {
    if (!user) {
      attendanceMessage.textContent = "Please save your user info first.";
      attendanceMessage.style.color = "red";
      return;
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const time = new Date().toLocaleTimeString();

    // Prevent multiple check-ins for the same day
    const existingRecord = attendance.find(record => record.date === today && record.name === user.name);

    if (existingRecord && existingRecord.checkIn) {
      attendanceMessage.textContent = "Already checked in today.";
      attendanceMessage.style.color = "orange";
      return;
    }

    const record = {
      name: user.name,
      role: user.role,
      date: today,
      checkIn: time,
      checkOut: "",
      status: "Present",
      notes: ""
    };

    attendance.push(record);
    localStorage.setItem("attendance", JSON.stringify(attendance));

    attendanceMessage.textContent = `Welcome, ${user.name}! Checked in at ${time}.`;
    attendanceMessage.style.color = "green";

    renderAttendance();
  });

  // Check Out
  checkoutBtn.addEventListener("click", () => {
    if (!user) {
      attendanceMessage.textContent = "Please save your user info first.";
      attendanceMessage.style.color = "red";
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const time = new Date().toLocaleTimeString();

    const record = attendance.find(
      rec => rec.date === today && rec.name === user.name
    );

    if (!record) {
      attendanceMessage.textContent = "You must check in first.";
      attendanceMessage.style.color = "orange";
      return;
    }

    if (record.checkOut) {
      attendanceMessage.textContent = "Already checked out today.";
      attendanceMessage.style.color = "orange";
      return;
    }

    record.checkOut = time;
    localStorage.setItem("attendance", JSON.stringify(attendance));

    attendanceMessage.textContent = `Goodbye, ${user.name}! Checked out at ${time}.`;
    attendanceMessage.style.color = "blue";

    renderAttendance();
  });

  // Render attendance table
  function renderAttendance() {
    attendanceTableBody.innerHTML = "";

    const userRecords = attendance.filter(rec => rec.name === (user?.name || ""));

    if (userRecords.length === 0) {
      attendanceTableBody.innerHTML = `<tr><td colspan="5">No attendance records found.</td></tr>`;
      return;
    }

    userRecords.reverse().forEach(rec => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${rec.date}</td>
        <td>${rec.checkIn || "-"}</td>
        <td>${rec.checkOut || "-"}</td>
        <td>${rec.status}</td>
        <td>${rec.notes || "-"}</td>
      `;
      attendanceTableBody.appendChild(row);
    });
  }

  // Logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user");
    attendanceMessage.textContent = "Logged out successfully.";
    fullNameInput.value = "";
    roleSelect.value = "";
    renderAttendance();
    savedMessage.textContent = "";
  });

  renderAttendance();
});

