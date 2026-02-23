"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export default function Home() {
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = useMemo(
    () => status === "submitted" || status === "streaming",
    [status],
  );

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setInput("");
    await sendMessage({ text: trimmed });
  };

  return (
    <main className="relative flex h-screen flex-col bg-background">
      <ScrollArea className="min-h-0 flex-1 pb-36">
        <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
          {messages.length === 0 ? (
            <p className="text-muted-foreground py-20 text-center text-sm">
              No messages yet. Ask me anything to get started.
            </p>
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {text || (
                      <span className="text-muted-foreground italic">
                        {isLoading && message.role === "assistant"
                          ? "Thinking..."
                          : "No text content"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>

      <div className="bg-background/95 fixed inset-x-0 bottom-0 border-t backdrop-blur">
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
          {error ? (
            <p className="text-destructive mb-2 text-sm">{error.message}</p>
          ) : null}

          <form className="flex gap-2" onSubmit={handleSubmit}>
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || input.trim().length === 0}>
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
