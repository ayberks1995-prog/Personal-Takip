"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getPersonnel,
  getAttendance,
  getDepartments,
  calculateTotalHours,
  formatDuration,
  type AttendanceRecord,
} from "@/lib/storage"
import { exportToCSV, exportPersonnelToCSV, printReport } from "@/lib/export"
import { Download, Printer, Calendar, Users, TrendingUp, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedPersonnel, setSelectedPersonnel] = useState("all")
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [personnel, setPersonnel] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalHours: 0,
    totalDays: 0,
    avgHoursPerDay: 0,
    totalPersonnel: 0,
  })

  useEffect(() => {
    const deps = getDepartments()
    setDepartments(deps.map((d) => d.name))

    const allPersonnel = getPersonnel()
    setPersonnel(allPersonnel.map((p) => p.name))

    // Set default date range to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split("T")[0])
    setEndDate(lastDay.toISOString().split("T")[0])
  }, [])

  useEffect(() => {
    const allAttendance = getAttendance()
    const allPersonnel = getPersonnel()

    let filtered = allAttendance

    // Filter by date range
    if (startDate && endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.date.split(".").reverse().join("-"))
        const start = new Date(startDate)
        const end = new Date(endDate)
        return recordDate >= start && recordDate <= end
      })
    }

    // Filter by department
    if (selectedDepartment !== "all") {
      const deptPersonnel = allPersonnel.filter((p) => p.department === selectedDepartment).map((p) => p.name)
      filtered = filtered.filter((record) => deptPersonnel.includes(record.personnelName))
    }

    // Filter by personnel
    if (selectedPersonnel !== "all") {
      filtered = filtered.filter((record) => record.personnelName === selectedPersonnel)
    }

    setFilteredRecords(filtered)

    // Calculate stats
    const totalHours = calculateTotalHours(filtered)
    const uniqueDates = new Set(filtered.map((r) => r.date)).size
    const uniquePersonnel = new Set(filtered.map((r) => r.personnelName)).size

    setStats({
      totalHours,
      totalDays: uniqueDates,
      avgHoursPerDay: uniqueDates > 0 ? totalHours / uniqueDates : 0,
      totalPersonnel: uniquePersonnel,
    })
  }, [startDate, endDate, selectedDepartment, selectedPersonnel])

  const handleExportAttendance = () => {
    const filename = `yoklama_raporu_${new Date().toLocaleDateString("tr-TR")}.csv`
    exportToCSV(filteredRecords, filename)
  }

  const handleExportPersonnel = () => {
    const allPersonnel = getPersonnel()
    const filename = `personel_listesi_${new Date().toLocaleDateString("tr-TR")}.csv`
    exportPersonnelToCSV(allPersonnel, filename)
  }

  // Group records by personnel
  const personnelSummary = filteredRecords.reduce(
    (acc, record) => {
      if (!acc[record.personnelName]) {
        acc[record.personnelName] = {
          name: record.personnelName,
          totalHours: 0,
          totalDays: 0,
        }
      }
      acc[record.personnelName].totalHours += record.duration
      acc[record.personnelName].totalDays += 1
      return acc
    },
    {} as Record<string, { name: string; totalHours: number; totalDays: number }>,
  )

  const personnelSummaryArray = Object.values(personnelSummary).sort((a, b) => b.totalHours - a.totalHours)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PageHeader
          title="Raporlar"
          description="Personel ve yoklama raporlarını görüntüleyin ve dışa aktarın"
          action={
            <div className="flex gap-2">
              <Button onClick={printReport} variant="outline" className="border-border bg-transparent">
                <Printer className="mr-2 h-4 w-4" />
                Yazdır
              </Button>
              <Button onClick={handleExportAttendance} className="bg-primary hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" />
                Yoklama
              </Button>
              <Button onClick={handleExportPersonnel} className="bg-secondary hover:bg-secondary/90">
                <Download className="mr-2 h-4 w-4" />
                Personel
              </Button>
            </div>
          }
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Filtreler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Tarihi</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departman</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all" className="text-foreground">
                        Tüm Departmanlar
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept} className="text-foreground">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Personel</Label>
                  <Select value={selectedPersonnel} onValueChange={setSelectedPersonnel}>
                    <SelectTrigger className="bg-input border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border max-h-60">
                      <SelectItem value="all" className="text-foreground">
                        Tüm Personel
                      </SelectItem>
                      {personnel.map((person) => (
                        <SelectItem key={person} value={person} className="text-foreground">
                          {person}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Saat</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{formatDuration(stats.totalHours)}</div>
                <p className="text-xs text-muted-foreground">Seçili dönem</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gün</CardTitle>
                <Calendar className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalDays}</div>
                <p className="text-xs text-muted-foreground">Çalışılan gün sayısı</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Günlük Ortalama</CardTitle>
                <TrendingUp className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatDuration(Math.round(stats.avgHoursPerDay))}
                </div>
                <p className="text-xs text-muted-foreground">Günlük ortalama saat</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Personel Sayısı</CardTitle>
                <Users className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalPersonnel}</div>
                <p className="text-xs text-muted-foreground">Aktif personel</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Personel Bazlı Özet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Personel</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Gün Sayısı</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Toplam Saat</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Ortalama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personnelSummaryArray.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                            Seçili dönemde veri bulunamadı
                          </td>
                        </tr>
                      ) : (
                        personnelSummaryArray.map((summary) => (
                          <tr key={summary.name} className="border-b border-border">
                            <td className="py-3 text-sm text-foreground">{summary.name}</td>
                            <td className="py-3 text-sm text-foreground">{summary.totalDays}</td>
                            <td className="py-3 text-sm text-foreground">{formatDuration(summary.totalHours)}</td>
                            <td className="py-3 text-sm text-foreground">
                              {formatDuration(Math.round(summary.totalHours / summary.totalDays))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Detaylı Kayıtlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card">
                      <tr className="border-b border-border text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Personel</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Tarih</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Süre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                            Seçili dönemde veri bulunamadı
                          </td>
                        </tr>
                      ) : (
                        filteredRecords.map((record) => (
                          <tr key={record.id} className="border-b border-border">
                            <td className="py-2 text-sm text-foreground">{record.personnelName}</td>
                            <td className="py-2 text-sm text-foreground">{record.date}</td>
                            <td className="py-2 text-sm text-foreground">
                              {record.duration > 0 ? formatDuration(record.duration) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
