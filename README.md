# 🏥 Modern EMR System - Frontend

A stunning, modern Electronic Medical Records frontend built with Next.js 14, TypeScript, and Tailwind CSS for healthcare providers.

## 📋 **Quick Overview**

**Status**: **90% Complete** - Production-ready frontend with real backend integration  
**Framework**: Next.js 14 + React 19 + TypeScript + Tailwind CSS  
**Backend**: Integrates with Spring Boot API (requires backend running on port 8080)

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ and npm

### 1. Clone and Setup
```bash
git clone https://github.com/ngangoju/new-emr.git
cd new-emr
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` file:
```bash
# Required: Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:3000

**Note**: This frontend requires the backend API running on port 8080. For backend setup and test credentials, refer to the backend repository documentation.

---

## 🏗️ **Project Structure**

```
src/
├── app/                    # Next.js 14 App Router pages
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── admin/        # Admin dashboard
│   │   ├── billing/      # Billing dashboard
│   │   ├── doctor/       # Doctor interface
│   │   ├── lab/          # Lab dashboard
│   │   └── pharmacy/     # Pharmacy dashboard
│   ├── login/            # Authentication page
│   └── layout.tsx        # Root layout with providers
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Header, Sidebar, Footer
│   ├── admin/            # Admin-specific components
│   ├── billing/          # Billing components
│   ├── doctor/           # Doctor-specific components
│   ├── lab/              # Lab components
│   ├── patient/          # Patient components
│   ├── pharmacy/         # Pharmacy components
│   └── charts/           # Reusable charts
├── hooks/                 # Custom React hooks
│   ├── api/              # React Query API hooks
│   └── use*.ts           # Custom hooks
├── lib/                   # Utilities and configurations
│   ├── api.ts            # Axios instance with interceptors
│   ├── stores/           # Zustand stores
│   ├── utils/            # Helper functions
│   ├── validations/      # Zod schemas
│   └── mock/             # Mock data (if needed)
└── types/                 # TypeScript type definitions
    ├── admin.ts
    ├── billing.ts
    ├── lab.ts
    ├── patient.ts
    └── pharmacy.ts
```

---

## ✅ **What's Working**

### Frontend Features
- ✅ **Authentication & Authorization**
  - JWT authentication with refresh tokens
  - Role-based access control (DOCTOR, NURSE, RECEPTIONIST, ADMIN, LAB, PHARMACY, BILLING)
  - Protected routes with automatic redirect

- ✅ **User Interface & Experience**
  - Modern, responsive UI with dark/light mode
  - Beautiful medical-grade design system
  - Smooth animations with Framer Motion
  - Toast notifications for user feedback
  - Loading states and error boundaries

- ✅ **Doctor Dashboard**
  - Real-time dashboard statistics
  - Patient queue management with WebSocket support
  - Charts and analytics (Recharts)
  - Quick actions and navigation

- ✅ **Patient Management**
  - Patient search with debounced input and filters
  - Patient registration with validation
  - Detailed patient profiles with medical history
  - Vitals tracking with timeline charts
  - Consultation history and timeline

- ✅ **Consultation Workflow**
  - 6-step consultation wizard
  - Patient selection and search
  - Chief complaint and examination notes
  - Vitals recording with BMI auto-calculation
  - ICD-10 diagnosis selection
  - Treatment plan with prescriptions and lab orders
  - SOAP notes support

- ✅ **Queue Management**
  - Real-time queue board
  - Patient check-in and status updates
  - Call next patient functionality
  - Queue position tracking

- ✅ **Billing System**
  - Invoice generation and management
  - Payment processing interface
  - Tariff calculator integration
  - Insurance and copay calculations

- ✅ **Pharmacy Interface**
  - Inventory management dashboard
  - Medication dispense workflow
  - Low stock alerts
  - Batch tracking and expiration monitoring

- ✅ **Lab Management**
  - Lab order management
  - Results entry forms
  - Test result tracking

- ✅ **Admin Features**
  - User management interface
  - System statistics dashboard
  - Reports and analytics

---

## 🚧 **Known Issues**

1. **WebSocket Connection**: Real-time features require proper WebSocket server configuration on backend.

2. **API Dependencies**: All features require backend API to be running on port 8080. Frontend shows appropriate error states when backend is unavailable.

3. **Performance**: Large datasets may require pagination improvements for optimal performance.

4. **Mobile Experience**: While responsive, some complex forms (consultation wizard) may benefit from mobile-specific optimizations.

---

## 📚 **Available Scripts**

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🔐 **Environment Variables**

Create `.env.local` file in the project root:

```bash
# Required: Backend API URL (must be running on port 8080)
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Note**: Backend configuration and environment variables are managed separately in the backend repository.

