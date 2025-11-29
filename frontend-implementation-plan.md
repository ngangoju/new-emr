# Next.js/React/TypeScript/Tailwind Frontend Implementation Plan - Modern EMR System

## Executive Summary

This plan presents a **world-class, one-of-a-kind** EMR frontend that will WOW users from the first interaction. As a UI/UX expert and senior frontend engineer, I've designed this system to be **intuitive**, **beautiful**, **performant**, and **accessible**, using cutting-edge technologies and best practices.

---

## 🎯 Technology Stack

### Core Framework
- **Next.js 14+** (App Router with React Server Components)
- **React 18+** (with Concurrent Features)
- **TypeScript 5.x** (Strict mode)

### Styling & UI
- **Tailwind CSS 3.x** (Utility-first styling)
- **shadcn/ui** (Accessible, customizable components)
- **Radix UI** (Headless accessible primitives)
- **Framer Motion** (Smooth animations)
- **Lucide React** (Beautiful, consistent icons)
- **Recharts** (Data visualization)

### State Management & Data Fetching
- **TanStack Query (React Query)** (Server state, caching, optimistic updates)
- **Zustand** (Client state - UI state, user preferences)
- **React Hook Form** (Form validation)
- **Zod** (Runtime validation)

### Real-time & Communication
- **Socket.io Client** (WebSocket for real-time updates)
- **React Hot Toast** (Elegant notifications)

### Developer Experience
- **ESLint + Prettier** (Code quality)
- **Husky** (Git hooks)
- **TypeScript Strict** (Type safety)
- **Storybook** (Component documentation)

### Testing
- **Vitest** (Unit tests)
- **Testing Library** (Component tests)
- **Playwright** (E2E tests)
- **MSW** (API mocking)

---

## 🎨 Design Philosophy & Principles

### 1. **Visual Excellence** - WOW Factor

> "The interface should be so beautiful that users want to use the system"

**Design Pillars**:
- ✨ **Modern Aesthetics**: Clean, premium design with subtle gradients and shadows
- 🌈 **Strategic Color**: Medical-grade color palette (calming blues/greens with vibrant accents)
- 📐 **Perfect Typography**: Inter/Outfit/Poppins font families with optimal hierarchy
- 🎭 **Micro-animations**: Delightful interactions that feel alive
- 🌓 **Dark Mode**: Complete dark theme support (toggle in header)

### 2. **Exceptional UX** - Zero Friction

- ⚡ **Instant Feedback**: Loading states, optimistic updates, skeleton screens
- 🔍 **Smart Search**: Auto-complete with fuzzy matching
- ⌨️ **Keyboard First**: Full keyboard navigation (shortcuts modal: `Cmd/Ctrl + K`)
- 📱 **Mobile Responsive**: Works flawlessly on all devices
- ♿ **Accessibility**: WCAG 2.1 AA compliant

### 3. **Performance** - Lightning Fast

- 🚀 **Instant Navigation**: Next.js prefetching + React Server Components
- 💾 **Smart Caching**: React Query persistent cache
- 📦 **Code Splitting**: Route-based lazy loading
- 🖼️ **Image Optimization**: Next.js Image component
- ⚡ **Optimistic UI**: Don't wait for server responses

---

## 🏗️ Application Architecture

### Folder Structure

