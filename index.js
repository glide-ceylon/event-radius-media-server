const NodeMediaServer = require("node-media-server");

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    mediaroot: "./media",
    allow_origin: "*",
  },
  trans: {
    ffmpeg: "./ffmpeg/ffmpeg.exe",
    tasks: [
      {
        app: "live",
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
      },
    ],
  },
};

const nms = new NodeMediaServer(config);

nms.on("prePublish", async (id, streamPath, args) => {
  const token = args.headers ? args.headers.Authorization : null;
  const streamKey = args.streamPath.split("/").pop(); // Extract stream key
  const session = nms.getSession(id);

  console.log(
    `[NodeEvent on prePublish] streamPath=${streamPath} args=${JSON.stringify(
      args
    )}`
  );

  if (!token) {
    console.log("Connection rejected: No token provided");
    session.reject();
    return;
  }

  try {
    const decoded = await verifyTokenWithAuthServer(token);

    // Check if the user has access to the stream
    if (decoded.allowedStreams.includes(streamKey)) {
      console.log(`Connection allowed for stream: ${streamKey}`);
    } else {
      console.log(`Connection denied for stream: ${streamKey}`);
      session.reject();
    }
  } catch (err) {
    console.log("Connection rejected: Invalid token");
    const session = nms.getSession(id);
    session.reject();
  }
});

async function verifyTokenWithAuthServer(token) {
  // allow all streams for now
  return { allowedStreams: ["stream1", "stream2"] };
}

nms.on("preConnect", (id, args) => {
  console.log(
    "[NodeEvent on preConnect]",
    `id=${id} args=${JSON.stringify(args)}`
  );
});

nms.on("postConnect", (id, args) => {
  console.log(
    "[NodeEvent on postConnect]",
    `id=${id} args=${JSON.stringify(args)}`
  );
});

nms.run();

// nms.run();

// nms.on("preConnect", (id, args) => {
//   console.log(
//     "[NodeEvent on preConnect]",
//     `id=${id} args=${JSON.stringify(args)}`
//   );
//   // let session = nms.getSession(id);
//   // session.reject();
// });

// nms.on("postConnect", (id, args) => {
//   console.log(
//     "[NodeEvent on postConnect]",
//     `id=${id} args=${JSON.stringify(args)}`
//   );
// });

// nms.on("doneConnect", (id, args) => {
//   console.log(
//     "[NodeEvent on doneConnect]",
//     `id=${id} args=${JSON.stringify(args)}`
//   );
// });

// nms.on("prePublish", (id, StreamPath, args) => {
//   console.log(
//     "[NodeEvent on prePublish]",
//     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
//   );
//   // let session = nms.getSession(id);
//   // session.reject();
// });

// nms.on("postPublish", (id, StreamPath, args) => {
//   console.log(
//     "[NodeEvent on postPublish]",
//     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
//   );
// });

// nms.on("donePublish", (id, StreamPath, args) => {
//   console.log(
//     "[NodeEvent on donePublish]",
//     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
//   );
// });

// nms.on("prePlay", (id, StreamPath, args) => {
//   console.log(
//     "[NodeEvent on prePlay]",
//     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
//   );
//   // let session = nms.getSession(id);
//   // session.reject();
// });

// nms.on("postPlay", (id, StreamPath, args) => {
//   console.log(
//     "[NodeEvent on postPlay]",
//     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
//   );
// });

// nms.on("donePlay", (id, StreamPath, args) => {
//   console.log(
//     "[NodeEvent on donePlay]",
//     `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
//   );
// });

// nms.on("logMessage", (...args) => {
//   // custom logger log message handler
// });

// nms.on("errorMessage", (...args) => {
//   // custom logger error message handler
// });

// nms.on("debugMessage", (...args) => {
//   // custom logger debug message handler
// });

// nms.on("ffDebugMessage", (...args) => {
//   // custom logger ffmpeg debug message handler
// });

// console.log(nms);
