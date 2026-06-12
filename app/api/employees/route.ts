import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

export const runtime = 'nodejs'

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) })

async function parseForm(req: Request) {
  const formData = await req.formData()
  const fields: Record<string, any> = {}
  const files: Record<string, File> = {}

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      files[key] = value
    } else {
      fields[key] = value
    }
  }

  return { fields, files }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || undefined
    const status = url.searchParams.get('status') || undefined
    const page = Number(url.searchParams.get('page') || '1')
    const perPage = Number(url.searchParams.get('perPage') || '5')

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }

    const total = await prisma.employee.count({ where })
    const employees = await prisma.employee.findMany({
      where,
      include: { department: true, position: true, skills: { include: { skill: true } } },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { id: 'asc' },
    })

    return NextResponse.json({ data: employees, total, page, perPage })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { fields, files } = await parseForm(req)
    const { name, email, phone, departmentId, positionId, skills, gender, status } = fields

    // Basic validation
    if (!name) return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 })
    if (!email) return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 })
    const exists = await prisma.employee.findUnique({ where: { email: String(email) } })
    if (exists) return NextResponse.json({ ok: false, error: 'Email sudah terdaftar' }, { status: 400 })

    const toNumber = (v: any) => {
      if (v === undefined || v === null || v === '') return undefined
      const n = Number(v)
      return Number.isFinite(n) && n > 0 ? n : undefined
    }

    let photoPath: string | null = null
    if (files?.photo) {
      const file = Array.isArray(files.photo) ? files.photo[0] : files.photo
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.promises.mkdir(uploadsDir, { recursive: true })
      const fileName = `${Date.now()}-${file.name}`
      const filePath = path.join(uploadsDir, fileName)
      const data = await file.arrayBuffer()
      await fs.promises.writeFile(filePath, Buffer.from(data))
      photoPath = '/uploads/' + fileName
    }

    const data: any = {
      name: String(name),
      email: String(email),
      phone: phone ? String(phone) : null,
      photo: photoPath,
    }
    const dId = toNumber(departmentId)
    const pId = toNumber(positionId)
    if (dId) data.department = { connect: { id: dId } }
    if (pId) data.position = { connect: { id: pId } }
    if (gender) data.gender = String(gender)
    if (status) data.status = String(status)

    let employee
    try {
      employee = await prisma.employee.create({ data })
    } catch (e: any) {
      console.error('Prisma create error', e)
      return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 })
    }

    if (skills) {
      const skillIds = Array.isArray(skills) ? skills.map(Number) : String(skills).split(',').map(Number)
      for (const sid of skillIds) {
        if (!Number.isFinite(Number(sid))) continue
        await prisma.employeeSkill.create({ data: { employeeId: employee.id, skillId: Number(sid) } })
      }
    }

    return NextResponse.json({ ok: true, employee })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const id = Number(url.searchParams.get('id'))
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
    // delete photo file if exists
    const emp = await prisma.employee.findUnique({ where: { id } })
    if (emp?.photo) {
      try {
        const p = path.join(process.cwd(), 'public', emp.photo.replace(/^\//, ''))
        await fs.promises.unlink(p)
      } catch (e) {
        // ignore
      }
    }
    await prisma.employeeSkill.deleteMany({ where: { employeeId: id } })
    await prisma.employee.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url)
    const id = Number(url.searchParams.get('id')) || undefined
    const { fields, files } = await parseForm(req)
    const { name, email, phone, departmentId, positionId, skills, gender, status } = fields

    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })

    // Email uniqueness check (exclude current record)
    if (email) {
      const existing = await prisma.employee.findUnique({ where: { email: String(email) } })
      if (existing && existing.id !== id) return NextResponse.json({ ok: false, error: 'Email sudah terdaftar' }, { status: 400 })
    }

    // handle photo
    let photoPath: string | null | undefined = undefined
    if (files?.photo) {
      const file = Array.isArray(files.photo) ? files.photo[0] : files.photo
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.promises.mkdir(uploadsDir, { recursive: true })
      const fileName = `${Date.now()}-${file.name}`
      const filePath = path.join(uploadsDir, fileName)
      const data = await file.arrayBuffer()
      await fs.promises.writeFile(filePath, Buffer.from(data))
      photoPath = '/uploads/' + fileName

      // delete old photo
      const old = await prisma.employee.findUnique({ where: { id } })
      if (old?.photo) {
        try {
          const p = path.join(process.cwd(), 'public', old.photo.replace(/^\//, ''))
          await fs.promises.unlink(p)
        } catch (e) {}
      }
    }

    const updData: any = {
      name: name ? String(name) : undefined,
      email: email ? String(email) : undefined,
      phone: phone ? String(phone) : null,
      photo: photoPath !== undefined ? photoPath : undefined,
    }
    const dId2 = departmentId ? Number(departmentId) : undefined
    const pId2 = positionId ? Number(positionId) : undefined
    if (dId2) updData.department = { connect: { id: dId2 } }
    if (pId2) updData.position = { connect: { id: pId2 } }
    if (gender) updData.gender = String(gender)
    if (status) updData.status = String(status)

    const employee = await prisma.employee.update({ where: { id }, data: updData })

    if (skills !== undefined) {
      await prisma.employeeSkill.deleteMany({ where: { employeeId: id } })
      const skillIds = Array.isArray(skills) ? skills.map(Number) : String(skills).split(',').map(Number)
      for (const sid of skillIds) {
        await prisma.employeeSkill.create({ data: { employeeId: id, skillId: sid } })
      }
    }

    return NextResponse.json({ ok: true, employee })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
