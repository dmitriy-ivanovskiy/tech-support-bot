"use client";

import { useChat } from "@/context/chat-context";
import { useToast } from "@/context/toast-context";
import { useCallback } from "react";

export function useChatWithToast() {
  const chat = useChat();
  const { showToast } = useToast();

  // Wrap sendMessage to show toasts based on success/failure
  const sendMessageWithToast = useCallback(
    async (content: string) => {
      try {
        await chat.sendMessage(content);
        // No success toast needed as the message appearing in chat is feedback enough
      } catch (error) {
        showToast(
          "Failed to send message. Please try again.",
          "error"
        );
      }
    },
    [chat, showToast]
  );
  
  // Wrap streamMessage to show toasts based on success/failure
  const streamMessageWithToast = useCallback(
    async (content: string, onChunk: (chunk: string, messageId: string) => void) => {
      try {
        await chat.streamMessage(content, onChunk);
        // No success toast needed as the message appearing in chat is feedback enough
      } catch (error) {
        showToast(
          "Failed to complete response. Please try again.",
          "error"
        );
      }
    },
    [chat, showToast]
  );

  // Wrap startNewConversation to show success toast
  const startNewConversationWithToast = useCallback(() => {
    chat.startNewConversation();
    showToast("New conversation started", "success", 3000);
  }, [chat, showToast]);

  // Wrap deleteConversation to show success toast
  const deleteConversationWithToast = useCallback(
    (id: string) => {
      chat.deleteConversation(id);
      showToast("Conversation deleted", "info", 3000);
    },
    [chat, showToast]
  );

  return {
    ...chat,
    sendMessage: sendMessageWithToast,
    streamMessage: streamMessageWithToast,
    startNewConversation: startNewConversationWithToast,
    deleteConversation: deleteConversationWithToast,
  };
} 