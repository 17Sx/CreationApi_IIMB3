<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Response;

class MeController extends AbstractController
{
    public function __construct(private UserRepository $userRepository)
    {
    }

    #[Route('/api/me', name: 'api_me', methods: ['GET'])]
    public function me(Request $request): JsonResponse
    {
        // Preferred: return the user provided by the security token
        $user = $this->getUser();
        if ($user) {
            return $this->json($user);
        }

        // Fallback: try to decode Bearer token and locate user by claim
        $auth = $request->headers->get('Authorization', '');
        if (str_starts_with($auth, 'Bearer ')) {
            $jwt = substr($auth, 7);
            $parts = explode('.', $jwt);
            if (count($parts) >= 2) {
                $payload = $parts[1];
                $b = strtr($payload, '-_', '+/');
                switch (strlen($b) % 4) { case 2: $b .= '=='; break; case 3: $b .= '='; break; }
                try {
                    $json = json_decode(base64_decode($b), true);
                    error_log('[MeController] Decoded JWT payload: ' . json_encode($json));
                    $usernameClaim = $json['username'] ?? null;
                    error_log('[MeController] usernameClaim=' . ($usernameClaim ?? 'NULL'));
                    if ($usernameClaim) {
                        // try email first
                        $u = $this->userRepository->findOneBy(['email' => $usernameClaim]);
                        error_log('[MeController] find by email result: ' . ($u ? $u->getId() : 'null'));
                        if (!$u) {
                            $u = $this->userRepository->findOneBy(['username' => $usernameClaim]);
                            error_log('[MeController] find by username result: ' . ($u ? $u->getId() : 'null'));
                        }
                        if ($u) {
                            error_log('[MeController] Found user by claim: ' . $u->getId());
                            return $this->json($u);
                        }
                    }
                } catch (\Throwable $e) {
                    error_log('[MeController] JWT decode error: ' . $e->getMessage());
                }
            }
        }

        return new JsonResponse(['code' => 401, 'message' => 'Invalid credentials.'], Response::HTTP_UNAUTHORIZED);
    }
}
