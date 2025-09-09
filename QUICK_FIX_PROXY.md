# Quick Fix for ECONNRESET - Bypass Proxy

Since your backend is working properly (CORS is configured and responds correctly), the issue is with the Vite proxy. Here's a quick fix:

## Option 1: Disable Proxy and Use Direct Connection

Update your environment variables to use direct connection:

### Create/Update `.env.local` file:

```env
VITE_API_BASE=http://10.10.2.133:8080
```

### Update your Login and SignUp to use environment variable:

The code will automatically use the direct URL in this case.

## Option 2: Fix Vite Proxy Configuration

Your current proxy might have issues. Let's use a more robust configuration:

### Update `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    proxy: {
      '/api': {
        target: 'http://10.10.2.133:8080',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err.message);
          });
        },
      }
    }
  },
  // ... rest of config
}));
```

## Option 3: Temporary Direct Connection (Recommended for Testing)

Let's temporarily force direct connection in your Login page:

```typescript
// In Login.tsx, replace the getApiUrl function:
const getApiUrl = () => {
  // Force direct connection for now
  return "http://10.10.2.133:8080";
};
```

## Current Status:

✅ **Backend is working** - CORS configured, responds to requests
✅ **Network connectivity** - Can reach backend from your machine  
❌ **Vite proxy** - Having connection reset issues

## Recommended Next Steps:

1. **Use Option 3** - Force direct connection for immediate testing
2. **Test login/signup** - Should work with direct connection
3. **Fix proxy later** - Once you confirm everything works

Your backend doesn't need any changes - it's already properly configured with CORS!
