// src/pages/Login.jsx
import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, User, Phone, BookOpen, Briefcase, IdCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/axios";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [otpStage, setOtpStage] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, control, reset } = useForm({ defaultValues: { role: "student" } });
  const watchRole = useWatch({ control, name: "role" });

  // 🔹 Handle Login / Signup
  const onSubmit = async (data) => {
    try {
      if (isSignup) {
        const payload = {
          first_name: data.first_name,
          username: data.username,
          email: data.email,
          password: data.password,
          confirm_password: data.password,
          role: data.role,
          phone: data.phone || "",
          unique_id: data.unique_id,
          department: data.department || "",
          year: data.role === "student" ? data.year || "" : null,
          designation: data.role === "teacher" ? data.designation || "" : null,
        };
        await signup(payload);
        toast.success("Signup successful — please login.");
        setIsSignup(false);
        reset();
      } else {
        const res = await login(data);
        toast.success("Welcome back!");
        navigate("/home");
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0];
      toast.error(detail || "Something went wrong!");
    }
  };

  // 🔹 Forgot Password via OTP
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if (!email) return toast.error("Enter your email");

    try {
      await api.post("auth/password/send-otp/", { email });
      toast.success("OTP sent to your email!");
      setOtpStage(true);
    } catch {
      toast.error("Failed to send OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const otp = e.target.otp.value;
    const new_password = e.target.new_password.value;

    try {
      await api.post("auth/password/reset/", { email, otp, new_password });
      toast.success("Password reset successful!");
      setShowForgot(false);
      setOtpStage(false);
    } catch {
      toast.error("Invalid or expired OTP");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gray-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('https://res.cloudinary.com/dlailcpfy/image/upload/v1767533065/ilas_bg_mjhuol.jpg')" }}
    >
      {/* Dark overlay for better card contrast */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

      {/* Form container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl p-6 w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-5 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-400 rounded-xl flex items-center justify-center shadow-lg mb-2">
            <BookOpen className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ILAS</h1>
          <p className="text-xs text-gray-500">Innovative Library Automation System</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-5 shadow-inner">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${!isSignup
              ? "bg-white shadow text-blue-700"
              : "text-gray-500 hover:text-blue-700"
              }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${isSignup
              ? "bg-white shadow text-blue-700"
              : "text-gray-500 hover:text-blue-700"
              }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form
            key={isSignup ? "signup" : "login"}
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, x: isSignup ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignup ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                {...register("username", { required: true })}
                placeholder="Username"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
              />
            </div>
            {isSignup && (
              <>
                {/* First Name */}
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    {...register("first_name", { required: true })}
                    placeholder="First Name"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
                  />
                </div>
                {/* Role */}
                <div>
                  <select
                    {...register("role", { required: true })}
                    className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    {...register("email", { required: true })}
                    type="email"
                    placeholder="Email address"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Department */}
                <input
                  {...register("department")}
                  placeholder="Department"
                  className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
                />

                {/* Conditional fields */}
                {watchRole === "student" && (
                  <>
                    <input
                      {...register("unique_id", { required: true })}
                      placeholder="USN (e.g., 1AT22ET001)"
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
                    />
                    <input
                      {...register("year")}
                      placeholder="Year (e.g., 3rd Year)"
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
                    />
                  </>
                )}
                {watchRole === "teacher" && (
                  <>
                    <input
                      {...register("unique_id", { required: true })}
                      placeholder="Employee ID"
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
                    />
                    <input
                      {...register("designation")}
                      placeholder="Designation (e.g.,Professor)"
                      className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
                    />
                  </>
                )}

                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    {...register("phone")}
                    placeholder="Phone (optional)"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                {...register("password", { required: true, minLength: 6 })}
                type="password"
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
              />
            </div>

            {!isSignup && (
              <div className="text-right text-xs">
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-400 text-white py-2.5 rounded-lg text-sm font-semibold shadow-md hover:opacity-95 transition-all"
            >
              {isSignup ? "Create Account" : "Login"}
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-3xl">
            <div className="bg-white shadow-xl p-6 rounded-2xl w-80">
              {!otpStage ? (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3 text-center">Reset Password</h2>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:opacity-95 transition-all">
                    Send OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl mt-2 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <h2 className="text-lg font-semibold text-gray-700 mb-3 text-center">Enter OTP</h2>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <input
                    name="otp"
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <input
                    name="new_password"
                    type="password"
                    required
                    placeholder="Enter new password"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                  <button className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:opacity-95 transition-all">
                    Reset Password
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
