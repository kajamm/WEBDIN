import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

export const runtime = 'nodejs'

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) })

export async function GET() {
  try {
    const departments = await prisma.department.findMany({ include: { positions: true } })
    const skills = await prisma.skill.findMany()

    if (departments.length === 0) {
      const d1 = await prisma.department.create({ data: { name: 'Engineering' } })
      const d2 = await prisma.department.create({ data: { name: 'HR' } })
      await prisma.position.createMany({ data: [
        { name: 'Frontend', departmentId: d1.id },
        { name: 'Backend', departmentId: d1.id },
        { name: 'Recruiter', departmentId: d2.id }
      ] })
    }

    const allDepartments = await prisma.department.findMany({ include: { positions: true } })

    for (const dept of allDepartments) {
      const count = await prisma.position.count({ where: { departmentId: dept.id } })
      if (count === 0) {
        const defaultPositions = dept.name.toLowerCase().includes('hr')
          ? ['Recruiter', 'HR Manager']
          : ['Frontend', 'Backend', 'QA']
        await prisma.position.createMany({ data: defaultPositions.map(name => ({ name, departmentId: dept.id })) })
      }
    }

    if (skills.length === 0) {
      await prisma.skill.createMany({ data: [{ name: 'React' }, { name: 'Node.js' }, { name: 'Communication' }] })
    }

    const deps = await prisma.department.findMany({ include: { positions: true } })
    const sks = await prisma.skill.findMany()
    return NextResponse.json({ departments: deps, skills: sks })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load meta data' }, { status: 500 })
  }
}
