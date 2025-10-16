import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  const API_BOOKS = "http://127.0.0.1:8000/api/books/";

  const [books, setBooks] = useState([]);
  const [membersCount, setMembersCount] = useState(18); // static placeholder
  const [transactionsCount, setTransactionsCount] = useState(42); // static placeholder

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await axios.get(API_BOOKS);
      setBooks(res.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  const totalBooks = books.length;
  const categories = {};

  books.forEach((b) => {
    categories[b.category] = (categories[b.category] || 0) + b.quantity;
  });

  const categoryData = Object.keys(categories).map((key) => ({
    category: key,
    count: categories[key],
  }));

  const COLORS = ["#4F46E5", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

  return (
    <div className="p-6 w-full min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
        📊 ILAS Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Total Books</h2>
          <p className="text-3xl font-bold mt-2">{totalBooks}</p>
        </div>

        <div className="bg-green-500 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Total Members</h2>
          <p className="text-3xl font-bold mt-2">{membersCount}</p>
        </div>

        <div className="bg-yellow-500 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <p className="text-3xl font-bold mt-2">{transactionsCount}</p>
        </div>

        <div className="bg-purple-500 text-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold">Categories</h2>
          <p className="text-3xl font-bold mt-2">
            {Object.keys(categories).length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4 border">
          <h2 className="text-lg font-semibold mb-4">Books by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center">No category data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border">
          <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="category"
                  outerRadius={100}
                  label
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center">No data yet</p>
          )}
        </div>
      </div>

      {/* Recent Books */}
      <div className="bg-white rounded-lg shadow-md p-4 border">
        <h2 className="text-lg font-semibold mb-4">📘 Recently Added Books</h2>
        {books.length > 0 ? (
          <ul className="divide-y">
            {books.slice(-5).reverse().map((book) => (
              <li
                key={book.book_id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <strong>{book.title}</strong> — {book.author}
                </div>
                <span className="text-sm text-gray-500">
                  {book.category} | Qty: {book.quantity}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No recent books found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
