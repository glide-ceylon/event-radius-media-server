const NodeMediaServer = require("node-media-server");

const nms = new NodeMediaServer({
  rtmp: {
    port: 1935,
    chunk_size: 4096, // Reduced from 60000 for better streaming performance
    host: "rtmp.stream.buyon.lk",
    gop_cache: true,
    ping: 60, // Increased for more stable connections
    ping_timeout: 30, // Reduced to detect disconnections faster
    warnings: true, // Enable warnings for debugging
  },
  http: {
    port: 8000,
    mediaroot: "./media",
    allow_origin: "*",
    host: "view.stream.buyon.lk",
    cors: {
      enabled: true, // Enable CORS explicitly
      origin: "*", // Allow all origins - modify in production
      methods: "GET,POST,OPTIONS",
      allowedHeaders: "*",
      exposedHeaders: "*",
      credentials: true,
      maxAge: 1728000,
    },
  },
  trans: {
    ffmpeg: "/usr/bin/ffmpeg",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags:
          "[hls_time=2:hls_list_size=3:hls_flags=delete_segments:hls_init_time=4]",
        // Added settings for better quality/performance balance
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

nms.on("prePublish", (id, streamPath, args) => {
  console.log(id, streamPath, args);
});

nms.on("prePlay", (id, streamPath, args) => {
  console.log(id, streamPath, args);
});

const streamMapping = {
  streamer1: {
    publishKey: "pub_5f3a8291e4b0c9a7d6b2c1a0",
    viewKeys: ["view_7d9f2e4a8b5c3n6m1k9h7g5", "view_2b8n4m6k9h3g5f1d7s9a4x2"],
  },
  streamer2: {
    publishKey: "pub_9d2c4b7a6e8f1n3m5k9h2g4",
    viewKeys: ["view_3f5h7j9k2n4m6q8w9e1r3t5", "view_8k2m4n6p9r3t5v7x1z8b4d6"],
  },
};

function validatePublishKey(streamKey, providedKey) {
  const stream = streamMapping[streamKey];
  if (!stream) {
    return false; // Stream not found
  }
  return stream.publishKey === providedKey;
}

function validateViewKey(streamKey, providedKey) {
  const stream = streamMapping[streamKey];
  if (!stream) {
    return false; // Stream not found
  }
  return stream.viewKeys.includes(providedKey);
}

nms.run();
