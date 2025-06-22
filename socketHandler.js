import { OpenAI } from "openai";
import axios from "axios";
import allGenres from "./genres.js";
import allMoods from "./moods.js";
import { URL } from "node:url";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import crypto from "crypto";
import https from "https";

dotenv.config();

const s3 = new S3Client({
  endpoint: process.env.STORJ_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORJ_SECRET_ACCESS_ID,
    secretAccessKey: process.env.STORJ_SECRET_ACCESS_KEY,
  },
  region: process.env.REGION,
});

let __dirname = new URL(".", import.meta.url).pathname;

const randomElements = (arr) => {
  let numerator = 2;
  let denominator = 3;
  let toPick = 1;
  let finished = false;
  const elements = [];
  let clone = Array.from(arr);
  while (!finished && toPick < arr.length) {
    const random = Math.random();
    if (random < numerator / denominator) {
      toPick++;
      numerator++;
      denominator += 2;
    } else finished = true;
  }
  Array.from(Array(toPick).keys()).forEach(() => {
    const item = clone[Math.floor(Math.random() * clone.length)];
    elements.push(item);
    clone = clone.filter((i) => i !== item);
  });
  return elements;
};

const uploadToFeednana = async (audioFile, lyrics) => {
  try {
    console.log(audioFile);
    console.log(
      `${__dirname.includes("C:/") ? "." : __dirname}/temp/${
        audioFile.split("/")[audioFile.split("/").length - 1]
      }`
    );
    const audio = fs.readFileSync(
      `${__dirname.includes("C:/") ? "." : __dirname}/temp/${
        audioFile.split("/")[audioFile.split("/").length - 1]
      }`
    );
    const md5_audio =
      crypto.createHash("md5").update(audioFile).digest("hex") +
      crypto.randomBytes(4).toString("hex");
    await s3.send(
      new PutObjectCommand({
        Body: audio,
        Bucket: "f.feednana.com",
        Key: "files/" + md5_audio + ".mp3",
        ACL: "public-read",
        ContentType: "audio/mp3",
      })
    );

    const body = {
      name: "",
      manifesto: lyrics,
      captchaKey: "naaah",
      files: [
        {
          mimeType: "video/mp3",
          type: "audio",
          main: md5_audio + ".mp3",
        },
      ],
      commentsDisabled: false,
      nsfw: false,
      singleComments: true,
      hidden: false,
    };
    console.log("body", body);
    await axios.post("https://feednana.com/images/upload", body);
    return `https://f.feednana.com/files/${md5_audio}.mp3`;
  } catch (err) {
    console.log("upload to feed nana error", err);
    return "";
  }
};

const fetchAndWriteFile = (url) =>
  new Promise((resolve, reject) => {
    try {
      https.get(url, (res) => {
        try {
          const filename = `${
            __dirname.includes("C:/") ? "." : __dirname
          }/temp/${url.split("/")[url.split("/").length - 1]}`;
          console.log("res", res.statusCode, filename);
          if (res.statusCode !== 200) {
            return reject(res);
          }
          console.log(
            `${__dirname.includes("C:/") ? "." : __dirname}/temp/${
              url.split("/")[url.split("/").length - 1]
            }`
          );
          const fileWriter = fs
            .createWriteStream(
              `${__dirname.includes("C:/") ? "." : __dirname}/temp/${
                url.split("/")[url.split("/").length - 1]
              }`
            )
            .on("finish", () => resolve(filename))
            .on("error", reject);
          res.pipe(fileWriter);
        } catch (err) {
          console.log("fetchAndWriteFile error", err);
          reject(err);
        }
      });
    } catch (err) {
      console.log("fetchAndWriteFile error", err);
      reject(err);
    }
  });

const getMurekaJob = (trace_id) =>
  new Promise((resolve, reject) => {
    try {
      console.log("https://api.mureka.ai/v1/song/query/" + trace_id);
      setTimeout(
        () =>
          axios
            .get("https://api.mureka.ai/v1/song/query/" + trace_id, {
              headers: {
                Authorization: `Bearer ${process.env.MUREKA_KEY}`,
              },
            })
            .then(async (res) => {
              try {
                switch (res.data.status) {
                  case "succeeded":
                    return resolve(res.data);
                  case "preparing":
                  case "running":
                    const murekaJob = await getMurekaJob(trace_id);
                    return resolve(murekaJob);
                  default:
                    console.log("oob mureka status", res.data);
                    return reject("");
                }
              } catch (err) {
                console.log("getMurekaJob error", err);
                reject(err);
              }
            })
            .catch((err) => {
              console.log("getMurekaJob error", err);
              reject(err);
            }),
        10000
      );
    } catch (err) {
      console.log("getMurekaJob error", err);
      reject(err);
    }
  });

