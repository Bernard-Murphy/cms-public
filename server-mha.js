import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import Groq from "groq-sdk";
import cors from "cors";
import http from "http";
import fileUpload from "express-fileupload";
import AWS from "aws-sdk";
import prompt from "./prompt.js";
import session from "express-session";
import MongoDBStore from "connect-mongodb-session";
import { MongoClient } from "mongodb";
import crypto from "crypto";
import { URL } from "node:url";
import fs from "fs";
import { Server as ioServer } from "socket.io";
import socketHandler from "./socketHandler.js";
import { createAdapter } from "@socket.io/mongo-adapter";

const __dirname = new URL(".", import.meta.url).pathname;

dotenv.config({ path: __dirname + "/.env" });

AWS.config.update({
  region: process.env.REGION,
});

const mongoUrl =
  process.env.MONGO_URL ||
  "mongodb+srv://" +
    process.env.MONGO_USER +
    ":" +
    encodeURIComponent(process.env.MONGO_PASSWORD) +
    "@" +
    process.env.MONGO_HOST +
    "/?retryWrites=true&w=majority";

const hitlers = ["virgil", "chad", "hitler", "adolf"];

const client = new MongoClient(mongoUrl);

const port = process.env.SERVER_PORT || 1488;

const app = express();
const sessionStore = new MongoDBStore(session)({
  uri: mongoUrl,
  databaseName: process.env.DATABASE,
  collection: "sessions",
});
const sessionConfig = {
  name: "MyHitlerApp",
  secret: process.env.COOKIE_SECRET,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secure: false,
    httpOnly: false,
  },
  store: sessionStore,
  resave: true,
  saveUninitialized: false,
};
const sessionObj = session(sessionConfig);

app.use(sessionObj);
app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use(express.static(__dirname + "/dist"));

app.use((req, res, next) => {
  if (!req.session.tempID)
    req.session.tempID = crypto.randomBytes(8).toString("hex");
  next();
});

const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/trans", async (req, res) => {
  try {
    // console.log("/trans", req.files);
    const filePath = __dirname + "/temp/" + req.files.audio.md5 + ".webm";
    fs.writeFileSync(filePath, req.files.audio.data);
    const transcription = await groqClient.audio.transcriptions.create({
      file:
        String(process.env.DEV) === "true"
          ? fs.createReadStream(__dirname + "/public/audio.wav")
          : fs.createReadStream(filePath),
      model: "whisper-large-v3-turbo",
      // model: "whisper-large-v3",
      // model: "distil-whisper-large-v3-en",
    });
    fs.unlinkSync(filePath);
    res.status(200).json({
      text: transcription.text.trim(),
    });
  } catch (err) {
    console.log("/trans error", err);
    res.sendStatus(500);
  }
});

app.post("/ask", async (req, res) => {
  try {
    // console.log("ask");
    // console.log("/ask", req.body, req.body.messages[0].parts);

    const item = req.body.messages[req.body.messages.length - 1];

    const message = item.parts[0].text;

    // console.log(item);

    if (item.role === "assistant") return res.status(200).json({});
    // return res.sendStatus(200);

    const db = client.db("askHitler");

    const userMessage = {
      _id: crypto.randomBytes(8).toString("hex"),
      timestamp: new Date(),
      to: "adolf",
      removed: false,
      message: message,
      from: req.session.tempID,
      decrypted: true,
    };

    const previousMessages = await db
      .collection("virgilChad")
      .find({
        $and: [
          {
            $or: [
              {
                from: req.session.tempID,
              },
              {
                to: req.session.tempID,
              },
            ],
          },
        ],
      })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    const preReqs = [];
    preReqs.push({
      role: "system",
      content: prompt,
    });

    previousMessages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .forEach((message) =>
        preReqs.push({
          role: message.from !== req.session.tempID ? "assistant" : "user",
          content: message.message,
        })
      );
    // console.log([
    //   ...preReqs,
    //   {
    //     role: "user",
    //     content: message,
    //   },
    // ]);
    let chatCompletion;
    const veniceClient = new OpenAI({
      apiKey: process.env.VENICE_KEY,
      baseURL: "https://api.venice.ai/api/v1",
    });
    chatCompletion = await veniceClient.chat.completions.create({
      model: "dolphin-2.9.2-qwen2-72b",
      messages: [
        ...preReqs,
        {
          role: "user",
          content: message,
        },
      ],
      venice_parameters: {
        include_venice_system_prompt: false,
      },
    });
    if (typeof chatCompletion === "string")
      chatCompletion = JSON.parse(chatCompletion);
    const aiMessage = {
      _id: crypto.randomBytes(8).toString("hex"),
      timestamp: new Date(),
      to: req.session.tempID,
      id: crypto.randomUUID(),
      removed: false,
      message: chatCompletion.choices[0].message.content,
      from: "adolf",
      decrypted: true,
    };

    await db
      .collection("virgilChad")
      .insertMany([userMessage, { ...aiMessage, message: aiMessage.message }]);
    res.status(200).json({
      message: {
        role: "assistant",
        content: aiMessage.message,
        parts: [{ type: "text", text: aiMessage.message }],
      },
    });
  } catch (err) {
    console.log("/ask error", err);
    res.sendStatus(500);
  }
});

app.post("/load-more", async (req, res) => {
  try {
    const newMessages = await db
      .collection("virgilChad")
      .find({
        $and: [
          {
            $or: [
              {
                from: req.session.tempID,
              },
              {
                to: req.session.tempID,
              },
            ],
          },
          {
            _id: {
              $nin: req.body.ids,
            },
          },
        ],
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    res.status(200).json({
      newMessages: newMessages
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((message) => ({
          role: hitlers.includes(message.from) ? "assistant" : "user",
          content: message.message,
          parts: [{ type: "text", text: message.message }],
        })),
    });
  } catch (err) {
    console.log("/load-more error", err);
    res.sendStatus(500);
  }
});

app.get("/clear", async (req, res) => {
  try {
    if (!req.session?.tempID) return res.sendStatus(200);
    await client
      .db("askHitler")
      .collection("virgilChad")
      .deleteMany({
        $and: [
          {
            $or: [
              {
                from: req.session.tempID,
              },
              {
                to: req.session.tempID,
              },
            ],
          },
        ],
      });
    res.sendStatus(200);
  } catch (err) {
    console.log("/clear error", err);
    res.sendStatus(500);
  }
});

app.get("/init", async (req, res) => {
  try {
    if (!req.session?.tempID) return res.status(200).json({ messages: [] });
    const messages = await client
      .db("askHitler")
      .collection("virgilChad")
      .find({
        $or: [
          {
            from: req.session.tempID,
          },
          {
            to: req.session.tempID,
          },
        ],
      })
      .sort({ timestamp: 1 })
      .limit(50)
      .toArray();
    res.status(200).json({
      messages: messages.map((message) => ({
        role: hitlers.includes(message.from) ? "assistant" : "user",
        content: message.message,
        parts: [{ type: "text", text: message.message }],
      })),
    });
  } catch (err) {
    console.log("/init error", err);
    res.sendStatus(500);
  }
});

const server = http.createServer(app);
const io = new ioServer(server, {
  cors: true,
});

const socketCollection = client.db("sessionServer").collection("sockets");

io.adapter(createAdapter(socketCollection));

io.on("connection", (socket) => socketHandler(io, socket));

server.listen(port, () => console.log("MyHitlerApp running on port", port));
