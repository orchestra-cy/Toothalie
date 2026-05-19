<?php

namespace App\Service;

class WebSocketNotificationService
{
    private string $bridgeHost = "127.0.0.1";
    private int $bridgePort = 1234;
    private int $socketTimeout = 2;
    private ActivityLogger $logger;

    public function __construct(ActivityLogger $logger)
    {
        $this->logger = $logger;

        $envHost = getenv("WS_BRIDGE_HOST");
        if ($envHost !== false && $envHost !== "") {
            $this->bridgeHost = $envHost;
        }

        $envPort = getenv("WS_BRIDGE_PORT");
        if ($envPort !== false && $envPort !== "") {
            $this->bridgePort = (int) $envPort;
        }
    }

    /**
     * Send appointment update notification to patient
     */
    public function notifyAppointmentUpdate(
        int $patientId,
        int $appointmentId,
        string $status,
        ?string $customTitle = null,
        ?string $customMessage = null,
    ): bool {
        $title = $customTitle ?? $this->getStatusTitle($status);

        $message = $customMessage ?? $this->getStatusMessage($status);

        return $this->sendNotification($patientId, $title, $message, [
            "type" => "appointment_update",
            "appointmentId" => $appointmentId,
            "newStatus" => $status,
        ]);
    }

    /**
     * Send reminder notification to patient
     */
    public function notifyReminder(
        int $patientId,
        int $appointmentId,
        string $reminderData,
    ): bool {
        return $this->sendNotification(
            $patientId,
            "Appointment Reminder",
            $reminderData,
            [
                "type" => "reminder",
                "appointmentId" => $appointmentId,
            ],
        );
    }

    /**
     * Send new appointment notification to dentist
     */
    public function notifyDentistNewAppointment(
        int $dentistId,
        int $appointmentId,
        string $patientName,
        string $appointmentDate,
    ): bool {
        $title = "New Appointment Request";
        $message = "New appointment request from {$patientName} for {$appointmentDate}. Please review and confirm availability.";

        return $this->sendNotification($dentistId, $title, $message, [
            "type" => "new_appointment",
            "appointmentId" => $appointmentId,
            "patientName" => $patientName,
        ]);
    }

    /**
     * Send appointment update notification to dentist
     */
    public function notifyDentistAppointmentUpdate(
        int $dentistId,
        int $appointmentId,
        string $patientName,
        string $changeDescription,
    ): bool {
        $title = "Appointment Updated by Patient";
        $message = "Appointment #{$appointmentId} was updated by {$patientName}.";

        $trimmedChange = trim($changeDescription);
        if ($trimmedChange !== "") {
            $message .= " {$trimmedChange}";
            if (!preg_match('/[.!?]$/', $trimmedChange)) {
                $message .= ".";
            }
        } else {
            $message .= " Please review the updated details.";
        }

        return $this->sendNotification($dentistId, $title, $message, [
            "type" => "appointment_updated_by_patient",
            "appointmentId" => $appointmentId,
            "patientName" => $patientName,
        ]);
    }

    /**
     * Send appointment cancellation notification to dentist
     */
    public function notifyDentistAppointmentCancelled(
        int $dentistId,
        int $appointmentId,
        string $patientName,
    ): bool {
        $title = "Appointment Cancelled by Patient";
        $message = "Appointment #{$appointmentId} was cancelled by {$patientName}. The slot is now available.";

        return $this->sendNotification($dentistId, $title, $message, [
            "type" => "appointment_cancelled",
            "appointmentId" => $appointmentId,
            "patientName" => $patientName,
        ]);
    }

    /**
     * Generic notification sender
     */
    private function sendNotification(
        int $userId,
        string $title,
        string $message,
        array $metadata = [],
    ): bool {
        try {
            $socket = @stream_socket_client(
                "tcp://{$this->bridgeHost}:{$this->bridgePort}",
                $errno,
                $errstr,
                $this->socketTimeout,
            );

            if (!$socket) {
                $this->logger->log(
                    "SOCKET_ERROR",
                    "Failed to connect to WebSocket bridge: [$errno] $errstr",
                );
                return false;
            }

            $payload = [
                "userId" => $userId,
                "payload" => [
                    "title" => $title,
                    "message" => $message,
                    "timestamp" => date("Y-m-d H:i:s"),
                    ...$metadata,
                ],
            ];

            $json = json_encode($payload);
            $written = fwrite($socket, $json . "\n");

            if ($written === false) {
                $this->logger->log(
                    "SOCKET_ERROR",
                    "Failed to write notification to socket for userId: {$userId}",
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
                    "notification_type" => $metadata["type"] ?? "unknown",
                    "title" => $title,
                ],
            );

            return true;
        } catch (\Exception $e) {
            $this->logger->log(
                "SOCKET_ERROR",
                "Exception sending notification: " . $e->getMessage(),
            );
            return false;
        }
    }

    /**
     * Get status title based on appointment status
     */
    private function getStatusTitle(string $status): string
    {
        $normalizedStatus = strtolower(trim($status));

        return match ($normalizedStatus) {
            "accepted" => "Appointment Confirmed",
            "rejected" => "Appointment Not Approved",
            "completed" => "Appointment Completed",
            "cancelled" => "Appointment Cancelled",
            "pending" => "Appointment Pending",
            "rescheduled" => "Appointment Rescheduled",
            default => "Appointment Status Update",
        };
    }

    /**
     * Get status message based on appointment status
     */
    private function getStatusMessage(string $status): string
    {
        $normalizedStatus = strtolower(trim($status));

        return match ($normalizedStatus) {
            "accepted"
                => "Your appointment has been confirmed by the clinic. We look forward to seeing you.",
            "rejected"
                => "Your appointment request was not approved by the clinic. Please choose a new time or contact the clinic.",
            "completed"
                => "Your appointment is marked as completed. Thank you for visiting.",
            "cancelled"
                => "Your appointment has been cancelled by the clinic. If this was unexpected, please contact us.",
            "pending"
                => "Your appointment request is pending review. We'll notify you once it's confirmed.",
            "rescheduled"
                => "Your appointment has been rescheduled by the clinic. Please check the updated date and time.",
            default => "The clinic updated your appointment status to " .
                $this->formatStatus($status) .
                ".",
        };
    }

    private function formatStatus(string $status): string
    {
        $trimmedStatus = trim($status);

        if ($trimmedStatus === "") {
            return "Updated";
        }

        $cleanStatus = str_replace(["_", "-"], " ", strtolower($trimmedStatus));

        return ucwords($cleanStatus);
    }
}
