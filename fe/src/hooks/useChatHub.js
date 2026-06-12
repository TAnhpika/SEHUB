import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { getAccessToken } from "@/api/httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export function useChatHub({ onReceiveMessage, onUnreadCountUpdated, enabled = true } = {}) {
  const connectionRef = useRef(null);
  const handlersRef = useRef({ onReceiveMessage, onUnreadCountUpdated });

  handlersRef.current = { onReceiveMessage, onUnreadCountUpdated };

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const token = getAccessToken();
    if (!token) {
      return undefined;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/chat?access_token=${encodeURIComponent(token)}`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (message) => {
      handlersRef.current.onReceiveMessage?.(message);
    });

    connection.on("UnreadCountUpdated", (payload) => {
      handlersRef.current.onUnreadCountUpdated?.(payload?.totalUnread ?? 0);
    });

    connectionRef.current = connection;

    connection
      .start()
      .catch(() => {
        /* hub optional when offline */
      });

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [enabled]);

  async function joinConversation(conversationId) {
    const connection = connectionRef.current;
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    await connection.invoke("JoinConversation", conversationId);
  }

  return { joinConversation };
}
