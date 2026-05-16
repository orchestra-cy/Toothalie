<?php

namespace App\Controller\API\Authenticated\Dentist;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;
use App\Service\ActivityLogger;
use App\Service\FcmService;
use App\Service\WebSocketNotificationService;
class UpdateAppointment extends AbstractController
{
    #[
        Route(
            "/api/edit-appointment-dentist",
            name: "edit-appointment-dentist",
            methods: ["POST"],
        ),
    ]
    public function getAppointment(
        Request $req,
        Connection $connection,
        ActivityLogger $logger,
        FcmService $fcmService,
        WebSocketNotificationService $wsNotification,
    ): JsonResponse {
        date_default_timezone_set("Asia/Manila");
        try {
            $user = $this->getUser();
            $userRole = $user->getRoles();
            if (!in_array("ROLE_DENTIST", $userRole)) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Forbidden",
                    ],
                    403,
                );
            }

            $data = json_decode($req->getContent(), true);
            $appointmentID = $data["id"] ?? null;
            $status = $data["status"] ?? null;

            // // debugging
            // return new JsonResponse([
            //     "status" => $status,
            //     "id" => $appointmentID,
            // ]);

            if (!$appointmentID || !$status) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Missing required fields: id or status",
                    ],
                    400,
                );
            }

            $appointment = $connection->fetchAssociative(
                "SELECT * FROM appointment WHERE id = ?",
                [$appointmentID],
            );

            if (!$appointment) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Appointment not found",
                    ],
                    404,
                );
            }

            $connection->update(
                "appointment",
                ["status" => $status],
                ["id" => $appointmentID],
            );

            // Log via ActivityLogger
            $user = $this->getUser();
            $logger->log(
                "APPOINTMENT_UPDATED",
                "Dentist updated appointment ID {$appointmentID} status from '{$appointment["status"]}' to '{$status}'",
                $user,
                ["appointment_snapshot" => (object) $appointment],
            );

            // FCM PROCESSS
            // FCM PROCESSS
            // FCM PROCESSS

            // find the patient associated with the appointment to get their FCM token
            $patientData = $connection->fetchAssociative(
                "SELECT u.fcm_token, u.email
                         FROM appointment a
                         JOIN user u ON a.patient_id = u.id
                         WHERE a.id = ?",
                [$appointmentID],
            );

            // if ($patientData && $patientData["fcm_token"]) {
            //     $title = "Appointment Update";
            //     $message =
            //         "Your appointment status has been updated to: " .
            //         strtoupper($status);

            //     // You can customize the message based on the status
            //     if ($status === "accepted") {
            //         $message =
            //             "Great news! The dentist has accepted your appointment schedule.";
            //     } elseif ($status === "rejected") {
            //         $message =
            //             "Your appointment was declined. Please check the app for details or to reschedule.";
            //     }

            //     $fcmService->sendAppointmentNotification(
            //         $patientData["fcm_token"],
            //         $title,
            //         $message,
            //         ["appointmentId" => (string) $appointmentID],
            //     );
            // }
            if ($patientData) {
                $patientId = $connection->fetchOne(
                    "SELECT patient_id FROM appointment WHERE id = ?",
                    [$appointmentID],
                );

                // Send real-time notification via WebSocket
                $wsNotification->notifyAppointmentUpdate(
                    (int) $patientId,
                    $appointmentID,
                    $status,
                );
            }

            return new JsonResponse([
                "status" => "success",
                "message" => "Appointment updated successfully",
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(
                [
                    "status" => "error",
                    "message" => "Failed: " . $e->getMessage(),
                ],
                500,
            );
        }
    }
}
