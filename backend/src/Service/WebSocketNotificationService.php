<?php

namespace App\Service;

class WebSocketNotificationService
{
    private string $bridgeHost = '127.0.0.1';
    private int $bridgePort = 1234;
    private int $socketTimeout = 2;
    private ActivityLogger $logger;

    public function __construct(ActivityLogger $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Send appointment update notification to patient
     */
    public function notifyAppointmentUpdate(
        int $patientId,
        int $appointmentId,
        string $status,
        ?string $customTitle = null,
        ?string $customMessage = null
    ): bool {
        $title = $customTitle ?? "Appointment Update";

        $message = $customMessage ?? $this->getStatusMessage($status);

        return $this->sendNotification(
            $patientId,
            $title,
            $message,
            [
                'type' => 'appointment_update',
                'appointmentId' => $appointmentId,
                'newStatus' => $status,
            ]
        );
    }

    /**
     * Send reminder notification to patient
     */
    public function notifyReminder(
        int $patientId,
        int $appointmentId,
        string $reminderData
    ): bool {
        return $this->sendNotification(
            $patientId,
            "Appointment Reminder",
            $reminderData,
            [
                'type' => 'reminder',
                'appointmentId' => $appointmentId,
            ]
        );
    }

    /**
     * Send new appointment notification to dentist
     */
    public function notifyDentistNewAppointment(
        int $dentistId,
        int $appointmentId,
        string $patientName,
        string $appointmentDate
    ): bool {
        $title = "New Appointment Request";
        $message = "New appointment from {$patientName} on {$appointmentDate}";

        return $this->sendNotification(
            $dentistId,
            $title,
            $message,
            [
                'type' => 'new_appointment',
                'appointmentId' => $appointmentId,
                'patientName' => $patientName,
            ]
        );
    }

    /**
     * Send appointment update notification to dentist
     */
    public function notifyDentistAppointmentUpdate(
        int $dentistId,
        int $appointmentId,
        string $patientName,
        string $changeDescription
    ): bool {
        $title = "Appointment Updated";
        $message = "Patient {$patientName} updated appointment #{$appointmentId}: {$changeDescription}";

        return $this->sendNotification(
            $dentistId,
            $title,
            $message,
            [
                'type' => 'appointment_updated_by_patient',
                'appointmentId' => $appointmentId,
                'patientName' => $patientName,
            ]
        );
    }

    /**
     * Send appointment cancellation notification to dentist
     */
    public function notifyDentistAppointmentCancelled(
        int $dentistId,
        int $appointmentId,
        string $patientName
    ): bool {
        $title = "Appointment Cancelled";
        $message = "Patient {$patientName} cancelled appointment #{$appointmentId}";

        return $this->sendNotification(
            $dentistId,
            $title,
            $message,
            [
                'type' => 'appointment_cancelled',
                'appointmentId' => $appointmentId,
                'patientName' => $patientName,
            ]
        );
    }

    /**
     * Generic notification sender
     */
    private function sendNotification(
        int $userId,
        string $title,
        string $message,
        array $metadata = []
    ): bool {
        try {
            $socket = @stream_socket_client(
                "tcp://{$this->bridgeHost}:{$this->bridgePort}",
                $errno,
                $errstr,
                $this->socketTimeout
            );

            if (!$socket) {
                $this->logger->log(
                    "SOCKET_ERROR",
                    "Failed to connect to WebSocket bridge: [$errno] $errstr"
                );
                return false;
            }

            $payload = [
                'userId' => $userId,
                'payload' => [
                    'title' => $title,
                    'message' => $message,
                    'timestamp' => date('Y-m-d H:i:s'),
                    ...$metadata,
                ],
            ];

            $json = json_encode($payload);
            $written = fwrite($socket, $json . "\n");

            if ($written === false) {
                $this->logger->log(
                    "SOCKET_ERROR",
                    "Failed to write notification to socket for userId: {$userId}"
                );
                fclose($socket);
                return false;
            }

            fclose($socket);
            $this->logger->log(
                "SOCKET_SUCCESS",
                "Notification sent to userId: {$userId}",
                null,
                [
                    'notification_type' => $metadata['type'] ?? 'unknown',
                    'title' => $title,
                ]
            );

            return true;
        } catch (\Exception $e) {
            $this->logger->log(
                "SOCKET_ERROR",
                "Exception sending notification: " . $e->getMessage()
            );
            return false;
        }
    }

    /**
     * Get status message based on appointment status
     */
    private function getStatusMessage(string $status): string
    {
        return match ($status) {
            'accepted' => 'Great news! The dentist has accepted your appointment schedule.',
            'rejected' => 'Your appointment was declined. Please check the app for details or reschedule.',
            'completed' => 'Your appointment has been completed. Thank you for visiting!',
            'cancelled' => 'Your appointment has been cancelled.',
            default => "Your appointment status has been updated to: " . strtoupper($status),
        };
    }
}
