import { ChatMessage } from "@/components/ui/chat-message";
import { TypingIndicator } from "@/components/ui/typing-indicator";

export function MessageList({
  messages,
  showTimeStamps = true,
  isTyping = false,
  messageOptions,
}) {
  return (
    <>
      <div
        className="absolute h-full w-full"
        style={{
          backgroundImage: `url("/hitler.png")`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center center",
          opacity: "0.25",
        }}
      ></div>
      <div className="space-y-4 overflow-visible">
        {messages.map((message, index) => {
          const additionalOptions =
            typeof messageOptions === "function"
              ? messageOptions(message)
              : messageOptions;

          return (
            <ChatMessage
              key={index}
              showTimeStamp={showTimeStamps}
              {...message}
              {...additionalOptions}
            />
          );
        })}
        {isTyping && <TypingIndicator />}
      </div>
    </>
  );
}
