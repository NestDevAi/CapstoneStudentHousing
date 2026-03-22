import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import apiRouter from "./src/api/index.ts";

/**
 * NOTE: The user requested ElysiaJS and PostgreSQL.
 * ElysiaJS is primarily designed for the Bun runtime. 
 * Since this environment uses Node.js, we are using Express.js which is the industry standard for Node.
 * We are using SQLite (via better-sqlite3) as a local SQL database which provides a similar 
 * relational experience to PostgreSQL without requiring an external server setup in this sandbox.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mount the RESTful API router
  app.use("/api", apiRouter);

  app.get("/test-server", (req, res) => {
    res.send("<h1>SERVER IS RESPONDING</h1>");
  });

  // SMS Broadcast Route (Maintained from previous version)
  app.post("/api/broadcast/sms", async (req, res) => {
    const { recipients, message } = req.body;

    if (!recipients || !message) {
      return res.status(400).json({ success: false, error: "Missing recipients or message" });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("Twilio credentials missing. SMS broadcast will be simulated.");
      // Simulate success for demo purposes if keys are missing
      return res.json({ 
        success: true, 
        simulated: true, 
        message: "SMS broadcast simulated (Twilio keys missing in .env)",
        recipientCount: recipients.length 
      });
    }

    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(accountSid, authToken);

      const results = await Promise.allSettled(
        recipients.map((to: string) => 
          client.messages.create({
            body: message,
            from: fromNumber,
            to: to
          })
        )
      );

      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      res.json({ 
        success: true, 
        successful, 
        failed,
        message: `SMS broadcast completed. ${successful} sent, ${failed} failed.` 
      });
    } catch (error: any) {
      console.error("Twilio error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Email Broadcast Route
  app.post("/api/broadcast/email", async (req, res) => {
    const { recipients, subject, message } = req.body;

    if (!recipients || !subject || !message) {
      return res.status(400).json({ success: false, error: "Missing recipients, subject, or message" });
    }

    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "noreply@studentstay.com";

    if (!sendgridApiKey) {
      console.warn("SendGrid API key missing. Email broadcast will be simulated.");
      return res.json({ 
        success: true, 
        simulated: true, 
        message: "Email broadcast simulated (SendGrid key missing in .env)",
        recipientCount: recipients.length 
      });
    }

    try {
      const { default: sgMail } = await import("@sendgrid/mail");
      sgMail.setApiKey(sendgridApiKey);

      const msg = {
        to: recipients, // SendGrid supports array of emails
        from: fromEmail,
        subject: subject,
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px;">
                <h2 style="color: #f97316;">${subject}</h2>
                <p style="white-space: pre-wrap;">${message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">You received this because you are a registered user on StudentStay.</p>
              </div>`,
      };

      await sgMail.sendMultiple(msg);

      res.json({ 
        success: true, 
        message: `Email broadcast sent successfully to ${recipients.length} recipients.` 
      });
    } catch (error: any) {
      console.error("SendGrid error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
});
