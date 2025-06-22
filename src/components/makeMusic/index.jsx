import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import t from "@/lib/transitions";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label"

const MakeMusic = ({
  makeSong,
  musicPrompt,
  setMusicPrompt,
  creatingSong,
  lyrics,
  musicLinks,
  customLyrics,
  setCustomLyrics,
  musicStyle,
  setMusicStyle,
  musicStatus,
  useCustomLyrics,
  setUseCustomLyrics,
  useCustomMusicStyle, 
  setUseCustomMusicStyle
}) => {
  const copyText = (string) => {
    let textarea;
    let result;

    try {
      textarea = document.createElement("textarea");
      textarea.setAttribute("readonly", true);
      textarea.setAttribute("contenteditable", true);
      textarea.style.position = "fixed";
      textarea.value = string;

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      const range = document.createRange();
      range.selectNodeContents(textarea);

      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      textarea.setSelectionRange(0, textarea.value.length);
      result = document.execCommand("copy");
    } catch (err) {
      console.error(err);
      result = null;
    } finally {
      document.body.removeChild(textarea);
    }

    if (!result) {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const copyHotkey = isMac ? "⌘C" : "CTRL+C";
      result = prompt(`Press ${copyHotkey}`, string); // eslint-disable-line no-alert
      if (!result) {
        return false;
      }
    }

    toast.success("Copied to clipboard");
  };

  return (
    <div style={{ paddingTop: "0px" }}>
      <h6 className=" mt-4 mb-2 scroll-m-20 text-lg font-semibold tracking-tight">
        Make a song {useCustomLyrics ? "with these lyrics" : "about"}....
      </h6>
      <div className="relative w-full pb-2">
        {useCustomLyrics ?
        <Textarea
          placeholder="Enter lyrics...."
          className="w-full"
          value={customLyrics}
          onChange={(e) => setCustomLyrics(e.target.value)}
        /> :
          <Textarea
            placeholder="Sitting at my desk making AI music while my cat watches"
            className="w-full"
            value={musicPrompt}
            onChange={(e) => setMusicPrompt(e.target.value)}
          />}
        <div className="absolute right-3 top-3">
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 transition-opacity"
            aria-label="Send message"
            disabled={creatingSong}
            onClick={makeSong}
          >
            {creatingSong ? (
              <Spinner height="1.25rem" width="1.25rem" hashColor="#4F4F4F" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
      <div className="pb-2 flex items-center">
        <div
          className="flex flex-row items-center gap-2"
        >
          <Checkbox
              checked={!useCustomLyrics}
              onCheckedChange={(checked) => {
                setUseCustomLyrics(!checked)
              }}
              id="use-custom-lyrics"
            />
          <Label htmlFor="use-custom-lyrics" className="text-sm font-normal">
            Generate Lyrics Automatically
          </Label>
        </div>
        <div
          className="flex flex-row items-center gap-2 ml-4"
        >
          <Checkbox
              id="use-custom-music-style"
              checked={!useCustomMusicStyle}
              onCheckedChange={(checked) => setUseCustomMusicStyle(!checked)}
            />
          <Label htmlFor="use-custom-music-style" className="text-sm font-normal">
            Generate Music Style Automatically
          </Label>
        </div>
      </div>
      <AnimatePresence>
        {useCustomMusicStyle ?
        <motion.div 
          transition={t.transition}
          exit={t.fade_out_scale_1}
          animate={t.normalize}
          initial={t.fade_out}
          className="pb-2"
        >
          <Input value={musicStyle} placeholder="lofi electro, male vocal" onChange={e => {
            setMusicStyle(e.target.value)
          }}/>
        </motion.div>
        
        : <></>}
        {musicStatus ?
        <motion.div className="flex items-center justify-center">
          <h6 
            transition={t.transition}
            exit={t.fade_out_scale_1}
            animate={t.normalize}
            initial={t.fade_out} className="scroll-m-20 font-semibold tracking-tight pb-2 mr-2"
          >
            {musicStatus}{musicStatus !== "Errored" ? "..." : ""}
          </h6>
          {musicStatus !== "Errored" ? <Spinner height="0.75rem" width="0.75rem" hashColor="#4F4F4F" /> : ""}
          
        </motion.div>
         : <></>}
      </AnimatePresence>
      
      <div className="w-full flex pt-2">
        <div className="w-1/3 p-2">
          {lyrics ? (
            <motion.div
              transition={t.transition}
              exit={t.fade_out_scale_1}
              animate={t.normalize}
              initial={t.fade_out}
              className="border rounded-md p-2"
            >
              {lyrics.split("\n\n").map((stanza) => (
                <div className="mb-2">
                  {stanza.split("\n").map((line) => (
                    <p>{line}</p>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : (
            <></>
          )}
        </div>
        <div className="w-2/3 p-2">
          {musicLinks.length ? (
            musicLinks.map((link) => {
              return (
                <div>
                  <audio
                    className="w-full block mb-2"
                    controls
                    src={link}
                    key={link}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="w-full">
                        <Input
                          className="cursor-pointer"
                          value={link}
                          readOnly
                          type="text"
                          onClick={() => copyText(link)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to Copy</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <hr className="my-2" />
                </div>
              );
            })
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}

export default MakeMusic;
