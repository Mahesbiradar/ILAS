// src/components/dashboard/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "../common/Loader";
import DashboardCard from "./DashboardCard";
import UserTransactionList from "../transactions/UserTransactionList";
import { Book, Clock, CheckCircle } from "lucide-react";

export default function UserDashboard() {
  const [stats, setStats] = useState({
    borrowed: 0,
    returned: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const data = await getBorrowHistory();
      const borrowed = data.filter((b) => b.status === "approved").length;
      const returned = data.filter((b) => b.status === "returned").length;
      const pending = data.filter((b) => b.status === "pending").length;

      setStats({ borrowed, returned, pending });
    } catch (err) {
      console.error("Error loading user dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-5xl mx-auto px-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
        👋 Welcome to Your Library Dashboard
      </h1>

      {/* --- Dashboard Stats --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="Borrowed"
          value={stats.borrowed}
          color="blue"
          icon={<Book />}
          description="Currently borrowed books"
          onClick={() => navigate("/usertransactions")}
        />
        <DashboardCard
          title="Pending Requests"
          value={stats.pending}
          color="yellow"
          icon={<Clock />}
          description="Awaiting admin approval"
        />
        <DashboardCard
          title="Returned"
          value={stats.returned}
          color="green"
          icon={<CheckCircle />}
          description="Completed returns"
        />
      </div>

      {/* --- User Activity Sections --- */}
      <UserBorrowRequests />
      <UserTransactionList />
    </div>
  );
}
