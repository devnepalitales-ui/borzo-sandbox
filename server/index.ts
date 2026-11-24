import path from "path";
import fs from "fs";
import express from "express";
import { app, borzo } from "./app";

const PORT = process.env.PORT || 4000;
const distPath = path.join(__dirname, "../dist");

// Serve Vite production build if exists locally
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Borzo Service running on port ${PORT}`);
  console.log(`📦 Environment: ${borzo.getEnvironment().toUpperCase()}`);
  console.log(`🌐 Base URL: ${borzo.getConfig().baseUrl}`);
  console.log(`🔔 Webhook Callback URL: https://test.nepalitales.com/api/borzo/webhook`);
  console.log(`=======================================================`);
});
