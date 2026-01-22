import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend from root directory since server.js is in the same root in this setup
// Or if the user structure implies server folder, but currently files are in root.
// The user context shows server.js in root (d:\Brave_Downloads\AI-resume\cv-resume-website\server.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Serving current directory as static
app.use(express.static(__dirname));

// Basic validation helper
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Contact endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ ok: false, error: "All fields are required." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    }

    const mailTo = process.env.MAIL_TO;
    if (!mailTo) {
      return res.status(500).json({ ok: false, error: "MAIL_TO is not configured on the server." });
    }

    const fromName = process.env.FROM_NAME || "Contact Form";
    const safeSubject = `[Contact] ${subject}`;

    // Send email
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: mailTo,
      replyTo: email,
      subject: safeSubject,
      text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <pre style="white-space:pre-wrap;font-family:system-ui,Segoe UI,Arial;">${escapeHtml(message)}</pre>
      `
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ ok: false, error: "Failed to send message. Check server logs." });
  }
});

// Simple HTML escaping to prevent injection in email HTML
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