```
emr-frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, forgot password)
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── doctor/
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── patients/
│   │   │   ├── consultations/
│   │   │   └── schedule/
│   │   ├── nurse/
│   │   ├── receptionist/
│   │   ├── cashier/
│   │   ├── lab/
│   │   ├── radiology/
│   │   ├── pharmacy/
│   │   ├── billing/
│   │   ├── admin/
│   │   └── layout.tsx            # Dashboard layout with sidebar
│   ├── api/                      # API routes (revalidation, etc.)
│   ├── globals.css               # Tailwind + global styles
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── PageHeader.tsx
│   ├── features/                 # Feature-specific components
│   │   ├── patients/
│   │   │   ├── PatientSearchBar.tsx
│   │   │   ├── PatientCard.tsx
│   │   │   ├── PatientForm.tsx
│   │   │   ├── VitalsChart.tsx
│   │   │   └── MedicalHistoryTimeline.tsx
│   │   ├── queue/
│   │   │   ├── QueueBoard.tsx
│   │   │   ├── QueueNumberBadge.tsx
│   │   │   └── QueueActions.tsx
│   │   ├── consultations/
│   │   │   ├── SOAPNoteEditor.tsx
│   │   │   ├── DiagnosisSelector.tsx
│   │   │   └── PrescriptionBuilder.tsx
│   │   ├── billing/
│   │   │   ├── InvoiceGenerator.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   └── TariffCalculator.tsx
│   │   └── ...
│   ├── charts/                   # Reusable charts
│   │   ├── RevenueChart.tsx
│   │   ├── PatientStatsChart.tsx
│   │   └── VitalsLineChart.tsx
│   └── shared/                   # Shared components
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       └── DataTable/
├── lib/
│   ├── api/                      # API client & hooks
│   │   ├── client.ts             # Axios instance
│   │   ├── hooks/
│   │   │   ├── usePatients.ts
│   │   │   ├── useConsultations.ts
│   │   │   ├── useBilling.ts
│   │   │   └── ...
│   │   └── types/                # API types
│   ├── utils/                    # Helper functions
│   │   ├── cn.ts                 # Tailwind merge
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── notificationStore.ts
│   └── constants/
│       ├── routes.ts
│       ├── permissions.ts
│       └── config.ts
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts
│   ├── usePermissions.ts
│   ├── useMediaQuery.ts
│   └── useDebounce.ts
├── types/                        # TypeScript types
│   ├── user.ts
│   ├── patient.ts
│   ├── consultation.ts
│   ├── billing.ts
│   └── ...
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── .storybook/                   # Storybook config
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 🎨 Design System

### Color Palette

```typescript
// tailwind.config.ts - Custom medical-grade colors
const colors = {
  // Base colors
  background: 'hsl(0 0% 100%)',          // White
  foreground: 'hsl(222.2 84% 4.9%)',    // Dark blue-gray
  
  // Primary - Calming medical blue
  primary: {
    50: 'hsl(207 90% 97%)',
    100: 'hsl(207 85% 92%)',
    200: 'hsl(207 77% 84%)',
    300: 'hsl(207 71% 72%)',
    400: 'hsl(207 67% 58%)',
    500: 'hsl(207 73% 43%)',  // Main
    600: 'hsl(207 76% 36%)',
    700: 'hsl(207 77% 29%)',
    800: 'hsl(207 78% 23%)',
    900: 'hsl(207 79% 18%)',
  },
  
  // Success - Medical green
  success: {
    light: 'hsl(142 76% 92%)',
    DEFAULT: 'hsl(142 71% 45%)',
    dark: 'hsl(142 76% 36%)',
  },
  
  // Warning - Amber
  warning: {
    light: 'hsl(38 92% 90%)',
    DEFAULT: 'hsl(38 92% 50%)',
    dark: 'hsl(38 92% 36%)',
  },
  
  // Danger - Medical red
  danger: {
    light: 'hsl(0 93% 94%)',
    DEFAULT: 'hsl(0 84% 60%)',
    dark: 'hsl(0 73% 41%)',
  },
  
  // Accent - Vibrant purple (for CTAs)
  accent: {
    light: 'hsl(262 83% 94%)',
    DEFAULT: 'hsl(262 83% 58%)',
    dark: 'hsl(262 83% 48%)',
  },
  
  // Neutral grays
  gray: {
    50: 'hsl(210 40% 98%)',
    100: 'hsl(214 32% 94%)',
    200: 'hsl(213 27% 84%)',
    300: 'hsl(211 23% 69%)',
    400: 'hsl(211 20% 53%)',
    500: 'hsl(211 24% 43%)',
    600: 'hsl(211 30% 33%)',
    700: 'hsl(211 34% 23%)',
    800: 'hsl(211 40% 16%)',
    900: 'hsl(211 44% 11%)',
  },
  
  // Dark mode
  dark: {
    background: 'hsl(222 47% 11%)',
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(222 47% 14%)',
  },
};
```

### Typography

```typescript
// Font configuration
const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  heading: ['Outfit', 'Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
};

