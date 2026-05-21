<?php
namespace App\Service;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;

class FcmService
{
    private Messaging $messaging;

    public function __construct(string $projectDir)
    {
        // Try to load credentials from file first, then from environment variable
        $credentialsPath = $projectDir . "/config/firebase_credentials.json";
        
        if (file_exists($credentialsPath)) {
            // Load from file
            $factory = new Factory()->withServiceAccount($credentialsPath);
        } else {
            // Load from environment variable (for Docker/Railway deployments)
            $credentialsJson = $_ENV['FIREBASE_CREDENTIALS'] ?? $_SERVER['FIREBASE_CREDENTIALS'] ?? null;
            
            if (!$credentialsJson) {
                throw new \RuntimeException(
                    'Firebase credentials not found. Provide either config/firebase_credentials.json file or FIREBASE_CREDENTIALS environment variable.'
                );
            }
            
            // Write to temporary file for the Factory
            $tempFile = sys_get_temp_dir() . '/firebase_credentials_' . uniqid() . '.json';
            file_put_contents($tempFile, $credentialsJson);
            register_shutdown_function(fn() => @unlink($tempFile));
            
            $factory = new Factory()->withServiceAccount($tempFile);
        }

        $this->messaging = $factory->createMessaging();
    }

    public function sendAppointmentNotification(
        string $deviceToken,
        string $title,
        string $body,
        array $extraData = [],
    ): void {
        // 1. Build the hybrid message using the v7.x Array format
        $message = CloudMessage::fromArray([
            'token' => $deviceToken,
            'notification' => [
                'title' => $title,
                'body' => $body,
            ],
            'data' => array_merge($extraData, [
                "click_action" => "FLUTTER_NOTIFICATION_CLICK", // Standard for many libraries
                "app_name" => "Toothalie",
            ]),
        ]);

        try {
            $this->messaging->send($message);
        } catch (\Exception $e) {
            error_log("FCM Send Error: " . $e->getMessage());
        }
    }
}