const SECRET_KEY = "dream-machine-admin-secret";

const passwordGate = document.getElementById("password-gate");
const passwordInput = document.getElementById("password-input");
const loginBtn = document.getElementById("login-btn");
const adminContent = document.getElementById("admin-content");
const requestsList = document.getElementById("requests-list");
const emptyMsg = document.getElementById("empty-msg");
const refreshBtn = document.getElementById("refresh-btn");

function getSecret() {
  return sessionStorage.getItem(SECRET_KEY);
}

function showAdmin() {
  passwordGate.hidden = true;
  adminContent.hidden = false;
  loadRequests();
}

async function loadRequests() {
  const secret = getSecret();
  const debugEl = document.getElementById("debug-info");
  try {
    const url = `/api/admin-list?secret=${encodeURIComponent(secret)}&_=${Date.now()}`;
    const resp = await fetch(url, { cache: "no-store" });
    const text = await resp.text();
    if (debugEl) {
      debugEl.textContent = `URL: ${url}\nStatus: ${resp.status}\nBody: ${text.slice(0, 300)}`;
    }
    if (resp.status === 401) {
      sessionStorage.removeItem(SECRET_KEY);
      passwordGate.hidden = false;
      adminContent.hidden = true;
      return;
    }
    const rows = JSON.parse(text);
    renderRequests(rows);
  } catch (err) {
    if (debugEl) debugEl.textContent = `Fetch threw an error: ${err}`;
  }
}

function renderRequests(rows) {
  requestsList.innerHTML = "";
  emptyMsg.hidden = rows.length > 0;

  for (const row of rows) {
    const card = document.createElement("div");
    card.className = "request-card";

    const prompt = document.createElement("p");
    prompt.textContent = row.prompt;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${row.id} · ${new Date(row.created_at).toLocaleString()}`;

    const rowEl = document.createElement("div");
    rowEl.className = "row";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";

    const uploadBtn = document.createElement("button");
    uploadBtn.textContent = "Upload";

    const statusMsg = document.createElement("p");
    statusMsg.className = "status-msg";

    uploadBtn.addEventListener("click", () => handleUpload(row.id, fileInput, uploadBtn, statusMsg));

    rowEl.appendChild(fileInput);
    rowEl.appendChild(uploadBtn);
    card.appendChild(prompt);
    card.appendChild(meta);
    card.appendChild(rowEl);
    card.appendChild(statusMsg);
    requestsList.appendChild(card);
  }
}

async function handleUpload(id, fileInput, uploadBtn, statusMsg) {
  const file = fileInput.files[0];
  if (!file) {
    statusMsg.textContent = "Choose a file first.";
    return;
  }

  const secret = getSecret();
  uploadBtn.disabled = true;

  try {
    statusMsg.textContent = "Requesting upload slot...";
    const extension = (file.name.split(".").pop() || "mp4").toLowerCase();
    const signResp = await fetch("/api/admin-upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, secret, extension }),
    });
    if (!signResp.ok) throw new Error(await signResp.text());
    const { uploadUrl, path } = await signResp.json();

    statusMsg.textContent = "Uploading video...";
    const putResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "video/mp4" },
      body: file,
    });
    if (!putResp.ok) throw new Error(await putResp.text());

    statusMsg.textContent = "Marking as ready...";
    const markResp = await fetch("/api/admin-mark-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, secret, path }),
    });
    if (!markResp.ok) throw new Error(await markResp.text());

    statusMsg.textContent = "Done! Refreshing list...";
    setTimeout(loadRequests, 800);
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "Upload failed - see console.";
    uploadBtn.disabled = false;
  }
}

loginBtn.addEventListener("click", async () => {
  const value = passwordInput.value.trim();
  if (!value) return;
  const resp = await fetch(`/api/admin-list?secret=${encodeURIComponent(value)}&_=${Date.now()}`, {
    cache: "no-store",
  });
  if (resp.status === 401) {
    passwordInput.value = "";
    passwordInput.placeholder = "Wrong secret, try again";
    return;
  }
  sessionStorage.setItem(SECRET_KEY, value);
  showAdmin();
});

refreshBtn.addEventListener("click", loadRequests);

if (getSecret()) {
  showAdmin();
}
