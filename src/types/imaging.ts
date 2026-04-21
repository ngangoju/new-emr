export interface ImagingOrder {
    id: string;
    patientId: string;
    consultId?: string;
    doctorId: string;
    imagingType: string;
    bodyPart?: string;
    priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    instructions?: string;
    status: 'ORDERED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REPORTED';
    scheduledAt?: string;
    performedBy?: string;
    orderedAt: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    approvedAt?: string;
    approvedBy?: string;
    physicianAcknowledgedBy?: string;
    physicianAcknowledgedAt?: string;

    // Enriched fields
    patientFirstName?: string;
    patientLastName?: string;
    doctorFirstName?: string;
    doctorLastName?: string;
}

export interface ImagingResult {
    id: string;
    imagingOrderId: string;
    findings?: string;
    impression?: string;
    recommendations?: string;
    comparisonWithPrevious?: string;
    techNotes?: string;
    reportedBy: string;
    radiologistSigned: boolean;
    radiologistSignedAt?: string;
    images?: string; // JSON array string
    performedAt?: string;
    reportedAt: string;
    createdAt: string;
    updatedAt: string;

    // Enriched order details
    patientId?: string;
    imagingType?: string;
    bodyPart?: string;
    orderInstructions?: string;
    orderStatus?: string;
    orderedAt?: string;

    // Personnel names
    radiologistFirstName?: string;
    radiologistLastName?: string;
    patientFirstName?: string;
    patientLastName?: string;
}

export interface DicomImage {
    id: string;
    imagingResultId: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    dicomStudyUid?: string;
    dicomSeriesUid?: string;
    dicomSopInstanceUid?: string;
    modality?: string;
    bodyPart?: string;
    imageType?: string;
    imagePosition?: string;
    exposureParameters?: string; // JSON string
    uploadedAt: string;
    createdAt: string;
    updatedAt: string;

    // Enriched
    patientId?: string;
    imagingType?: string;
    patientFirstName?: string;
    patientLastName?: string;
}

export interface CreateImagingOrderInput {
    patientId: string;
    consultId?: string;
    imagingType: string;
    bodyPart?: string;
    priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
    instructions?: string;
}