// Font sizes
const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
};
```

### Spacing (8pt Grid)

```typescript
const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px (base)
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
};
```

### Animation & Motion

```typescript
const animation = {
  // Micro-interactions
  'fade-in': 'fadeIn 0.3s ease-in',
  'slide-in-up': 'slideInUp 0.4s ease-out',
  'slide-in-right': 'slideInRight 0.3s ease-out',
  'scale-in': 'scaleIn 0.2s ease-out',
  
  // Loading
  'spin': 'spin 1s linear infinite',
  'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  
  // Attention
  'bounce': 'bounce 1s infinite',
  'shake': 'shake 0.5s ease-in-out',
};
```

---

## 📱 Page Specifications by User Role

### 1. **Login Page** (`/login`)

**Design**:
- Split screen: Left = stunning medical imagery with gradient overlay, Right = login form
- Animated hospital scene in background (subtle parallax)
- Minimalist form: Username/Email, Password, Remember Me, Forgot Password
- Role selector dropdown (optional, or auto-detect from token)
- Smooth transitions

**Components**:
```tsx
<LoginPage>
  <div className="grid lg:grid-cols-2 min-h-screen">
    {/* Left: Hero */}
    <div className="relative bg-gradient-to-br from-primary-600 to-primary-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-5xl text-white">Modern EMR</h1>
        <p className="text-primary-100">Revolutionizing Healthcare Management</p>
      </motion.div>
      <Image src="/login-hero.png" alt="Medical" className="opacity-20" />
    </div>
    
    {/* Right: Form */}
    <div className="flex items-center justify-center p-8 bg-white dark:bg-dark-background">
      <Card className="w-full max-w-md">
        <LoginForm />
      </Card>
    </div>
  </div>
</LoginPage>
```

---

### 2. **Doctor Dashboard** (`/doctor`)

**Layout**:
- Top: Header (search bar, notifications, profile dropdown)
- Left: Collapsible sidebar (navigation)
- Main: Dashboard content

**Dashboard Cards** (Grid: 2x2 on desktop, 1x4 on mobile):
1. **Quick Stats**
   - Today's Appointments
   - Pending Consultations
   - Patients Seen (today)
   - Average Wait Time
   
2. **Patient Queue** (Real-time via WebSocket)
   - Live queue board with queue numbers
   - "Call Next Patient" button
   - Currently serving indicator
   
3. **Recent Patients**
   - List of last 5 patients seen
   - Quick actions: View History, New Consultation
   
4. **Upcoming Appointments**
   - Timeline view
   - Click to view details

**Charts**:
- Consultations per Day (last 7 days) - Bar chart
- Patient Demographics - Pie chart

**Quick Actions Floating Button** (Bottom-right):
- New Patient Registration
- Quick Search
- New Consultation

**Components**:
```tsx
<DoctorDashboard>
  <DashboardHeader />
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <StatCard icon={Users} title="Today's Appointments" value={12} trend="+3" />
    <StatCard icon={Clock} title="Pending" value={5} className="text-warning-600" />
    <StatCard icon={CheckCircle} title="Completed" value={7} className="text-success-600" />
    <StatCard icon={Timer} title="Avg Wait" value="12 min" />
  </div>
  
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
    <Card className="lg:col-span-2">
      <CardHeader><h3>Patient Queue</h3></CardHeader>
      <QueueBoard real-time />
    </Card>
    
    <Card>
      <CardHeader><h3>Recent Patients</h3></CardHeader>
      <RecentPatientsList />
    </Card>
  </div>
  
  <Card className="mt-6">
    <ConsultationsChart />
  </Card>
  
  <FloatingActionButton />
