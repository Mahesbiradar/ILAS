// src/pages/admin/Transactions.jsx
import AdminTransactionList from "../../components/admin/transactions/AdminTransactionList";

export default function AdminTransactionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
        📊 All Transactions
      </h1>
      <AdminTransactionList />
    </div>
  );
}
