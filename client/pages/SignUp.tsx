import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("access")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("http://localhost:5294/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      if (response.ok) {
        navigate("/login", { replace: true });
      } else {
        let message = "Registration failed";
        try {
          const errorData = await response.json();
          message = errorData.message || message;
        } catch {}
        setErrors({ submit: message });
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Side - Illustrations and Content (desktop only) */}
      <div className="relative hidden lg:block lg:w-1/2 bg-white overflow-hidden">
        {/* Background Blur Effects */}
        <div className="absolute inset-0">
          <div
            className="absolute w-[342px] h-[342px] rounded-full opacity-80"
            style={{
              background: "#BCD2E8",
              filter: "blur(115px)",
              left: "335px",
              top: "301px",
            }}
          />
          <div
            className="absolute w-[465px] h-[397px] rounded-full opacity-80"
            style={{
              background: "#E0EFFE",
              filter: "blur(80px)",
              left: "0px",
              top: "0px",
            }}
          />
        </div>

        {/* Decorative Elements */}
        <div className="relative z-10">
          <div
            className="absolute w-[279px] h-[123px] opacity-80"
            style={{
              left: "190px",
              top: "214px",
              transform: "rotate(-12.392deg)",
            }}
          >
            <div
              className="absolute w-full h-full rounded-full"
              style={{
                background: "linear-gradient(135deg, #F8E4E8 0%, #E0EFFE 100%)",
                filter: "blur(34px)",
              }}
            />
          </div>

          {/* Main illustration cards */}
          <div className="absolute" style={{ left: "275px", top: "140px" }}>
            <div
              className="absolute w-[252px] h-[318px] rounded-3xl border border-black/10"
              style={{
                background:
                  "linear-gradient(324deg, #E0EFFE 19.3%, #F3CFFF 70.5%)",
                backdropFilter: "blur(7.5px)",
                transform: "rotate(6.554deg)",
              }}
            />

            <div
              className="absolute w-[252px] h-[318px] rounded-3xl border border-black/10 bg-white"
              style={{
                left: "1px",
                top: "10px",
                backdropFilter: "blur(7.5px)",
              }}
            >
              <div className="absolute top-6 right-6">
                <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                    <path
                      d="M1 5L5 9L13 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute inset-4 top-16">
                <div className="w-full h-[130px] rounded-2xl bg-arcon-blue/20" />

                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 67 94" fill="none">
                      <path
                        d="M33.5 80.1898V93.5464L51.6857 70.2102L33.5 80.1898Z"
                        stroke="#91ACC8"
                        strokeWidth="1.8144"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M33.5 93.5464L52.3406 83.6172L51.6857 70.2102"
                        stroke="#91ACC8"
                        strokeWidth="1.8144"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8">
                <div className="h-20 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20"></div>
                  <div className="absolute top-4 left-4">
                    <div className="w-8 h-8 rounded-full bg-white/30"></div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-2 bg-white/40 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-10 left-8 right-8 text-center z-20 lg:bottom-24 lg:left-20 lg:right-20">
          <h2 className="text-arcon-gray-heading text-2xl md:text-3xl font-bold font-roboto leading-tight mb-4 md:mb-6">
            Proof of identity, made simple.
          </h2>
          <p className="text-arcon-gray-secondary text-sm md:text-base font-roboto leading-relaxed">
            Easily verify your identity in seconds with our secure and seamless
            process.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 md:py-16 bg-white relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden hidden md:block pointer-events-none">
          <div
            className="absolute opacity-80"
            style={{
              width: "279px",
              height: "123px",
              right: "-50px",
              top: "214px",
              transform: "rotate(-12.392deg)",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #F8E4E8 50%, #E0EFFE 100%)",
                filter: "blur(20px)",
                opacity: 0.6,
              }}
            />
          </div>
        </div>

        <div className="relative z-10 max-w-[360px] md:max-w-[420px] mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <path
                  d="M27.3723 22.6039C27.9964 23.7209 27.189 25.097 25.9095 25.097H4.88702C3.6005 25.097 2.79387 23.7073 3.43201 22.5902L14.0587 3.98729C14.7055 2.85516 16.3405 2.86285 16.9765 4.00102L27.3723 22.6039Z"
                  stroke="#D83A52"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
              <span className="text-arcon-gray-primary text-2xl font-bold font-roboto">
                arcon
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-arcon-gray-heading text-2xl md:text-3xl font-bold font-roboto mb-2">
              Sign up
            </h1>
            <p className="text-arcon-gray-secondary text-sm font-roboto">
              Create your account with email and password.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5 md:space-y-6"
          >
            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                First Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                    errors.firstName
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.firstName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Last Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                    errors.lastName
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.lastName && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.lastName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                    errors.email ? "border-red-500" : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                    errors.password
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Date Of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary ${
                    errors.dateOfBirth
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.dateOfBirth}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Permanent Address
              </label>
              <div className="relative">
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your permanent address"
                  rows={3}
                  className={`w-full min-h-[72px] sm:min-h-[84px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary resize-none ${
                    errors.permanentAddress
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.permanentAddress && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.permanentAddress}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Current Address
              </label>
              <div className="relative">
                <textarea
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your current address"
                  rows={3}
                  className={`w-full min-h-[72px] sm:min-h-[84px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base placeholder-arcon-gray-secondary resize-none ${
                    errors.currentAddress
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent`}
                />
              </div>
              {errors.currentAddress && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.currentAddress}
                </p>
              )}
            </div>

            <div>
              <label className="block text-arcon-gray-primary text-sm md:text-sm font-medium mb-2 font-roboto">
                Gender
              </label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`w-full h-[48px] sm:h-[54px] px-3 sm:px-4 py-3 sm:py-4 border-t border-r border-b border-l rounded font-roboto text-sm sm:text-base ${
                    formData.gender
                      ? "text-arcon-gray-primary"
                      : "text-arcon-gray-secondary"
                  } ${
                    errors.gender
                      ? "border-red-500"
                      : "border-arcon-gray-border"
                  } focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:border-transparent bg-white`}
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 font-roboto">
                  {errors.gender}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="text-red-500 text-xs sm:text-sm text-center font-roboto">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[48px] sm:h-[52px] bg-arcon-blue text-white font-bold text-sm sm:text-base rounded font-roboto hover:bg-arcon-blue/90 focus:outline-none focus:ring-2 focus:ring-arcon-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-arcon-gray-secondary text-xs sm:text-sm font-roboto">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login", { replace: true })}
                className="text-arcon-blue hover:underline font-medium"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
