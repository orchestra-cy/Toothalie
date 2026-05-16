<?php

namespace App\Controller\API\Authenticated;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;

final class GetHistory extends AbstractController
{
    #[Route('/api/get-history', name: 'app_get_history', methods: ['POST'])]
    public function index(Request $request, Connection $connection): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            $userID = $data['userID'] ?? null;
            $role = strtoupper($data['role'] ?? '');

            if (!$userID || !$role) {
                return new JsonResponse([
                    'status' => 'error',
                    'message' => 'Missing required parameter: userID or role',
                ], 400);
            }

            // Determine which appointments belong to the user
            $queryBase = match ($role) {
                'DENTIST' => "SELECT id FROM appointment WHERE dentist_id = ?",
                'PATIENT' => "SELECT id FROM appointment WHERE patient_id = ?",
                default => null,
            };

            if (!$queryBase) {
                return new JsonResponse([
                    'status' => 'error',
                    'message' => 'Invalid role provided',
                ], 400);
            }

            // Fetch appointment IDs
            $appointments = $connection->fetchAllAssociative($queryBase, [$userID]);
            $appointmentIDs = array_column($appointments, 'id');

            // If user has no appointments, still check if there are null logs
            if (empty($appointmentIDs)) {
                $logs = $connection->fetchAllAssociative("
                    SELECT 
                        al.*
                    FROM appointment_log al
                    WHERE al.appointment_id IS NULL
                    ORDER BY al.logged_at DESC
                ");

                return new JsonResponse([
                    'status' => 'ok',
                    'count' => count($logs),
                    'data' => $logs
                ]);
            }

            // Create placeholders (?, ?, ?, ...)
            $placeholders = implode(',', array_fill(0, count($appointmentIDs), '?'));

            $logQuery = "
                SELECT 
                    al.*,

                    a.patient_id,
                    a.dentist_id,
                    a.status AS current_appointment_status,
                    a.user_set_date,

                    dentist.first_name AS dentist_first_name,
                    dentist.last_name AS dentist_last_name,

                    patient.first_name AS patient_first_name,
                    patient.last_name AS patient_last_name

                FROM appointment_log al
                LEFT JOIN appointment a ON a.id = al.appointment_id
                LEFT JOIN user dentist ON dentist.id = a.dentist_id
                LEFT JOIN user patient ON patient.id = a.patient_id

                WHERE (
                    al.appointment_id IN ($placeholders)
                    OR al.appointment_id IS NULL
                )

                ORDER BY al.logged_at DESC
            ";

            $logs = $connection->fetchAllAssociative(
                $logQuery,
                array_values($appointmentIDs)
            );

            return new JsonResponse([
                'status' => 'ok',
                'count' => count($logs),
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'status' => 'error',
                'message' => 'Failed to fetch history: ' . $e->getMessage()
            ], 500);
        }
    }
}