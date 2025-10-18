import React from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthProvider";

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();

  const onSubmit = (data) => login(data);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Login to ILAS</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("email")} type="email" placeholder="Email" className="border p-2 w-full rounded" required />
          <input {...register("password")} type="password" placeholder="Password" className="border p-2 w-full rounded" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Login</button>
        </form>
      </div>
    </div>
  );
}
