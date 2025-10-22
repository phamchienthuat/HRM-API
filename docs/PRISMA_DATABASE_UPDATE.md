# Prisma Database Update Guide

## 📚 Table of Contents
1. [Basic Commands](#basic-commands)
2. [Migration Workflow](#migration-workflow)
3. [Common Scenarios](#common-scenarios)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)

---

## Basic Commands

### 1. **Create and Apply Migration** (Most Common)
```bash
npx prisma migrate dev --name your_migration_name
```
**What it does:**
- ✅ Creates SQL migration file
- ✅ Applies migration to database
- ✅ Regenerates Prisma Client
- ✅ Perfect for development

**Examples:**
```bash
npx prisma migrate dev --name add_employee_table
npx prisma migrate dev --name add_phone_to_user
npx prisma migrate dev --name update_user_relations
```

---

### 2. **Push Schema Changes** (Quick Prototyping)
```bash
npx prisma db push
```
**What it does:**
- ✅ Pushes schema changes to database
- ✅ No migration files created
- ⚠️ Use only for prototyping

**When to use:**
- Early development
- Quick experiments
- Local testing

**When NOT to use:**
- Production
- Team collaboration
- When you need migration history

---

### 3. **Generate Prisma Client**
```bash
npx prisma generate
```
**What it does:**
- ✅ Regenerates Prisma Client based on schema
- ✅ Updates TypeScript types
- ✅ Run after any schema change

**When to use:**
- After pulling new migrations
- After changing generator settings
- After switching branches

---

### 4. **View Database in Browser**
```bash
npx prisma studio
```
**What it does:**
- ✅ Opens GUI at http://localhost:5555
- ✅ View and edit data visually
- ✅ Great for debugging

---

### 5. **Check Migration Status**
```bash
npx prisma migrate status
```
**What it does:**
- ✅ Shows pending migrations
- ✅ Shows applied migrations
- ✅ Detects schema drift

---

### 6. **Reset Database** (⚠️ Deletes All Data)
```bash
npx prisma migrate reset
```
**What it does:**
- ⚠️ Drops database
- ✅ Recreates database
- ✅ Applies all migrations
- ✅ Runs seed scripts

**When to use:**
- Fresh start in development
- Fix migration issues
- Reset to clean state

---

### 7. **Deploy to Production**
```bash
npx prisma migrate deploy
```
**What it does:**
- ✅ Applies pending migrations
- ✅ No interactive prompts
- ✅ Safe for CI/CD

**When to use:**
- Production deployments
- CI/CD pipelines
- Automated deployments

---

### 8. **Pull Database Schema**
```bash
npx prisma db pull
```
**What it does:**
- ✅ Pulls schema from existing database
- ✅ Updates schema.prisma
- ✅ Useful for existing databases

**When to use:**
- Working with existing database
- Reverse engineering schema
- Syncing with database changes

---

## Migration Workflow

### Development Workflow

```
1. Edit schema.prisma
   ↓
2. npx prisma migrate dev --name describe_change
   ↓
3. Test your changes
   ↓
4. Commit migration files
   ↓
5. Push to repository
```

### Team Workflow

**When pulling changes from Git:**
```bash
# Pull latest code
git pull

# Apply new migrations
npx prisma migrate dev

# Or just generate client if no migrations
npx prisma generate
```

### Production Workflow

```bash
# In CI/CD pipeline or production server
npx prisma migrate deploy
```

---

## Common Scenarios

### Scenario 1: Add New Model (Employee)

**1. Edit `schema.prisma`:**
```prisma
model Employee {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(100)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**2. Run migration:**
```bash
npx prisma migrate dev --name create_employee_model
```

**3. Use in code:**
```typescript
await this.prisma.employee.create({
  data: { name: 'John', email: 'john@example.com' }
});
```

---

### Scenario 2: Add Field to Existing Model

**1. Edit `schema.prisma`:**
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  username  String   @unique
  phone     String?  @db.VarChar(15)  // ← Add this
  isLocked  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userTokens UserTokens[]
}
```

**2. Run migration:**
```bash
npx prisma migrate dev --name add_phone_to_user
```

---

### Scenario 3: Modify Existing Field

**1. Edit `schema.prisma`:**
```prisma
model User {
  username  String   @unique @db.VarChar(50)  // ← Changed from no length limit
}
```

**2. Run migration:**
```bash
npx prisma migrate dev --name limit_username_length
```

---

### Scenario 4: Add Relationship

**1. Edit `schema.prisma`:**
```prisma
model User {
  id       Int       @id @default(autoincrement())
  profile  Profile?  // ← One-to-one relation
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

**2. Run migration:**
```bash
npx prisma migrate dev --name add_user_profile_relation
```

---

### Scenario 5: Migration Failed/Stuck

**Problem:** Migration failed midway

**Solution 1: Reset and retry**
```bash
npx prisma migrate reset
```

**Solution 2: Mark as applied**
```bash
npx prisma migrate resolve --applied "migration_name"
```

**Solution 3: Roll back manually**
```bash
# Delete the migration folder
# Then run
npx prisma migrate dev
```

---

## Troubleshooting

### Issue 1: "Migration is already applied"
```bash
# Check status
npx prisma migrate status

# If needed, mark as resolved
npx prisma migrate resolve --applied "20231015123456_migration_name"
```

---

### Issue 2: "Schema drift detected"
**Meaning:** Database schema doesn't match your schema.prisma

**Solution:**
```bash
# Option 1: Reset (loses data)
npx prisma migrate reset

# Option 2: Create migration to sync
npx prisma migrate dev --name sync_schema

# Option 3: Pull from database
npx prisma db pull
```

---

### Issue 3: "Cannot connect to database"
**Check:**
1. Database is running
2. DATABASE_URL in .env is correct
3. Database credentials are valid
4. Port is correct

```bash
# Test connection
npx prisma db pull
```

---

### Issue 4: "Prisma Client out of sync"
**Error:** `@prisma/client` did not initialize yet

**Solution:**
```bash
# Regenerate client
npx prisma generate

# Or run migration (includes generate)
npx prisma migrate dev
```

---

## Best Practices

### ✅ DO

1. **Always use migrations in production**
   ```bash
   npx prisma migrate deploy
   ```

2. **Commit migration files to Git**
   ```bash
   git add prisma/migrations
   git commit -m "Add employee model"
   ```

3. **Use descriptive migration names**
   ```bash
   npx prisma migrate dev --name add_employee_email_field
   # NOT: npx prisma migrate dev --name update
   ```

4. **Test migrations before deploying**
   ```bash
   # On staging environment
   npx prisma migrate deploy
   ```

5. **Backup database before major migrations**
   ```bash
   pg_dump hrm > backup.sql
   ```

6. **Run prisma generate after pulling changes**
   ```bash
   git pull
   npx prisma generate
   ```

---

### ❌ DON'T

1. **Don't edit migration files manually**
   - Once created, treat as immutable

2. **Don't use `db push` in production**
   - No migration history
   - Can cause data loss

3. **Don't delete migration files**
   - Breaks migration history
   - Causes sync issues

4. **Don't skip migrations**
   - Can cause database drift
   - Hard to debug later

5. **Don't mix `migrate dev` and `db push`**
   - Choose one workflow
   - Stick with it

---

## Quick Reference

### Development
```bash
# Make changes → migrate
npx prisma migrate dev --name description

# View data
npx prisma studio

# Check status
npx prisma migrate status
```

### Production
```bash
# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### Troubleshooting
```bash
# Reset database
npx prisma migrate reset

# Pull from database
npx prisma db pull

# Check status
npx prisma migrate status
```

---

## Environment-Specific Commands

### Local Development
```bash
DATABASE_URL="postgresql://admin_hrm:admin@localhost:5433/hrm?schema=public"
npx prisma migrate dev
```

### Staging
```bash
DATABASE_URL="postgresql://user:pass@staging-db:5432/hrm_staging"
npx prisma migrate deploy
```

### Production
```bash
DATABASE_URL="postgresql://user:pass@prod-db:5432/hrm_prod"
npx prisma migrate deploy
```

---

## Summary

**Most Common Command (90% of time):**
```bash
npx prisma migrate dev --name your_description
```

This command:
- ✅ Creates migration
- ✅ Applies to database
- ✅ Generates Prisma Client
- ✅ Safe for development

**For Production:**
```bash
npx prisma migrate deploy
```

**For Viewing Data:**
```bash
npx prisma studio
```

That's it! You're ready to manage your Prisma database! 🚀
