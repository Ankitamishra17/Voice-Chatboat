const voiceBtn = document.getElementById("voiceBtn");
const statusEl = document.getElementById("status");
const themeToggle = document.getElementById("themeToggle");

let recognizing = false;
let recognition = null;
let synth = window.speechSynthesis;
let currentUtterance = null;

// ---- STATUS ----
function setStatus(msg) {
  statusEl.textContent = msg || "";
}

// ---- THEME TOGGLE ----
const storedTheme = localStorage.getItem("theme") || "light";
document.body.classList.toggle("dark", storedTheme === "dark");
document.body.classList.toggle("light", storedTheme !== "dark");
themeToggle.textContent = document.body.classList.contains("dark") ? "🌙" : "🌞";

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
  const dark = document.body.classList.contains("dark");
  localStorage.setItem("theme", dark ? "dark" : "light");
  themeToggle.textContent = dark ? "🌙" : "🌞";
});

// ---- SPEECH RECOGNITION ----
function setupRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    setStatus("Speech Recognition not supported. Use Chrome.");
    return null;
  }
  const rec = new webkitSpeechRecognition();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = "hi-IN"; 

  rec.onstart = () => setStatus("🎤 Listening...");
  rec.onerror = (e) => {
    console.error("Recognition error:", e);
    setStatus("Error: " + e.error);
  };
  rec.onend = () => {
    if (recognizing) {
      rec.start(); 
    }
  };
  rec.onresult = (ev) => {
    const userSpeech = ev.results[0][0].transcript;
    console.log("User Speech:", userSpeech);

    // 🚨 Interrupt bot if speaking
    if (synth.speaking) synth.cancel();

    handleUserText(userSpeech);
  };
  return rec;
}

recognition = setupRecognition();

// ---- BACKEND CALL ----
async function handleUserText(text) {
  try {
    setStatus("🤔 Thinking...");
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await r.json();
    const reply = data?.reply || "maaf kare, Mai sirf Revolt Motors ke baare me baat kar sakta hu.";
    console.log("Bot Reply:", reply);
    speak(reply, detectVoiceLang(reply));
  } catch (e) {
    console.error(e);
    setStatus("Network error");
  }
}

// ---- VOICE DETECTION ----
function detectVoiceLang(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN"; // Hindi/Marathi/Bhojpuri
  if (/[\u0900-\u097F]/.test(text)) return "en-IN"; // Hindi/Marathi/Bhojpuri
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN"; // Telugu
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN"; // Tamil
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu-IN"; // Gujarati
  if (/[\u0980-\u09FF]/.test(text)) return "bn-IN"; // Bengali
  return "hi-IN"; // fallback hindi
}

// ---- SPEAK ----
function speak(text, lang) {
  if (!synth) return;
  if (currentUtterance) synth.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1.0;
  u.pitch = 1.0;

  u.onstart = () => {
    setStatus("🔊 Speaking...");
    // ⚡ Important: Mic listening ko band mat karo
    if (recognition && recognizing) {
      try {
        recognition.start(); // ensure mic keeps running
      } catch (e) {
        console.log("Mic already running");
      }
    }
  };

  u.onend = () => {
    setStatus("🎤 Listening...");
  };

  u.onerror = (e) => {
    console.warn("Speech error:", e);
    setStatus("🎤 Listening...");
  };

  currentUtterance = u;
  synth.speak(u);
}


// ---- MAIN BUTTON ----
voiceBtn.addEventListener("click", () => {
  if (!recognition) recognition = setupRecognition();

  if (!recognizing) {
    recognizing = true;
    voiceBtn.classList.add("active");
    voiceBtn.textContent = "🛑 Stop";
     
    recognition.start();
    statusEl.style.display = "block";
  } else {
    recognizing = false;
    voiceBtn.classList.remove("active");
    voiceBtn.textContent = "🎤 Start Talking";
    recognition.stop();
    statusEl.style.display = "none";
    if (synth.speaking) synth.cancel();
  }
});

voiceBtn.innerHTML = recognizing
  ? `<span class="icon">🛑</span><span class="text">Stop</span><span class="pulse"></span>`
  : `<span class="icon">🎤</span><span class="text">Start Talking</span>`;

