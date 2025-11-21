<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

class LoginController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // This controller should normally never be executed because the
        // security system (json_login) intercepts the request earlier.
        // We keep a simple response here so the router has a matching
        // route and you don't get 404s when POSTing to /api/login.
        return new JsonResponse(['message' => 'Authentication endpoint (handled by firewall)'], 200);
    }
}
