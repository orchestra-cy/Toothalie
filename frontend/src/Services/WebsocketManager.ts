import { useEffect, useRef } from "react";

export const useWebSocketManager = (onAppointmentUpdate: (payload: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
      // Adjust URL if needed
      const wsUrl = "ws://127.0.0.1:8086"; 
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Dashboard WS] Connected. Authenticating...");
        
        try {
          const userInfoStr = localStorage.getItem("userInfo");
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo?.token) {
              console.log("[Dashboard WS] Sending Auth Token...");
              ws.send(JSON.stringify({ type: "auth", token: userInfo.token }));
            }
          } else {
            console.warn("[Dashboard WS] No userInfo/token found in localStorage");
          }
        } catch (err) {
          console.error("[Dashboard WS] Error reading token:", err);
        }

        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // --- AGGRESSIVE LOGGING TO SEE EXACT SERVER PAYLOAD ---
          console.log("====================================");
          console.log("[Dashboard WS] RAW DATA RECEIVED:", data);
          console.log("====================================");

          if (data.type === "auth_success") {
            console.log(`[Dashboard WS] Authenticated successfully for user: ${data.userId}`);
          } 
          else if (data.type === "auth_error") {
            console.error(`[Dashboard WS] Auth error: ${data.message}`);
          } 
          else if (data.type === "pong") {
            // Optional: silence pong logs to keep console clean, or leave it for debugging
            // console.log(`[Dashboard WS] Pong received at ${data.timestamp}`);
          }
          // Workerman sends { type: "notification", payload: { ... } }
          else if (data.type === "notification") {
            console.log("[Dashboard WS] Passing payload to Dashboard Main.tsx...");
            if (onAppointmentUpdate) {
              // Pass ONLY the inner payload to your dashboard handler
              onAppointmentUpdate(data.payload); 
            }
          }
        } catch (err) {
          console.error("[Dashboard WS] Message parsing error:", err);
        }
      };

      ws.onclose = () => {
        console.log("[Dashboard WS] Disconnected");
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        
        if (isMounted) {
          console.log("[Dashboard WS] Attempting to reconnect in 5s...");
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.onclose = null; 
        wsRef.current.close();
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [onAppointmentUpdate]);
};