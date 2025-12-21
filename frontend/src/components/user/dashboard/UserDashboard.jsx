// src/components/user/dashboard/UserDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, PageTitle } from "../../common";
import DashboardCard from "../../common/DashboardCard";
import { Book, Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

import { getUserDashboardStats } from "../../../api/userApi";

export default function UserDashboard() {
  const [stats, setStats] = useState({
    borrowed: 0,
    returned: 0,
    overdue: 0,
  });

  const [lastTransactions, setLastTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserDashboardStats();

      setStats({
        borrowed: data.active_count || 0,
        returned: data.returned_count || 0,
        overdue: data.overdue_count || 0,
      });

      setLastTransactions(data.last_transactions || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e9f7ef] to-[#d3f5e4] px-4 py-6">
      <div className="max-w-5xl mx-auto">

        {/* Page Title */}
        <PageTitle
          title="Welcome to Your Library"
          subtitle="Your borrowing activity at a glance"
          icon={Book}
        />

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <DashboardCard
            title="Borrowed"
            value={stats.borrowed}
            color="blue"
            icon={<Book />}
            description="Books currently borrowed"
            onClick={() => navigate("/user/transactions")}
          />

          <DashboardCard
            title="Overdue"
            value={stats.overdue}
            color="yellow"
            icon={<Clock />}
            description="Books past due date"
          />

          <DashboardCard
            title="Returned"
            value={stats.returned}
            color="green"
            icon={<CheckCircle />}
            description="Completed returns"
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>📘</span> Recent Activity
          </h2>

          {!lastTransactions.length ? (
            <p className="text-gray-500 text-sm">No recent activity.</p>
          ) : (
            <div className="divide-y">
              {lastTransactions.map((t) => (
                <div
                  key={t.id}
                  className="py-3 flex justify-between items-center hover:bg-gray-50 transition rounded-md px-1"
                >
                  {/* Book & Type */}
                  <div>
                    <div className="font-medium text-gray-900 text-[15px]">
                      {t.book_title}
                    </div>
                    <div className="text-gray-500 text-xs font-medium tracking-wide uppercase">
                      {t.txn_type}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-gray-600 text-xs">
                    {t.action_date ? new Date(t.action_date).toLocaleDateString() : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
