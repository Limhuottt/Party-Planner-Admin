// === API Setup ===
// Base URL for the API
const BASE_URL = "https://fsa-crud-2aa9294fe819.herokuapp.com/api";
// Your cohort path - change this to your cohort code
const COHORT_PATH = "/2504-FTB-ET-WEB-PT";
const API_ENDPOINT = BASE_URL + COHORT_PATH;

// === Application State ===
// Store all parties here
let allParties = [];
// Store the currently selected party here
let currentParty = null;
// Store all RSVPs here (for guests attending parties)
let allRsvps = [];
// Store all guests here
let allGuests = [];

// === Data Fetching Functions ===

// Fetch all parties from the API and save in state
async function loadParties() {
  try {
    const res = await fetch(API_ENDPOINT + "/events");
    if (!res.ok) throw new Error("Failed to fetch parties");
    const json = await res.json();
    allParties = json.data;
    refreshUI(); // update the UI after loading parties
  } catch (err) {
    console.error("Failed to load parties:", err);
    alert("Unable to load parties. Please try again later.");
  }
}

// Fetch details for one party by its ID
async function loadPartyDetails(id) {
  try {
    const res = await fetch(API_ENDPOINT + "/events/" + id);
    if (!res.ok) throw new Error("Failed to fetch party details");
    const json = await res.json();
    currentParty = json.data;
    refreshUI(); // update UI to show party details
  } catch (err) {
    console.error("Failed to load party details:", err);
    alert("Unable to load party details. Please try again later.");
  }
}

// Fetch all RSVPs from API and save to state
async function loadRsvps() {
  try {
    const res = await fetch(API_ENDPOINT + "/rsvps");
    if (!res.ok) throw new Error("Failed to fetch RSVPs");
    const json = await res.json();
    allRsvps = json.data;
    refreshUI(); // update UI because RSVPs affect guest list
  } catch (err) {
    console.error("Failed to load RSVPs:", err);
  }
}

// Fetch all guests from API and save to state
async function loadGuests() {
  try {
    const res = await fetch(API_ENDPOINT + "/guests");
    if (!res.ok) throw new Error("Failed to fetch guests");
    const json = await res.json();
    allGuests = json.data;
    refreshUI(); // update UI because guests affect guest list
  } catch (err) {
    console.error("Failed to load guests:", err);
  }
}

// === UI Components ===

// Create a list item (<li>) for one party in the party list
function createPartyListItem(party) {
  const li = document.createElement("li");

  // Highlight the currently selected party
  if (currentParty?.id === party.id) {
    li.classList.add("selected");
  }

  // Display party name as a clickable link
  li.innerHTML = `<a href="#selected">${party.name}</a>`;
  // When clicked, load that party's details
  li.addEventListener("click", () => loadPartyDetails(party.id));
  return li;
}

// Create the full party list (<ul>) by mapping over all parties
function createPartyList() {
  const ul = document.createElement("ul");
  ul.classList.add("parties");

  const partyItems = allParties.map(createPartyListItem);
  ul.replaceChildren(...partyItems);
  return ul;
}

// Create the guest list for the selected party
function createGuestList() {
  const ul = document.createElement("ul");

  // Filter guests who RSVP’d for the current party
  const attendingGuests = allGuests.filter((guest) =>
    allRsvps.some(
      (rsvp) => rsvp.guestId === guest.id && rsvp.eventId === currentParty.id
    )
  );

  // Create list items (<li>) for each guest attending
  const guestItems = attendingGuests.map((guest) => {
    const li = document.createElement("li");
    li.textContent = guest.name;
    return li;
  });

  ul.replaceChildren(...guestItems);
  return ul;
}

