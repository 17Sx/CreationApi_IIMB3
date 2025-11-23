<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Like;
use Doctrine\ORM\EntityManagerInterface;

class LikeDeleteProcessor implements ProcessorInterface
{
    public function __construct(
        private ProcessorInterface $deleteProcessor,
        private EntityManagerInterface $entityManager
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        if ($data instanceof Like) {
            $post = $data->getPost();
            if ($post && $post->getLikesCount() > 0) {
                $post->setLikesCount($post->getLikesCount() - 1);
                $this->entityManager->persist($post);
            }
        }
        
        return $this->deleteProcessor->process($data, $operation, $uriVariables, $context);
    }
}

