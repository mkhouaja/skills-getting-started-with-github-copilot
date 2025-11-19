document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and reset select (keep placeholder)
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("div");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = `Participants (${details.participants.length})`;
        participantsSection.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants";

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement("li");
          li.className = "empty";
          li.textContent = "No participants yet.";
          ul.appendChild(li);
        } else {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.className = "participant-email";
            span.textContent = p;
            li.appendChild(span);

            const btn = document.createElement("button");
            btn.className = "delete-participant";
            btn.type = "button";
            btn.title = "Unregister participant";
            btn.dataset.activity = name;
            btn.dataset.email = p;
            btn.innerHTML = "&times;";

            li.appendChild(btn);
            ul.appendChild(li);
          });
        }

        participantsSection.appendChild(ul);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click handler for delete buttons
  activitiesList.addEventListener("click", async (event) => {
    const el = event.target;
    if (!el.classList.contains("delete-participant")) return;

    const activityName = el.dataset.activity;
    const email = el.dataset.email;

    if (!activityName || !email) return;

    // Confirm with the user
    const ok = confirm(`Unregister ${email} from "${activityName}"?`);
    if (!ok) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE", cache: "no-store" }
      );

      const result = await res.json();

      if (res.ok) {
        // Remove the participant from the UI
        const li = el.closest("li");
        if (li) li.remove();

        // Optionally show a brief message
        const messageDiv = document.getElementById("message");
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        messageDiv.classList.remove("hidden");
        setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      } else {
        const messageDiv = document.getElementById("message");
        messageDiv.textContent = result.detail || "Failed to unregister";
        messageDiv.className = "message error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error unregistering participant:", err);
      const messageDiv = document.getElementById("message");
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities to show the new participant
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
