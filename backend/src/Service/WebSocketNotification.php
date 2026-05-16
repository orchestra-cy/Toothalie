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
    )
    {
        // Connect to the WebSocket server
        try {
            $instance = stream_socket_client('tcp://127.0.0.1:1234', $errno, $errstr, 1);
            if ($instance) {
                $socketPayload = [
                    'userId' => $patientId,
                    'payload' => [
                        'title' => $title,
                        'message' => $message,
                        'appointmentId' => $appointmentID,
                        'newStatus' => $status
                    ]
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