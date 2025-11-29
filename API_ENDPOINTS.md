# API Endpoints Specification

This document outlines the backend API endpoints required to support the frontend implementation.

## Base URL
All endpoints are prefixed with `/api`.
Example: `http://localhost:8000/api/auth/login`

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Payload | Response |
|--------|----------|-------------|---------|----------|
| POST | `/login` | User login | `{ email, password }` | `{ token, user: { id, name, role, ... } }` |
| GET | `/me` | Get current user | - | `{ id, name, role, permissions }` |
| POST | `/logout` | User logout | - | `{ message: "Logged out" }` |

## 2. Patients (`/patients`)

| Method | Endpoint | Description | Payload | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List patients | `?page=1&limit=10&search=...&gender=...` | `{ data: Patient[], meta: { total, page, ... } }` |
| POST | `/` | Register patient | `{ firstName, lastName, dob, gender, phone, ... }` | `{ id, ...patientData }` |
| GET | `/:id` | Get patient details | - | `{ id, firstName, lastName, insurance, ... }` |
| PUT | `/:id` | Update patient | `{ ...fieldsToUpdate }` | `{ id, ...updatedData }` |
| GET | `/:id/history` | Get medical history | - | `{ allergies: [], conditions: [], surgeries: [] }` |
| GET | `/:id/vitals` | Get vitals history | - | `[{ date, bp, heartRate, temp, weight, ... }]` |

## 3. Queue Management (`/queue`)

| Method | Endpoint | Description | Payload | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | Get current queue | - | `[{ id, patientName, status, waitTime, ... }]` |
| POST | `/` | Add to queue | `{ patientId, consultationType }` | `{ id, queueNumber, status: 'waiting' }` |
| POST | `/next` | Call next patient | - | `{ id, status: 'called', ... }` |
| PUT | `/:id/status` | Update status | `{ status: 'in-consultation' | 'completed' }` | `{ id, status, ... }` |

## 4. Consultations (`/consultations`)

| Method | Endpoint | Description | Payload | Response |
|--------|----------|-------------|---------|----------|
| GET | `/` | List consultations | `?patientId=...&doctorId=...` | `[{ id, date, diagnosis, doctorName, ... }]` |
| POST | `/` | Create consultation | `{ patientId, chiefComplaint, vitals, diagnosis, treatment }` | `{ id, ...consultationData }` |
| GET | `/:id` | Get consultation | - | `{ id, patient, vitals, diagnosis, treatment, ... }` |
| PUT | `/:id` | Update draft | `{ ...fields }` | `{ id, ...updatedData }` |

## 5. Dashboard Stats (`/dashboard`)

| Method | Endpoint | Description | Payload | Response |
|--------|----------|-------------|---------|----------|
| GET | `/stats` | Get summary metrics | - | `{ todayAppointments, pending, seen, avgWait }` |
| GET | `/appointments` | Get today's schedule | - | `[{ time, patientName, type, status }]` |
| GET | `/recent-patients` | Get recent patients | - | `[{ id, name, lastVisit, status }]` |
| GET | `/demographics` | Get patient stats | - | `[{ name: 'Male', value: 45 }, ...]` |
| GET | `/activity` | Get weekly activity | - | `[{ name: 'Mon', total: 12 }, ...]` |

## 6. Reference Data (Recommended)

| Method | Endpoint | Description | Payload | Response |
|--------|----------|-------------|---------|----------|
| GET | `/ref/diagnosis` | Search ICD-10 | `?q=headache` | `[{ code: 'R51', name: 'Headache' }]` |
| GET | `/ref/medications` | Search medications | `?q=para` | `[{ id, name, stock }]` |
| GET | `/ref/labs` | Search lab tests | `?q=blood` | `[{ id, name, code }]` |
