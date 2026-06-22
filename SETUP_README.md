# Emergency System - MySQL Setup Complete ✅

## What Has Been Done

Your emergency response system has been **migrated from MongoDB to MySQL** with local XAMPP support.

### Changes Made:

1. ✅ **Backend Updated**
   - Removed MongoDB dependencies (mongoose)
   - Added Sequelize ORM for MySQL
   - Added mysql2 package for MySQL connection

2. ✅ **Database Models Updated**
   - `User.js` - Sequelize model for users table
   - `Sos.js` - Sequelize model for SOS calls table

3. ✅ **Server Configuration**
   - Complete rewrite using Sequelize
   - New routes added (register, login, user management)
   - Auto-sync database tables on startup

4. ✅ **Environment Configuration**
   - `.env` file configured for MySQL
   - `.env.example` created with all required variables

5. ✅ **Documentation & Tools**
   - `SETUP_GUIDE.md` - Complete setup instructions
   - `test-db.js` - Database connection test script

---

## Quick Start Guide

### 1️⃣ Start MySQL in XAMPP

1. Open **XAMPP Control Panel**
2. Click **"Start"** next to **MySQL**
3. Wait for it to show as running

### 2️⃣ Create Hospital Database

Open browser and go to: **http://localhost/phpmyadmin**

1. Click **"New"**
2. Database name: `hospital`
3. Collation: `utf8mb4_unicode_ci`
4. Click **"Create"**

OR use SQL command:
```sql
CREATE DATABASE hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3️⃣ Install Dependencies

Open PowerShell/Command Prompt and run:
```powershell
cd "c:\Программ хангамжийн тест\test\emergency-system"
npm install
```

### 4️⃣ Test Database Connection

```powershell
npm run test-db
```

You should see:
```
✅ MySQL Connection Successful!
   Host: localhost
   Port: 3306
   User: root
   Database: hospital
```

### 5️⃣ Start Backend Server

```powershell
npm run server
```

Expected output:
```
✅ MySQL Database connected successfully
✅ Models synchronized with database
✅ Server running on http://localhost:3000
   Database: hospital
   Host: localhost
```

---

## Available API Endpoints

### Health Check
```bash
GET http://localhost:3000/health
```

### SOS Calls Management
```bash
# Save new SOS
POST /sos
Body: { "latitude": 47.9, "longitude": 106.9, "userId": "user123" }

# Get all SOS calls
GET /sos

# Get specific SOS
GET /sos/:id
```

### User Management
```bash
# Register new user
POST /auth/register
Body: { "name": "John", "email": "john@example.com", "password": "pass123" }

# Login user
POST /auth/login
Body: { "email": "john@example.com", "password": "pass123" }

# Get all users
GET /users
```

---

## Important Notes

### Default MySQL Credentials
```
Host: localhost
Port: 3306
Username: root
Password: (empty - leave blank)
Database: hospital
```

### Database Tables Auto-Created
- `users` - User authentication
- `sos_calls` - Emergency SOS records

### Next Steps
1. ✅ Database is ready
2. ⬜ Connect React Native frontend to backend
3. ⬜ Update API calls in `app/home.js` and `app/LoginScreen.js`
4. ⬜ Test end-to-end functionality

---

## Troubleshooting

### MySQL Not Running
- Start MySQL in XAMPP Control Panel
- Check if port 3306 conflicts

### Database Connection Error
- Verify "hospital" database exists in phpMyAdmin
- Check .env file credentials
- Run: `npm run test-db`

### Port 3000 Already in Use
- Change PORT in `.env` file
- Or run: `netstat -ano | findstr :3000` to find process using it

### npm install Errors
```powershell
npm install --legacy-peer-deps
```

---

## File Structure

```
emergency-system/
├── backend/
│   ├── server.js          (✅ Updated for MySQL)
│   ├── test-db.js         (✅ New - Tests DB connection)
│   ├── .env               (✅ Updated with MySQL config)
│   ├── .env.example       (✅ Updated for MySQL)
│   ├── models/
│   │   ├── User.js        (✅ Updated to Sequelize)
│   │   └── Sos.js         (✅ Updated to Sequelize)
│   ├── router/            (Old auth routes - deprecated)
│   └── SETUP_GUIDE.md     (✅ New - Full setup instructions)
├── app/                   (Frontend code - needs updating)
├── package.json           (✅ Updated with MySQL packages)
└── SETUP_README.md        (This file)
```

---

## Support

For more detailed setup instructions, see: [SETUP_GUIDE.md](./backend/SETUP_GUIDE.md)

Happy coding! 🚀
