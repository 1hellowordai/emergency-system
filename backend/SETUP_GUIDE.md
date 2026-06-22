# MySQL Database Setup Guide - Emergency System

## Step 1: Install XAMPP (if not already installed)

1. Download XAMPP from: https://www.apachefriends.org/
2. Run the installer
3. Install with at least Apache and MySQL enabled
4. Click "Finish"

## Step 2: Start MySQL in XAMPP

1. Open XAMPP Control Panel
2. Click **"Start"** next to "MySQL"
3. Wait for it to show as running (text should be green)

## Step 3: Create Database

### Option A: Using phpMyAdmin (Recommended)

1. Open your browser
2. Go to: **http://localhost/phpmyadmin**
3. Click on **"New"** in left panel
4. Database Name: `hospital`
5. Collation: `utf8mb4_unicode_ci`
6. Click **"Create"**

### Option B: Using Command Line

1. Open Command Prompt/PowerShell
2. Navigate to XAMPP MySQL bin folder:
   ```
   cd "C:\xampp\mysql\bin"
   ```
3. Login to MySQL:
   ```
   mysql -u root -p
   ```
4. Just press Enter when asked for password (default has no password)
5. Create database:
   ```sql
   CREATE DATABASE hospital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```

## Step 4: Install Dependencies

1. Open Command Prompt/PowerShell
2. Navigate to project root:
   ```
   cd "c:\Программ хангамжийн тест\test\emergency-system"
   ```
3. Install packages:
   ```
   npm install
   ```

## Step 5: Start Backend Server

1. In Command Prompt/PowerShell (at project root):
   ```
   npm run server
   ```
   OR with auto-reload:
   ```
   npm run server:dev
   ```

2. You should see:
   ```
   ✅ MySQL Database connected successfully
   ✅ Models synchronized with database
   ✅ Server running on http://localhost:3000
      Database: hospital
      Host: localhost
   ```

## Step 6: Test API Endpoints

### Health Check
```bash
curl http://localhost:3000/health
```

### Save SOS Call
```bash
curl -X POST http://localhost:3000/sos \
  -H "Content-Type: application/json" \
  -d '{"latitude": 47.9, "longitude": 106.9, "userId": "user123"}'
```

### Get SOS History
```bash
curl http://localhost:3000/sos
```

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Батар", "email": "batar@example.com", "password": "pass123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "batar@example.com", "password": "pass123"}'
```

## Troubleshooting

### MySQL Not Starting
- Check if port 3306 is already in use
- Try restarting XAMPP Control Panel

### Database Connection Error
- Verify MySQL is running in XAMPP
- Check `.env` file has correct credentials
- Make sure database "hospital" exists

### npm install fails
- Try: `npm install --legacy-peer-deps`
- If still fails, delete `node_modules` and `package-lock.json`, then try again

### Port 3000 Already in Use
- Change PORT in `.env` file to a different number (e.g., 3001)

## Database Structure

### Users Table
```sql
id (INT, Primary Key, Auto Increment)
name (VARCHAR)
email (VARCHAR, Unique)
password (VARCHAR)
createdAt (DATETIME)
updatedAt (DATETIME)
```

### SOS Calls Table
```sql
id (INT, Primary Key, Auto Increment)
userId (VARCHAR)
latitude (FLOAT)
longitude (FLOAT)
createdAt (DATETIME)
updatedAt (DATETIME)
```

## Notes

- Default MySQL username: `root`
- Default password: empty (leave blank)
- Host: `localhost`
- Database name: `hospital`
- Server port: `3000`
