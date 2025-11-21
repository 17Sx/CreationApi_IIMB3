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

        $payload['firstname'] = $user->getFirstname();
        $payload['lastname'] = $user->getLastname();
        $event->setData($payload);
    }
}
