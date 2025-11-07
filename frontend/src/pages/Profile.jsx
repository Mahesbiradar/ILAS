// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthProvider";
import api from "../api/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, Building, Briefcase, IdCard, Lock, Edit3 } from "lucide-react";

export default function Profile() {
  const { user, fetchUser } = useAuth();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({ old_password: "", new_password: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        department: user.department || "",
        phone: user.phone || "",
        unique_id: user.unique_id || "",
        year: user.year || "",
        designation: user.designation || "",
        role: user.role || "user",
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("auth/me/", formData);
      toast.success("Profile updated successfully!");
      fetchUser();
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // 🖼️ Image Upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = async () => {
    if (!profileImage) return toast.error("Please select an image first!");
    const fd = new FormData();
    fd.append("profile_image", profileImage);
    try {
      await api.post("auth/me/upload/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile picture updated!");
      fetchUser();
    } catch {
      toast.error("Failed to upload image.");
    }
  };

  // 🔒 Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("auth/me/change-password/", passwordData);
      toast.success(res.data.message || "Password updated successfully!");
      setPasswordData({ old_password: "", new_password: "" });
      setShowPasswordSection(false);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        Object.values(err.response?.data || {})[0] ||
        "Password update failed.";
      toast.error(msg);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-blue-700 mb-6">Profile Settings</h2>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 mb-8"
      >
        {/* Top Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
          <div className="flex flex-col items-center">
            <div
              className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center text-4xl font-bold text-blue-700 shadow-inner cursor-pointer"
              onClick={() => fileInputRef.current.click()}
              title="Click to change profile picture"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.username?.charAt(0)?.toUpperCase()
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={handleImageUpload}
              className="mt-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:opacity-90 transition-all"
            >
              Upload
            </button>
          </div>

          {/* Account Info */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold text-gray-800">{user.username}</h3>
            <p className="text-sm text-gray-500 capitalize mb-2">{user.role}</p>
            <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-xs font-medium shadow-sm border border-blue-100">
              Joined: {new Date(user.date_joined).toLocaleDateString("en-IN")}
            </div>
          </div>
        </div>

        {/* Edit Toggle Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="flex items-center gap-2 text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all"
          >
            <Edit3 size={16} />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {/* Editable Fields */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InputField
            icon={User}
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            icon={Mail}
            name="email"
            label="Email"
            value={formData.email}
            disabled
          />
          <InputField
            icon={Building}
            name="department"
            label="Department"
            value={formData.department}
            onChange={handleChange}
            disabled={!isEditing}
          />
          <InputField
            icon={Phone}
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
          />

          {user.role === "student" && (
            <>
              <InputField
                icon={IdCard}
                name="unique_id"
                label="USN"
                value={formData.unique_id}
                disabled
              />
              <InputField
                name="year"
                label="Year"
                value={formData.year}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </>
          )}

          {user.role === "teacher" && (
            <>
              <InputField
                icon={IdCard}
                name="unique_id"
                label="Employee ID"
                value={formData.unique_id}
                disabled
              />
              <InputField
                icon={Briefcase}
                name="designation"
                label="Designation"
                value={formData.designation}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </>
          )}
        </form>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-6 py-2.5 rounded-xl shadow hover:opacity-95 transition-all font-medium disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Change Password Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-8"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Lock size={18} /> Change Password
          </h3>
          <button
            onClick={() => setShowPasswordSection((p) => !p)}
            className="text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all"
          >
            {showPasswordSection ? "Close" : "Change"}
          </button>
        </div>

        <AnimatePresence>
          {showPasswordSection && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <form
                onSubmit={handlePasswordChange}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              >
                <InputField
                  name="old_password"
                  label="Current Password"
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      old_password: e.target.value,
                    }))
                  }
                />
                <InputField
                  name="new_password"
                  label="New Password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData((p) => ({
                      ...p,
                      new_password: e.target.value,
                    }))
                  }
                />
              </form>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  onClick={handlePasswordChange}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:opacity-95 transition-all font-medium"
                >
                  Update Password
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* 🎨 Input Component */
const InputField = ({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}) => (
  <div>
    {label && <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3 text-gray-400" size={18} />}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full ${Icon ? "pl-10" : "pl-3"} pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition-all ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
        }`}
      />
    </div>
  </div>
);
