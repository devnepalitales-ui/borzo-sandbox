# Nepali Tales — Borzo Delivery Service Dispatcher (Business API v1.8)

A dedicated, production-ready delivery dispatch portal designed for the **Nepali Tales Founder & Team** to book real Borzo bike deliveries to friends, family, and customers, calculate exact delivery fares, and provide real-time tracking links.

---

## 🌐 Deployment: `test.nepalitales.com`

When deployed at `test.nepalitales.com`, the app provides a full web interface for:
1. **Live Fare Estimation (`/calculate-order`)**: Enter any address in Mumbai/Thane to preview exact courier delivery fees (₹), road driving distance (km), and arrival time window.
2. **Book Real Borzo Delivery (`/create-order`)**: Dispatch a courier from the Nepali Tales Cloud Kitchen (`Metropolis Rivera / Aquaris Phase 2, Kasarvadavali, Thane West`).
3. **1-Click WhatsApp Sharing**: Automatically generates ready-to-send WhatsApp messages with live tracking links for recipients.
4. **Order History & Courier Tracker (`/orders`)**: Real-time statuses (`available`, `active`, `completed`, `canceled`), courier name, phone, and cancel options.
5. **Webhook Status Receiver (`/api/borzo/webhook`)**: Receives automated callbacks from Borzo when courier arrives, picks up, delivers, or cancels.

---

## ⚙️ Borzo Integration Cabinet Configuration

Log in to your [Borzo Cabinet](https://borzodelivery.com/in/cabinet/integration) and enter the following settings under **"Callback URL for statuses receiving"**:

| Setting | Value to Enter | Notes |
| :--- | :--- | :--- |
| **Callback URL** | `https://test.nepalitales.com/api/borzo/webhook` | Borzo sends HTTP POST status updates here |
| **Callback token** | `nt_borzo_callback_2026` | Used for HMAC-SHA256 signature verification in `X-DV-Signature` header |

> **Note on Callback Token:** You can choose any secure secret string (e.g. `nt_borzo_callback_2026`). Enter it in Borzo's cabinet, and put the same value in your server `.env` as `BORZO_CALLBACK_TOKEN=nt_borzo_callback_2026`.

---

## 🔑 Environment Variables (`.env`)

```env
PORT=4000
# Live Borzo Production API
BORZO_ENV=production
BORZO_BASE_URL=https://robot-in.borzodelivery.com/api/business/1.8
BORZO_AUTH_TOKEN=1AD41C9342210CAF081601ABA8A30EB851514A89
BORZO_CLIENT_ID=8138640

# Test Sandbox Fallback (Switchable in UI)
BORZO_TEST_BASE_URL=https://robotapitest-in.borzodelivery.com/api/business/1.8
BORZO_TEST_AUTH_TOKEN=9445E42F83FBC1E811714F71ACE60EBC2979A4FE
BORZO_TEST_CLIENT_ID=119490

# Nepali Tales Cloud Kitchen Coordinates
KITCHEN_ADDRESS=7XCC+R9Q Metropolis Aquaris Phase 2, Ghodbunder Rd, near Ace Homes, Kasarvadavali, Thane West, Thane, Maharashtra 400615, India
KITCHEN_PHONE=917585080407
KITCHEN_NAME=Nepali Tales Kitchen

# Webhook Secret Token
BORZO_CALLBACK_TOKEN=nt_borzo_callback_2026
```

---

## 🚀 Running & Deploying

### Build & Run locally:
```bash
cd borzo-sandbox

# 1. Install dependencies
bun install   # or npm install

# 2. Build React frontend
bun run build # or npm run build

# 3. Start server (serves API & pre-built UI on port 4000)
bun run start # or npm start
```

### Running on your Server / Subdomain (`test.nepalitales.com`):
Set up your Nginx / Caddy reverse proxy or Cloudflare Tunnel to forward `test.nepalitales.com` traffic to local port `4000`:

```nginx
server {
    server_name test.nepalitales.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
