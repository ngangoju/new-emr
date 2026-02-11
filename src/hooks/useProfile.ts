import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { UserProfile, UpdatePasswordRequest } from '@/types/admin'
import { toast } from 'react-hot-toast'

export function useProfile() {
    const queryClient = useQueryClient()

    const profileQuery = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const { data } = await api.get<UserProfile>('/profile')
            return data
        }
    })

    const updateProfileMutation = useMutation({
        mutationFn: async (profile: Partial<UserProfile>) => {
            const { data } = await api.put<UserProfile>('/profile', profile)
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile'], data)
            toast.success('Profile updated successfully')
        }
    })

    const uploadPictureMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData()
            formData.append('file', file)
            const { data } = await api.post<UserProfile>('/profile/picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile'], data)
            toast.success('Profile picture updated')
        }
    })

    const deletePictureMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.delete<UserProfile>('/profile/picture')
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile'], data)
            toast.success('Profile picture removed')
        }
    })

    const changePasswordMutation = useMutation({
        mutationFn: async (req: UpdatePasswordRequest) => {
            await api.put('/profile/password', req)
        },
        onSuccess: () => {
            toast.success('Password changed successfully')
        }
    })

    const deactivateAccountMutation = useMutation({
        mutationFn: async () => {
            await api.post('/profile/deactivate')
        },
        onSuccess: () => {
            toast.success('Account deactivated')
            // Handle logout/redirect here if needed
        }
    })

    return {
        profile: profileQuery.data,
        isLoading: profileQuery.isLoading,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdating: updateProfileMutation.isPending,
        uploadPicture: uploadPictureMutation.mutateAsync,
        isUploading: uploadPictureMutation.isPending,
        deletePicture: deletePictureMutation.mutateAsync,
        isDeletingPicture: deletePictureMutation.isPending,
        changePassword: changePasswordMutation.mutateAsync,
        isChangingPassword: changePasswordMutation.isPending,
        deactivateAccount: deactivateAccountMutation.mutateAsync,
        isDeactivating: deactivateAccountMutation.isPending
    }
}
