<?php

namespace App\DataFixtures;

use App\Entity\Category;
use App\Entity\Product;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class AppFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $category1 = (new Category())
            ->setTitle('Carton');
        $manager->persist($category1);

        $category2 = (new Category())
            ->setTitle('Film plastique');
        $manager->persist($category2);

        $product = (new Product())
            ->setTitlz('Caisse américaine')
            ->setCategory($category1);
        $manager->persist($product);

        $manager->flush();
    }
}
