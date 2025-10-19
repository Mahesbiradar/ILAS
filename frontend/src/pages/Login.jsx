import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, User, Phone, IdCard, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  // 🔹 Handle Login / Signup
  const onSubmit = async (data) => {
    try {
      if (isSignup) {
        const payload = {
          ...data,
          role: "user", // Default role assignment
          confirm_password: data.password,
        };
        await signup(payload);
        toast.success("Signup successful — please login.");
        setIsSignup(false);
        reset();
      } else {
        const res = await login(data);
        toast.success("Login successful!");
        const role =
          res?.user?.role ||
          JSON.parse(localStorage.getItem("user"))?.role ||
          "user";

        // Role-based redirection
        if (role === "admin" || role === "librarian") {
          navigate("/home");
        } else {
          navigate("/home");
        }
      }
    } catch (err) {
      console.error("Auth error", err.response?.data || err.message);
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0];
      toast.error(detail || "Authentication failed!");
    }
  };

  // 🔹 Forgot Password (Demo)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    toast("📧 Password reset link sent (demo only)", {
      icon: "📨",
    });
    setShowForgot(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 relative overflow-hidden"
      >
        {/* 🔷 Logo & Title */}
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-teal-400 flex items-center justify-center mb-3 shadow-lg"
          >
            <BookOpen className="text-white" size={30} />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800">ILAS</h1>
          <p className="text-sm text-gray-500">Library Automation System</p>
        </div>

        {/* 🟦 Tabs (Login / Signup) */}
        <div className="flex bg-blue-50 p-1 rounded-xl mb-6">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              !isSignup
                ? "bg-white shadow text-blue-700"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 rounded-lg font-medium transition-all ${
              isSignup
                ? "bg-white shadow text-blue-700"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* ✨ Form Section (Fixed Height for Stability) */}
        <div className="min-h-[380px]">
          <AnimatePresence mode="wait">
            <motion.form
              key={isSignup ? "signup" : "login"}
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, x: isSignup ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignup ? -40 : 40 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                  <User size={16} className="text-gray-400" />
                  <input
                    {...register("username", { required: true })}
                    placeholder="Enter your username"
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    Username is required
                  </p>
                )}
              </div>

              {/* Signup-only Fields */}
              {isSignup && (
                <>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                      <Mail size={16} className="text-gray-400" />
                      <input
                        {...register("email", { required: true })}
                        type="email"
                        placeholder="Enter your email"
                        className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (optional)
                    </label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                      <Phone size={16} className="text-gray-400" />
                      <input
                        {...register("phone")}
                        placeholder="Enter phone number"
                        className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* USN */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      USN (optional)
                    </label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                      <IdCard size={16} className="text-gray-400" />
                      <input
                        {...register("usn")}
                        placeholder="Enter USN"
                        className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                  <Lock size={16} className="text-gray-400" />
                  <input
                    {...register("password", { required: true, minLength: 6 })}
                    type="password"
                    placeholder="Enter your password"
                    className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              {!isSignup && (
                <div className="text-right text-sm">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-400 text-white p-3 rounded-lg font-semibold hover:opacity-95 transition-all shadow-md"
              >
                {isSignup ? "Create Account" : "Login"}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer (Login ↔ Signup Toggle) */}
        <p className="text-center mt-5 text-gray-600 text-sm">
          {isSignup ? "Already have an account?" : "New user?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 font-medium hover:underline"
          >
            {isSignup ? "Login" : "Sign up"}
          </button>
        </p>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="bg-white shadow-lg p-6 rounded-xl w-80">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Reset Password
              </h2>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:opacity-90"
                  >
                    Send Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