---

## 🧪 **Testing**

### Frontend Testing
1. Start the development server: `npm run dev`
2. Navigate to http://localhost:3000/login
3. Ensure backend is running on port 8080
4. Test user interface responsiveness and functionality
5. Verify API integration with real backend data

### Recommended Testing Workflow
- Test authentication flow
- Navigate through different role dashboards
- Verify patient registration and search
- Test consultation wizard end-to-end
- Check responsive design on different screen sizes

---

## 📖 **Documentation**

- **Frontend Implementation Plan**: [`frontend-implementation-plan.md`](./frontend-implementation-plan.md) - Detailed implementation specifications and architecture
- **Backend Integration Guide**: [`BACKEND-INTEGRATION.md`](./BACKEND-INTEGRATION.md) - API integration details and setup
- **Implementation Status**: [`IMPLEMENTATION-STATUS.md`](./IMPLEMENTATION-STATUS.md) - Current progress and completed features
- **API Endpoints**: [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) - Backend API specification
- **Phase 2 Integration**: [`INTEGRATION-PHASE-2-COMPLETE.md`](./INTEGRATION-PHASE-2-COMPLETE.md) - Recent integration achievements

**Backend API Documentation**: Available at http://localhost:8080/webjars/swagger-ui/index.html (when backend is running)

---

## 📸 **Screenshots**

*Coming Soon: Screenshots of the beautiful EMR interface*

### Planned Screenshots:
- Login page with modern design
- Doctor dashboard with real-time stats
- Patient management interface
- Consultation wizard workflow
- Mobile-responsive design

---

## 🤝 **Contributing**

1. **Setup Development Environment**
   ```bash
   git clone <repo-url>
   cd new-emr
   npm install
   ```

2. **Development Workflow**
   - Create a feature branch: `git checkout -b feature/your-feature-name`
   - Make your changes following the existing code style
   - Test thoroughly with `npm run lint` and manual testing
   - Submit a pull request with clear description

3. **Code Standards**
   - Follow TypeScript strict mode
   - Use ESLint and Prettier for code formatting
   - Write semantic commit messages
   - Add comments for complex logic

4. **Testing**
   - Test your changes with the backend API running
   - Verify responsive design on different screen sizes
   - Check dark/light mode compatibility

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🚀 **Deployment**

### Recommended: Vercel (Next.js Optimized)
1. Push your code to GitHub/GitLab
2. Connect your repository to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy automatically with each push

### Alternative Platforms
- **Netlify**: Supports Next.js with serverless functions
- **AWS Amplify**: Full-stack deployment with CI/CD
- **Firebase Hosting**: Google's hosting platform
- **Railway**: Simple deployment with database support

**Note**: Configure `NEXT_PUBLIC_API_URL` environment variable in your deployment platform to point to your backend API.

---

**🎉 A production-ready, world-class EMR frontend that's beautiful, fast, and intuitive!**

---

## 💡 **Tech Stack**

### Core Framework
- **Next.js 14** - React framework with App Router
- **React 19** - Modern React with concurrent features
- **TypeScript 5** - Type-safe development

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Accessible, customizable component library
- **Radix UI** - Headless accessible primitives
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful, consistent icons

### State Management & Data
- **TanStack Query (React Query)** - Server state management and caching
- **Zustand** - Client state management
- **React Hook Form** - Form handling and validation
- **Zod** - Runtime type validation

### API & Communication
- **Axios** - HTTP client with interceptors
- **Socket.io Client** - Real-time WebSocket communication

### Development Tools
- **ESLint & Prettier** - Code quality and formatting
- **PostCSS** - CSS processing
- **date-fns** - Date manipulation utilities
- **React Hot Toast** - Elegant notifications

### Charts & Visualization
- **Recharts** - Responsive React charts
- **React Day Picker** - Date picker component

---

**🎉 The system is functional and ready for testing! See the implementation plan for production readiness tasks.**
