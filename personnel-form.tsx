"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addPersonnel, updatePersonnel, getDepartments, type Personnel } from "@/lib/storage"

interface PersonnelFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personnel?: Personnel | null
  onSuccess: () => void
}

export function PersonnelForm({ open, onOpenChange, personnel, onSuccess }: PersonnelFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    phoneNumber: "",
    startDate: "",
    status: "active" as "active" | "inactive",
  })
  const [departments, setDepartments] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const deps = getDepartments()
    setDepartments(deps.map((d) => d.name))
  }, [])

  useEffect(() => {
    if (personnel) {
      setFormData({
        name: personnel.name,
        email: personnel.email,
        position: personnel.position,
        department: personnel.department,
        phoneNumber: personnel.phoneNumber,
        startDate: personnel.startDate,
        status: personnel.status,
      })
    } else {
      setFormData({
        name: "",
        email: "",
        position: "",
        department: "",
        phoneNumber: "",
        startDate: new Date().toISOString().split("T")[0],
        status: "active",
      })
    }
    setError("")
  }, [personnel, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (!formData.name || !formData.email || !formData.position || !formData.department) {
        throw new Error("Lütfen tüm gerekli alanları doldurun")
      }

      if (personnel) {
        updatePersonnel(personnel.id, formData)
      } else {
        addPersonnel(formData)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{personnel ? "Personel Düzenle" : "Yeni Personel Ekle"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {personnel ? "Personel bilgilerini güncelleyin" : "Yeni personel bilgilerini girin"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ahmet Yılmaz"
                required
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ahmet@example.com"
                required
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Pozisyon *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Yazılım Geliştirici"
                required
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Departman *</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Departman seçin" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept} className="text-foreground">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefon</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0555 123 45 67"
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">İşe Başlama Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="active" className="text-foreground">
                    Aktif
                  </SelectItem>
                  <SelectItem value="inactive" className="text-foreground">
                    Pasif
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting ? "Kaydediliyor..." : personnel ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
