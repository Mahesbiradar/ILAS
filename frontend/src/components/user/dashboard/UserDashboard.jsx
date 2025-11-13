// src/components/user/dashboard/UserDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Card, PageTitle, SectionHeader } from "../../common";
import DashboardCard from "../../common/DashboardCard";
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
      // TODO: Update with actual API call when ready
      // const data = await getBorrowHistory();
      setStats({ borrowed: 0, returned: 0, pending: 0 });
    } catch (err) {
      console.error("Error loading user dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

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
