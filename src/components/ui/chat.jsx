import { forwardRef, useCallback, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { MessageInput } from "@/components/ui/message-input";
import { MessageList } from "@/components/ui/message-list";

export function Chat({
  messages,
  handleSubmit,
  input,
  handleInputChange,
  stop,
  isGenerating,
  className,
  onRateResponse,
  setMessages,
  transcribing,
  cancelTranscription,
  transcribeAudio,
  clearChat,
}) {
  const lastMessage = messages.at(-1);
  const isTyping = lastMessage?.role === "user";

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // Enhanced stop function that marks pending tool calls as cancelled
  const handleStop = useCallback(() => {
    stop?.();

    if (!setMessages) return;

    const latestMessages = [...messagesRef.current];
    const lastAssistantMessage = latestMessages.findLast(
      (m) => m.role === "assistant"
    );

    if (lastAssistantMessage && lastAssistantMessage.toolInvocations) {
      const updatedToolInvocations = lastAssistantMessage.toolInvocations.map(
        (toolInvocation) => {
          if (toolInvocation.state === "call") {
            return {
              ...toolInvocation,
              state: "result",

              result: {
                content: "Tool execution was cancelled",
                __cancelled: true, // Special marker to indicate cancellation
              },
            };
          }
          return toolInvocation;
        }
      );

      const messageIndex = latestMessages.findIndex(
        (m) => m.id === lastAssistantMessage.id
      );
      if (messageIndex !== -1) {
        latestMessages[messageIndex] = {
          ...lastAssistantMessage,
          toolInvocations: updatedToolInvocations,
        };
        setMessages(latestMessages);
      }
    }
  }, [stop, setMessages, messagesRef]);

  const messageOptions = useCallback(
    (message) => ({
      actions: (
        <CopyButton
          content={message.content}
          copyMessage="Copied response to clipboard!"
        />
      ),
    }),
    [onRateResponse]
  );

  return (
    <ChatContainer className={className}>
      <ChatMessages messages={messages}>
        <MessageList
          messages={messages}
          isTyping={isTyping}
          messageOptions={messageOptions}
        />
      </ChatMessages>
      {transcribing ? (
        <div
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
          className="flex flex-col py-2 w-full"
        >
          <h5 className="text-gray-100 mb-1 flash">Processing</h5>
          <Button
            className="mt-1"
            variant="ghost"
            onClick={cancelTranscription}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <ChatForm
          className="mt-auto"
          isPending={isGenerating || isTyping}
          handleSubmit={handleSubmit}
        >
          {({ files, setFiles }) => (
            <MessageInput
              value={input}
              onChange={handleInputChange}
              allowAttachments={false}
              files={files}
              setFiles={setFiles}
              stop={handleStop}
              isGenerating={isGenerating}
              transcribeAudio={transcribeAudio}
              messages={messages}
              clearChat={clearChat}
            />
          )}
        </ChatForm>
      )}
    </ChatContainer>
  );
}
Chat.displayName = "Chat";

export function ChatMessages({ messages, children }) {
  const {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldAutoScroll,
    handleTouchStart,
  } = useAutoScroll([messages]);

  return (
    <div
      className="grid grid-cols-1 overflow-y-auto pb-4"
      ref={containerRef}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
    >
      <div className="max-w-full [grid-column:1/1] [grid-row:1/1] relative">
        {children}
      </div>
      <div className="flex flex-1 items-end justify-end [grid-column:1/1] [grid-row:1/1]">
        {!shouldAutoScroll && (
          <div className="sticky bottom-0 left-0 flex w-full justify-end">
            <Button
              onClick={scrollToBottom}
              className="h-8 w-8 rounded-full ease-in-out animate-in fade-in-0 slide-in-from-bottom-1"
              size="icon"
              variant="ghost"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export const ChatContainer = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid h-full w-full grid-rows-[1fr_auto]", className)}
      style={{ paddingTop: "40px" }}
      {...props}
    />
  );
});
ChatContainer.displayName = "ChatContainer";

export const ChatForm = forwardRef(
  ({ children, handleSubmit, isPending, className }, ref) => {
    const [files, setFiles] = useState(null);

    const onSubmit = (event) => {
      if (!files) {
        handleSubmit(event);
        return;
      }

      const fileList = createFileList(files);
      handleSubmit(event, { experimental_attachments: fileList });
      setFiles(null);
    };

    return (
      <form id="chat-form" ref={ref} onSubmit={onSubmit} className={className}>
        {children({ files, setFiles })}
      </form>
    );
  }
);
ChatForm.displayName = "ChatForm";

function createFileList(files) {
  const dataTransfer = new DataTransfer();
  for (const file of Array.from(files)) {
    dataTransfer.items.add(file);
  }
  return dataTransfer.files;
}
