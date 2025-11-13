// src/components/user/dashboard/UserDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Card, PageTitle, SectionHeader } from "../../common";
import DashboardCard from "../../common/DashboardCard";
import UserTransactionList from "../transactions/UserTransactionList";
import { Book, Clock, CheckCircle } from "lucide-react";
import { getActiveTransactions } from "../../../services/transactionApi";
import toast from "react-hot-toast";

export default function UserDashboard() {
  const [stats, setStats] = useState({
    borrowed: 0,
    returned: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUserStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch counts for each status using limit=1 to minimize payload
      const [borrowedRes, returnedRes, pendingRes] = await Promise.all([
        getActiveTransactions({ page: 1, page_size: 1, status: "approved" }),
        getActiveTransactions({ page: 1, page_size: 1, status: "returned" }),
        getActiveTransactions({ page: 1, page_size: 1, status: "pending" }),
      ]);

      setStats({
        borrowed: borrowedRes.count || 0,
        returned: returnedRes.count || 0,
        pending: pendingRes.count || 0,
      });
    } catch (err) {
      console.error("Error loading user dashboard stats:", err);
      toast.error("Failed to load dashboard statistics.");
      setStats({ borrowed: 0, returned: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <PageTitle 
          title="Welcome to Your Library" 
          subtitle="Manage your borrowed books and requests"
          icon={Book}
        />

      {/* --- Dashboard Stats --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="Borrowed"
          value={stats.borrowed}
          color="blue"
          icon={<Book />}
          description="Currently borrowed books"
          onClick={() => navigate("/user/transactions")}
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
      <UserTransactionList />
      </div>
    </div>
  );
}
