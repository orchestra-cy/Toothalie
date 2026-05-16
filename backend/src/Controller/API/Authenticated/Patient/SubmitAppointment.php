<?php

namespace App\Controller\API\Authenticated\Patient;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;
use App\Service\ActivityLogger;
use App\Service\WebSocketNotificationService;

class SubmitAppointment extends AbstractController
{
    // >> >> >> << << <<
    //
    // Append new appointment to db
    //
    // >> >> >> << << <<
    #[Route("/api/add-appointment", name: "add-appointment", methods: ["POST"])]
    public function addAppointment(
        Request $req,
        Connection $connection,
        ActivityLogger $logger,
        WebSocketNotificationService $wsNotification,
    ): JsonResponse {
        date_default_timezone_set("Asia/Manila");
        try {
            // authenticated user
            $user = $this->getUser();
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

            if (
                !$data ||
                !isset($data["dentistID"], $data["day"], $data["time"])
            ) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" =>
                            "Missing required fields: patientID, dentistID, day, time",
                    ],
                    400,
                );
            }

            $patientIDBase = $user->getId();
            $patientID = $patientIDBase;
            $dentistID = $data["dentistID"];
            $day = $data["day"];
            $time = $data["time"];
            $serviceID = $data["serviceID"];

            $emergency = $data["emergency"];
            $setEmergency = $emergency == true ? 1 : 0;

            $appointmentTypeId = $data["appointmentTypeId"];

            $setDate = $data["date"];
            $status = "Pending"; // defualt valUE
            $message = $data["message"];

            $schedule = $connection->fetchAssociative(
                "SELECT id FROM schedule WHERE dentistID = ? AND day_of_week = ? AND time_slot = ?",
                [$dentistID, $day, $time],
            );

            if ($schedule === false || !isset($schedule["id"])) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" =>
                            "No schedule found for the selected dentist, day, and time",
                    ],
                    400,
                );
            }

            $scheduleID = $schedule["id"];

            // Insert appointment
            $connection->insert("appointment", [
                "patient_id" => $patientID,
                "dentist_id" => $dentistID,
                "schedule_id" => $scheduleID,
                "emergency" => $setEmergency,
                "appointment_type_id" => $appointmentTypeId,
                "user_set_date" => $setDate,
                "status" => $status,
                "message" => $message,
                "service_id" => $serviceID,
            ]);

            $appointmentID = $connection->lastInsertId();
            $connection->insert("appointment_log", [
                "appointment_id" => $appointmentID,
                "actor_type" => "PATIENT",
                "action" => "create",
                "message" => "Created a new appointment request.",
                "snapshot" => json_encode([
                    "patient_id" => $patientID,
                    "dentist_id" => $dentistID,
                    "schedule_id" => $scheduleID,
                    "emergency" => $setEmergency,
                    "appointment_type_id" => $appointmentTypeId,
                    "user_set_date" => $setDate,
                    "status" => $status,
                    "message" => $message,
                    "service_id" => $serviceID,
                ]),
                "logged_at" => new \DateTime()->format("Y-m-d H:i:s"),
            ]);

            // Log to activity log
            $logger->log(
                "APPOINTMENT_CREATED",
                "created appointment ID {$appointmentID} (Dentist: {$dentistID})",
            );

            // Notify dentist of new appointment request
            $patientName = $user->getUsername() ?? "Patient";
            $wsNotification->notifyDentistNewAppointment(
                $dentistID,
                $appointmentID,
                $patientName,
                $setDate,
            );

            return new JsonResponse([
                "status" => "ok",
                "message" => "Appointment booked successfully",
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(
                [
                    "status" => "error",
                    "message" =>
                        "Failed to book appointment: " . $e->getMessage(),
                ],
                500,
            );
        }
    }
}