</DoctorDashboard>
```

---

### 3. **Patient Management** (`/doctor/patients`, `/receptionist/patients`)

**Patient Search**:
- Powerful search bar (auto-complete)
  - Search by: Name, PID, National ID, Phone, Insurance Card
  - Fuzzy matching
  - Recent searches dropdown
- Filters: Insurance, Gender, Date Range
- Sort: Name, Date Registered, Last Visit

**Patient List**:
- Beautiful table with hover effects
- Columns: Patient ID, Full Name, Age, Gender, Insurance, Phone, Last Visit, Actions
- Row actions: View Details, New Consultation, Edit, View History
- Pagination with "Load More" (infinite scroll option)

**Patient Detail Modal/Page**:
- Tabs: Overview, Medical History, Vitals Timeline, Lab Results, Imaging, Billing
- **Overview**:
  - Patient photo (avatar if no photo)
  - Demographics (name, age, gender, contact, insurance)
  - Emergency contact
  - Allergies (highlighted in red badges)
  - Blood group
- **Medical History Timeline**:
  - Vertical timeline with dates
  - Diagnoses, conditions, surgeries
- **Vitals Timeline**:
  - Interactive chart (Recharts line chart)
  - Toggle: Temperature, BP, Heart Rate, Weight
  - Hover for exact values

**Patient Registration Form**:
```tsx
<PatientRegistrationDialog>
  <Form schema={patientSchema}>
    <Tabs defaultValue="demographics">
      <TabsList>
        <TabsTrigger value="demographics">Demographics</TabsTrigger>
        <TabsTrigger value="insurance">Insurance</TabsTrigger>
        <TabsTrigger value="address">Address</TabsTrigger>
      </TabsList>
      
      <TabsContent value="demographics">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name" required />
          <Input label="National ID" />
          <Select label="Gender" options={['Male', 'Female']} />
          <DatePicker label="Date of Birth" />
          <Input label="Phone" type="tel" />
          <Input label="Email" type="email" />
        </div>
      </TabsContent>
      
      <TabsContent value="insurance">
        <InsuranceSelector />
        <Input label="Card Number" />
        <Input label="Copay %" type="number" />
      </TabsContent>
      
      <TabsContent value="address">
        <CascadingLocationSelector 
          levels={['Province', 'District', 'Sector', 'Cell', 'Village']} 
        />
      </TabsContent>
    </Tabs>
    
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button type="submit" className="bg-primary-600">Register Patient</Button>
    </DialogFooter>
  </Form>
</PatientRegistrationDialog>
```

---

### 4. **Consultation Page** (`/doctor/consultations/new`)

**Layout**: Wizard/Step-by-step

**Step 1: Patient Selection**
- Search patient (auto-complete)
- Display patient card (demographics, recent vitals)

**Step 2: Chief Complaint & History**
- Rich text editor (Tiptap or Quill)
- Templates dropdown (common complaints)
- Voice-to-text option (Web Speech API)

**Step 3: Examination & Vitals**
- Vitals input (BP, temp, weight, height → auto-calculate BMI)
- Physical examination notes

**Step 4: Diagnosis**
- ICD-10 search with auto-complete
- Add multiple diagnoses
- Severity selector

**Step 5: Treatment Plan**
- Prescription builder:
  - Medication search (auto-complete)
  - Dosage, frequency, duration
  - Instructions
  - Add to prescription list
- Lab tests selector (checkboxes with search)
- Imaging orders (checkboxes with priority)
- Follow-up date picker

**Step 6: SOAP Note (Optional)**
- Subjective, Objective, Assessment, Plan (separate text areas)

**Step 7: Review & Submit**
- Summary of all entered data
- Edit buttons for each section
- "Save Draft" or "Complete Consultation"

**Components**:
```tsx
<ConsultationWizard>
  <Stepper currentStep={step} steps={[
    'Patient', 'History', 'Examination', 'Diagnosis', 'Treatment', 'SOAP', 'Review'
  ]} />
  
  {step === 1 && <PatientSelector />}
  {step === 2 && <HistoryEditor />}
  {step === 3 && <VitalsForm />}
  {step === 4 && <DiagnosisSelector />}
  {step === 5 && (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PrescriptionBuilder />
      <OrdersPanel />
    </div>
  )}
  {step === 6 && <SOAPNoteEditor />}
  {step === 7 && <ConsultationSummary />}
  
  <div className="flex justify-between mt-8">
    <Button variant="outline" onClick={prevStep}>Back</Button>
    <div className="space-x-2">
      <Button variant="ghost" onClick={saveDraft}>Save Draft</Button>
      <Button onClick={nextStep}>
        {step === 7 ? 'Complete Consultation' : 'Next'}
      </Button>
    </div>
  </div>
