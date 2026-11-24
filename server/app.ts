import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { BorzoClient } from "./borzo-client";

dotenv.config();

export const app = express();

// Enable CORS and capture raw body for HMAC-SHA256 webhook signature verification
app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// In-memory webhook event store
interface WebhookEvent {
  id: string;
  receivedAt: string;
  signatureHeader?: string;
  isSignatureValid?: boolean | null;
  headers: Record<string, any>;
  body: any;
}
const webhookEvents: WebhookEvent[] = [];

export const borzo = new BorzoClient();

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "borzo-sandbox-server",
    env: borzo.getEnvironment(),
    timestamp: new Date().toISOString(),
  });
});

// App configuration & defaults
app.get("/api/config", (_req, res) => {
  res.json({
    borzo: borzo.getConfig(),
    callback: {
      url: "https://test.nepalitales.com/api/borzo/webhook",
      tokenConfigured: Boolean(process.env.BORZO_CALLBACK_TOKEN),
    },
    kitchen: {
      address:
        process.env.KITCHEN_ADDRESS ||
        "7XCC+R9Q Metropolis Aquaris Phase 2, Ghodbunder Rd, near Ace Homes, Kasarvadavali, Thane West, Thane, Maharashtra 400615, India",
      phone: process.env.KITCHEN_PHONE || "917585080407",
      name: process.env.KITCHEN_NAME || "Nepali Tales Kitchen",
    },
    sampleDestinations: [
      {
        label: "Hiranandani Estate, Thane West (3.8 km)",
        address: "Hiranandani Estate, Thane West, Thane, Maharashtra 400607",
        phone: "919820000001",
        name: "Aarav Sharma (Friend/Tester)",
      },
      {
        label: "Viviana Mall, Thane West (8.2 km)",
        address: "Viviana Mall, Eastern Express Hwy, Thane West, Maharashtra 400606",
        phone: "919820000002",
        name: "Pooja Mehta (Friend/Tester)",
      },
      {
        label: "Ghodbunder Road, Anand Nagar (2.1 km)",
        address: "Anand Nagar, Ghodbunder Rd, Thane West, Maharashtra 400615",
        phone: "919820000003",
        name: "Rohan Verma (Friend/Tester)",
      },
      {
        label: "Majiwada Junction, Thane (6.5 km)",
        address: "Majiwada Junction, Thane West, Maharashtra 400601",
        phone: "919820000004",
        name: "Kavita Rao (Friend/Tester)",
      },
    ],
  });
});

// Toggle Environment: Production vs Test
app.post("/api/borzo/switch-env", (req, res) => {
  const { env } = req.body;
  if (env !== "production" && env !== "test") {
    return res.status(400).json({ is_successful: false, errors: ["Invalid env. Use 'production' or 'test'"] });
  }
  borzo.setEnvironment(env);
  res.json({
    is_successful: true,
    message: `Switched Borzo environment to ${env.toUpperCase()}`,
    borzo: borzo.getConfig(),
  });
});

