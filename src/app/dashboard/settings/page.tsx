'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useUIStore } from "@/lib/stores/uiStore"
import { Moon, Sun, Globe, Bell, Shield, Layout, Loader2 } from "lucide-react"
import { useSettings } from "@/hooks/useSettings"
import type { UserSettings } from '@/types/admin'

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDarkMode = resolvedTheme === 'dark'
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  
  const { 
    settings, 
    isLoadingSettings, 
    updateSettings, 
    isUpdatingSettings,
    notifications,
    updateNotifications,
    
  } = useSettings()

  // Sync theme from persisted user settings into next-themes (canonical)
  useEffect(() => {
    if (settings?.theme === 'dark' || settings?.theme === 'light') {
      if (settings.theme !== resolvedTheme) {
        setTheme(settings.theme)
      }
    }
  }, [settings?.theme, resolvedTheme, setTheme])

  const handleToggleTheme = async (checked: boolean) => {
    const theme = checked ? 'dark' : 'light'
    setTheme(theme)
    await updateSettings({ theme })
  }

  const handleSidebarChange = async (value: string) => {
    const collapsed = value === 'collapsed'
    if (collapsed !== sidebarCollapsed) {
      toggleSidebar()
    }
    await updateSettings({ sidebarCollapsed: collapsed })
  }

  const handleLanguageChange = async (value: string) => {
    await updateSettings({ language: value as UserSettings['language'] })
  }

  const handleTimezoneChange = async (value: string) => {
    await updateSettings({ timezone: value })
  }

  const handleTogglePreference = async (key: string, checked: boolean) => {
    await updateSettings({ [key]: checked })
  }

  const handleToggleNotification = async (key: string, checked: boolean) => {
    await updateNotifications({ [key]: checked })
  }

  if (isLoadingSettings) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full h-8 w-8">
          <Link href="/dashboard/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and system configuration.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isUpdatingSettings && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <p className="text-xs text-muted-foreground">
            {isUpdatingSettings ? 'Saving changes...' : 'All changes saved autoamtically'}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Appearance Section */}
        <Card className="shadow-sm border-primary/5">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Layout className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the EMR system looks on your screen.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Adjust the interface for lower light environments.</p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={handleToggleTheme}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="border-t pt-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Sidebar Layout</Label>
                <p className="text-sm text-muted-foreground">Choose your preferred sidebar state.</p>
              </div>
              <Select value={sidebarCollapsed ? 'collapsed' : 'expanded'} onValueChange={handleSidebarChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expanded">Expanded</SelectItem>
                  <SelectItem value="collapsed">Collapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Regional & Language */}
        <Card className="shadow-sm border-primary/5">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/10 text-accent">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Regional & Language</CardTitle>
              <CardDescription>Set your preferred language and date formatting.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Language</Label>
                <p className="text-sm text-muted-foreground">Change the primary language of the interface.</p>
              </div>
              <Select value={settings?.language || 'en'} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="rw">Kinyarwanda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-6 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Time Zone</Label>
                <p className="text-sm text-muted-foreground">Set the local time for patient schedules.</p>
              </div>
              <Select value={settings?.timezone || 'CAT'} onValueChange={handleTimezoneChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAT">CAT (GMT+2)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  <SelectItem value="EST">EST (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Security & System */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-primary/5 h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <Bell className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif" className="text-sm font-normal">Push Notifications</Label>
                <Switch 
                  id="push-notif" 
                  checked={notifications?.pushNotifications ?? true} 
                  onCheckedChange={(checked) => handleToggleNotification('pushNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif" className="text-sm font-normal">Email Alerts</Label>
                <Switch 
                  id="email-notif" 
                  checked={notifications?.emailNotifications ?? true}
                  onCheckedChange={(checked) => handleToggleNotification('emailNotifications', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-primary/5 h-full">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="audit-log" className="text-sm font-normal">Share Usage Data</Label>
                <Switch 
                  id="audit-log" 
                  checked={settings?.shareUsageData ?? false}
                  onCheckedChange={(checked) => handleTogglePreference('shareUsageData', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor" className="text-sm font-normal">2FA Protection</Label>
                <Switch 
                  id="two-factor" 
                  checked={settings?.twoFactorEnabled ?? false}
                  onCheckedChange={(checked) => handleTogglePreference('twoFactorEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