</ConsultationWizard>
```

---

### 5. **Lab Dashboard** (`/lab`)

**Pending Orders**:
- Table: Patient, Test Name, Priority (HIGH/NORMAL), Ordered By, Ordered At
- Filter: Priority, Test Type, Date Range
- Sort: Newest First, Priority, Patient Name
- Row actions: Enter Results, View Order Details

**Results Entry Form**:
```tsx
<LabResultsDialog orderId={orderId}>
  {testType === 'NFS' ? (
    <NFSResultsForm 
      fields={['WBC', 'HGB', 'HCT', 'PLT', 'RBC', 'MCV', 'MCH', ...]} 
    />
  ) : (
    <GenericResultsForm>
      <Input label="Results" multiline />
      <Input label="Normal Range" />
      <FileUpload label="Microscopy Images" accept="image/*" />
      <Textarea label="Comment" />
      <Select label="Status" options={['Normal', 'Abnormal', 'Critical']} />
    </GenericResultsForm>
  )}
  
  <Button onClick={submitResults}>Submit Results</Button>
</LabResultsDialog>
```

**Completed Results**:
- Table with search
- Export to PDF (print results)

---

### 6. **Billing/Cashier Dashboard** (`/cashier`, `/billing`)

**Pending Invoices**:
- Table: Patient, Invoice Number, Amount, Insurance Due, Patient Due, Date
- Search/Filter
- Actions: View, Process Payment, Print

**Invoice Generation**:
```tsx
<InvoiceGenerator>
  <PatientSelector />
  
  <InvoiceItemsBuilder>
    {/* Auto-populate from consultation */}
    <AddItemButton>
      <Select label="Item Type" options={['Consultation', 'Lab Test', 'Imaging', 'Procedure', 'Medication']} />
      <Select label="Item" options={dynamicOptions} />
      <Input label="Quantity" type="number" />
      <Input label="Unit Price" type="number" disabled /> {/* Auto from tariff */}
      <Input label="Total" disabled /> {/* Auto-calculated */}
    </AddItemButton>
  </InvoiceItemsBuilder>
  
  <InvoiceSummary>
    <div className="space-y-2 border-t pt-4">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span className="font-semibold">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Discount:</span>
        <Input type="number" className="w-24 text-right" />
      </div>
      <div className="flex justify-between text-warning-600">
        <span>Insurance Due ({insurance.name} - {copay}%):</span>
        <span className="font-semibold">{formatCurrency(insuranceDue)}</span>
      </div>
      <div className="flex justify-between text-primary-600">
        <span>Patient Due:</span>
        <span className="font-semibold">{formatCurrency(patientDue)}</span>
      </div>
      <Separator />
      <div className="flex justify-between text-2xl font-bold">
        <span>Total Due:</span>
        <span>{formatCurrency(totalDue)}</span>
      </div>
    </div>
  </InvoiceSummary>
  
  <Button onClick={generateInvoice} className="w-full">Generate Invoice</Button>
