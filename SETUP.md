# Setup Guide for Rental Management

## Database Setup

### Prerequisites
You need a PostgreSQL database to run this application. You have several options:

### Option 1: Local PostgreSQL Installation

#### Install PostgreSQL on Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Create Database:
```bash
sudo -u postgres psql
CREATE DATABASE rental_management;
CREATE USER rental_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE rental_management TO rental_user;
\q
```

#### Update .env file:
```
DATABASE_URL="postgresql://rental_user:your_password@localhost:5432/rental_management?schema=public"
```

### Option 2: Docker PostgreSQL

#### Run PostgreSQL in Docker:
```bash
docker run --name rental-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=rental_management \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### Update .env file:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rental_management?schema=public"
```

### Option 3: Cloud Database (Recommended for Production)

Use a managed PostgreSQL service:
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available
- **AWS RDS** (https://aws.amazon.com/rds/)
- **Google Cloud SQL** (https://cloud.google.com/sql)
- **Azure Database** (https://azure.microsoft.com/en-us/products/postgresql)

After creating your database, copy the connection string to `.env`:
```
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

## Running Migrations

Once your database is configured:

### 1. Generate Prisma Client (already done)
```bash
npx prisma generate
```

### 2. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables in your database
- Apply the schema from `prisma/schema.prisma`
- Generate a migration file

### 3. Verify Database Schema
```bash
npx prisma studio
```

This opens a visual database browser at http://localhost:5555

## Creating Your First Tenant

### Option 1: Using Prisma Studio

1. Open Prisma Studio: `npx prisma studio`
2. Navigate to the "Tenant" model
3. Click "Add record"
4. Fill in:
   - name: "My Rental Business"
   - subdomain: "mycompany"
   - businessTypes: ["VEHICLE_RENTAL"]
5. Save

### Option 2: Using Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Rental Company',
      subdomain: 'demo',
      businessTypes: ['VEHICLE_RENTAL', 'SCOOTER_RENTAL'],
      location: 'Madrid, Spain',
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      },
    },
  });

  console.log('Created tenant:', tenant);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'OWNER',
    },
  });

  console.log('Created user:', user);

  // Create sample items
  const items = await prisma.item.createMany({
    data: [
      {
        tenantId: tenant.id,
        type: 'VEHICLE',
        name: 'Honda PCX 125',
        description: 'Comfortable scooter for city rides',
        basePrice: 25.0,
        status: 'AVAILABLE',
        attributes: {
          make: 'Honda',
          model: 'PCX 125',
          year: 2023,
          color: 'Red',
        },
        photos: [],
      },
      {
        tenantId: tenant.id,
        type: 'VEHICLE',
        name: 'Yamaha NMAX 155',
        description: 'Powerful and reliable scooter',
        basePrice: 30.0,
        status: 'AVAILABLE',
        attributes: {
          make: 'Yamaha',
          model: 'NMAX 155',
          year: 2023,
          color: 'Blue',
        },
        photos: [],
      },
    ],
  });

  console.log('Created items:', items);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Update `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Install ts-node:
```bash
npm install -D ts-node
```

Run seed:
```bash
npx prisma db seed
```

## Testing Multi-Tenant Setup

### Local Development with Subdomains

To test subdomains locally, you need to modify your `/etc/hosts` file:

```bash
sudo nano /etc/hosts
```

Add:
```
127.0.0.1 demo.localhost
127.0.0.1 acme.localhost
127.0.0.1 test.localhost
```

Now you can access:
- http://demo.localhost:3000 - Demo tenant
- http://acme.localhost:3000 - Acme tenant
- http://test.localhost:3000 - Test tenant

### Production Subdomain Setup

1. Configure your DNS provider to add a wildcard A record:
   ```
   *.yourdomain.com -> Your server IP
   ```

2. Configure your web server (nginx/caddy) to proxy all subdomains to your Next.js app

3. Update NEXTAUTH_URL in production:
   ```
   NEXTAUTH_URL="https://yourdomain.com"
   ```

## Troubleshooting

### "P1001: Can't reach database server"
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env
- Check firewall settings
- Ensure database accepts connections

### "P1017: Server has closed the connection"
- Database timeout - increase connection pool settings
- Check database server logs

### "Tenant not found"
- Ensure you've created a tenant in the database
- Check subdomain matches tenant.subdomain in database
- Verify middleware is correctly extracting subdomain

### Migration Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy
```

## Next Steps

1. ✅ Setup database
2. ✅ Run migrations
3. ✅ Create first tenant
4. ⏭️ Build authentication pages
5. ⏭️ Create dashboard UI
6. ⏭️ Implement booking flow
7. ⏭️ Add invoice generation
8. ⏭️ Deploy to production

## Support

For issues or questions:
- Check the main README.md
- Review Prisma documentation: https://www.prisma.io/docs
- Review Next.js documentation: https://nextjs.org/docs