// Create the party details section, including the delete button
function createSelectedPartySection() {
  // Show message if no party is selected
  if (!currentParty) {
    const p = document.createElement("p");
    p.textContent = "Please select a party to learn more.";
    return p;
  }

  // Create a container for party details
  const section = document.createElement("section");
  section.innerHTML = `
    <h3>${currentParty.name} #${currentParty.id}</h3>
    <time datetime="${currentParty.date}">${currentParty.date.slice(
    0,
    10
  )}</time>
    <address>${currentParty.location}</address>
    <p>${currentParty.description}</p>
  `;

  // Add the guest list below party details
  section.appendChild(createGuestList());

  // Add the delete button to allow removing this party
  section.appendChild(createDeleteButton());

  return section;
}

// Create a button to delete the currently selected party
function createDeleteButton() {
  const button = document.createElement("button");
  button.textContent = "Delete This Party";

  // Style the button (red background, white text)
  button.style.marginTop = "1rem";
  button.style.backgroundColor = "#ff4444";
  button.style.color = "white";
  button.style.border = "none";
  button.style.padding = "0.5rem 1rem";
  button.style.borderRadius = "4px";
  button.style.cursor = "pointer";

  // When clicked, confirm deletion and send DELETE request
  button.addEventListener("click", async () => {
    if (!currentParty) return;

    const confirmDelete = confirm(`Delete party "${currentParty.name}"?`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        API_ENDPOINT + "/events/" + currentParty.id,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete party");

      currentParty = null; // Clear selected party
      await loadParties(); // Reload party list
      refreshUI(); // Update UI
    } catch (error) {
      console.error("Error deleting party:", error);
      alert("Could not delete party. Please try again.");
    }
  });

  return button;
}

// Create the form for adding a new party
function createPartyForm() {
  const form = document.createElement("form");
  form.id = "create-party-form";

  // Form inputs for name, description, date, location
  form.innerHTML = `
    <h2>Add a New Party</h2>
    <label>
      Name:<br />
      <input name="name" type="text" required />
    </label><br />
    <label>
      Description:<br />
      <textarea name="description" rows="3" required></textarea>
    </label><br />
    <label>
      Date:<br />
      <input name="date" type="date" required />
    </label><br />
    <label>
      Location:<br />
      <input name="location" type="text" required />
    </label><br />
    <button type="submit">Add Party</button>
  `;

  // When form is submitted, send POST request to create party
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload

    // Gather input values from the form
    const formData = new FormData(form);
    const name = formData.get("name").trim();
    const description = formData.get("description").trim();
    const dateInput = formData.get("date");
    const location = formData.get("location").trim();

    // Simple validation to make sure all fields are filled
    if (!name || !description || !dateInput || !location) {
      alert("Please fill in all fields.");
      return;
    }

    // Convert date input to ISO string (required by API)
    const isoDate = new Date(dateInput).toISOString();

    try {
      // Send POST request to create a new party
      const response = await fetch(API_ENDPOINT + "/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, date: isoDate, location }),
      });

      if (!response.ok) throw new Error("Failed to add party");

      await loadParties(); // Reload parties to include new one
      currentParty = null; // Clear selection
      refreshUI(); // Update UI
      form.reset(); // Clear form inputs
    } catch (error) {
      console.error("Error adding party:", error);
      alert("Could not add party. Please try again.");
    }
  });

  return form;
}

// === Main render function ===
// This function clears the page and redraws everything based on state
function refreshUI() {
  const app = document.querySelector("#app");
  app.innerHTML = `
    <h1>Party Planner Admin</h1>
    <main>
      <section>
        <h2>Upcoming Parties</h2>
        <div id="party-list-container"></div>
        <div id="create-party-form-container"></div>
      </section>
      <section id="selected">
        <h2>Party Details</h2>
        <div id="party-details-container"></div>
      </section>
    </main>
  `;

  // Append the party list, add-party form, and details to their containers
  app.querySelector("#party-list-container").appendChild(createPartyList());
  app
    .querySelector("#create-party-form-container")
    .appendChild(createPartyForm());
  app
    .querySelector("#party-details-container")
    .appendChild(createSelectedPartySection());
}

// === Initialization ===
// This function runs once at page load
async function initializeApp() {
  await loadParties();
  await loadRsvps();
  await loadGuests();
  refreshUI();
}

// Start the app!
initializeApp();
