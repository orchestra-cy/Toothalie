<?php

namespace App\Controller\API\Authenticated\Patient;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;
use App\Service\ActivityLogger;
use App\Service\WebSocketNotificationService;
use App\Entity\User;

class UpdateAppointment extends AbstractController
{
    // >> >> >> << << <<
    //
    // UPDATE APPOINTMENT VALUE BY THE PATIENT
    //
    // >> >> >> << << <<
    #[
        Route(
            "/api/update-appointment",
            name: "update-appointment",
            methods: ["POST"],
        ),
    ]
    public function updateAppointment(
        Request $req,
        Connection $connection,
        ActivityLogger $logger,
        WebSocketNotificationService $wsNotification,
    ): JsonResponse {
        try {
            // authenticated user
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Invalid user",
                    ],
                    401,
                );
            }
            $userRole = $user->getRoles();
            if (!in_array("ROLE_PATIENT", $userRole)) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Forbidden",
                    ],
                    403,
                );
            }
            $data = json_decode($req->getContent(), true);
            $appointmentID = $data["appointmentID"] ?? null;
            $scheduleID = $data["scheduleID"] ?? null;
            $date = $data["date"];

            $emergency = !empty($data["isEmergency"]) ? 1 : 0;
            $appointment_type_id = !empty($data["isFamilyBooking"]) ? 2 : 1;
            $message = $data["message"];

            if (!$appointmentID || !$scheduleID) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" =>
                            "appointmentID and scheduleID are required",
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
                [
                    "schedule_id" => $scheduleID,
                    "user_set_date" => $date,
                    "emergency" => $emergency,
                    "appointment_type_id" => $appointment_type_id,
                    "message" => $message,
                ],
                ["id" => $appointmentID],
            );

            $appointmentAfter = $connection->fetchAssociative(
                "SELECT * FROM appointment WHERE id = ?",
                [$appointmentID],
            );

            $connection->insert("appointment_log", [
                // "id" => $appointmentID,
                "actor_type" => "patient",
                "action" => "update",
                "message" => "Updated appointment details.",
                "snapshot" => json_encode([
                    "before" => $appointment,
                    "after" => $appointmentAfter,
                ]),
                "logged_at" => new \DateTime()->format("Y-m-d H:i:s"),
            ]);

            // Log to activity log
            $logger->log(
                "APPOINTMENT_UPDATED",
                "updated appointment ID {$appointmentID}",
            );

            // Notify dentist of patient's update
            $dentistId = $connection->fetchOne(
                "SELECT dentist_id FROM appointment WHERE id = ?",
                [$appointmentID],
            );
            $patientName = $user->getUsername() ?? "Patient";

            if ($dentistId) {
                $wsNotification->notifyDentistAppointmentUpdate(
                    (int) $dentistId,
                    $appointmentID,
                    $patientName,
                    "Please review the requested changes.",
                );
            }

            return new JsonResponse([
                "status" => "ok",
                "message" => "Appointment updated successfully",
                "appointmentID" => $appointmentID,
                "newScheduleID" => $scheduleID,
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(
                [
                    "status" => "error",
                    "message" => $e->getMessage(),
                ],
                500,
            );
        }
    }
}
