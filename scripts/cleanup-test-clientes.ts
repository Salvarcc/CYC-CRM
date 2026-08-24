import { prisma } from "../src/lib/prisma";

async function main() {
  const r = await prisma.cliente.deleteMany({
    where: { correo: { endsWith: "@cymtest.com" } },
  });
  console.log("Clientes de prueba eliminados:", r.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
