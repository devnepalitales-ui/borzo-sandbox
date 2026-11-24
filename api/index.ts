import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// ---------------------------------------------------------------------------
// Borzo Business API (v1.8) Client
// ---------------------------------------------------------------------------

export interface BorzoContactPerson {
  phone: string;
  name?: string | null;
}

export interface BorzoPoint {
  point_id?: number | null;
  delivery_id?: number | null;
  client_order_id?: string | null;
  address: string;
  latitude?: string | null;
  longitude?: string | null;
  contact_person: BorzoContactPerson;
  required_start_datetime?: string | null;
  required_finish_datetime?: string | null;
  taking_amount?: string;
  buyout_amount?: string;
  note?: string | null;
  is_order_payment_here?: boolean;
  building_number?: string | null;
  entrance_number?: string | null;
  intercom_code?: string | null;
  floor_number?: string | null;
  apartment_number?: string | null;
  invisible_mile_navigation_instructions?: string | null;
  is_cod_cash_voucher_required?: boolean;
  packages?: Array<{
    order_package_id?: number;
    ware_code?: string | null;
    description?: string | null;
    items_count?: number;
    item_payment_amount?: string;
    nomenclature_code?: string | null;
  }>;
}

export interface CalculateOrderPayload {
  type?: "standard" | "vip_delivery" | "endofday";
  matter: string;
  vehicle_type_id?: number;
  total_weight_kg?: number;
  insurance_amount?: string;
  is_client_notification_enabled?: boolean;
  is_contact_person_notification_enabled?: boolean;
  is_route_optimizer_enabled?: boolean;
  loaders_count?: number;
  is_motobox_required?: boolean;
  is_thermobox_required?: boolean;
  payment_method?: string | null;
  promo_code?: string | null;
  points: BorzoPoint[];
}

export interface CreateOrderPayload extends CalculateOrderPayload {
  is_return_required?: boolean;
}

export interface EditOrderPayload {
  order_id: number;
  matter?: string;
  payment_method?: string;
  points?: Array<Partial<BorzoPoint> & { point_id?: number }>;
  [key: string]: any;
}

export interface BorzoResponse<T = any> {
  is_successful: boolean;
  order?: T;
  orders?: T[];
  orders_count?: number;
  courier?: any;
  errors?: string[];
  parameter_errors?: Record<string, any>;
  warnings?: string[];
  parameter_warnings?: Record<string, any>;
}

export class BorzoClient {
  private env: "production" | "test";
  private baseUrl: string;
  private token: string;
  private clientId: string;

  constructor() {
    this.env = (process.env.BORZO_ENV as "production" | "test") || "production";
    if (this.env === "production") {
      this.baseUrl = (process.env.BORZO_BASE_URL || "https://robot-in.borzodelivery.com/api/business/1.8").replace(/\/$/, "");
      this.token = process.env.BORZO_AUTH_TOKEN || "1AD41C9342210CAF081601ABA8A30EB851514A89";
      this.clientId = process.env.BORZO_CLIENT_ID || "8138640";
    } else {
      this.baseUrl = (process.env.BORZO_TEST_BASE_URL || "https://robotapitest-in.borzodelivery.com/api/business/1.8").replace(/\/$/, "");
      this.token = process.env.BORZO_TEST_AUTH_TOKEN || "9445E42F83FBC1E811714F71ACE60EBC2979A4FE";
      this.clientId = process.env.BORZO_TEST_CLIENT_ID || "119490";
    }
  }

  setEnvironment(env: "production" | "test") {
    this.env = env;
    if (env === "production") {
      this.baseUrl = (process.env.BORZO_BASE_URL || "https://robot-in.borzodelivery.com/api/business/1.8").replace(/\/$/, "");
      this.token = process.env.BORZO_AUTH_TOKEN || "1AD41C9342210CAF081601ABA8A30EB851514A89";
      this.clientId = process.env.BORZO_CLIENT_ID || "8138640";
    } else {
      this.baseUrl = (process.env.BORZO_TEST_BASE_URL || "https://robotapitest-in.borzodelivery.com/api/business/1.8").replace(/\/$/, "");
      this.token = process.env.BORZO_TEST_AUTH_TOKEN || "9445E42F83FBC1E811714F71ACE60EBC2979A4FE";
      this.clientId = process.env.BORZO_TEST_CLIENT_ID || "119490";
    }
  }

  getEnvironment() {
    return this.env;
  }

