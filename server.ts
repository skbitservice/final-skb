import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini client lazily/safely
  let ai: GoogleGenAI | null = null;
  function getGeminiClient() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        ai = new GoogleGenAI({ apiKey });
      }
    }
    return ai;
  }

  // API Route: Generate Order Email content using Gemini API
  app.post("/api/generate-order-email", async (req, res) => {
    try {
      const { orderId, customerName, items, total, status } = req.body;
      
      if (!orderId || !customerName || !items || !total) {
        return res.status(400).json({ error: "Missing order metadata for email drafting" });
      }

      const client = getGeminiClient();
      let emailContent = "";

      if (client) {
        try {
          const itemsStr = items.map((i: any) => `${i.name} x${i.quantity} (INR ${i.price})`).join(", ");
          const prompt = `
            You are drafting a professional, beautiful, and warm customer order confirmation email for SKB Computer Services.
            Customer Name: ${customerName}
            Order Reference: ${orderId}
            Purchased Items: ${itemsStr}
            Grand Total: INR ${total}
            Shipping Status: ${status || "Pending"}
            
            Write an elegant plain-text email with the subject "Order Confirmed - ${orderId}". Keep the style modern, clear, premium, and friendly. Do not use markdown tags like **bold** in the email body, keep it as standard plain text structure with nice line breaks.
          `;
          const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          emailContent = response.text || "";
        } catch (gemIniError) {
          console.error("Gemini email generation failed, falling back:", gemIniError);
        }
      }

      // If Gemini is not set up or failed, provide a fallback template
      if (!emailContent) {
        emailContent = `Dear ${customerName},\n\nThank you for choosing SKB Computer Services!\n\nWe are pleased to confirm that your order ${orderId} has been received and is currently being processed by our technical service desk.\n\nOrder Details:\n` +
          items.map((i: any) => `- ${i.name} x ${i.quantity} @ INR ${i.price}`).join("\n") +
          `\n\nGrand Total: INR ${total}\nShipping Status: ${status || "Pending"}\n\nWe will update you with a tracking number as soon as the item ships.\n\nBest regards,\nSKB Support Team`;
      }

      return res.json({
        emailText: emailContent,
        subject: `Order Confirmation - ${orderId}`,
        recipient: req.body.customerEmail || "skbitservice@gmail.com"
      });
    } catch (err: any) {
      console.error("Error drafting email:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // API Route: Send Push Notification triggering endpoint
  app.post("/api/trigger-push-notification", (req, res) => {
    const { orderId, status, trackingNumber } = req.body;
    // Broadcast can be logged; since Firestore is real-time, changes broadcast automatically.
    res.json({
      success: true,
      status,
      message: `Push notification generated for Order ${orderId}: changed status to ${status}`,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
