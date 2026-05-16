<?php

namespace App\Controller\API\Authenticated\Dentist;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;
use App\Service\ActivityLogger;

class EditSettings extends AbstractController
{
    #[
        Route(
            "/api/update-dentist-settings",
            name: "update-dentist-settings",
            methods: ["POST"],
        ),
    ]
    public function Edit(
        Request $req,
        Connection $conn,
        ActivityLogger $logger,
    ): JsonResponse {
        $conn->beginTransaction();
        try {
            $user = $this->getUser();
            $dentistID = $user->getId();

            $data = json_decode($req->getContent(), true);
            $schedules = $data["schedules"];
            $userRole = $user->getRoles();
            
            if (!in_array('ROLE_DENTIST', $userRole)) {
                return new JsonResponse([
                    'status' => 'error',
                    'message' => 'Forbidden'
                ], 403);
            }
            if ($schedules === null) {
                return new JsonResponse(
                    ["status" => "error", "message" => "Invalid JSON payload"],
                    400,
                );
            }

            if (!$dentistID && !empty($schedules)) {
                $dentistID = $schedules[0]["dentistID"] ?? null;
            }

            if (!$dentistID) {
                return new JsonResponse(
                    ["status" => "error", "message" => "Missing dentistID"],
                    400,
                );
            }

            $dentist = $conn->fetchAssociative(
                "SELECT id, username, first_name, last_name, email
                 FROM user WHERE id = ?",
                [$dentistID],
            );

            if (!$dentist) {
                return new JsonResponse(
                    ["status" => "error", "message" => "User not found"],
                    404,
                );
            }

            $userRoles = [];
            $userRolesData = $conn->fetchAssociative(
                "SELECT roles FROM user WHERE id = ?",
                [$dentistID],
            );

            if ($userRolesData && !empty($userRolesData["roles"])) {
                $userRoles = json_decode($userRolesData["roles"], true);
            }

            $userRoles = array_map("strtoupper", $userRoles);

            if (!in_array("ROLE_DENTIST", $userRoles)) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "User is not authorized as a dentist",
                        "debug_roles" => $userRoles,
                    ],
                    403,
                );
            }

            // Fetch existing schedules for this dentist
            $existingSchedules = $conn->fetchAllAssociative(
                "SELECT id, day_of_week, time_slot FROM schedule WHERE dentistID = ?",
                [$dentistID],
            );
            
            $existingByID = [];
            $existingByTime = [];
            foreach ($existingSchedules as $es) {
                $existingByID[$es["id"]] = $es;
                $key = strtoupper(trim($es["day_of_week"])) . '-' . strtoupper(trim($es["time_slot"]));
                $existingByTime[$key] = $es["id"];
            }

            $processedIDs = [];
            $claimedTimes = []; // Tracks day/time combinations processed in this request

            // ==========================================
            // PROCESS INSERTS, UPDATES, AND SKIP DUPLICATES
            // ==========================================
            foreach ($schedules as $schedule) {
                $scheduleID = !empty($schedule["scheduleID"]) ? (int) $schedule["scheduleID"] : null;
                $day = trim($schedule["day_of_week"] ?? "");
                $time = trim($schedule["time_slot"] ?? "");

                if (!$day || !$time) {
                    continue; 
                }

                $uniqueKey = strtoupper($day) . '-' . strtoupper($time);

                // 1. Skip duplicate exact day/time within the SAME payload
                if (in_array($uniqueKey, $claimedTimes)) {
                    if ($scheduleID) {
                        $processedIDs[] = $scheduleID; // Prevent deletion if ID was passed
                    }
                    continue;
                }

                $claimedTimes[] = $uniqueKey;

                if ($scheduleID && isset($existingByID[$scheduleID])) {
                    $currentEs = $existingByID[$scheduleID];
                    $isChangingTime = (strtoupper($currentEs['day_of_week']) !== strtoupper($day) || strtoupper($currentEs['time_slot']) !== strtoupper($time));

                    if (!$isChangingTime) {
                        // Unchanged schedule. Just mark as processed.
                        $processedIDs[] = $scheduleID;
                        continue;
                    }

                    // Schedule is changing time. Check for DB conflicts.
                    if (isset($existingByTime[$uniqueKey]) && $existingByTime[$uniqueKey] !== $scheduleID) {
                        // Conflict exists. Skip update to prevent duplicate.
                        $processedIDs[] = $scheduleID;
                        continue;
                    }

                    // Check for appointments
                    $hasAppointment = $conn->fetchOne(
                        "SELECT 1 FROM appointment WHERE schedule_id = ? LIMIT 1",
                        [$scheduleID]
                    );

                    if ($hasAppointment) {
                        // Has appointment. Skip update to protect data.
                        $processedIDs[] = $scheduleID;
                        continue;
                    }

                    // Safe to update
                    $conn->update(
                        "schedule",
                        [
                            "day_of_week" => $day,
                            "time_slot" => $time,
                        ],
                        ["id" => $scheduleID], 
                    );
                    $processedIDs[] = $scheduleID;

                } else {
                    // New schedule (no ID provided)
                    if (isset($existingByTime[$uniqueKey])) {
                        // A record with this time already exists in the DB.
                        // Map it to the existing ID to prevent deletion, do NOT insert duplicate.
                        $processedIDs[] = $existingByTime[$uniqueKey];
                    } else {
                        // Insert new schedule safely
                        $conn->insert("schedule", [
                            "day_of_week" => $day,
                            "time_slot" => $time,
                            "dentistID" => $dentistID,
                        ]);
                        $processedIDs[] = (int) $conn->lastInsertId();
                    }
                }
            }

            $processedIDs = array_unique($processedIDs);

            // ==========================================
            // PROCESS DELETIONS
            // ==========================================
            $existingIDs = array_keys($existingByID);
            $toDelete = array_diff($existingIDs, $processedIDs);
            $deletedIDs = [];
            $notDeletedIDs = [];

            if (!empty($toDelete)) {
                $placeholders = implode(",", array_fill(0, count($toDelete), "?"));
                $deleteParams = array_map("intval", $toDelete);

                // Check if any schedules to be deleted are referenced in appointments
                $referencedIDs = $conn->fetchFirstColumn(
                    "SELECT DISTINCT schedule_id FROM appointment WHERE schedule_id IN ($placeholders)",
                    $deleteParams,
                ) ?: [];

                $safeToDelete = array_diff($toDelete, $referencedIDs);
                
                if (!empty($safeToDelete)) {
                    $placeholdersDelete = implode(",", array_fill(0, count($safeToDelete), "?"));
                    $conn->executeStatement(
                        "DELETE FROM schedule WHERE id IN ($placeholdersDelete)",
                        array_map("intval", $safeToDelete),
                    );
                    $deletedIDs = $safeToDelete;
                }

                $notDeletedIDs = $referencedIDs;
            }

            $conn->commit();

            // Log Success
            $logger->log(
                "SCHEDULE_UPDATED",
                "Dentist schedule updated for User ID {$dentistID}",
                null,
                [
                    "actor_type" => "DENTIST",
                    "dentist_id" => $dentistID,
                    "processed_ids" => array_values($processedIDs),
                    "deleted_ids" => array_values($deletedIDs),
                    "skipped_ids" => array_values($notDeletedIDs),
                ],
            );

            return new JsonResponse([
                "status" => "ok",
                "message" => "Dentist schedule processed successfully",
                "processed" => array_values($processedIDs),
                "deleted" => array_values($deletedIDs),
                "not_deleted_due_to_appointments" => array_values($notDeletedIDs),
            ]);
        } catch (\Exception $e) {
            if ($conn->isTransactionActive()) {
                $conn->rollBack();
            }

            // Log Error
            $logger->log(
                "ERROR",
                "Failed to update dentist schedule: " . $e->getMessage(),
                null,
                ["actor_type" => "DENTIST"],
            );

            return new JsonResponse(
                [
                    "status" => "error",
                    "message" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    #[
        Route(
            "/api/edit-services",
            name: "/api/edit-services",
            methods: ["POST"],
        ),
    ]
    public function editServices(
        Request $request,
        Connection $connection,
        ActivityLogger $logger,
    ): JsonResponse {
        $user = $this->getUser();
        $userID = $user->getId();
        $data = json_decode($request->getContent(), true);
        $userRole = $user->getRoles();
        
        if (!in_array('ROLE_DENTIST', $userRole)) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Forbidden'
            ], 403);
        }
        if (!$data || !isset($data["payload"])) {
            return new JsonResponse(["error" => "Invalid request"], 400);
        }

        $payload = $data["payload"];

        try {
            $connection->beginTransaction();

            // Fetch CURRENT dentist services from DB
            $existing = $connection->fetchFirstColumn(
                "SELECT service_id FROM dentist_service WHERE user_id = ?",
                [$userID],
            );

            $existing = array_map("intval", $existing);

            // Extract NEW service IDs from payload
            $newServiceIds = array_map(
                fn($item) => (int) $item["service_id"],
                $payload,
            );

            // Remove duplicates just in case
            $newServiceIds = array_unique($newServiceIds);

            // Determine INSERTS & DELETES
            $toInsert = array_diff($newServiceIds, $existing);
            $toDelete = array_diff($existing, $newServiceIds);

            //  Perform INSERTS
            foreach ($toInsert as $serviceID) {
                $connection->insert("dentist_service", [
                    "user_id" => $userID,
                    "service_id" => $serviceID,
                ]);
            }

            //  Perform DELETES
            foreach ($toDelete as $serviceID) {
                $connection->delete("dentist_service", [
                    "user_id" => $userID,
                    "service_id" => $serviceID,
                ]);
            }

            // Commit changes
            $connection->commit();

            // Log Success
            $logger->log(
                "SERVICES_UPDATED",
                "Dentist services updated for User ID {$userID}",
                null,
                [
                    "actor_type" => "DENTIST",
                    "user_id" => $userID,
                    "added_services" => array_values($toInsert),
                    "removed_services" => array_values($toDelete),
                    "final_service_list" => $newServiceIds,
                ],
            );

            return new JsonResponse([
                "status" => "success",
                "added" => array_values($toInsert),
                "removed" => array_values($toDelete),
                "finalServices" => array_values($newServiceIds),
            ]);
        } catch (\Throwable $e) {
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }

            // Log Error
            $logger->log(
                "ERROR",
                "Failed to update dentist services: " . $e->getMessage(),
                null,
                ["actor_type" => "DENTIST"],
            );

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