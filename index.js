const express = require("express");
const cors = require("cors");
const NodeMediaServer = require("node-media-server");
const httpProxy = require("http-proxy");

// Create Express app
const app = express();
const proxy = httpProxy.createProxyServer();

// Configure CORS for Express
app.use(
  cors({
    origin: "*", // In production, change to your specific domains
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true,
  })
);

// Your existing Node-Media-Server config
const nms = new NodeMediaServer({
  rtmp: {
    port: 1935,
    chunk_size: 4096,
    host: "rtmp-stream.buyon.lk",
    gop_cache: true,
    ping: 60,
    ping_timeout: 30,
    warnings: true,
  },
  http: {
    port: 8000,
    mediaroot: "./media",
    host: "view-stream.buyon.lk",
    allow_origin: "*",
  },
  webrtc: {
    port: 8080,
    host: "view-stream.buyon.lk",
  },
  trans: {
    ffmpeg: "/usr/bin/ffmpeg",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=5:hls_list_size=3:hls_flags=delete_segments:hls_init_time=4]",
        args: "-c:v libx264 -preset veryfast -tune zerolatency -c:a aac -ar 44100 -b:a 128k",
      },
    ],
  },
  relay: {
    ffmpeg: "/usr/bin/ffmpeg",
    tasks: [],
    edge: process.env.NODE_ENV === "production" ? process.env.EDGE_SERVER : "",
  },
});

// Proxy all requests to Node-Media-Server
app.all("*", (req, res) => {
  proxy.web(req, res, {
    target: "http://localhost:8000",
    ws: true,
  });
});

// Handle proxy errors
proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  res.status(500).send("Proxy error");
});

// Your existing event handlers
nms.on("prePublish", (id, streamPath, args) => {
  console.log("[NodeEvent on prePublish]", `id=${id} streamPath=${streamPath}`);
});

nms.on("prePlay", (id, streamPath, args) => {
  console.log("[NodeEvent on prePlay]", `id=${id} streamPath=${streamPath}`);
});

// Start Node-Media-Server
nms.run();

// Start Express on port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
