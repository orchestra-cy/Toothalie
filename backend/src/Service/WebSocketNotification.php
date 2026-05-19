<?php
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
//  THIS IS JUST A REFERENCE FILE
namespace App\Service;

class WebSocketNotification
{
    public function sendNotification(
        string $patientId,
        string $title,
        string $message,
        string $appointmentID,
        string $status,
    ) {
        // Connect to the WebSocket server
        try {
            $bridgeHost = getenv("WS_BRIDGE_HOST") ?: "127.0.0.1";
            $bridgePort = (int) (getenv("WS_BRIDGE_PORT") ?: 1234);
            $instance = stream_socket_client(
                "tcp://{$bridgeHost}:{$bridgePort}",
                $errno,
                $errstr,
                1,
            );
            if ($instance) {
                $socketPayload = [
                    "userId" => $patientId,
                    "payload" => [
                        "title" => $title,
                        "message" => $message,
                        "appointmentId" => $appointmentID,
                        "newStatus" => $status,
                    ],
                ];
                // Send to Workerman (add \n because we used 'text' protocol)
                fwrite($instance, json_encode($socketPayload) . "\n");
                fclose($instance);
            }
        } catch (\Exception $e) {
            return $e->getMessage();
            // Log that the socket was offline, but don't fail the whole request
            // $logger->log("SOCKET_ERROR", "Could not reach Workerman: " . $e->getMessage(), $user);
        }
    }
}
