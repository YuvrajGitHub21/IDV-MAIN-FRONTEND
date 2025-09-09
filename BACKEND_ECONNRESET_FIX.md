# Backend Configuration to Fix ECONNRESET Error

The `ECONNRESET` error indicates your ASP.NET Core backend is rejecting or dropping connections. Here's how to fix it:

## 1. Enable CORS in Your Backend

### For .NET 6+ (Program.cs)

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using IDV_Backend.Data;
using IDV_Backend.Services.Auth;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();

// Configure CORS - IMPORTANT: Add this before other services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:8080",
                "http://localhost:8081", 
                "http://localhost:3000",
                "http://10.10.5.225:8080",
                "http://10.10.5.225:8081"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
    
    // For development - allows all origins (use only in development!)
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true) // Allow any origin
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Authentication & JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key is missing");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// Register your services
builder.Services.AddScoped<IAuthService, AuthService>();

// Add Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
    
    // Use permissive CORS in development
    app.UseCors("AllowAll");
}
else
{
    // Use restrictive CORS in production
    app.UseCors("AllowFrontend");
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// IMPORTANT: Order matters! CORS must come before Authentication/Authorization
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Add health check endpoint
app.MapGet("/health", () => "Healthy");

app.Run();
```

## 2. Update Your appsettings.json

Make sure your `appsettings.json` has proper configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=IDVDatabase;Trusted_Connection=true;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForSecurity123!",
    "Issuer": "IDV-Backend",
    "Audience": "IDV-Frontend",
    "AccessTokenMinutes": "60",
    "RefreshTokenDays": "14"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

## 3. Update Your AuthController (Add Error Handling)

```csharp
using IDV_Backend.Contracts.Auth;
using IDV_Backend.Services.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IDV_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService auth, ILogger<AuthController> logger)
    {
        _auth = auth ?? throw new ArgumentNullException(nameof(auth));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>Register a new user.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Registration attempt for email: {Email}", request.Email);
            var res = await _auth.RegisterAsync(request, ct);
            _logger.LogInformation("Registration successful for email: {Email}", request.Email);
            return Ok(res);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email already exists"))
        {
            _logger.LogWarning("Registration failed - email exists: {Email}", request.Email);
            return Conflict(new ProblemDetails 
            { 
                Title = "Email already exists", 
                Detail = ex.Message,
                Status = 409
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed for email: {Email}", request.Email);
            return BadRequest(new ProblemDetails 
            { 
                Title = "Registration failed", 
                Detail = ex.Message,
                Status = 400
            });
        }
    }

    /// <summary>Login and receive access/refresh tokens.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);
            var res = await _auth.LoginAsync(request, ct);
            _logger.LogInformation("Login successful for email: {Email}", request.Email);
            return Ok(res);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed for email: {Email} - {Error}", request.Email, ex.Message);
            return Unauthorized(new ProblemDetails 
            { 
                Title = "Invalid credentials", 
                Detail = "Email or password is incorrect",
                Status = 401
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed for email: {Email}", request.Email);
            return BadRequest(new ProblemDetails 
            { 
                Title = "Login failed", 
                Detail = ex.Message,
                Status = 400
            });
        }
    }

    /// <summary>Refresh access token using a valid refresh token.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest request, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Token refresh attempt");
            var res = await _auth.RefreshAsync(request, ct);
            _logger.LogInformation("Token refresh successful");
            return Ok(res);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Token refresh failed: {Error}", ex.Message);
            return Unauthorized(new ProblemDetails 
            { 
                Title = "Invalid refresh token", 
                Detail = ex.Message,
                Status = 401
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed");
            return BadRequest(new ProblemDetails 
            { 
                Title = "Token refresh failed", 
                Detail = ex.Message,
                Status = 400
            });
        }
    }

    /// <summary>Logout by revoking a refresh token.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest request, CancellationToken ct)
    {
        try
        {
            _logger.LogInformation("Logout attempt");
            var ok = await _auth.LogoutAsync(request.RefreshToken, ct);
            if (ok)
            {
                _logger.LogInformation("Logout successful");
                return Ok(new { message = "Logged out successfully" });
            }
            return NotFound(new { message = "Token not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Logout failed");
            return BadRequest(new ProblemDetails 
            { 
                Title = "Logout failed", 
                Detail = ex.Message,
                Status = 400
            });
        }
    }
}
```

## 4. Add Global Exception Handler (Optional but Recommended)

Create a middleware to handle exceptions globally:

```csharp
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var problemDetails = exception switch
        {
            UnauthorizedAccessException => new ProblemDetails
            {
                Status = 401,
                Title = "Unauthorized",
                Detail = exception.Message
            },
            InvalidOperationException => new ProblemDetails
            {
                Status = 400,
                Title = "Bad Request",
                Detail = exception.Message
            },
            _ => new ProblemDetails
            {
                Status = 500,
                Title = "Internal Server Error",
                Detail = "An error occurred while processing your request"
            }
        };

        context.Response.StatusCode = problemDetails.Status ?? 500;
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails));
    }
}

// Add to Program.cs
app.UseMiddleware<GlobalExceptionMiddleware>();
```

## 5. Check Your Database Connection

Make sure your database is accessible:

```csharp
// Add to Program.cs to test DB connection on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        await context.Database.CanConnectAsync();
        app.Logger.LogInformation("Database connection successful");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database connection failed");
    }
}
```

## 6. Run Your Backend with Proper Logging

Start your backend and watch the console for errors:

```bash
dotnet run --urls="http://0.0.0.0:8080"
```

## Key Points to Fix ECONNRESET:

1. **CORS Configuration** - Most important for cross-origin requests
2. **Proper Error Handling** - Prevents unhandled exceptions that close connections
3. **Database Connectivity** - Ensure DB is accessible
4. **JWT Configuration** - Must be properly configured
5. **Logging** - To see what's failing

After implementing these changes, restart your backend and try the frontend again. The detailed logging will show you exactly what's happening.
