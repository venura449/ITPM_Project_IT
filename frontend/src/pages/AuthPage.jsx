import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiUser,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data } = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        login(data.user, data.token);
        navigate(data.user.role === "admin" ? "/admin" : data.user.role === "sponsor" ? "/sponsor" : "/dashboard");
      } else {
        const { data } = await api.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        login(data.user, data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      rememberMe: false,
    });
  };

  return (
    <div className="h-screen bg-white flex overflow-hidden">
      {/* ── Left Panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative overflow-hidden p-12 rounded-r-3xl">
        {/* Decorative circles */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute top-1/2 -right-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 left-10 w-48 h-48 bg-white/10 rounded-full" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            <svg
              className="w-5 h-5 text-green-800"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            SLIIT Events
          </span>
        </div>

        {/* Headline */}
        <div className="relative flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Your campus,
            <br />
            your events.
          </h1>
          <p className="text-green-100 text-base mb-12 leading-relaxed">
            One platform to manage merchandise, events, sponsors, and student
            leadership — all in one place.
          </p>

          {/* Features */}
          <div className="space-y-5">
            {[
              {
                icon: "📦",
                title: "Merchandise Management",
                desc: "Digital tokens & collection scheduling",
              },
              {
                icon: "📅",
                title: "Event Management",
                desc: "Create, approve & vote on campus events",
              },
              {
                icon: "👥",
                title: "Student Management",
                desc: "Smart merit-based OC recommendations",
              },
              {
                icon: "🤝",
                title: "Sponsor Management",
                desc: "Automated sponsor matching & outreach",
              },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 text-xl">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none mb-0.5">
                    {f.title}
                  </p>
                  <p className="text-green-100 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="relative text-green-200 text-xs mt-10">
          © 2026 SLIIT Events Platform
        </p>
      </div>

      {/* ── Right Panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md min-h-[560px] flex flex-col">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-green-900 font-bold text-lg">
              SLIIT Events
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">
              {isLogin ? "Sign in" : "Create account"}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin
                ? "Welcome back! Please enter your details."
                : "Get started — it only takes a minute."}
            </p>
          </div>

          {/* Toggle pill */}
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 mb-8 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isLogin
                  ? "bg-green-800 text-white shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                !isLogin
                  ? "bg-green-800 text-white shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${isLogin ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
            >
              <div className="overflow-hidden">
                <div className="pb-0.5">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Saman Kumara"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition"
                      required={!isLogin}
                      autoComplete="name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@sliit.lk"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-11 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700 transition"
                >
                  {showPassword ? (
                    <FiEyeOff className="text-base" />
                  ) : (
                    <FiEye className="text-base" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${isLogin ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
            >
              <div className="overflow-hidden">
                <div className="pb-0.5">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100 transition"
                      required={!isLogin}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isLogin
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex items-center justify-between pt-1 pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-green-800 rounded"
                    />
                    <span className="text-sm text-gray-500">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-semibold text-green-800 hover:text-green-900 transition"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-800 hover:bg-green-900 active:scale-[0.98] text-white py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? isLogin
                  ? "Signing in…"
                  : "Creating account…"
                : isLogin
                  ? "Sign In →"
                  : "Create Account →"}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-center text-gray-400 mt-7">
            By signing in you agree to our{" "}
            <button className="text-green-800 hover:underline font-medium">
              Terms
            </button>{" "}
            &{" "}
            <button className="text-green-800 hover:underline font-medium">
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
