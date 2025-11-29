### <PREVIOUS_STEP>
Build succeeded and current controllers are active for auth and patients. Database migrations for appointments, queue, consultations, and lab modules exist. Consultation service is implemented; controllers for consultations/queue/dashboard are pending exposure.

### <PLAN>
1) API Base Path and CORS [Status: In progress → To verify]
- Configure a single base path so frontend calls `/api/...` map correctly.
- Option A: application.yml set `spring.webflux.base-path: /api`.
- Option B: Add `@RequestMapping("/api")` at controller level or a shared base controller.
- Ensure CORS allows your frontend origin (e.g., http://localhost:3000) with Authorization headers.

2) Authentication Endpoints [Status: Partially done → Extend]
- Current: `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/register`, `POST /api/auth/refresh` (string refreshToken), no explicit logout.
- Add: `POST /api/auth/logout` (server-side token blacklist if needed), standardize refresh payload `{ refreshToken }` and response `{ accessToken }`.
- Confirm roles/claims in JWT and map to UI role selector (Doctor, Admin, Pharmacist, Lab, Billing).

3) Patients API [Status: Implemented → Enhance]
- Existing: `POST /api/patients`, `GET /api/patients`, `GET /api/patients/{id}`, `PUT /api/patients/{id}`, `DELETE /api/patients/{id}`, `GET /api/patients/search?query=...`.
- Enhance: pagination (`page`, `limit`), filters (`gender`, `insurance`), consistent response envelope `{ data, meta }`.
- Add: `GET /api/patients/{id}/history`, `GET /api/patients/{id}/vitals`, `POST /api/patients/{id}/vitals` (per plan).

4) Consultations API [Status: Service ready → Expose controller]
- Implement controller to match:
  - `GET /api/consultations?patientId=&doctorId=`
  - `POST /api/consultations` using `CreateConsultationDto`.
  - `GET /api/consultations/{id}` (doctor scoped and admin variant as needed).
  - `PUT /api/consultations/{id}` for draft updates using `UpdateConsultationDto`.
  - `POST /api/consultations/{id}/sign` to finalize (uses `ConsultationService.sign`).

5) Queue Management API [Status: DB ready → Implement]
- Create model/repository/service/controller for `queue_entries`:
  - `GET /api/queue` (today’s queue, optional doctor filter).
  - `POST /api/queue` add to queue `{ patientId, consultationType?, priority? }`.
  - `POST /api/queue/next` (by doctor) returns next entry.
  - `PUT /api/queue/{id}/status` body `{ status: 'WAITING'|'CALLED'|'IN_PROGRESS'|'COMPLETED'|'NO_SHOW' }`.
- Later: WebSocket push for real-time updates.

6) Appointments API [Status: DB ready → Implement]
- Add: `POST /api/appointments`, `GET /api/appointments?doctorId=&date=` (today’s schedule), `PUT /api/appointments/{id}`, `DELETE /api/appointments/{id}`.

7) Dashboard API [Status: Pending → Implement]
- `GET /api/dashboard/stats` → `{ todayAppointments, pending, seen, avgWait }`.
- `GET /api/dashboard/appointments` (today’s schedule).
- `GET /api/dashboard/recent-patients`.
- Optional analytics: `/demographics`, `/activity`.

8) Reference Data API [Status: Pending → Implement]
- `GET /api/ref/diagnosis?q=` ICD-10 search.
- `GET /api/ref/medications?q=` medication search.
- `GET /api/ref/labs?q=` lab tests.

9) Frontend Integration (Axios + React Query) [Status: To implement]
- Create a shared HTTP client with interceptors for JWT.
- Wrap app with React Query provider; implement typed hooks for auth, patients, consultations, queue, dashboard.
- Replace mock data in Doctor Dashboard and Patients pages with hooks.

10) Error, Validation, and Loading States [Status: Partial → Improve]
- Use existing backend error envelope `ApiError` to show toasts/messages.
- Add React Query error boundaries and retry configs; add skeletons for list pages.

11) Security and RBAC [Status: Partial → Verify]
- Ensure `@PreAuthorize` annotations cover roles as needed (Doctor, Nurse, etc.).
- Map backend roles/permissions into frontend guards for routes and menus.

12) Testing & Documentation [Status: Pending]
- Add Swagger/OpenAPI; generate a Postman collection.
- Add MSW mocks aligned to live contracts for component tests.

### How the frontend connects to the backend (concrete guide)

