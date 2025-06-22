import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import Groq from "groq-sdk";
import cors from "cors";
import http from "http";
import fileUpload from "express-fileupload";
import AWS from "aws-sdk";
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

const port = process.env.SERVER_PORT;

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

const server = http.createServer(app);
const io = new ioServer(server, {
  cors: true,
});

const socketCollection = client.db("sessionServer").collection("sockets");

io.adapter(createAdapter(socketCollection));

io.on("connection", (socket) => socketHandler(io, socket));

server.listen(port, () => console.log("MyHitlerApp running on port", port));
