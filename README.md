# 🏥 Modern EMR System

A comprehensive Electronic Medical Records system built with modern technologies for healthcare providers.

## 📋 **Quick Overview**

**Status**: **75% Complete** - Functional with real backend integration  
**Tech Stack**: Spring Boot (Backend) + Next.js 14 (Frontend)  
**Database**: PostgreSQL with R2DBC (Reactive)

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ and npm
- Java 17+
- PostgreSQL 15+
- Maven 3.6+

### 1. Clone the Repository
```bash
# Frontend
git clone <your-frontend-repo-url> new-emr
cd new-emr

# Backend (in a separate directory)
git clone <your-backend-repo-url> new-emr-backend
cd new-emr-backend
```

### 2. Backend Setup
```bash
cd new-emr-backend

# Configure database in src/main/resources/application.properties
# Update these values:
# spring.r2dbc.url=r2dbc:postgresql://localhost:5432/emr_db
# spring.r2dbc.username=your_username
# spring.r2dbc.password=your_password

# Run the application
mvn spring-boot:run

# Backend will start on http://localhost:8080
# Swagger UI: http://localhost:8080/webjars/swagger-ui/index.html
```

### 3. Frontend Setup
```bash
cd new-emr

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local

# Run development server
npm run dev

# Frontend will start on http://localhost:3000
```

### 4. Access the System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Swagger Docs**: http://localhost:8080/webjars/swagger-ui/index.html

**Default Test Credentials** (if seeded):
- Doctor: `zagabe` / `password123`
- Nurse: `beatha` / `password123`

---

## 🏗️ **Project Structure**

### Frontend (`new-emr/`)
```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── dashboard/         # Main dashboard and sub-pages
│   ├── login/            # Authentication page
│   └── layout.tsx        # Root layout with providers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Header, Sidebar
│   ├── doctor/           # Doctor-specific components
│   └── patient/          # Patient-specific components
├── hooks/                 # Custom React hooks
│   └── api/              # React Query API hooks
├── lib/                   # Utilities and configurations
│   ├── api.ts            # Axios instance with interceptors
│   └── utils.ts          # Helper functions
└── styles/               # Global styles and Tailwind config
```

### Backend (`new-emr-backend/`)
```
src/main/java/com/emr/newemrbackend/
├── controller/           # REST API controllers
├── service/             # Business logic
├── repository/          # R2DBC repositories
├── model/              # Domain entities
├── dto/                # Data Transfer Objects
├── security/           # JWT authentication & authorization
├── config/             # Spring configuration classes
└── exception/          # Custom exceptions and handlers
```

---

## ✅ **What's Working**

### Backend
- ✅ JWT authentication with refresh tokens
- ✅ Role-based authorization (DOCTOR, NURSE, RECEPTIONIST, etc.)
- ✅ Patient management (CRUD, search, vitals)
- ✅ Consultation management (create, update, finalize)
- ✅ Queue management (check-in, call next, status updates)
- ✅ Appointment scheduling
- ✅ Dashboard statistics (user-specific)
- ✅ Swagger API documentation

### Frontend
- ✅ Modern, responsive UI with dark mode
- ✅ Login with role-based access
- ✅ Doctor dashboard with real-time stats
- ✅ Patient list with search and filters
- ✅ Patient details with vitals and consultation history
- ✅ Consultation wizard (6-step process)
- ✅ Queue management board
- ✅ Charts and analytics (Recharts)
- ✅ Toast notifications for user feedback
- ✅ Loading states and empty states

---

## 🚧 **Known Issues**

1. **Dashboard Stats Show Zero for New Users**: By design, stats are filtered by logged-in user. Create sample appointments/consultations to see data.

2. **Address Field Shows IDs**: Location IDs displayed instead of names. Needs mapping implementation.

3. **Date Formatting**: Some date fields show timestamps. Needs consistent formatting.

---

## 📚 **Available Scripts**

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend
```bash
mvn spring-boot:run  # Run the application
mvn clean install    # Build the project
mvn test            # Run tests
```

---

## 🔐 **Environment Variables**

### Frontend (`.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend (`application.properties`)
```properties
# Database
spring.r2dbc.url=r2dbc:postgresql://localhost:5432/emr_db
spring.r2dbc.username=your_username
spring.r2dbc.password=your_password

# JWT
app.jwt.secret=your-secret-key-min-256-bits
app.jwt.access-token-expiry=86400000
app.jwt.refresh-token-expiry=604800000

# CORS
app.cors.allowed-origins=http://localhost:3000
```

---

## 🧪 **Testing**

### Test the Integration
1. Start both backend and frontend servers
2. Navigate to http://localhost:3000/login
3. Log in with test credentials
4. Verify dashboard displays real data
5. Try creating a patient, adding to queue, creating a consultation

---

## 📖 **Documentation**

- **Implementation Plan**: See `.gemini/antigravity/brain/.../implementation_plan.md` for detailed status
- **API Documentation**: http://localhost:8080/webjars/swagger-ui/index.html (when backend is running)
- **Backend Plan**: See `new-emr-backend/backend-implementation-plan.md`
- **Frontend Plan**: See `new-emr/frontend-implementation-plan.md`

---

## 🚀 **Deployment** (Coming Soon)

Deployment guides for:
- Docker / Docker Compose
- Kubernetes
- AWS / Google Cloud / Azure
- DigitalOcean

---

## 🤝 **Contributing**

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 **License**

[Your License Here]

---

## 💡 **Tech Stack**

### Backend
- Spring Boot 3.x (WebFlux)
- Spring Security + JWT
- Spring Data R2DBC
- PostgreSQL 15+
- Swagger/OpenAPI

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Query
- Framer Motion
- Recharts

---

**🎉 The system is functional and ready for testing! See the implementation plan for production readiness tasks.**
