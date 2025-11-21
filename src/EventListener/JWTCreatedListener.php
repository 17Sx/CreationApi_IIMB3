<?php

namespace App\EventListener;

use App\Repository\UserRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\Security\Core\Event\AuthenticationSuccessEvent;

final class JWTCreatedListener
{
    public function __construct(private UserRepository $userRepository)
    {
    }

    public function onJWTCreated(JWTCreatedEvent $event) {
        $payload = $event->getData();
        $user = $this->userRepository
            ->findOneByEmail($payload['username']);

        if ($user) {
            // Ensure the token's 'username' claim matches the user provider's identifier (email)
            $payload['username'] = $user->getEmail();
            // Also include an explicit email claim for clarity
            $payload['email'] = $user->getEmail();
            // Do not call non-existent getters. Use known fields only.
            $payload['firstname'] = $user->getUsername();
            $payload['lastname'] = '';
        } else {
            // If we couldn't find a user, keep the username as-is and empty names
            $payload['firstname'] = $payload['username'] ?? '';
            $payload['lastname'] = '';
        }
        $event->setData($payload);
    }
}
