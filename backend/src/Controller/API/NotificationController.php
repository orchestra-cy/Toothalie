<?php

namespace App\Controller\API;
use Symfony\Component\Routing\Annotation\Route;

class NotificationController {
    #[Route('/ws', name: 'websocket')]
    public function websocket() {
        // Mercure handles this automatically
    }

    #[Route('/api/notify-user', name: 'notify_user', methods: ['POST'])]
    public function notifyUser(Request $request) {
        $data = json_decode($request->getContent(), true);
        
        // Publish to Mercure
        $update = new Update(
            'https://example.com/user/' . $data['user_id'],
            json_encode(['type' => 'notification', 'message' => $data['message']])
        );
        
        $this->mercure->publish($update);
    }
}
