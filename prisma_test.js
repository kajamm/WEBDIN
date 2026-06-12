require('dotenv/config');
const {PrismaClient}=require('./node_modules/@prisma/client');
const {PrismaMariaDb}=require('@prisma/adapter-mariadb');
const prisma=new PrismaClient({adapter:new PrismaMariaDb(process.env.DATABASE_URL)});
async function run(){
  const employee = await prisma.employee.create({
    data: {
      name: 'test gender',
      email: 'test-gender-'+Date.now()+'@example.com',
      phone: '08123',
      photo: '/uploads/test.txt',
      gender: 'MALE',
      status: 'ACTIVE',
      department: { connect: { id: 1 } },
      position: { connect: { id: 1 } }
    }
  });
  console.log('created', employee);
  await prisma.employee.delete({ where: { id: employee.id } });
  await prisma.$disconnect();
}
run().catch(e=>{ console.error(e); process.exit(1);});
