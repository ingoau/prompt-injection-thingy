"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, RotateCcw, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupButton } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHALLENGE_LEVELS, getLevelByIndex, isLastLevel } from "@/lib/levels";

function hasCompleteChallengeToolCall(message: UIMessage) {
  return message.parts.some((part) => {
    return part.type === "tool-continue";
  });
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function shouldHideAsToolOnlyMessage(message: UIMessage) {
  if (message.role !== "assistant") {
    return false;
  }

  const text = getMessageText(message).trim();
  return hasCompleteChallengeToolCall(message) && text.length === 0;
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
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const isDev = process.env.NODE_ENV !== "production";
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/chat?levelIndex=${currentLevelIndex}`,
      }),
    [currentLevelIndex],
  );
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

  const currentLevel = useMemo(
    () => getLevelByIndex(currentLevelIndex),
    [currentLevelIndex],
  );
  const finalLevel = useMemo(
    () => isLastLevel(currentLevelIndex),
    [currentLevelIndex],
  );
  const levelProgressText = useMemo(
    () => `Level ${currentLevelIndex + 1} of ${CHALLENGE_LEVELS.length}`,
    [currentLevelIndex],
  );
  const progressPercent = useMemo(
    () => ((currentLevelIndex + 1) / CHALLENGE_LEVELS.length) * 100,
    [currentLevelIndex],
  );
  const isLoading = useMemo(
    () => status === "submitted" || status === "streaming",
    [status],
  );
  const challengeComplete = useMemo(
    () => messages.some(hasCompleteChallengeToolCall),
    [messages],
  );
  const visibleMessages = useMemo(
    () => messages.filter((message) => !shouldHideAsToolOnlyMessage(message)),
    [messages],
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

    if (!trimmed || isLoading || challengeComplete) {
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

    if (!trimmed || isLoading || challengeComplete) {
      return;
    }

    setInput("");
    await sendMessage({ text: trimmed });
  };

  const handleResetChat = () => {
    if (isLoading) {
      return;
    }

    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleContinueLevel = () => {
    if (isLoading || !challengeComplete || finalLevel) {
      return;
    }

    setCurrentLevelIndex((previous) => {
      return Math.min(previous + 1, CHALLENGE_LEVELS.length - 1);
    });
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleLevelSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    if (isLoading) {
      return;
    }

    const selectedLevel = Number.parseInt(event.target.value, 10);
    if (!Number.isInteger(selectedLevel)) {
      return;
    }

    setCurrentLevelIndex(Math.min(Math.max(selectedLevel, 0), CHALLENGE_LEVELS.length - 1));
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <main className="relative flex h-screen flex-col bg-background font-mono">
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6 pb-24!">
          <section className="w-full border border-primary/45 bg-primary/5 p-4">
            <p className="text-primary text-xs tracking-[0.2em] uppercase">{levelProgressText}</p>
            <p className="text-primary mt-2 text-base font-semibold">{currentLevel.name}</p>
            <p className="text-primary/75 mt-1 text-sm">{currentLevel.description}</p>
            {isDev ? (
              <div className="mt-3 flex items-center gap-2">
                <label
                  htmlFor="level-picker"
                  className="text-primary/70 text-xs tracking-[0.15em] uppercase"
                >
                  Dev level picker
                </label>
                <select
                  id="level-picker"
                  value={currentLevelIndex}
                  onChange={handleLevelSelect}
                  disabled={isLoading}
                  className="h-8 border border-primary/45 bg-background px-2 text-sm"
                >
                  {CHALLENGE_LEVELS.map((level, index) => (
                    <option key={level.id} value={index}>
                      {index + 1}. {level.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-none border border-primary/40 bg-background"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={CHALLENGE_LEVELS.length}
              aria-valuenow={currentLevelIndex + 1}
              aria-label={levelProgressText}
            >
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
          {visibleMessages.length === 0 && !challengeComplete ? (
            <p className="text-primary/70 py-20 text-center text-sm tracking-wide">
              No messages yet. Ask me anything to get started.
            </p>
          ) : (
            visibleMessages.map((message) => {
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
          {challengeComplete ? (
            <div className="w-full rounded-none border border-primary/45 bg-primary/10 p-4 space-y-3">
              <p className="text-primary pt-1 text-sm tracking-wide uppercase">
                {finalLevel ? "All levels complete!" : "Challenge complete!"}
              </p>
              {!finalLevel ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleContinueLevel}
                  disabled={isLoading}
                  className="rounded-none border-primary/45 bg-primary/5 hover:bg-primary/10"
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
          <div ref={endOfMessagesRef} />
        </div>
      </ScrollArea>

      <div className="fixed inset-x-0 bottom-0 border-t border-primary/35 bg-background">
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
          {error ? (
            <p className="text-destructive mb-2 text-sm">{error.message}</p>
          ) : null}

          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <Button
              type="button"
              size="icon-lg"
              variant="outline"
              onClick={handleResetChat}
              disabled={isLoading || (messages.length === 0 && input.length === 0)}
              className="rounded-none border-primary/45 bg-primary/5 hover:bg-primary/10"
              aria-label="Reset chat"
              title="Reset chat"
            >
              <RotateCcw className="size-4" />
            </Button>
            <div className="relative w-full">
              <InputGroup>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={challengeComplete ? "Challenge complete." : "Type a message..."}
                  disabled={challengeComplete}
                  className="h-10 rounded-none border-primary/45 bg-primary/5 pr-24 placeholder:text-primary/45 focus-visible:ring-primary/55"
                />
                <InputGroupButton>
                  <Button
                    type="submit"
                    size="icon-sm"
                    disabled={challengeComplete || isLoading || input.trim().length === 0}
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
