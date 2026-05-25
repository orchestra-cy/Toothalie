<?php

namespace App\Controller\API\Auth;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Bundle\SecurityBundle\Security;
use App\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;

final class MeController extends AbstractController
{
    #[Route("/api/auth/me", name: "auth_me", methods:['GET'])]
    public function getMe(Security $security)
    {
        $user = $security->getUser();
        
        if(!$user){
            return new JsonResponse([
                ['status' => 'error']
            ], 401);
        }
     
        return new JsonResponse([
            'status'=> 'ok',
            "email" => $user?->getUserIdentifier(),
            "roles" => $user?->getRoles(),
        ]);
    }
    #[Route('/api/debug-key', name: 'debug_key', methods: ['GET'])]
    public function getPublicKey(): JsonResponse
    {
        // Grabs the public key file directly from the server
        $path = $this->getParameter('kernel.project_dir') . '/config/jwt/public.pem';
        $key = file_get_contents($path);
        
        return new JsonResponse([$key, 200, ['Content-Type' => 'text/plain']]);
    }
}
