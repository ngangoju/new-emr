'use client'

import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Shield, Key, Bell, Camera, Loader2, Phone, FileText, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useProfile } from "@/hooks/useProfile"
import { useSettings } from "@/hooks/useSettings"
import { useForm } from "react-hook-form"
import type { NotificationPreferences, UpdatePasswordRequest, UserProfile } from '@/types/admin'

type ProfileFormValues = Pick<UserProfile, 'firstName' | 'lastName' | 'phoneNumber' | 'bio'>

export default function ProfilePage() {
  const { 
    profile, 
    isLoading, 
    updateProfile, 
    isUpdating, 
    uploadPicture, 
    isUploading,
    deletePicture,
    isDeletingPicture,
    changePassword,
    isChangingPassword,
    deactivateAccount,
    isDeactivating
  } = useProfile()

  const {
    notifications,
    updateNotifications,
    isUpdatingNotifications
  } = useSettings()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register: registerProfile, handleSubmit: handleSubmitProfile } = useForm<Partial<ProfileFormValues>>({
    values: profile ? {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phoneNumber: profile.phoneNumber || '',
      bio: profile.bio || ''
    } : {}
  })

  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, watch: watchPassword } = useForm<UpdatePasswordRequest>()

  const onUpdateProfile = async (data: Partial<ProfileFormValues>) => {
    await updateProfile(data)
  }

  const onChangePassword = async (data: UpdatePasswordRequest) => {
    if (data.newPassword !== data.confirmPassword) return
    await changePassword(data)
    resetPassword()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadPicture(file)
    }
  }

  const handleNotificationChange = async (key: string, checked: boolean) => {
    await updateNotifications({ [key]: checked })
  }

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const initials = profile?.firstName?.charAt(0) || profile?.email?.charAt(0) || 'U'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar and Basic Info */}
        <Card className="md:col-span-1 shadow-md border-primary/10">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-xl">
                {profile?.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initials.toUpperCase()
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
              <div className="absolute bottom-0 right-0 flex gap-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-background rounded-full border shadow-lg hover:bg-accent transition-colors"
                  disabled={isUploading}
                >
                  <Camera className={`h-4 w-4 text-muted-foreground ${isUploading ? 'animate-pulse' : ''}`} />
                </button>
                {profile?.profilePictureUrl && (
                  <button 
                    onClick={() => deletePicture()}
                    className="p-2 bg-background rounded-full border shadow-lg hover:bg-destructive/10 text-destructive transition-colors"
                    disabled={isDeletingPicture}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold">
              {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Update Your Name'}
            </h2>
            <p className="text-sm font-medium text-primary px-3 py-1 bg-primary/10 rounded-full mt-2 uppercase tracking-wider">
              {profile?.role?.replace('_', ' ') || 'USER'}
            </p>
            <div className="w-full border-t my-6" />
            <div className="space-y-4 w-full text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile?.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{profile?.phoneNumber || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  {profile?.role === 'ADMIN' ? 'Full Access Account' : 'Standard Access Account'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Tabbed Content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...registerProfile('firstName')} placeholder="Enter first name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...registerProfile('lastName')} placeholder="Enter last name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" value={profile?.email || ''} disabled className="bg-muted" />
                      <p className="text-[0.7rem] text-muted-foreground">Email cannot be changed here. Contact support for changes.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" {...registerProfile('phoneNumber')} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Input id="bio" {...registerProfile('bio')} placeholder="Tell us about yourself..." />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <Button type="submit" disabled={isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and security preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" {...registerPassword('currentPassword', { required: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" {...registerPassword('newPassword', { required: true, minLength: 8 })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" {...registerPassword('confirmPassword', { required: true })} />
                      {watchPassword('newPassword') !== watchPassword('confirmPassword') && watchPassword('confirmPassword') && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                      )}
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button type="submit" disabled={isChangingPassword || watchPassword('newPassword') !== watchPassword('confirmPassword')}>
                        {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </div>
                  </form>
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground mb-4">Once you deactivate your account, there is no going back. Please be certain.</p>
                    <Button 
                      variant="outline" 
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        if (confirm('Are you sure you want to deactivate your account? This action is permanent.')) {
                          deactivateAccount()
                        }
                      }}
                      disabled={isDeactivating}
                    >
                      {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Deactivate Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose how you want to be notified.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {[
                      { id: 'emailNotifications', title: 'Email Notifications', desc: 'Receive updates via email about your account activity.' },
                      { id: 'desktopNotifications', title: 'Desktop Alerts', desc: 'Show real-time notifications on your desktop.' },
                      { id: 'smsNotifications', title: 'SMS Alerts', desc: 'Get urgent notifications sent to your phone.' },
                      { id: 'pushNotifications', title: 'Push Notifications', desc: 'Get mobile app push notifications.' }
                    ].map((item) => (
                      <div key={item.id} className="flex items-start justify-between space-x-2 border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <Label htmlFor={item.id} className="text-base cursor-pointer">{item.title}</Label>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="flex items-center h-6">
                           <Checkbox 
                            id={item.id} 
                            checked={notifications?.[item.id as keyof NotificationPreferences] as boolean ?? false}
                            onCheckedChange={(checked) => handleNotificationChange(item.id, !!checked)}
                            disabled={isUpdatingNotifications}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
