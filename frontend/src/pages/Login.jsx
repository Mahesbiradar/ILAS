// src/pages/Login.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      if (isSignup) {
        // send signup
        await signup(data);
        setIsSignup(false);
        reset();
        toast.success("Signup successful — either logged in or please login");
      } else {
        const res = await login(data);
        toast.success("Logged in");
        // redirect based on role
        const role = res?.user?.role || (JSON.parse(localStorage.getItem("user"))?.role);
        if (role === "admin") navigate("/admin/dashboard");
        else navigate("/dashboard");
      }
    } catch (err) {
      console.error("Auth error", err.response?.data || err.message);
      toast.error(err.response?.data?.detail || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-6">
          {isSignup ? "Create ILAS Account" : "Welcome back"}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input {...register("username", { required: true })} className="w-full p-2 border rounded" />
            {errors.username && <p className="text-red-500 text-sm">Username required</p>}
          </div>

          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register("email", { required: true })} type="email" className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input {...register("phone")} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">USN (optional)</label>
                <input {...register("usn")} className="w-full p-2 border rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select {...register("role", { required: true })} className="w-full p-2 border rounded">
                  <option value="user">User / Student</option>
                  <option value="admin">Admin / Librarian</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input {...register("password", { required: true, minLength: 6 })} type="password" className="w-full p-2 border rounded" />
            {errors.password && <p className="text-red-500 text-sm">Password must be 6+ chars</p>}
          </div>

          <button className="w-full bg-blue-600 text-white p-2 rounded" type="submit">
            {isSignup ? "Sign up" : "Login"}
          </button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          {isSignup ? "Already have an account?" : "New user?"}{" "}
          <button onClick={() => setIsSignup(!isSignup)} className="text-blue-600 font-medium">
            {isSignup ? "Login" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
