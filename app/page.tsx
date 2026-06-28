"use client"

import React, { useEffect, useState } from 'react'

type Department = { id: number; name: string; positions?: { id: number; name: string }[] }
type Skill = { id: number; name: string }
type Employee = any

export default function Home() {
  const [deps, setDeps] = useState<Department[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [positions, setPositions] = useState<{ id: number; name: string }[]>([])
  const [selectedDept, setSelectedDept] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', departmentId: '', positionId: '', skills: [] as number[], gender: '', status: '' })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [perPage] = useState(5)
  const [total, setTotal] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
  console.log("USE EFFECT JALAN")

  const load = async () => {
    console.log("LOAD JALAN")

    await fetchMeta()
    await fetchEmployees()
  }

  load()
}, [])

  async function fetchMeta() {
    try {
      
      console.log('[FETCH] /api/meta')
      console.log("HOME COMPONENT RENDER")
      const res = await fetch('/api/meta')
      const data = await res.json()
      console.log('[RESPONSE] /api/meta:', data)
      if (!res.ok) {
        throw new Error(data?.error || 'Gagal memuat referensi')
      }
      setDeps(data.departments || [])
      setSkills(data.skills || [])
      setError(null)
    } catch (err: any) {
      console.error('[ERROR] fetchMeta:', err)
      setError(err.message || 'Gagal memuat referensi')
    }
  }

  async function fetchEmployees(p = 1) {
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterStatus) params.set('status', filterStatus)
      params.set('page', String(p))
      params.set('perPage', String(perPage))

      const res = await fetch(`/api/employees?${params}`)
      const data = await res.json()

      if (res.ok) {
        setEmployees(data.data ?? [])
        setTotal(data.total ?? 0)
        setPage(data.page ?? 1)
      } else {
        console.error('Gagal memuklat data employee:', data.error)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Sinkronisasi Jabatan berdasarkan Departemen Pilihan
  useEffect(() => {
    if (selectedDept) {
      const sel = deps.find(d => d.id === Number(selectedDept))
      setPositions(sel?.positions || [])
    } else {
      setPositions([])
    }
  }, [selectedDept, deps])

  function handleSkillToggle(id: number) {
    setForm(f => ({ ...f, skills: f.skills.includes(id) ? f.skills.filter(s => s !== id) : [...f.skills, id] }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    console.log("SUBMIT DIKLIK")
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('email', form.email)
    fd.append('phone', form.phone)
    if (form.departmentId) fd.append('departmentId', form.departmentId)
    if (form.positionId) fd.append('positionId', form.positionId)
    fd.append('skills', form.skills.join(','))
    if (form.gender) fd.append('gender', form.gender)
    if (form.status) fd.append('status', form.status)
    if (photoFile) fd.append('photo', photoFile)

    const url = editingId ? '/api/employees?id=' + editingId : '/api/employees'
    const method = editingId ? 'PUT' : 'POST'
    
    try {
      const res = await fetch(url, { method, body: fd })
      const data = await res.json()
      
      // Mengecek kecocokan response HTTP atau key data.ok
      if (res.ok || data.ok) {
        setForm({ name: '', email: '', phone: '', departmentId: '', positionId: '', skills: [], gender: '', status: '' })
        setEditingId(null)
        setPhotoFile(null)
        setSelectedDept(null)
        await fetchEmployees(1)
        alert(editingId ? 'Data berhasil diupdate!' : 'Data berhasil disimpan!')
      } else {
        alert('Error: ' + (data.error || 'Terjadi kesalahan sistem.'))
      }
    } catch (err: any) {
      alert('Terjadi kesalahan koneksi ke server.')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus karyawan ini?')) return
    const res = await fetch('/api/employees?id=' + id, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok || data.ok) fetchEmployees(1)
    else alert(data.error)
  }

  function handleEdit(emp: Employee) {
    setEditingId(emp.id)
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      departmentId: emp.departmentId ? String(emp.departmentId) : '',
      positionId: emp.positionId ? String(emp.positionId) : '',
      skills: (emp.skills || []).map((es: any) => es.skill?.id).filter(Boolean),
      gender: emp.gender || '',
      status: emp.status || '',
    })
    setSelectedDept(emp.departmentId || null)
    setPhotoFile(null)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">CRUD Manajemen Karyawan</h1>
      {error && <div className="mb-4 rounded border border-red-300 bg-red-50 p-4 text-red-700">{error}</div>}
      
      <form onSubmit={submit} className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block font-medium">Nama</label>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border p-2 rounded" required />
        </div>
        <div>
          <label className="block font-medium">Telepon</label>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block font-medium">Foto</label>
          <input type="file" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="w-full border p-1 rounded" />
        </div>

        <div>
          <label className="block font-medium">Gender</label>
          <div className="flex gap-4 mt-2">
            <label className="inline-flex items-center"><input type="radio" name="gender" checked={form.gender === 'MALE'} onChange={() => setForm({ ...form, gender: 'MALE' })} /> <span className="ml-2">Laki-laki</span></label>
            <label className="inline-flex items-center"><input type="radio" name="gender" checked={form.gender === 'FEMALE'} onChange={() => setForm({ ...form, gender: 'FEMALE' })} /> <span className="ml-2">Perempuan</span></label>
          </div>
        </div>

        <div>
          <label className="block font-medium">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border p-2 rounded">
            <option value="">Pilih status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PROBATION">Masa Percobaan</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Departemen</label>
          <select value={form.departmentId} onChange={e => { setForm({ ...form, departmentId: e.target.value, positionId: '' }); setSelectedDept(Number(e.target.value)) }} className="w-full border p-2 rounded">
            <option value="">Pilih departemen</option>
            {deps.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium">Jabatan</label>
          <select value={form.positionId} onChange={e => setForm({ ...form, positionId: e.target.value })} className="w-full border p-2 rounded" disabled={!form.departmentId}>
            <option value="">Pilih jabatan</option>
            {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block font-medium">Skill (pilih beberapa)</label>
          <div className="flex gap-4 mt-2 flex-wrap bg-gray-50 p-3 border rounded">
            {skills.length === 0 ? <span className="text-sm text-gray-400">Tidak ada data skill master</span> : 
              skills.map(s => (
                <label key={s.id} className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.skills.includes(s.id)} onChange={() => handleSkillToggle(s.id)} />
                  {s.name}
                </label>
              ))
            }
          </div>
        </div>

        <div className="col-span-2 flex items-center gap-2 mt-2">
          <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded">{editingId ? 'Update' : 'Simpan'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', email: '', phone: '', departmentId: '', positionId: '', skills: [], gender: '', status: '' }); setPhotoFile(null); setSelectedDept(null) }} className="px-4 py-2 border rounded hover:bg-gray-100">Batal</button>}
        </div>
      </form>

      <div className="flex items-center justify-between mb-4 gap-2 border-t pt-4">
        <div className="flex gap-2">
          <input placeholder="Search nama atau email" value={search} onChange={e => setSearch(e.target.value)} className="border p-2 rounded" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border p-2 rounded">
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="PROBATION">Masa Percobaan</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
          <button onClick={() => fetchEmployees(1)} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">Filter</button>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Total API: {total} | Total State: {employees.length}</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Daftar Karyawan</h2>

      <table className="w-full border-collapse border border-gray-300 rounded shadow-sm overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Foto</th>
            <th className="border p-2 text-left">ID</th>
            <th className="border p-2 text-left">Nama</th>
            <th className="border p-2 text-left">Email</th>
            <th className="border p-2 text-left">Departemen</th>
            <th className="border p-2 text-left">Jabatan</th>
            <th className="border p-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td colSpan={6} className="border p-8 text-center text-gray-500">Tidak ada data karyawan</td>
            </tr>
          ) : (
            employees.map((emp: any) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="border p-2">
      {emp.photo ? (
        <img
          src={emp.photo}
          alt={emp.name}
          className="w-16 h-16 object-cover rounded border"
        />
      ) : (
        <span className="text-gray-400 text-xs">
          No Photo
        </span>
      )}
                </td>
                <td className="border p-2">{emp.id}</td>
                <td className="border p-2 font-medium">{emp.name}</td>
                <td className="border p-2">{emp.email}</td>
                <td className="border p-2">{emp.department?.name || "-"}</td>
                <td className="border p-2">{emp.position?.name || "-"}</td>
                <td className="border p-2 text-center">
                  <button onClick={() => handleEdit(emp)} className="mr-3 text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:underline font-medium">Hapus</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button disabled={page <= 1} onClick={() => fetchEmployees(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
        <span className="text-sm">Halaman <strong>{page}</strong></span>
        <button disabled={page * perPage >= total} onClick={() => fetchEmployees(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  )
}
