<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Comment;
use Symfony\Bundle\SecurityBundle\Security;

class CommentAuthorProcessor implements ProcessorInterface
{
    public function __construct(
        private ProcessorInterface $persistProcessor,
        private Security $security
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        if ($data instanceof Comment) {
            $user = $this->security->getUser();
            if ($user) {
                $data->setAuthor($user);
            }
        }
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}

