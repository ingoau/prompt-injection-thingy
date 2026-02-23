"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function MessageMarkdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
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

  const handleInputKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

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
              const label = message.role === "user" ? "User" : "Agent";

              return (
                <div
                  key={message.id}
                  className="w-full"
                >
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {label}
                    </p>
                    {text ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-m-20 prose-headings:tracking-tight prose-h1:text-3xl prose-h1:font-extrabold prose-h2:border-b prose-h2:pb-2 prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold prose-p:leading-7 prose-a:underline prose-a:underline-offset-2 prose-code:before:content-none prose-code:after:content-none prose-code:bg-foreground/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-background/70 prose-pre:overflow-x-auto">
                        <MessageMarkdown text={text} />
                      </div>
                    ) : (
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

          <form className="flex items-end gap-2" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type a message..."
              disabled={isLoading}
              rows={3}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-9 max-h-48 flex-1 resize-y rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
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