</InvoiceGenerator>
```

**Payment Processing**:
- Payment method selector (Cash, Card, Mobile Money, Insurance)
- Amount input
- "Print Receipt" button

---

### 7. **Pharmacy Dashboard** (`/pharmacy`)

**Inventory Overview**:
- Cards: Total Medications, Low Stock Alerts, Expiring Soon, Out of Stock
- Table: Medication, Batch No, Quantity, Expires, Status (color-coded)

**Dispense Medication**:
```tsx
<DispenseMedicationDialog>
  <PrescriptionSelector /> {/* Loads from pending prescriptions */}
  
  <DispenseForm>
    {prescription.medications.map(med => (
      <div key={med.id} className="flex items-center gap-4 p-4 border rounded-lg">
        <div className="flex-1">
          <h4 className="font-semibold">{med.brandName}</h4>
          <p className="text-sm text-gray-600">
            {med.dosage} - {med.frequency} for {med.duration} days
          </p>
        </div>
        <Input label="Quantity" type="number" defaultValue={calculateQuantity(med)} />
        <Select label="Batch" options={availableBatches(med.id)} />
      </div>
    ))}
  </DispenseForm>
  
  <Button onClick={dispense}>Dispense & Print Label</Button>
</DispenseMedicationDialog>
```

---

### 8. **Admin Dashboard** (`/admin`)

**System Overview**:
- Total Users, Active Sessions, Today's Revenue, System Health
- Charts: User Activity, Revenue Trends, Patient Growth

**User Management**:
- Table: Username, Role, Email, Status, Last Login
- Actions: Edit, Deactivate, Reset Password
- Add User modal

---

## 🔌 State Management & Data Fetching

### React Query Setup

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error);
  }
);

// lib/api/hooks/usePatients.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const usePatients = (params?: PatientQueryParams) => {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => apiClient.get('/api/patients', { params }).then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePatient = (id: number) => {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiClient.get(`/api/patients/${id}`).then(res => res.data),
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePatientDTO) => apiClient.post('/api/patients', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success('Patient registered successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to register patient');
    },
  });
};

// Optimistic update example
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePatientDTO }) => 
      apiClient.put(`/api/patients/${id}`, data).then(res => res.data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['patient', id] });
      
      // Snapshot previous value
      const previousPatient = queryClient.getQueryData(['patient', id]);
      
      // Optimistically update
      queryClient.setQueryData(['patient', id], (old: any) => ({ ...old, ...data }));
      
      return { previousPatient };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(['patient', id], context?.previousPatient);
      toast.error('Update failed');
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
    },
  });
};
```

### Zustand Store (Client State)

```typescript
// lib/stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      darkMode: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    { name: 'ui-storage' }
  )
);
```

---

## 🌐 Real-Time Features (WebSocket)

```typescript
// lib/socket.ts
import { io } from 'socket.io-client';

export const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
  autoConnect: false,
});

// In queue component
useEffect(() => {
  socket.connect();
  
  socket.on('queue:updated', (data) => {
    queryClient.setQueryData(['queue'], data);
    toast.info(`Queue updated: ${data.action}`);
  });
  
  return () => {
    socket.disconnect();
  };
}, []);
```

---

## ♿ Accessibility Features

1. **Keyboard Navigation**
   - All interactive elements focusable
   - Logical tab order
   - Skip to main content link
   - Keyboard shortcuts modal

2. **Screen Reader Support**
   - ARIA labels
   - Role attributes
   - Live regions for dynamic content

3. **Visual Accessibility**
   - Sufficient color contrast (WCAG AA)
   - Focus indicators
   - No reliance on color alone

4. **Forms**
   - Clear labels
   - Error messages
   - Required field indicators

---

## 📊 Performance Optimizations

1. **Code Splitting**
   ```typescript
   const PatientDetailModal = dynamic(() => import('@/components/features/patients/PatientDetailModal'), {
     loading: () => <Skeleton />,
   });
   ```

