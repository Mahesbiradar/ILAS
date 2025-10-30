// src/components/dashboard/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks} from "../../api/libraryApi";
import Loader from "../common/Loader";
import DashboardCard from "./DashboardCard";
import AdminBookActivity from "../transactions/AdminBookActivity";
import { BookOpen, Users, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    borrowedBooks: 0,
    availableBooks: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const books = await getBooks();
      const logs = await getAllBorrowLogs();

      const total = books.length;
      const borrowed = logs.filter((l) => l.status === "approved").length;
      const available = total - borrowed;

      setStats({
        totalBooks: total,
        borrowedBooks: borrowed,
        availableBooks: available,
      });
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-6xl mx-auto px-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
        🏛️ Library Admin Dashboard
      </h1>

      {/* --- Dashboard Stats --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="Total Books"
          value={stats.totalBooks}
          color="blue"
          icon={<BookOpen />}
          description="All books in catalog"
          onClick={() => navigate("/libraryops")}
        />
        <DashboardCard
          title="Borrowed Books"
          value={stats.borrowedBooks}
          color="green"
          icon={<Users />}
          description="Currently issued to users"
          onClick={() => navigate("/admintransactions")}
        />
        <DashboardCard
          title="Available Books"
          value={stats.availableBooks}
          color="purple"
          icon={<ClipboardList />}
          description="Books ready for borrowing"
          onClick={() => navigate("/libraryreports")}
        />
      </div>

      {/* --- Recent Activity --- */}
      <AdminBookActivity />
    </div>
  );
}
