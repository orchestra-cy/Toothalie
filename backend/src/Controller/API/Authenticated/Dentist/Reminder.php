<?php

namespace App\Controller\API\Authenticated\Dentist;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;
use App\Service\ActivityLogger;
use App\Service\WebSocketNotificationService;
use App\Entity\User;

class Reminder extends AbstractController
{
    #[Route("/api/save-reminder", name: "save-reminder", methods: ["POST"])]
    public function saveReminder(
        Request $req,
        Connection $connection,
        ActivityLogger $logger,
        WebSocketNotificationService $wsNotification,
    ): JsonResponse {
        date_default_timezone_set("Asia/Manila");

        try {
            $user = $this->getUser();
            if (!$user instanceof User) {
                return new JsonResponse([
                    "status" => "error",
                    "message" => "Invalid user",
                ], 401);
            }
            
            $userRole = $user->getRoles();
            if (!in_array("ROLE_DENTIST", $userRole)) {
                return new JsonResponse([
                    "status" => "error",
                    "message" => "Forbidden",
                ], 403);
            }

            $data = json_decode($req->getContent(), true);
            $appointmentID = $data["id"] ?? null;

            // 1. EXTRACT RAW PAYLOAD
            $rawPayload = $data["payload"] ?? null;
            $payloadArray = is_string($rawPayload) ? json_decode($rawPayload, true) : $rawPayload;

            if (!$rawPayload || !$appointmentID) {
                return new JsonResponse([
                    "status" => "error",
                    "message" => "Missing payload or id",
                ], 400);
            }

            // 2. EXTRACT SPECIFIC ATTRIBUTES FOR THE NOTIFICATION
            $aptDate = $payloadArray[0]["date"] ?? "your upcoming appointment";
            $startTime = $payloadArray[0]["slots"][0]["startTime"] ?? "";
            $endTime = $payloadArray[0]["slots"][0]["endTime"] ?? "";
            $extractedMessage = $payloadArray[0]["slots"][0]["message"] ?? "";

            // 3. GET DENTIST NAME SAFELY (Fallback to "Your Dentist" if not found)
            $dentistName = "Your Dentist";
            if (method_exists($user, 'getUserIdentifier') && $user->getUserIdentifier()) {
                $dentistName = $user->getUserIdentifier();
            } elseif (method_exists($user, 'getUsername') && $user->getUsername()) {
                $dentistName = $user->getUsername();
            }

            // 4. UPSERT INTO DATABASE (Save the FULL structure, not just the message)
            $existing = $connection->fetchAssociative(
                "SELECT * FROM reminder WHERE appointment_id = ?",
                [$appointmentID],
            );

            $dbInformation = is_string($rawPayload) ? $rawPayload : json_encode($rawPayload);

            if ($existing) {
                $connection->update(
                    "reminder",
                    ["information" => $dbInformation],
                    ["appointment_id" => $appointmentID],
                );

                $actionKey = "REMINDER_UPDATED";
                $logMessage = "Reminder updated for appointmentID {$appointmentID}";
            } else {
                $connection->insert("reminder", [
                    "appointment_id" => $appointmentID,
                    "information" => $dbInformation,
                ]);

                $actionKey = "REMINDER_CREATED";
                $logMessage = "Reminder created for appointmentID {$appointmentID}";
            }

            // Log the action via Service
            $logger->log($actionKey, $logMessage, null, [
                "actor_type" => "DENTIST",
                "appointment_id" => $appointmentID,
                "snapshot" => $rawPayload,
            ]);

            // 5. SEND BEAUTIFUL NOTIFICATION
            $patientId = $connection->fetchOne(
                "SELECT patient_id FROM appointment WHERE id = ?",
                [$appointmentID],
            );

            if ($patientId) {
                // Construct the base message
                $timeString = ($startTime && $endTime) ? " between {$startTime} - {$endTime}" : "";
                $friendlyNotificationText = "Dr. {$dentistName} set a reminder for {$aptDate}{$timeString}.";
                
                // Append the specific message if the dentist wrote one
                if (!empty(trim($extractedMessage))) {
                    $friendlyNotificationText .= " Note: {$extractedMessage}";
                }

                $wsNotification->notifyReminder(
                    (int) $patientId,
                    $appointmentID,
                    $friendlyNotificationText,
                );
            }

            return new JsonResponse([
                "status" => "success",
                "message" => "Reminder saved successfully",
            ]);
            
        } catch (\Exception $e) {
            $logger->log("ERROR", "Failed to save reminder: " . $e->getMessage(), null, ["actor_type" => "DENTIST"]);
            return new JsonResponse(["status" => "error", "message" => $e->getMessage()], 500);
        }
    }

    #[Route("/api/get-reminder", name: "get-reminder", methods: ["POST"])]
    public function getReminder(
        Request $req,
        Connection $connection,
        ActivityLogger $logger,
    ): JsonResponse {
        try {
            $user = $this->getUser();
            $userRole = $user->getRoles();
            if (!in_array("ROLE_DENTIST", $userRole)) {
                return new JsonResponse(["status" => "error", "message" => "Forbidden"], 403);
            }
            
            $data = json_decode($req->getContent(), true);
            $appointmentID = $data["id"] ?? null;

            if (!$appointmentID) {
                return new JsonResponse(["status" => "error", "message" => "Missing id"], 400);
            }

            $reminder = $connection->fetchAssociative(
                "SELECT information FROM reminder WHERE appointment_id = ?",
                [$appointmentID],
            );

            if (!$reminder) {
                return new JsonResponse([
                    "status" => "success",
                    "message" => "No reminder found",
                    "data" => null,
                ]);
            }

            return new JsonResponse([
                "status" => "success",
                "message" => "Reminder fetched successfully",
                "data" => json_decode($reminder["information"], true),
            ]);
            
        } catch (\Exception $e) {
            $logger->log("ERROR", "Failed to fetch reminder: " . $e->getMessage(), null, ["actor_type" => "DENTIST"]);
            return new JsonResponse(["status" => "error", "message" => $e->getMessage()], 500);
        }
    }

    #[Route("/api/update-reminder", name: "update-reminder", methods: ["POST"])]
    public function updateReminder(
        Request $req,
        Connection $connection,
        ActivityLogger $logger,
        WebSocketNotificationService $wsNotification,
    ): JsonResponse {
        // Because saveReminder handles both INSERT and UPDATE logic perfectly, 
        // we can cleanly reuse the exact same logic here to prevent duplicate bugs.
        return $this->saveReminder($req, $connection, $logger, $wsNotification);
    }
}