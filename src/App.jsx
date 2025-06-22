import React, { useEffect, useState } from "react";
import { useChat } from "ai/react";
import { Chat } from "@/components/ui/chat";
import axios from "axios";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import t from "@/lib/transitions";
import MakeMusic from "@/components/MakeMusic";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API);

const App = () => {
  const [newResponse, setNewResponse] = useState();
  const [transcribing, setTranscribing] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [page, setPage] = useState("music");
  const [creatingSong, setCreatingSong] = useState(false);
  const [musicLinks, setMusicLinks] = useState([]);
  const [musicStyle, setMusicStyle] = useState("");
  const [useCustomLyrics, setUseCustomLyrics] = useState(false);
  const [useCustomMusicStyle, setUseCustomMusicStyle] = useState(false)
  const [customLyrics, setCustomLyrics] = useState("");
  const [musicStatus, setMusicStatus] = useState("")

  const options = {
    api: process.env.REACT_APP_API + "/ask",
    onResponse: async (res) => {
      try {
        const response = await res.json();
        if (response?.message) setNewResponse(response.message);
      } catch (err) {
        console.log("onResponse error", err);
      }
    },
  };

  const makeSong = () => {
    setLyrics("");
    setMusicLinks([]);
    setCreatingSong(true);
    setMusicStatus(useCustomLyrics ? `Generating song` : `Generating lyrics`)
    socket.emit("new-song", musicPrompt, useCustomLyrics ?  customLyrics : "", useCustomMusicStyle ?  musicStyle : "");
  };

  const {
    messages,
    input,
    handleSubmit,
    handleInputChange,
    append,
    isLoading,
    stop,
    setMessages,
  } = useChat(options);

  useEffect(() => {
    
    socket.on("lyrics", (lyrics) => {
      console.log("lyrics", lyrics, lyrics.split("\n"));
      setMusicStatus(`Generating song`)
      setLyrics(lyrics);
    });
    socket.on("music-error", (err) => {
      try {
        console.log(err);
        toast.error(
          "An error occurred while generating the song. Check the console for more details.",
          {
            closeButton: true,
          }
        );
        setMusicStatus("Errored")
        setCreatingSong(false);
      } catch (err) {
        console.log("music-error err", err);
        setMusicStatus("Errored")
      }
    });
    socket.on("music-links", (links) => {
      try {
        console.log("music links", links);
        setMusicLinks(links);
        setCreatingSong(false);
        setMusicStatus("")
      } catch (err) {
        console.log("music links error", err);
        setCreatingSong(false);
        setLyrics("");
        setMusicStatus("Errored")
      }
    });
  }, []);

  useEffect(() => {
    if (newResponse) {
      append(newResponse);
      setNewResponse();
    }
  }, [newResponse]);

  const clearChat = () => {
    setMessages([]);
    axios
      .get(process.env.REACT_APP_API + "/clear")
      .catch((err) => console.log("error clearing chat", err));
  };

  // console.log(isLoading, messages);

  // const messages = [
  //   {
  //     role: "assistant",
  //     content: "TEST",
  //     parts: [{ type: "text", text: "TEST" }],
  //   },
  // ];

  const transcribeAudio = (recording) => {
    setTranscribing(true);
    const fd = new FormData();
    fd.append("audio", recording, "audio.webm");
    axios
      .post(process.env.REACT_APP_API + "/trans", fd)
      .then((res) => {
        setTranscribing(false);
        handleInputChange({
          target: {
            value: res.data.text,
          },
        });
      })
      .catch((err) => {
        console.log(err);
        setTranscribing(false);
        toast.error("An error occurred while transcribing the audio", {
          closeButton: true,
        });
      });
  };

  return (
    <div
      id="app-jsx"
      class={`p-4 h-screen relative ${page === "ask" ? "overflow-hidden" : ""}`}
    >
      <AnimatePresence>
       <motion.section
            transition={t.transition}
            exit={t.fade_out_scale_1}
            animate={t.normalize}
            initial={t.fade_out}
            className="h-full w-full"
            key="music"
          >
            <MakeMusic
              lyrics={lyrics}
              makeSong={makeSong}
              musicPrompt={musicPrompt}
              setMusicPrompt={setMusicPrompt}
              creatingSong={creatingSong}
              musicLinks={musicLinks}
              customLyrics={customLyrics}
              setCustomLyrics={setCustomLyrics}
              musicStyle={musicStyle}
              setMusicStyle={setMusicStyle}
              musicStatus={musicStatus}
              useCustomLyrics={useCustomLyrics}
              setUseCustomLyrics={setUseCustomLyrics}
              useCustomMusicStyle={useCustomMusicStyle} 
              setUseCustomMusicStyle={setUseCustomMusicStyle}
            />
          </motion.section>
      </AnimatePresence>

      <Toaster />
      <p className="absolute bottom-0 text-xs right-0 pr-4">
        Created by Bernard Murphy
      </p>
    </div>
  );
};

export default App;
