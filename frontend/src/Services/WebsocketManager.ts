import { useEffect, useRef } from "react";

const useWebSocketManager = (onAppointmentUpdate) => {
  // We use refs to keep track of the connection and intervals 
  // without triggering React re-renders when they change.
  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connectWebSocket = () => {
      // Adjust this URL to match your environment variables if needed
      const wsUrl = "ws://127.0.0.1:8086"; 
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Dashboard] WebSocket connected. Authenticating...");
        
        try {
          // Safely parse localStorage
          const userInfoStr = localStorage.getItem("userInfo");
          if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo?.token) {
              ws.send(JSON.stringify({ type: "auth", token: userInfo.token }));
            }
          } else {
            console.warn("[Dashboard] No JWT token found for WebSocket auth");
          }
        } catch (err) {
          console.error("Error reading token from localStorage", err);
        }

        // Clear any existing interval before starting a new one
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        
        // Start ping heartbeat every 30 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("data from webscoket ",data)
          if (data.type === "auth_success") {
            console.log(`[Dashboard] WebSocket authenticated for user: ${data.userId}`);
          } 
          else if (data.type === "auth_error") {
            console.error(`[Dashboard] WebSocket auth error: ${data.message}`);
          } 
          else if (data.type === "notification") {
            console.log("[Dashboard] Real-time update received!", data.payload);
            
            // Pass the payload up to whatever component is using this hook
            if (onAppointmentUpdate) {
              onAppointmentUpdate(data.payload);
            }
          }
        } catch (err) {
          console.error("[Dashboard] WebSocket message parsing error:", err);
        }
      };

      ws.onclose = () => {
        console.log("[Dashboard] WebSocket disconnected");
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        
        // Auto-Reconnect Logic: Try to reconnect every 5 seconds if still mounted
        if (isMounted) {
          console.log("[Dashboard] Attempting to reconnect in 5 seconds...");
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        }
      };
      
      ws.onerror = (error) => {
          console.error("[Dashboard] WebSocket Error:", error);
          // The onclose event will automatically fire after onerror, triggering the reconnect.
      };
    };

    // Initial connection
    connectWebSocket();

    // Cleanup function when the component unmounts
    return () => {
      isMounted = false;
      if (wsRef.current) {
        // Prevent onclose from triggering a reconnect when intentionally unmounting
        wsRef.current.onclose = null; 
        wsRef.current.close();
      }
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [onAppointmentUpdate]); // Re-bind if the callback changes
};

export {useWebSocketManager}