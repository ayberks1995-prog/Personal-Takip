import type { AttendanceRecord, Personnel } from "./storage"
import { formatDuration } from "./storage"

export function exportToCSV(data: AttendanceRecord[], filename = "rapor.csv") {
  const headers = ["Personel,Tarih,Giriş Saati,Çıkış Saati,Çalışma Süresi"]

  const rows = data.map((record) => {
    const duration = record.duration > 0 ? formatDuration(record.duration) : "-"
    return `${record.personnelName},${record.date},${record.checkIn},${record.checkOut || "Devam ediyor"},${duration}`
  })

  const csv = [...headers, ...rows].join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export function exportPersonnelToCSV(data: Personnel[], filename = "personel.csv") {
  const headers = ["Ad Soyad,E-posta,Pozisyon,Departman,Telefon,İşe Başlama,Durum"]

  const rows = data.map((person) => {
    return `${person.name},${person.email},${person.position},${person.department},${person.phoneNumber || "-"},${person.startDate},${person.status === "active" ? "Aktif" : "Pasif"}`
  })

  const csv = [...headers, ...rows].join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export function printReport() {
  window.print()
}
