import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isSignup) {
        console.log("🔹 Signup payload:", data);
        const res = await api.post("auth/register/", data);
        console.log("✅ Signup response:", res.data);

        // backend sends tokens inside "tokens"
        const { tokens, user } = res.data;
        if (tokens && user) {
          localStorage.setItem("access", tokens.access);
          localStorage.setItem("refresh", tokens.refresh);
          localStorage.setItem("user", JSON.stringify(user));
          toast.success("Account created successfully! Logging you in...");
          reset();
          navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
        } else {
          toast.success("Account created successfully! Please log in.");
          setIsSignup(false);
        }
      } else {
        // 🔹 Login flow
        const res = await login(data);
        toast.success("Login successful!");
        if (res?.user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("❌ Auth error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.detail ||
          (isSignup
            ? "Signup failed. Try again."
            : "Login failed. Check credentials.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {isSignup ? "Create Your ILAS Account" : "Welcome Back to ILAS"}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              {...register("username", { required: "Username is required" })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email / Phone / USN / Role for signup */}
          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (optional)
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  placeholder="Enter phone number"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  USN (optional)
                </label>
                <input
                  type="text"
                  {...register("usn")}
                  placeholder="USN (if student)"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  {...register("role", { required: true })}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User / Student</option>
                  <option value="admin">Admin / Librarian</option>
                </select>
              </div>
            </>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Minimum 6 characters" },
              })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          {/* ✅ Confirm Password (Only in Signup) */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                {...register("confirm_password", {
                  required: "Confirm your password",
                  validate: (value, formValues) =>
                    value === formValues.password || "Passwords do not match",
                })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading
              ? isSignup
                ? "Creating account..."
                : "Logging in..."
              : isSignup
              ? "Sign Up"
              : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          {isSignup ? "Already have an account?" : "New user?"}{" "}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-600 font-medium hover:underline"
          >
            {isSignup ? "Login" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