// 1. Calculate Order Price
app.post("/api/borzo/calculate", async (req, res) => {
  try {
    const result = await borzo.calculateOrder(req.body);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 2. Create Order
app.post("/api/borzo/create", async (req, res) => {
  try {
    const result = await borzo.createOrder(req.body);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 3. Edit Order
app.post("/api/borzo/edit", async (req, res) => {
  try {
    const result = await borzo.editOrder(req.body);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 4. Cancel Order
app.post("/api/borzo/cancel", async (req, res) => {
  try {
    const orderId = Number(req.body.order_id);
    if (!orderId) {
      return res.status(400).json({ is_successful: false, errors: ["order_id is required"] });
    }
    const result = await borzo.cancelOrder(orderId);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 5. Get Orders List
app.get("/api/borzo/orders", async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const count = req.query.count ? Number(req.query.count) : undefined;
    const order_id = req.query.order_id ? Number(req.query.order_id) : undefined;

    const result = await borzo.getOrders({ status, offset, count, order_id });
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 6. Get Courier Info
app.get("/api/borzo/courier", async (req, res) => {
  try {
    const orderId = Number(req.query.order_id);
    if (!orderId) {
      return res.status(400).json({ is_successful: false, errors: ["order_id query param is required"] });
    }
    const result = await borzo.getCourier(orderId);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 7. Raw API Runner
app.post("/api/borzo/raw", async (req, res) => {
  try {
    const { endpoint, method, payload } = req.body;
    if (!endpoint) {
      return res.status(400).json({ is_successful: false, errors: ["endpoint is required"] });
    }
    const startTime = Date.now();
    const result = await borzo.sendRaw(endpoint, method || "POST", payload);
    const durationMs = Date.now() - startTime;

    res.status(result.status).json({
      ...result.data,
      _debug: {
        durationMs,
        httpStatus: result.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 8. Webhook Receiver (Accepts callbacks from Borzo for statuses receiving)
const handleWebhook = (req: any, res: express.Response) => {
  const signatureHeader = (req.headers["x-dv-signature"] || req.headers["x-dv-auth-token"]) as string | undefined;
  const callbackToken = process.env.BORZO_CALLBACK_TOKEN;

  let isSignatureValid: boolean | null = null;
  if (callbackToken && signatureHeader) {
    // Check 1: Direct token match
    if (signatureHeader.toLowerCase() === callbackToken.toLowerCase()) {
      isSignatureValid = true;
    } else if (req.rawBody) {
      // Check 2: HMAC-SHA256 signature verification
      try {
        const computed = crypto.createHmac("sha256", callbackToken).update(req.rawBody).digest("hex");
        isSignatureValid = computed.toLowerCase() === signatureHeader.toLowerCase();
      } catch (e) {
        isSignatureValid = false;
      }
    }
  }

  const event: WebhookEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    receivedAt: new Date().toISOString(),
    signatureHeader,
    isSignatureValid,
    headers: req.headers,
    body: req.body,
  };

  webhookEvents.unshift(event);
  if (webhookEvents.length > 50) {
    webhookEvents.pop();
  }

  console.log(`[BORZO WEBHOOK] Callback received:`, JSON.stringify(req.body, null, 2));

  // Borzo documentation requires responding with 200 OK and { is_successful: true }
  res.status(200).json({ is_successful: true, received: true });
};

// Mount webhook on recommended endpoints
app.post("/api/borzo/webhook", handleWebhook);
app.post("/api/webhook", handleWebhook);
app.post("/webhook", handleWebhook);

// 9. Inspect stored webhooks
app.get("/api/borzo/webhooks", (_req, res) => {
  res.json({
    total: webhookEvents.length,
    events: webhookEvents,
    callbackUrl: "https://test.nepalitales.com/api/borzo/webhook",
  });
});

app.delete("/api/borzo/webhooks", (_req, res) => {
  webhookEvents.length = 0;
  res.json({ is_successful: true, message: "Cleared webhook logs" });
});

// 10. Simulate a webhook event locally
app.post("/api/borzo/webhooks/simulate", (req, res) => {
  const sampleEvent: WebhookEvent = {
    id: `sim_${Date.now()}`,
    receivedAt: new Date().toISOString(),
    signatureHeader: "simulated_sha256_sig",
    isSignatureValid: true,
    headers: { "user-agent": "Borzo-Webhook-Simulator/1.0" },
    body:
      req.body && Object.keys(req.body).length > 0
        ? req.body
        : {
            event_type: "order_status_changed",
            order_id: 98325694,
            status: "active",
            status_description: "Courier is on the way to Nepali Tales kitchen",
            courier: {
              courier_id: 7704738,
              name: "Salman",
              surname: "Aziz Ahmad",
              phone: "919112572641",
            },
            updated_at: new Date().toISOString(),
          },
  };
  webhookEvents.unshift(sampleEvent);
  res.json({ is_successful: true, event: sampleEvent });
});
