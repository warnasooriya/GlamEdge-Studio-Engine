import { PrismaClient } from "@prisma/client";
import { SERVICE_TEMPLATES } from "../src/modules/services/service.controller";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-salon" },
    update: {},
    create: {
      salonName: "Demo Salon & Studio",
      slug: "demo-salon",
      phone: "0771234567",
      ownerName: "Demo Owner",
      subscription: "PRO",
    },
  });

  const existingServices = await prisma.service.count({ where: { tenantId: tenant.id } });
  if (existingServices === 0) {
    await prisma.service.createMany({
      data: SERVICE_TEMPLATES.map((t) => ({ ...t, tenantId: tenant.id })),
    });
  }

  const existingStaff = await prisma.staff.count({ where: { tenantId: tenant.id } });
  if (existingStaff === 0) {
    await prisma.staff.createMany({
      data: [
        { tenantId: tenant.id, name: "Amaya Perera", role: "Senior Stylist", commission: 15 },
        { tenantId: tenant.id, name: "Nadeesha Silva", role: "Barber", commission: 12 },
        { tenantId: tenant.id, name: "Kavindu Fernando", role: "Kids Specialist", commission: 10 },
      ],
    });
  }

  console.log(`Seeded demo tenant: ${tenant.salonName} (slug: ${tenant.slug}, phone: ${tenant.phone})`);
  console.log("Use the OTP dev-stub: request an OTP for this phone, it will print in the API server logs.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
