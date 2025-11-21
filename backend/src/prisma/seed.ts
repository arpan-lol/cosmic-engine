import prisma from './client';

async function main() {
  console.log('Seeding database...');

  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@cosmicengine' },
    update: {},
    create: {
      email: 'guest@cosmicengine',
      name: 'Guest User',
      password: 'guest',
    },
  });

  console.log('Guest user created/updated:', guestUser);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
