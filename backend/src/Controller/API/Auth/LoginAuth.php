<?php

namespace App\Controller\API\Auth;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Entity\User;

class LoginAuth extends AbstractController
{
    #[Route("/api/login-auth", name: "login-auth", methods: ["POST"])]
    public function doGetUser(
        Request $req,
        Connection $connection,
        EntityManagerInterface $entityManager,
        JWTTokenManagerInterface $jwtManager,
        UserPasswordHasherInterface $passwordHasher,
    ): JsonResponse {
        try {
            $userInput = json_decode($req->getContent(), true);
            $username = $userInput["username"] ?? null;
            $password = $userInput["password"] ?? null;

            if (!$username || !$password) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Username and password are required.",
                    ],
                    400,
                );
            }

            $isVerified = $connection->fetchOne(
                "
                SELECT is_verified
                FROM user
                WHERE username = ?
            ",
                [$username],
            );

            // Cast to int to ensure string "0" from DB is caught correctly
            if ($isVerified === false || (int) $isVerified === 0) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "User Not Verified",
                    ],
                    401,
                );
            }

            $userData = $connection->fetchAssociative(
                "
                SELECT id, username, email, password, first_name, last_name
                FROM user
                WHERE username = ? and is_verified = 1
            ",
                [$username],
            );

            if (!$userData) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "No user found with that username.",
                    ],
                    401,
                );
            }

            // Verify password using Symfony hasher
            $dummyUser = new User();
            $dummyUser->setPassword($userData["password"]); // set hashed password from DB

            if (!$passwordHasher->isPasswordValid($dummyUser, $password)) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "Incorrect username or password.",
                    ],
                    401,
                );
            }

            // Fetch roles
            $roles = $connection->fetchFirstColumn(
                "
                SELECT r.role_name
                FROM role r
                INNER JOIN user_role ur ON r.id = ur.role_id
                WHERE ur.user_id = ?
            ",
                [$userData["id"]],
            );

            $userEntity = $entityManager
                ->getRepository(User::class)
                ->find($userData["id"]);

            if (!$userEntity) {
                return new JsonResponse(
                    [
                        "status" => "error",
                        "message" => "User not found.",
                    ],
                    401,
                );
            }

            // Ensure roles are included in the token payload
            $userEntity->setRoles($roles);

            $token = $jwtManager->create($userEntity);

            return new JsonResponse(
                [
                    "token" => $token,
                ],
                200,
            );
        } catch (\Exception $e) {
            return new JsonResponse(
                [
                    "status" => "error",
                    "message" => "Login failed: " . $e->getMessage(),
                ],
                500,
            );
        }
    }
}