#### 1) Configure Axios base client
```
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const { data } = await axios.post(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api') + '/auth/refresh',
          { refreshToken }
        );
        localStorage.setItem('accessToken', data.accessToken || data.token);
        original.headers.Authorization = `Bearer ${data.accessToken || data.token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` in `.env.local`.

#### 2) Auth endpoints and hooks
- Login
```
POST /api/auth/login
Body: { "username": "doctor1" | "email": "d@x.com", "password": "***" }
Response: { accessToken, refreshToken?, user: { id, username, email, role? } }
```
- Me
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { id, username, email, active }
```
- Hook
```
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { username?: string; email?: string; password: string }) => {
      const { data } = await api.post('/auth/login', payload);
      localStorage.setItem('accessToken', data.accessToken || data.token);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      return data.user;
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/auth/me')).data,
  });
}
```

#### 3) Patients endpoints and hooks
- List/search
```
GET /api/patients?Page=&limit=&gender=
GET /api/patients/search?query=John
Response (current): Flux<PatientDto> → treated as array on frontend
Recommended: { data: Patient[], meta: { total, page, limit } }
```
- Create/update/get
```
POST /api/patients
PUT  /api/patients/{id}
GET  /api/patients/{id}
```
- Hook examples
```
export function usePatients(params?: { page?: number; limit?: number; gender?: string; query?: string }) {
  const key = ['patients', params];
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const url = params?.query ? `/patients/search?query=${encodeURIComponent(params.query)}` : '/patients';
      const { data } = await api.get(url);
      return Array.isArray(data) ? data : data.data; // support both shapes
    },
  });
}

export function useCreatePatient() {
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/patients', payload)).data,
  });
}
```

#### 4) Consultations endpoints (to implement controller now but service ready)
- Contracts aligned to spec and current service
```
POST /api/consultations
Body: { appointmentId, patientId, diagnosis?, findings?, prescriptions? }
→ returns ConsultationDto

GET /api/consultations?doctorId=&from=&to=
GET /api/consultations/{id}
PUT /api/consultations/{id}
POST /api/consultations/{id}/sign
```
- Hook examples
```
export const useCreateConsultation = () => useMutation({
  mutationFn: async (payload) => (await api.post('/consultations', payload)).data,
});

export const useConsultation = (id: string) => useQuery({
  queryKey: ['consultation', id],
  queryFn: async () => (await api.get(`/consultations/${id}`)).data,
});
```

#### 5) Queue endpoints (pending implementation)
```
GET  /api/queue
POST /api/queue            { patientId, consultationType?, priority? }
POST /api/queue/next       (by doctor)
PUT  /api/queue/{id}/status { status }
```
- Frontend: wire Doctor Dashboard queue board to these endpoints, and later subscribe to WebSocket for real-time.

#### 6) Dashboard endpoints (pending implementation)
```
GET /api/dashboard/stats            → { todayAppointments, pending, seen, avgWait }
GET /api/dashboard/appointments     → [{ time, patientName, type, status }]
GET /api/dashboard/recent-patients  → [{ id, name, lastVisit, status }]
```

#### 7) Reference data (optional now)
```
GET /api/ref/diagnosis?q=
GET /api/ref/medications?q=
GET /api/ref/labs?q=
```

### Request/Response DTOs reference (current backend)
- Auth
  - LoginRequest: `{ username, password }` (email also supported if AuthService handles it)
  - AuthResponse: `{ token | accessToken, refreshToken?, user }`
- Patients
  - PatientDto: `{ id, doctorId, firstName, lastName, dateOfBirth, gender, phone, email, ssn, address, demographics, allergies, conditions, medications, consentTreatment, consentDataSharing, active, createdAt, updatedAt }`
- Consultations
  - CreateConsultationDto: `{ appointmentId, patientId, diagnosis?, findings?, prescriptions? }`
  - UpdateConsultationDto: subset of `{ diagnosis, findings, prescriptions, status }`
  - ConsultationDto: `{ id, appointmentId, doctorId, patientId, status, diagnosis, findings, prescriptions, signedBy, signedAt, createdAt, updatedAt }`

### Security headers and transport
- Always send `Authorization: Bearer <accessToken>`.
- Backend returns structured `ApiError` with `status`, `error`, `message`, and optional `fieldErrors`; surface `message` in toast.
- Enable HTTPS in production and set secure cookie or secure storage strategy according to compliance policy.

### Environment variables
- Frontend: `NEXT_PUBLIC_API_URL`, optionally `NEXT_PUBLIC_WS_URL` later.
- Backend: DB credentials, `JWT_SECRET`, CORS allowed origins, etc. (see plan’s application.yml example).

### Gaps to close before full UI wiring
- Expose consultations controller, add queue and dashboard controllers.
- Add pagination and envelopes to patients list.
- Implement WebSocket for queue updates (phase 3).

### <NEXT_STEP>
Publish the API base path (`/api`), expose the Consultations/Queue/Dashboard controllers, and switch the frontend to use the provided Axios client and hooks.