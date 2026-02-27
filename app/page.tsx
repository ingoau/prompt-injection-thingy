"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupButton } from "@/components/ui/input-group";
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
        p: ({ children }) => <p className="whitespace-pre-wrap wrap-break-word">{children}</p>,
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
  const inputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed || isLoading) {
      return;
    }

    setInput("");
    await sendMessage({ text: trimmed });
  };

  const handleInputKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
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
    <main className="relative flex h-screen flex-col bg-background font-mono">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6 pb-24!">
          {messages.length === 0 ? (
            <p className="text-primary/70 py-20 text-center text-sm tracking-wide">
              No messages yet. Ask me anything to get started.
            </p>
          ) : (
            messages.map((message) => {
              const text = getMessageText(message);
              const label = message.role === "user" ? "User" : "Agent";
              const isAgent = message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={`w-full border-l-2 py-1 pl-3 ${isAgent
                    ? "border-primary/70 bg-transparent"
                    : "border-primary/45 bg-primary/5"
                    }`}
                >
                  <div className="space-y-1">
                    <p className="text-primary text-xs tracking-[0.2em] uppercase">
                      {label}
                    </p>
                    {text ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:scroll-m-20 prose-headings:tracking-tight prose-h1:text-3xl prose-h1:font-extrabold prose-h2:border-b prose-h2:pb-2 prose-h2:text-2xl prose-h2:font-semibold prose-h3:text-xl prose-h3:font-semibold prose-p:leading-7 prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-code:before:content-none prose-code:after:content-none prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none prose-pre:border prose-pre:border-primary/30 prose-pre:bg-background/70 prose-pre:overflow-x-auto">
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

      <div className="fixed inset-x-0 bottom-0 border-t border-primary/35 bg-background">
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
          {error ? (
            <p className="text-destructive mb-2 text-sm">{error.message}</p>
          ) : null}

          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <div className="relative w-full">
              <InputGroup>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type a message..."
                  className="h-10 rounded-none border-primary/45 bg-primary/5 pr-24 placeholder:text-primary/45 focus-visible:ring-primary/55"
                />
                <InputGroupButton>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || input.trim().length === 0}
                    className="pointer-events-auto rounded-none border border-primary/50 bg-primary/20 text-primary hover:bg-primary/30"
                    aria-label="Send message"
                    title="Send"
                  >
                    <Send className="size-4" />
                  </Button>
                </InputGroupButton>
              </InputGroup>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
