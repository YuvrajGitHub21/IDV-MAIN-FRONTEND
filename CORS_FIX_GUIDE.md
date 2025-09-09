# CORS Error Fix Guide

You're experiencing a CORS (Cross-Origin Resource Sharing) error because your frontend and backend are running on different origins.

## The Error Explained

- **Frontend**: `http://localhost:8082` (or whatever port Vite assigns)
- **Backend**: `http://10.10.2.133:8080`
- **Problem**: Browser blocks requests between different origins unless the server allows it

## ✅ Solution 1: Frontend Proxy (IMPLEMENTED)

I've configured your Vite development server to proxy API requests to your backend. This means:

- All requests to `/api/*` from your frontend will be forwarded to `http://10.10.2.133:8080`
- The browser sees requests as coming from the same origin (no CORS issues)
- Your frontend code now uses relative URLs in development

### Changes Made:

1. **Updated `vite.config.ts`** - Added proxy configuration
2. **Updated Login/SignUp pages** - Now use relative URLs in development
3. **Updated auth utilities** - Same relative URL logic

### How It Works:

- **Development**: Frontend makes request to `/api/auth/login` → Vite proxy forwards to `http://10.10.2.133:8080/api/auth/login`
- **Production**: Uses absolute URLs from environment variables

## ✅ Solution 2: Backend CORS Configuration (RECOMMENDED)

For a permanent fix, configure CORS in your ASP.NET Core backend by adding this to your `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins(
                "http://localhost:8080",
                "http://localhost:8081",
                "http://localhost:8082",
                "http://10.10.5.225:8082"  // Your network IP
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();

var app = builder.Build();

// IMPORTANT: Use CORS before routing and authorization
app.UseCors("AllowFrontend");

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

## 🚀 Test Your Login Now

1. Your frontend is running on: `http://localhost:8082`
2. Try logging in - the proxy should handle the CORS issue
3. Check the Network tab in browser DevTools to see the requests

## ⚠️ Important Notes

1. **Proxy is for Development Only** - In production, you'll need proper CORS configuration
2. **Backend Solution is Better** - Implement CORS in your backend for a permanent fix
3. **Update Environment Variables** - Make sure your production environment variables point to the correct backend URL

## 🔧 Troubleshooting

If you still get CORS errors:

1. **Check Backend is Running** - Ensure `http://10.10.2.133:8080` is accessible
2. **Check Network Tab** - See if requests are going to `/api/auth/login` (should be proxied)
3. **Clear Browser Cache** - Sometimes helps with CORS issues
4. **Check Console** - Look for any other errors

## 📋 Next Steps

1. **Test Login/SignUp** - Should work now with the proxy
2. **Implement Backend CORS** - For production deployment
3. **Update Environment Variables** - For different environments (dev/staging/prod)

The proxy solution should resolve your immediate CORS issue. Let me know if you need help with the backend CORS configuration!