  private async request<T = any>(endpoint: string, method: "GET" | "POST", body?: any): Promise<{ status: number; data: BorzoResponse<T> }> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      "X-DV-Auth-Token": this.token,
    };

    let fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "POST") {
      headers["Content-Type"] = "application/json; charset=utf-8";
      fetchOptions.body = JSON.stringify(body ?? {});
    }

    try {
      const response = await fetch(url, fetchOptions);
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          is_successful: false,
          errors: [`HTTP_${response.status}: Failed to parse JSON response (${text.slice(0, 100)})`],
        };
      }

      return {
        status: response.status,
        data: data as BorzoResponse<T>,
      };
    } catch (err: any) {
      return {
        status: 500,
        data: {
          is_successful: false,
          errors: [err?.message || "Failed to connect to Borzo server"],
        },
      };
    }
  }

  async calculateOrder(payload: CalculateOrderPayload) {
    return this.request("/calculate-order", "POST", payload);
  }

  async createOrder(payload: CreateOrderPayload) {
    return this.request("/create-order", "POST", payload);
  }

  async editOrder(payload: EditOrderPayload) {
    return this.request("/edit-order", "POST", payload);
  }

  async cancelOrder(orderId: number) {
    return this.request("/cancel-order", "POST", { order_id: orderId });
  }

  async getOrders(params?: { status?: string; offset?: number; count?: number; order_id?: number | number[] }) {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.offset !== undefined) query.set("offset", String(params.offset));
    if (params?.count !== undefined) query.set("count", String(params.count));
    if (params?.order_id) {
      if (Array.isArray(params.order_id)) {
        params.order_id.forEach((id) => query.append("order_id[]", String(id)));
      } else {
        query.set("order_id", String(params.order_id));
      }
    }
    const qs = query.toString();
    return this.request(`/orders${qs ? `?${qs}` : ""}`, "GET");
  }

  async getCourier(orderId: number) {
    return this.request(`/courier?order_id=${orderId}`, "GET");
  }

  async sendRaw(endpoint: string, method: "GET" | "POST", body?: any) {
    return this.request(endpoint, method, body);
  }

  getConfig() {
    return {
      env: this.env,
      baseUrl: this.baseUrl,
      tokenMasked: this.token ? `${this.token.slice(0, 6)}...${this.token.slice(-4)}` : "NOT_CONFIGURED",
      token: this.token,
      clientId: this.clientId,
    };
  }
}

// ---------------------------------------------------------------------------
// Express Application & Routes
// ---------------------------------------------------------------------------

export const app = express();
export const borzo = new BorzoClient();

app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

interface WebhookEvent {
  id: string;
  receivedAt: string;
  signatureHeader?: string;
  isSignatureValid?: boolean | null;
  headers: Record<string, any>;
  body: any;
}
const webhookEvents: WebhookEvent[] = [];

const router = express.Router();

// Health Check
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "borzo-sandbox-server",
    env: borzo.getEnvironment(),
    timestamp: new Date().toISOString(),
  });
});

// App Config & Defaults
router.get("/config", (_req, res) => {
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

// Switch Environment
router.post("/borzo/switch-env", (req, res) => {
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
router.post("/borzo/calculate", async (req, res) => {
  try {
    const result = await borzo.calculateOrder(req.body);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 2. Create Order
router.post("/borzo/create", async (req, res) => {
  try {
    const result = await borzo.createOrder(req.body);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 3. Edit Order
router.post("/borzo/edit", async (req, res) => {
  try {
    const result = await borzo.editOrder(req.body);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ is_successful: false, errors: [error?.message || "Internal server error"] });
  }
});

// 4. Cancel Order
router.post("/borzo/cancel", async (req, res) => {
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
router.get("/borzo/orders", async (req, res) => {
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
router.get("/borzo/courier", async (req, res) => {
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
router.post("/borzo/raw", async (req, res) => {
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

// 8. Webhook Receiver
const handleWebhook = (req: any, res: express.Response) => {
  const signatureHeader = (req.headers["x-dv-signature"] || req.headers["x-dv-auth-token"]) as string | undefined;
  const callbackToken = process.env.BORZO_CALLBACK_TOKEN;

  let isSignatureValid: boolean | null = null;
  if (callbackToken && signatureHeader) {
    if (signatureHeader.toLowerCase() === callbackToken.toLowerCase()) {
      isSignatureValid = true;
    } else if (req.rawBody) {
      try {
        const computed = crypto.createHmac("sha256", callbackToken).update(req.rawBody).digest("hex");
        isSignatureValid = computed.toLowerCase() === signatureHeader.toLowerCase();
      } catch {
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
  res.status(200).json({ is_successful: true, received: true });
};

router.post("/borzo/webhook", handleWebhook);
router.post("/webhook", handleWebhook);

// 9. Inspect Webhook Logs
router.get("/borzo/webhooks", (_req, res) => {
  res.json({
    total: webhookEvents.length,
    events: webhookEvents,
    callbackUrl: "https://test.nepalitales.com/api/borzo/webhook",
  });
});

router.delete("/borzo/webhooks", (_req, res) => {
  webhookEvents.length = 0;
  res.json({ is_successful: true, message: "Cleared webhook logs" });
});

// 10. Simulate Webhook
router.post("/borzo/webhooks/simulate", (req, res) => {
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

// Mount the API router at both /api and / to seamlessly support Vercel rewrites & direct requests
app.use("/api", router);
app.use("/", router);

// Vercel Serverless Function entry point
export default function handler(req: any, res: any) {
  return app(req, res);
}
