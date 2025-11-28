# 🚗 Rental Management System

Multi-tenant rental management application built with Next.js 14, TypeScript, and PostgreSQL. Complete solution for vehicle rental businesses with advanced booking management, customer tracking, financial reporting, and multi-language support.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.28-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.7.0-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.3-38B2AC)](https://tailwindcss.com/)

---

## 🌟 Key Features

### 🏢 Multi-Tenant Architecture
- Complete business isolation per tenant
- Custom domains and branding
- Role-based access control (6 roles)
- Centralized admin panel

### 📅 Advanced Booking System
- Real-time availability calendar
- Multi-vehicle reservations
- Automatic conflict detection
- Custom pricing rules
- Deposit management
- Payment tracking

### 👥 Customer Management
- Complete CRM functionality
- Customer profiles with documents
- Booking history
- Credit tracking
- Multi-language communication

### 🚙 Vehicle Management
- Complete vehicle inventory
- Maintenance tracking
- Inspection system with photos
- Fuel level monitoring
- Damage reporting
- GPS tracking integration

### 💰 Financial Management
- Income and expense tracking
- Invoice generation (PDF)
- Budget vs. actual reports
- Payment reconciliation
- Multi-currency support
- Integration with accounting systems (GSControl)

### 📊 Analytics Dashboard
- Real-time KPIs
- Revenue charts
- Vehicle utilization
- Customer insights
- Custom reports
- Export to Excel/CSV

### 🔐 Advanced Security
- JWT authentication
- Role-based permissions
- Secure password hashing
- API rate limiting
- Data encryption
- Audit logs

### 🌍 Multi-Language Support
- English, Spanish, French, German, Italian, Portuguese
- Automatic contract translation
- Localized emails
- Date/time formatting

### 📱 Mobile-First Design
- Responsive UI
- Progressive Web App (PWA)
- Touch-optimized
- Offline capabilities

---

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14.2.28** - React framework with App Router
- **TypeScript 5.2.2** - Type-safe development
- **React 18.2.0** - UI library

### Database & ORM
- **PostgreSQL** - Production database
- **Prisma 6.7.0** - Type-safe ORM
- **Prisma Migrate** - Database migrations

### UI Components & Styling
- **Tailwind CSS 3.3.3** - Utility-first CSS
- **Shadcn/ui** - Component library (Radix UI primitives)
- **Lucide React** - Icon library
- **Framer Motion** - Animations

### Authentication & Authorization
- **NextAuth.js 4.24.11** - Authentication system
- **bcryptjs** - Password hashing
- **JWT** - Token-based auth

### Cloud Storage & Files
- **AWS S3** - File storage
- **Google Drive API** - Document backup
- **Sharp** - Image processing
- **Puppeteer** - PDF generation

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Yup** - Alternative validation

### Data Fetching & State
- **SWR** - Data fetching
- **TanStack Query** - Server state
- **Zustand** - Client state

### Charts & Visualization
- **Chart.js + react-chartjs-2** - Charts
- **Recharts** - Alternative charts
- **Plotly.js** - Advanced visualizations

### Utilities
- **date-fns** - Date manipulation
- **lodash** - Utility functions
- **xlsx** - Excel import/export
- **Nodemailer** - Email sending

### External Integrations
- **Abacus.AI Vision API** - OCR for documents
- **GSControl API** - Accounting integration
- **Mapbox** - Maps and geolocation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.6.2 or higher
- PostgreSQL 14 or higher
- Yarn package manager
- AWS account (for S3)
- Optional: Google Drive API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jovaik/rental-management.git
   cd rental-management
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Setup environment variables**
   
   Create a `.env` file in the root directory:
   
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/rental_db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key-change-this"
   
   # AWS S3 (Optional - for file uploads)
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   AWS_BUCKET_NAME="your-bucket-name"
   AWS_FOLDER_PREFIX="uploads/"
   
   # Email (Optional - for notifications)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   SMTP_FROM="noreply@yourdomain.com"
   
   # Google Drive (Optional - for backups)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REFRESH_TOKEN="your-refresh-token"
   
   # OCR API (Optional - for document scanning)
   ABACUSAI_API_KEY="your-abacus-api-key"
   
   # Accounting Integration (Optional)
   GSCONTROLL_API_KEY="your-gscontrol-api-key"
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   yarn prisma:generate
   
   # Run migrations
   yarn prisma:migrate
   
   # Seed database with demo data (optional)
   yarn prisma:seed
   ```

5. **Run development server**
   ```bash
   yarn dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Credentials

After seeding the database, you can use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@demo.com | password123 |
| Owner | owner@demo.com | password123 |
| Operator | operator@demo.com | password123 |

---

## 📦 Deploy to Vercel

The easiest way to deploy this application is using Vercel:

### 1. Push to GitHub

Make sure your code is pushed to a GitHub repository.

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration

### 3. Configure Environment Variables

In Vercel dashboard, add all environment variables from your `.env` file:

- Go to **Settings** → **Environment Variables**
- Add each variable one by one
- Make sure to add them for **Production**, **Preview**, and **Development**

**Critical variables:**
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_URL` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` - Generate a secure secret key

### 4. Setup Database

You'll need a PostgreSQL database. Options:

- **Vercel Postgres** (recommended for Vercel deployments)
- **Supabase** (free tier available)
- **Railway** (easy setup)
- **Neon** (serverless Postgres)
- **AWS RDS** (production-grade)

**For Vercel Postgres:**
1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → Select **Postgres**
3. Vercel will automatically set the `DATABASE_URL` environment variable

### 5. Run Database Migrations

After deploying, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
yarn prisma:migrate
yarn prisma:generate
```

Or use Vercel's build command:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```

### 6. Deploy

Click **Deploy** and wait for the build to complete.

Your app will be live at: `https://your-app.vercel.app`

### 7. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain

---

## 🎯 One-Click Deploy

[![Deploy with Vercel](https://i.ytimg.com/vi/zRJcQ9PFSHE/mqdefault.jpg)

---

## 📋 Available Scripts

```bash
# Development
yarn dev              # Start dev server (localhost:3000)

# Build
yarn build            # Build for production
yarn start            # Start production server

# Database
yarn prisma:generate  # Generate Prisma client
yarn prisma:migrate   # Run migrations
yarn prisma:seed      # Seed demo data
yarn prisma:studio    # Open Prisma Studio

# Code Quality
yarn lint             # Run ESLint
yarn type-check       # Run TypeScript compiler
```

---

## 📁 Project Structure

```
rental-management/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── bookings/     # Booking management
│   │   ├── customers/    # Customer management
│   │   ├── vehicles/     # Vehicle management
│   │   ├── finance/      # Financial reports
│   │   └── settings/     # System settings
│   └── layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # Shadcn UI components
│   ├── forms/            # Form components
│   ├── tables/           # Data tables
│   └── charts/           # Chart components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── auth.ts           # Auth helpers
│   ├── utils.ts          # Utility functions
│   └── validations/      # Zod schemas
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Seed script
├── public/               # Static files
│   ├── icons/            # PWA icons
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
├── types/                # TypeScript types
├── .env.example          # Environment variables template
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `POST /api/auth/signup` - Register
- `GET /api/auth/session` - Get current session

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking
- `PUT /api/bookings/[id]` - Update booking
- `DELETE /api/bookings/[id]` - Delete booking

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer
- `PUT /api/customers/[id]` - Update customer

### Vehicles
- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/[id]` - Get vehicle
- `PUT /api/vehicles/[id]` - Update vehicle

### Finance
- `GET /api/finance/dashboard` - Financial dashboard
- `GET /api/finance/invoices` - List invoices
- `POST /api/finance/invoices` - Generate invoice

---

## 🎨 Customization

### Branding

Update your brand colors in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    DEFAULT: '#your-primary-color',
    foreground: '#ffffff',
  },
  // ... other colors
}
```

### Logo

Replace files in `/public`:
- `logo.svg` - Main logo
- `logo-white.svg` - White version
- `favicon.ico` - Favicon

### Email Templates

Customize email templates in `/lib/emails/templates/`

---

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

---

## 📈 Performance

- **Lighthouse Score:** 95+
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Total Bundle Size:** < 200kb (gzipped)

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check your DATABASE_URL
echo $DATABASE_URL

# Test connection
yarn prisma db push
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
yarn build
```

### Environment Variables Not Loading

```bash
# Make sure .env file is in root directory
# Restart dev server after changes
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Shadcn/ui](https://ui.shadcn.com/) - Component library
- [Vercel](https://vercel.com/) - Hosting platform

---

## 📞 Support

For questions or issues:

- 📧 Email: support@yourdomain.com
- 🐛 Issues: [GitHub Issues](https://github.com/jovaik/rental-management/issues)
- 📚 Documentation: [Wiki](https://github.com/jovaik/rental-management/wiki)

---

## 🗺️ Roadmap

- [ ] Mobile apps (iOS & Android)
- [ ] WhatsApp integration
- [ ] SMS notifications
- [ ] Advanced analytics with AI
- [ ] Fleet management module
- [ ] Insurance integration
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Multi-location support
- [ ] Customer portal
- [ ] Driver verification system

---

**Built with ❤️ by the Rental Management Team**

⭐ Star this repo if you find it helpful!