const murekaQuery = (lyrics, musicStyle) =>
  new Promise((resolve, reject) => {
    try {
      let prompt = musicStyle;
      if (!prompt) {
        const genres = randomElements(allGenres);
        const moods = randomElements(allMoods);
        prompt = `${genres.join(", ")} ${moods.join(", ")}`;
      }

      const options = {
        headers: {
          Authorization: `Bearer ${process.env.MUREKA_KEY}`,
          "Content-Type": "application/json",
        },
      };
      const body = {
        lyrics,
        model: "auto",
        prompt,
      };
      axios
        .post("https://api.mureka.ai/v1/song/generate", body, options)
        .then(async (res) => {
          try {
            console.log("res", res.data);
            const job = await getMurekaJob(res.data.id);
            resolve(job);
          } catch (err) {
            console.log("murekaQuery error", err);
            reject(err);
          }
        })
        .catch((err) => {
          console.log("murekaQuery error", err);
          reject(err);
        });
      console.log("body", body);
    } catch (err) {
      console.log(err, "murekaQuery error");
      reject(err);
    }
  });

const socketHandler = (io, socket) => {
  try {
    console.log("connection");

    socket.on("new-song", async (musicPrompt, customLyrics, musicStyle) => {
      try {
        console.log("new song", musicPrompt, customLyrics, musicStyle);

        let lyrics = customLyrics;
        if (!lyrics) {
          const venicePrompt = `
          Write a funny poem that incorporates the following:
          ${musicPrompt}
  
          Make it 4 or more stanzas long. Respond with only the poem itself - do not include the title, author, description, commentary, or any other information.
          `;
          let chatCompletion;
          const veniceClient = new OpenAI({
            apiKey: process.env.VENICE_KEY,
            baseURL: "https://api.venice.ai/api/v1",
          });
          const messages = [];

          messages.push({
            role: "user",
            content: venicePrompt,
          });
          chatCompletion = await veniceClient.chat.completions.create({
            model: "dolphin-2.9.2-qwen2-72b",
            messages,
            venice_parameters: {
              include_venice_system_prompt: false,
            },
          });
          if (typeof chatCompletion === "string")
            chatCompletion = JSON.parse(chatCompletion);
          lyrics = chatCompletion.choices[0].message.content;
        }

        console.log(lyrics);
        socket.emit("lyrics", lyrics);

        const originalLyrics = lyrics;

        lyrics = lyrics.replaceAll(/nigger/gi, "niggur");
        lyrics = lyrics.replaceAll(/faggot/gi, "phag it");
        lyrics = lyrics.replaceAll(/fag/gi, "phag");
        lyrics = lyrics.replaceAll(/bitch/gi, "bidch");
        lyrics = lyrics.replaceAll(/kike/gi, "qaiq");
        lyrics = lyrics.replaceAll(/chink/gi, "chinq");
        lyrics = lyrics.replaceAll(/cunt/gi, "kunt");
        lyrics = lyrics.replaceAll(/spic/gi, "spik");
        lyrics = lyrics.replaceAll(/gook/gi, "gooq");

        const songData = await murekaQuery(lyrics, musicStyle);

        const links = [];
        for (let c = 0; c < songData.choices.length; c++) {
          const song = songData.choices[c];
          console.log("song", song);
          try {
            const audioFile = await fetchAndWriteFile(song.url);
            console.log("audio", audioFile);

            const feednanaLink = await uploadToFeednana(
              audioFile,
              originalLyrics
            );
            console.log(feednanaLink);
            links.push(feednanaLink);
          } catch (err) {
            console.log("song error", err);
          }
        }
        socket.emit("music-links", links);
      } catch (err) {
        console.log("new-song error", err);
        socket.emit("music-error", err);
      }
    });
  } catch (err) {
    console.log("socket error", err);
    socket.emit("music-error", err);
  }
};

export default socketHandler;
