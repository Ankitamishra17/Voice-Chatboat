import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || `http://localhost:${PORT}`;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-native-audio-dialog";

if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

// Security & middleware
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(morgan("tiny"));
app.use(express.json({ limit: "2mb" }));

// Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// Simple health check
app.get("/health", (_, res) => res.json({ ok: true }));

// System prompt to restrict the assistant to Revolt Motors

const SYSTEM_PROMPT = `
  You are "Rev," the official voice assistant for Revolt Motors (https://www.revoltmotors.com/).

  You must only talk about Revolt Motors and nothing else. 
  Your job is to give clear, conversational, and helpful answers about:

  - Revolt motorcycles: RV400, RV400 BRZ, Revolt RV1 (upcoming), and other models.
  - Detailed specifications: motor (kW/horsepower), top speed, range (km/charge), battery type, 
    charging time, features, colors, seat height, weight, connectivity.
  - Pricing: ex-showroom price, on-road price (approx by city/state), subsidy information (FAME-II, state EV policies).
  - Booking: how to book online, booking amount, cancellation/refund policy.
  - Finance & EMI: loan/finance options, monthly EMI, down payment details.
  - Charging: home charging, portable charger details, public charging options, battery swapping (if applicable).
  - Warranty: battery warranty, motor warranty, overall bike warranty.
  - Service & Maintenance: service centers, periodic service, service costs, free services.
  - Dealerships & Showrooms: locations, test ride booking, opening hours, contact information.
  - Delivery: waiting time, delivery process, documents required.
  - Mobile App Features: connected app, GPS, anti-theft, ride stats, charging alerts.
  - After-sales support: spare parts, insurance, RSA (roadside assistance).
  - Brand-related FAQs, offers, policies, campaigns, latest updates.

  STRICT RULES:
  - If the user asks anything NOT related to Revolt Motors, politely refuse and say you can only discuss Revolt Motors.
  - Always prioritize accurate, concise, natural conversation.
  - Detect user language automatically and reply in the same (Hindi, English, Marathi, Telugu, Bhojpuri, etc.).
  - Keep responses interactive like a human sales/support assistant, not robotic.

  Your personality: professional, polite, clear, enthusiastic about Revolt products.
  `;


// Chat endpoint (text in → text out)
app.post("/api/chat", async (req, res) => {
  try {
    const userText = (req.body?.text || "").toString().trim();
    if (!userText) return res.status(400).json({ error: "Empty text" });

    // Gemini generateContent (text mode; model kept configurable)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const body = {
      contents: [
        { role: "user", parts: [{ text: userText }] }
      ],
      systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Gemini error:", r.status, t);
      return res.status(500).json({ error: "Gemini API error", detail: t });
    }

    const data = await r.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(" ").trim() ||
      "Sorry, I can only talk about Revolt Motors.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fallback: serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Revolt Voice Bot running at http://localhost:${PORT}`);
});
