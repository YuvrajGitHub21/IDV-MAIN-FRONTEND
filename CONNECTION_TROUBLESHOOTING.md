# 🔧 CORS & Connection Issues - Troubleshooting Guide

## Current Issue Analysis

You're experiencing connection issues between your frontend and backend:

### Error Evolution:
1. **CORS Error** ❌ → **Fixed with proxy** ✅
2. **500 Internal Server Error** ❌ → **Backend issue or connection problem**
3. **ECONNRESET** ❌ → **Connection being reset**

## 🚀 Immediate Steps to Resolve

### Step 1: Test Your Connection

1. **Go to the Debug Page**: Visit `http://localhost:8081/debug`
2. **Test Both Connections**:
   - Click "Test Proxy Connection" 
   - Click "Test Direct Connection"
3. **Check Browser Console** for detailed logs

### Step 2: Verify Backend is Running

Run this in PowerShell to test your backend directly:

```powershell
# Test if backend is accessible
Invoke-WebRequest -Uri "http://10.10.2.133:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@test.com","password":"123456"}'
```

**Expected Results:**
- ✅ **401 Unauthorized** = Backend is working, just invalid credentials
- ❌ **Connection timeout/refused** = Backend is down or unreachable

### Step 3: Check Your Backend Logs

Look at your ASP.NET Core backend console/logs for:
- **500 Internal Server Error** details
- **Exception stack traces**
- **Database connection issues**
- **Authentication/JWT configuration problems**

## 🔍 Common Causes & Solutions

### 1. Backend Not Running
**Symptoms**: ECONNRESET, connection timeout
**Solution**: Start your ASP.NET Core backend server

### 2. Database Connection Issues
**Symptoms**: 500 Internal Server Error
**Solution**: Check database connection string and ensure DB is accessible

### 3. JWT Configuration Missing
**Symptoms**: 500 error during authentication
**Solution**: Verify JWT settings in `appsettings.json`:

```json
{
  "Jwt": {
    "Key": "your-super-secret-key-that-is-at-least-32-characters-long",
    "Issuer": "your-app",
    "Audience": "your-app",
    "AccessTokenMinutes": 60,
    "RefreshTokenDays": 14
  }
}
```

### 4. Network/Firewall Issues
**Symptoms**: ECONNRESET, intermittent failures
**Solution**: 
- Check if `10.10.2.133:8080` is accessible from your machine
- Try pinging: `ping 10.10.2.133`
- Check Windows Firewall settings

### 5. Port Conflicts
**Symptoms**: Intermittent connection issues
**Solution**: 
- Your frontend is on `localhost:8081`
- Backend should be on `10.10.2.133:8080`
- Make sure no port conflicts exist

## 🛠️ Enhanced Login with Fallback

I've updated your Login page with:

1. **Automatic Fallback**: Tries proxy first, then direct connection
2. **Enhanced Logging**: Console logs show exactly what's happening
3. **Better Error Handling**: More specific error messages

## 📋 Debugging Checklist

### Frontend (Your Side):
- [ ] Frontend running on `http://localhost:8081` ✅
- [ ] Debug page accessible at `/debug`
- [ ] Browser console shows connection attempts
- [ ] Network tab shows the actual requests

### Backend (Need to Check):
- [ ] ASP.NET Core server running on `10.10.2.133:8080`
- [ ] Database accessible and connected
- [ ] JWT configuration present in `appsettings.json`
- [ ] No exceptions in backend console/logs
- [ ] CORS configured (optional but recommended)

### Network:
- [ ] Can ping `10.10.2.133` from your machine
- [ ] Port 8080 is open and accessible
- [ ] No firewall blocking the connection

## 🎯 Next Steps

1. **Test with Debug Page**: Go to `/debug` and test both connections
2. **Check Backend Logs**: Look for 500 error details in your ASP.NET Core logs
3. **Verify Backend Configuration**: Ensure JWT, database, and other settings are correct
4. **Test Network Connectivity**: Make sure you can reach the backend server

## 💡 Quick Fixes to Try

### Fix 1: Update Backend API Base
Your environment might be pointing to the wrong URL. Check your `.env` files:

```env
VITE_API_BASE=http://10.10.2.133:8080
```

### Fix 2: Temporary Direct Connection
If proxy keeps failing, temporarily bypass it by updating Login.tsx:

```typescript
// Force direct connection for testing
const apiUrl = "http://10.10.2.133:8080";
```

### Fix 3: Check Backend CORS
Even with proxy, add CORS to your backend for better compatibility:

```csharp
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
        builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

app.UseCors("AllowAll");
```

## 📞 If Still Stuck

1. Share your backend console logs showing the 500 error
2. Test the debug page and share results
3. Confirm backend is running and accessible
4. Check if database connection is working

The enhanced logging should show exactly where the connection is failing! 🔍
