/**
 * Notification Types
 * Based on backend NotificationDto
 */

export interface Notification {
    id: string
    recipientUserId: string
    type: string
    title: string
    body: string
    entityType?: string
    entityId?: string
    isRead: boolean
    createdAt: string
    readAt?: string
}

export interface NotificationFilters {
    unread?: boolean
    limit?: number
    page?: number
    size?: number
    offset?: number
}

export interface NotificationsResponse {
    notifications: Notification[]
    total?: number
}

export interface UnreadCountResponse {
    count: number
}

/**
 * Notification types from backend
 */
export type NotificationType =
    | 'CONSULTATION_ASSIGNED'
    | 'LAB_RESULT_READY'
    | 'IMAGING_RESULT_READY'
    | 'DRUG_REQUEST'
    | 'ADMISSION'
    | 'DISCHARGE'
    | 'APPROVAL_REQUIRED'
    | 'QUEUE_UPDATE'
    | 'INVOICE_UNPAID'
    | 'INVOICE_CREATED_UNPAID'
    | 'QUEUE_ADMISSION'
    | 'PATIENT_CHECKED_IN'
    | 'INITIAL_SERVICE_PAYMENT_CLEARED'
    | 'DRUG_REQUEST_SUBMITTED'
    | 'GENERAL'

/**
 * Entity types that notifications can reference
 */
export type NotificationEntityType =
    | 'CONSULTATION'
    | 'LAB_ORDER'
    | 'IMAGING_ORDER'
    | 'DRUG_REQUEST'
    | 'ADMISSION'
    | 'INVOICE'
    | 'APPROVAL'
    | 'QUEUE_ENTRY'
    | 'USER'
    | 'GENERAL'

/**
 * Helper to get icon for notification type
 */
export function getNotificationIcon(type: string): string {
    switch (type) {
        case 'CONSULTATION_ASSIGNED':
            return 'stethoscope'
        case 'LAB_RESULT_READY':
            return 'flask'
        case 'IMAGING_RESULT_READY':
            return 'scan'
        case 'DRUG_REQUEST':
        case 'DRUG_REQUEST_SUBMITTED':
            return 'pill'
        case 'ADMISSION':
            return 'bed'
        case 'DISCHARGE':
            return 'door-open'
        case 'APPROVAL_REQUIRED':
            return 'clipboard-check'
        case 'QUEUE_UPDATE':
        case 'QUEUE_ADMISSION':
        case 'PATIENT_CHECKED_IN':
        case 'INITIAL_SERVICE_PAYMENT_CLEARED':
            return 'users'
        case 'INVOICE_UNPAID':
        case 'INVOICE_CREATED_UNPAID':
            return 'receipt'
        default:
            return 'bell'
    }
}

/**
 * Helper to get color for notification type
 */
export function getNotificationColor(type: string): string {
    switch (type) {
        case 'CONSULTATION_ASSIGNED':
            return 'text-blue-500'
        case 'LAB_RESULT_READY':
            return 'text-green-500'
        case 'IMAGING_RESULT_READY':
            return 'text-purple-500'
        case 'DRUG_REQUEST':
        case 'DRUG_REQUEST_SUBMITTED':
            return 'text-orange-500'
        case 'ADMISSION':
            return 'text-indigo-500'
        case 'DISCHARGE':
            return 'text-teal-500'
        case 'APPROVAL_REQUIRED':
            return 'text-red-500'
        case 'QUEUE_UPDATE':
        case 'QUEUE_ADMISSION':
        case 'PATIENT_CHECKED_IN':
        case 'INITIAL_SERVICE_PAYMENT_CLEARED':
            return 'text-cyan-500'
        case 'INVOICE_UNPAID':
        case 'INVOICE_CREATED_UNPAID':
            return 'text-yellow-500'
        default:
            return 'text-gray-500'
    }
}
