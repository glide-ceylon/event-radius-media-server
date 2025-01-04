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
  const streamKey = streamPath.split("/").pop(); // Extract stream key, e.g., streamer1
  const publishKey = args.query.key; // Publisher provides this as a query parameter

  if (!validatePublishKey(streamKey, publishKey)) {
    console.log(`[prePublish] Invalid publish key for stream ${streamKey}`);
    const session = nms.getSession(id);
    session.reject();
    return;
  }

  console.log(`[prePublish] Valid publish key for stream ${streamKey}`);
});

nms.on("prePlay", (id, streamPath, args) => {
  const streamKey = streamPath.split("/").pop(); // Extract stream key, e.g., streamer1
  const viewKey = args.query.key; // Viewer provides this as a query parameter

  if (!validateViewKey(streamKey, viewKey)) {
    console.log(`[prePlay] Invalid view key for stream ${streamKey}`);
    const session = nms.getSession(id);
    session.reject();
    return;
  }

  console.log(`[prePlay] Valid view key for stream ${streamKey}`);
});

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
