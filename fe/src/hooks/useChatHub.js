import { useCallback, useEffect, useRef } from "react";
import { getAccessToken } from "@/api/httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";

export function useChatHub({
  onReceiveMessage,
  onUnreadCountUpdated,
  onNotificationReceived,
  onNotificationUnreadUpdated,
  enabled = true,
} = {}) {
  const connectionRef = useRef(null);
  const handlersRef = useRef({
    onReceiveMessage,
    onUnreadCountUpdated,
    onNotificationReceived,
    onNotificationUnreadUpdated,
  });

  handlersRef.current = {
    onReceiveMessage,
    onUnreadCountUpdated,
    onNotificationReceived,
    onNotificationUnreadUpdated,
  };

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const token = getAccessToken();
    if (!token) {
      return undefined;
    }

    let cancelled = false;
    let connection;

    async function connect() {
      const signalR = await import("@microsoft/signalr");
      if (cancelled) return;

      connection = new signalR.HubConnectionBuilder()
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

      connection.on("NotificationReceived", (payload) => {
        handlersRef.current.onNotificationReceived?.(payload);
      });

      connection.on("NotificationUnreadUpdated", (payload) => {
        handlersRef.current.onNotificationUnreadUpdated?.(payload?.totalUnread ?? 0);
      });

      connectionRef.current = connection;

      connection.start().catch(() => {
        /* hub optional when offline */
      });
    }

    connect();

    return () => {
      cancelled = true;
      connection?.stop();
      connectionRef.current = null;
    };
  }, [enabled]);

  const joinConversation = useCallback(async (conversationId) => {
    const connection = connectionRef.current;
    if (!connection) return;

    const signalR = await import("@microsoft/signalr");
    if (connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    await connection.invoke("JoinConversation", conversationId);
  }, []);

  return { joinConversation };
}
