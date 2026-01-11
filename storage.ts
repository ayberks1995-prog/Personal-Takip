// Local storage management for personnel tracking system
export interface Personnel {
  id: string
  name: string
  email: string
  position: string
  department: string
  phoneNumber: string
  startDate: string
  status: "active" | "inactive"
}

export interface AttendanceRecord {
  id: string
  personnelId: string
  personnelName: string
  date: string
  checkIn: string
  checkOut: string | null
  duration: number // in minutes
  notes?: string
}

export interface Department {
  id: string
  name: string
  description: string
}

// Authentication
export const AUTH_KEY = "personnel_auth"
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin1234",
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(AUTH_KEY) === "true"
}

export function login(username: string, password: string): boolean {
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    localStorage.setItem(AUTH_KEY, "true")
    return true
  }
  return false
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY)
}

// Personnel Management
const PERSONNEL_KEY = "personnel_data"

export function getPersonnel(): Personnel[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(PERSONNEL_KEY)
  return data ? JSON.parse(data) : []
}

export function savePersonnel(personnel: Personnel[]): void {
  localStorage.setItem(PERSONNEL_KEY, JSON.stringify(personnel))
}

export function addPersonnel(personnel: Omit<Personnel, "id">): Personnel {
  const allPersonnel = getPersonnel()
  const newPersonnel: Personnel = {
    ...personnel,
    id: Date.now().toString(),
  }
  allPersonnel.push(newPersonnel)
  savePersonnel(allPersonnel)
  return newPersonnel
}

export function updatePersonnel(id: string, updates: Partial<Personnel>): void {
  const allPersonnel = getPersonnel()
  const index = allPersonnel.findIndex((p) => p.id === id)
  if (index !== -1) {
    allPersonnel[index] = { ...allPersonnel[index], ...updates }
    savePersonnel(allPersonnel)
  }
}

export function deletePersonnel(id: string): void {
  const allPersonnel = getPersonnel()
  savePersonnel(allPersonnel.filter((p) => p.id !== id))
}

// Attendance Management
const ATTENDANCE_KEY = "attendance_data"

export function getAttendance(): AttendanceRecord[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(ATTENDANCE_KEY)
  return data ? JSON.parse(data) : []
}

export function saveAttendance(attendance: AttendanceRecord[]): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(attendance))
}

export function checkIn(personnelId: string, personnelName: string): AttendanceRecord {
  const attendance = getAttendance()
  const now = new Date()
  const today = now.toLocaleDateString("tr-TR")
  const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  // Check if already checked in today
  const existing = attendance.find((a) => a.personnelId === personnelId && a.date === today && !a.checkOut)

  if (existing) {
    throw new Error("Bu personel bugün zaten giriş yapmış")
  }

  const record: AttendanceRecord = {
    id: Date.now().toString(),
    personnelId,
    personnelName,
    date: today,
    checkIn: time,
    checkOut: null,
    duration: 0,
  }

  attendance.push(record)
  saveAttendance(attendance)
  return record
}

export function checkOut(personnelId: string): AttendanceRecord | null {
  const attendance = getAttendance()
  const today = new Date().toLocaleDateString("tr-TR")
  const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })

  const recordIndex = attendance.findIndex((a) => a.personnelId === personnelId && a.date === today && !a.checkOut)

  if (recordIndex === -1) {
    throw new Error("Bu personel için aktif giriş kaydı bulunamadı")
  }

  const record = attendance[recordIndex]
  const checkInTime = record.checkIn.split(":")
  const checkOutTime = time.split(":")
  const checkInMinutes = Number.parseInt(checkInTime[0]) * 60 + Number.parseInt(checkInTime[1])
  const checkOutMinutes = Number.parseInt(checkOutTime[0]) * 60 + Number.parseInt(checkOutTime[1])
  const duration = checkOutMinutes - checkInMinutes

  attendance[recordIndex] = {
    ...record,
    checkOut: time,
    duration: duration > 0 ? duration : 0,
  }

  saveAttendance(attendance)
  return attendance[recordIndex]
}

export function deleteAttendanceRecord(id: string): void {
  const attendance = getAttendance()
  saveAttendance(attendance.filter((a) => a.id !== id))
}

// Department Management
const DEPARTMENT_KEY = "department_data"

export function getDepartments(): Department[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(DEPARTMENT_KEY)
  if (!data) {
    // Initialize with default departments
    const defaults: Department[] = [
      { id: "1", name: "Yönetim", description: "Yönetim departmanı" },
      { id: "2", name: "İnsan Kaynakları", description: "İK departmanı" },
      { id: "3", name: "Bilgi Teknolojileri", description: "IT departmanı" },
      { id: "4", name: "Satış", description: "Satış departmanı" },
      { id: "5", name: "Pazarlama", description: "Pazarlama departmanı" },
    ]
    saveDepartments(defaults)
    return defaults
  }
  return JSON.parse(data)
}

export function saveDepartments(departments: Department[]): void {
  localStorage.setItem(DEPARTMENT_KEY, JSON.stringify(departments))
}

// Utility functions
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}s ${mins}dk`
}

export function getTodayAttendance(): AttendanceRecord[] {
  const today = new Date().toLocaleDateString("tr-TR")
  return getAttendance().filter((a) => a.date === today)
}

export function getMonthlyAttendance(): AttendanceRecord[] {
  const currentMonth = new Date().getMonth()
  return getAttendance().filter((a) => {
    const [day, month] = a.date.split(".")
    return Number.parseInt(month) - 1 === currentMonth
  })
}

export function calculateTotalHours(records: AttendanceRecord[]): number {
  return records.reduce((total, record) => total + record.duration, 0)
}
