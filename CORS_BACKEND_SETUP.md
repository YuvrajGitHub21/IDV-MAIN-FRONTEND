# Backend CORS Configuration

Add this to your ASP.NET Core backend to fix the CORS issue:

## In Program.cs (for .NET 6+)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins(
                "http://localhost:8080",
                "http://localhost:8081", 
                "http://localhost:3000",  // Common React dev server ports
                "http://localhost:5173",  // Vite default port
                "http://10.10.5.225:8081" // Your network IP
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Use CORS (IMPORTANT: This must be before UseRouting and UseAuthorization)
app.UseCors("AllowFrontend");

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

## Alternative: Allow All Origins (Development Only)

⚠️ **Only use this in development, never in production!**

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Then use it:
app.UseCors("AllowAll");
```

## Important Notes

1. **Order Matters**: `app.UseCors()` must be called before `app.UseRouting()` and `app.UseAuthorization()`
2. **Include All Frontend URLs**: Add all possible frontend URLs (localhost:8080, localhost:8081, your network IP, etc.)
3. **AllowCredentials**: This is needed if you're sending cookies or authorization headers
4. **Production**: In production, only allow your actual frontend domain

## For ASP.NET Core 5 and earlier (Startup.cs)

```csharp
// In ConfigureServices method
public void ConfigureServices(IServiceCollection services)
{
    services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", builder =>
        {
            builder
                .WithOrigins("http://localhost:8080", "http://localhost:8081")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });
    
    services.AddControllers();
}

// In Configure method
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }

    app.UseCors("AllowFrontend"); // Must be before UseRouting
    
    app.UseRouting();
    app.UseAuthentication();
    app.UseAuthorization();
    
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```
