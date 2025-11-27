# Rental Management - Multi-Tenant SaaS Platform

A powerful multi-tenant SaaS platform for managing rental businesses including vehicles, properties, boats, experiences, and equipment.

## ✨ Implemented Modules

### Core Modules
- ✅ **Multi-tenant System** - Subdomain-based tenant isolation
- ✅ **Authentication** - NextAuth.js with multi-tenant support
- ✅ **Onboarding** - Multi-step tenant registration wizard
- ✅ **Inventory Management** - Full CRUD for rental items
- ✅ **Booking System** - Calendar-based reservations with availability checks
- ✅ **Customer Management** - Complete CRM functionality
- ✅ **Invoice Management** - Automatic invoice generation with PDF export
- ✅ **Dashboard** - Real-time business metrics and financial analytics

### Latest: Customer & Invoice Management (MVP)
Complete billing system with automatic invoice generation:
- Customer database with search and filtering
- Automatic invoice creation on booking confirmation
- PDF generation with professional design
- Financial dashboard with revenue metrics
- Status management (Pending, Paid, Cancelled)

📖 **Full documentation**: See [CUSTOMERS_INVOICES_MODULE.md](./CUSTOMERS_INVOICES_MODULE.md)

### Optional Integrations
- ⚙️ **AWS S3 Storage** - Cloud-based file storage with CDN support (ready to enable)
- 📧 **SMTP Email** - Transactional emails for bookings and welcome messages (ready to enable)
  - Welcome email on tenant registration
  - Booking confirmation with PDF invoice attachment

## 🏗️ Architecture

### Multi-Tenant Design
- **Subdomain-based tenant isolation**: Each tenant gets their own subdomain (e.g., `acme.rentalmanagement.com`)
- **Row-Level Security**: Prisma middleware automatically filters all queries by `tenantId`
- **Shared Database**: All tenants share the same PostgreSQL database with strict data isolation

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the required values:

```bash
cp .env.example .env
```

**Required variables:**
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NODE_ENV="development"
```

**Optional integrations:**

#### AWS S3 (Cloud Storage)
For production file uploads, configure S3:
```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_CLOUDFRONT_DOMAIN="your-cdn-domain"  # Optional
```

Then:
1. Install SDK: `npm install @aws-sdk/client-s3`
2. Uncomment S3 code in `/app/api/upload/route.ts`

#### SMTP Email (Transactional Emails)
For sending booking confirmations and welcome emails:
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_EMAIL="noreply@yourdomain.com"
SMTP_FROM_NAME="Rental Management"
```

Then:
1. Install Nodemailer: `npm install nodemailer`
2. Install types: `npm install -D @types/nodemailer`

See `.env.example` for provider-specific examples (Gmail, SendGrid, AWS SES).

### 3. Database Setup

Run migrations and seed data:

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database with demo data (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Test with Demo Data

If you seeded the database, you can login with:
- **Subdomain**: `demo`
- **Email**: `owner@demo.com`
- **Password**: `password123`

See [SETUP.md](./SETUP.md) for detailed setup instructions including local subdomain testing.

## 📁 Project Structure

```
rental_management/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (auth)/           # Auth pages (login, register)
│   └── (dashboard)/      # Protected dashboard pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions
│   ├── prisma.ts        # Prisma client with multi-tenant middleware
│   ├── tenant.ts        # Tenant helper functions
│   └── utils.ts         # Common utilities
├── prisma/              # Database schema and migrations
│   └── schema.prisma    # Prisma schema
├── types/               # TypeScript type definitions
│   └── index.ts        # Shared types
└── middleware.ts        # Next.js middleware for tenant detection
```

## 🗄️ Database Models

### Core Models

1. **Tenant**: Organization/business entity
   - Multi-business type support
   - Custom branding (logo, colors)
   - Subdomain routing

2. **User**: System users with role-based access
   - Roles: SUPER_ADMIN, OWNER, ADMIN, OPERATOR, MECHANIC
   - Tenant-scoped

3. **Item**: Rentable items (vehicles, properties, boats, etc.)
   - Dynamic attributes via JSON field
   - Photo galleries
   - Status tracking

4. **Customer**: Rental customers
   - Document management
   - Booking history

5. **Booking**: Rental reservations
   - Date range validation
   - Price calculation
   - Status workflow

6. **Invoice**: Billing documents
   - Auto-generated invoice numbers
   - PDF generation support
   - Payment tracking

## 🔐 Multi-Tenant Security

### Automatic Tenant Isolation

The Prisma middleware in `lib/prisma.ts` automatically:
- Injects `tenantId` on all CREATE operations
- Filters by `tenantId` on all READ operations
- Restricts UPDATE/DELETE to tenant's data only

### Usage Example

```typescript
import { prisma, setTenantId } from '@/lib/prisma';

// Set tenant context
setTenantId('tenant_123');

// All queries are automatically filtered by tenant_123
const items = await prisma.item.findMany(); // Only returns tenant_123's items
const booking = await prisma.booking.create({
  data: {
    // tenantId is automatically added
    itemId: 'item_123',
    customerId: 'customer_123',
    // ...
  }
});
```

### Server Component Usage

```typescript
import { requireTenant } from '@/lib/tenant';

export default async function DashboardPage() {
  const tenant = await requireTenant(); // Gets tenant from subdomain
  
  // Tenant context is automatically set
  const bookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED' }
  });
  
  return <div>...</div>;
}
```

## 🎨 Customization

### Adding Business Types

Edit `prisma/schema.prisma`:

```prisma
enum BusinessType {
  SCOOTER_RENTAL
  VEHICLE_RENTAL
  PROPERTY_RENTAL
  BOAT_RENTAL
  EXPERIENCE_RENTAL
  EQUIPMENT_RENTAL
  // Add new types here
}
```

Then run:
```bash
npx prisma migrate dev --name add_business_type
```

### Dynamic Item Attributes

Items have a flexible `attributes` JSON field for business-specific data:

```typescript
// Vehicle rental
{
  attributes: {
    make: "Honda",
    model: "PCX 125",
    year: 2023,
    color: "Red",
    licensePlate: "ABC-1234"
  }
}

// Property rental
{
  attributes: {
    bedrooms: 3,
    bathrooms: 2,
    squareMeters: 120,
    floor: 5,
    amenities: ["wifi", "parking", "pool"]
  }
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

## 📝 API Routes

### Tenant Management
- `GET /api/tenants` - List all tenants (super admin)
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/[id]` - Get tenant details
- `PATCH /api/tenants/[id]` - Update tenant
- `DELETE /api/tenants/[id]` - Delete tenant

### Items
- `GET /api/items` - List tenant's items
- `POST /api/items` - Create item
- `GET /api/items/[id]` - Get item details
- `PATCH /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item

### Bookings
- `GET /api/bookings` - List tenant's bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking status
- `DELETE /api/bookings/[id]` - Cancel booking

### Customers
- `GET /api/customers` - List tenant's customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PATCH /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

## 🚢 Deployment

### Environment Variables for Production

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-secure-secret"
NODE_ENV="production"
```

### Deploy to Vercel

```bash
vercel --prod
```

### Deploy to Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm start
   ```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@rentalmanagement.com or open an issue in the repository.
