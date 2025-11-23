<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Like;
use App\Repository\LikeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;

class LikeUserProcessor implements ProcessorInterface
{
    public function __construct(
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private LikeRepository $likeRepository,
        private EntityManagerInterface $entityManager
    ) {}

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = [])
    {
        if ($data instanceof Like) {
            try {
                $user = $this->security->getUser();
                if ($user) {
                    $data->setUser($user);

                    $post = $data->getPost();
                    if ($post) {
                        $existingLike = $this->likeRepository->findOneByUserAndPost($user, $post);
                        if ($existingLike) {
                            return $existingLike;
                        }

                        $post->setLikesCount($post->getLikesCount() + 1);
                        $this->entityManager->persist($post);
                    }
                }
            } catch (\Throwable $e) {
                return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
            }
        }
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}

