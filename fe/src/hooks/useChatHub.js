import { useCallback, useEffect, useRef } from "react";
import { getAccessToken } from "@/api/httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5006";
const PRESENCE_PING_MS = 60_000;

export function useChatHub({
  onReceiveMessage,
  onUnreadCountUpdated,
  onNotificationReceived,
  onNotificationUnreadUpdated,
  onPresenceUpdated,
  enabled = true,
} = {}) {
  const connectionRef = useRef(null);
  const handlersRef = useRef({
    onReceiveMessage,
    onUnreadCountUpdated,
    onNotificationReceived,
    onNotificationUnreadUpdated,
    onPresenceUpdated,
  });

  handlersRef.current = {
    onReceiveMessage,
    onUnreadCountUpdated,
    onNotificationReceived,
    onNotificationUnreadUpdated,
    onPresenceUpdated,
  };

  const pingPresence = useCallback(async () => {
    const connection = connectionRef.current;
    if (!connection) return;

    const signalR = await import("@microsoft/signalr");
    if (connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await connection.invoke("PingPresence");
    } catch {
      /* optional heartbeat */
    }
  }, []);

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
    let pingTimer;

    async function connect() {
      const signalR = await import("@microsoft/signalr");
      if (cancelled) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/hubs/chat?access_token=${encodeURIComponent(token)}`, {
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Warning)
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

      connection.on("UserPresenceUpdated", (payload) => {
        handlersRef.current.onPresenceUpdated?.(payload);
      });

      connectionRef.current = connection;

      try {
        await connection.start();
        if (!cancelled) {
          pingTimer = window.setInterval(() => {
            pingPresence();
          }, PRESENCE_PING_MS);
        }
      } catch {
        /* hub optional when offline */
      }
    }

    connect();

    return () => {
      cancelled = true;
      if (pingTimer) {
        window.clearInterval(pingTimer);
      }
      connection?.stop();
      connectionRef.current = null;
    };
  }, [enabled, pingPresence]);

  const joinConversation = useCallback(async (conversationId) => {
    const connection = connectionRef.current;
    if (!connection) return;

    const signalR = await import("@microsoft/signalr");
    if (connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    await connection.invoke("JoinConversation", conversationId);
  }, []);

  return { joinConversation, pingPresence };
}
