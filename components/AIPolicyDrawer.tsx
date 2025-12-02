import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "./Sheet";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { Input } from "./Input";
import { Skeleton } from "./Skeleton";
import { MessageSquare, Sparkles, Send, Check } from "lucide-react";
import { usePolicyPrompt } from "../helpers/useAIPolicyApi";
import type { Message as ConversationMessage } from "../endpoints/ai/policy-prompt_POST.schema";
import styles from "./AIPolicyDrawer.module.css";

interface AIPolicyDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  policyContent: string;
  onAcceptChanges: (newContent: string) => void;
  className?: string;
}

export const AIPolicyDrawer: React.FC<AIPolicyDrawerProps> = ({
  isOpen,
  onOpenChange,
  policyContent,
  onAcceptChanges,
  className,
}) => {
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [streamingResponse, setStreamingResponse] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const { mutate: sendPrompt, isPending } = usePolicyPrompt();

  const handlePromptSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!prompt.trim() || isPending) return;

      const newConversation: ConversationMessage[] = [
        ...conversation,
        { role: "user", content: prompt },
      ];
      setConversation(newConversation);
      setPrompt("");
      setStreamingResponse("");

      const lastAssistantMessage = conversation
        .slice()
        .reverse()
        .find((m) => m.role === "assistant");

      sendPrompt(
        {
          policyText: lastAssistantMessage?.content ?? policyContent,
          prompt,
          history: conversation,
        },
        {
          onSuccess: async (stream) => {
            const reader = stream.getReader();
            let accumulatedResponse = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              accumulatedResponse += value;
              setStreamingResponse(accumulatedResponse);
            }
            setConversation((prev) => [
              ...prev,
              { role: "assistant", content: accumulatedResponse },
            ]);
            setStreamingResponse(null);
          },
          onError: () => {
            setStreamingResponse(null);
            // Revert optimistic update on error
            setConversation((prev) => prev.slice(0, -1));
          },
        }
      );
    },
    [prompt, isPending, conversation, policyContent, sendPrompt]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, streamingResponse]);

  const lastAssistantMessage = conversation
    .slice()
    .reverse()
    .find((m) => m.role === "assistant");

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`${styles.sheetContent} ${className ?? ""}`}
      >
        <SheetHeader>
          <SheetTitle className={styles.sheetTitle}>
            <Sparkles className={styles.titleIcon} />
            AI Policy Assistant
          </SheetTitle>
          <SheetDescription>
            Use natural language to edit your policy. Describe the changes you
            want, and the AI will apply them.
          </SheetDescription>
        </SheetHeader>

        <div className={styles.chatContainer} ref={scrollRef}>
          {conversation.length === 0 && !isPending && (
            <div className={styles.emptyState}>
                            <MessageSquare size={48} className={styles.emptyIcon} />
              <p>Start by typing a prompt below.</p>
              <p className={styles.examplePrompts}>
                e.g., "Make the tone more formal" or "Add a section about data
                privacy."
              </p>
            </div>
          )}
          {conversation.map((msg, index) => (
            <div
              key={index}
              className={`${styles.message} ${styles[msg.role]}`}
            >
              <div className={styles.messageContent}>{msg.content}</div>
            </div>
          ))}
          {isPending && streamingResponse !== null && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageContent}>
                {streamingResponse}
                <span className={styles.cursor} />
              </div>
            </div>
          )}
          {isPending && streamingResponse === "" && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageContent}>
                <Skeleton style={{ height: "1.2rem", width: "80%" }} />
                <Skeleton
                  style={{ height: "1.2rem", width: "60%", marginTop: "8px" }}
                />
              </div>
            </div>
          )}
        </div>

        <SheetFooter className={styles.sheetFooter}>
          {lastAssistantMessage && !isPending && (
            <Button
              onClick={() => {
                onAcceptChanges(lastAssistantMessage.content);
                onOpenChange(false);
              }}
              className={styles.acceptButton}
            >
              <Check size={16} />
              Accept Changes
            </Button>
          )}
          <form onSubmit={handlePromptSubmit} className={styles.inputForm}>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handlePromptSubmit(e);
                }
              }}
              placeholder="e.g., 'Rewrite this to be more concise.'"
              className={styles.promptInput}
              rows={1}
              disabled={isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isPending || !prompt.trim()}
              className={styles.sendButton}
            >
              <Send size={16} />
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};