/**
 * Borzo Business API (v1.8) Client
 * Supports both Live Production & Sandbox Test environments
 */

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
  vehicle_type_id?: number; // 8 = Motorbike
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