2. **Image Optimization**
   ```tsx
   <Image 
     src="/patient-photo.jpg" 
     alt="Patient" 
     width={200} 
     height={200}
     priority={aboveTheFold}
     placeholder="blur"
   />
   ```

3. **Memoization**
   ```typescript
   const patientList = useMemo(() => 
     patients?.filter(p => p.status === 'active').sort((a, b) => a.name.localeCompare(b.name)),
     [patients]
   );
   ```

---

## 🧪 Verification Plan

### Unit Tests (Vitest)
```bash
npm run test
npm run test:coverage
```

### Component Tests (Testing Library)
```tsx
describe('PatientSearchBar', () => {
  it('should display search results on input', async () => {
    render(<PatientSearchBar />);
    
    const input = screen.getByPlaceholderText('Search patients...');
    await userEvent.type(input, 'John Doe');
    
    expect(await screen.findByText('John Doe - ND-20250815092615')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)
```typescript
test('should complete patient registration flow', async ({ page }) => {
  await page.goto('http://localhost:3000/receptionist/patients');
  await page.click('button:has-text("Register Patient")');
  
  await page.fill('input[name="fullName"]', 'Test Patient');
  await page.selectOption('select[name="gender"]', 'Male');
  // ... fill all fields
  
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Patient registered successfully')).toBeVisible();
});
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation (1-2 weeks)
- ✅ Next.js project setup
- ✅ Tailwind + shadcn/ui configuration
- ✅ Design system implementation
- ✅ Layout components (Header, Sidebar, Footer)
- ✅ Auth pages (Login, Forgot Password)
- ✅ Protected route middleware
- ✅ API client + React Query setup

### Phase 2: Patient Management (2 weeks)
- ✅ Patient search & list
- ✅ Patient registration form
- ✅ Patient detail view
- ✅ Medical history timeline
- ✅ Vitals recording & charts

### Phase 3: Doctor Features (2-3 weeks)
- ✅ Doctor dashboard
- ✅ Consultation wizard
- ✅ SOAP note editor
- ✅ Prescription builder
- ✅ Lab/imaging order forms

### Phase 4: Lab & Radiology (1 week)
- ✅ Lab dashboard
- ✅ Results entry forms (NFS & other)
- ✅ Imaging results upload

### Phase 5: Billing (1-2 weeks)
- ✅ Invoice generator
- ✅ Payment processing
- ✅ Tariff calculator
- ✅ Financial reports

### Phase 6: Pharmacy & Inventory (1 week)
- ✅ Inventory dashboard
- ✅ Dispense medications
- ✅ Stock alerts

### Phase 7: Admin & Reports (1 week)
- ✅ User management
- ✅ System dashboard
- ✅ Reports & analytics

### Phase 8: Polish & Optimization (1 week)
- ✅ Dark mode
- ✅ Animations
- ✅ Performance optimization
- ✅ Accessibility audit
- ✅ E2E testing

**Total Estimate: 10-13 weeks for MVP**

---

## ✅ Success Criteria

- [ ] All role dashboards implemented
- [ ] 100% responsive (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Lighthouse score: 90+ (Performance, Accessibility, Best Practices)
- [ ] WCAG 2.1 AA compliant
- [ ] Comprehensive test coverage (80%+)
- [ ] Zero console errors
- [ ] Smooth animations (60fps)
- [ ] User testing with 5+ medical professionals (positive feedback)

---

## 🎯 Conclusion

This frontend will not just be functional—it will be **exceptional**. Users will love using this EMR system because it's:
- 🎨 **Beautiful** - Premium design that feels modern and trustworthy
- ⚡ **Fast** - Instant feedback, optimistic updates, smart caching
- 🧠 **Intuitive** - Zero training needed, self-explanatory UI
- ♿ **Accessible** - Everyone can use it
- 📱 **Responsive** - Works everywhere

This is the EMR system that will set a new standard in healthcare technology!
