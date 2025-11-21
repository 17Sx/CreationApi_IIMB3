<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Entity\Post;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(private UserPasswordHasherInterface $passwordHasher)
    {
    }

    public function load(ObjectManager $manager): void
    {
        $user1 = (new User())
            ->setEmail('brainrot@patapim.social')
            ->setUsername('brainrot_king')
            ->setBio('le roi du brainrot 💀🔥');
        
        $user1->setPassword($this->passwordHasher->hashPassword($user1, 'password123'));
        $manager->persist($user1);

        $user2 = (new User())
            ->setEmail('skibidi@patapim.social')
            ->setUsername('skibidi_master')
            ->setBio('skibidi toilet enjoyer fr fr 🚽');
        
        $user2->setPassword($this->passwordHasher->hashPassword($user2, 'password123'));
        $manager->persist($user2);

        $user3 = (new User())
            ->setEmail('sigma@patapim.social')
            ->setUsername('sigma_grindset')
            ->setBio('always on that grind 💪');
        
        $user3->setPassword($this->passwordHasher->hashPassword($user3, 'password123'));
        $manager->persist($user3);

        $post1 = (new Post())
            ->setContent('yo les bg c moi le roi du brainrot 💀🔥 on est là pour défoncer le game')
            ->setAuthor($user1);
        $manager->persist($post1);

        $post2 = (new Post())
            ->setContent('skibidi toilet best anime no cap fr fr 🚽✨')
            ->setAuthor($user2);
        $manager->persist($post2);

        $post3 = (new Post())
            ->setContent('sigma grindset never stops 💪 on lâche rien les kheys')
            ->setAuthor($user3);
        $manager->persist($post3);

        $post4 = (new Post())
            ->setContent('patapim social > twitter fight me 🔥')
            ->setAuthor($user1);
        $manager->persist($post4);

        $manager->flush();
    }
}
