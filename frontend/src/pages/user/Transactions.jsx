// src/pages/user/Transactions.jsx
import UserTransactionList from "../../components/user/transactions/UserTransactionList";
import { PageTitle } from "../../components/common";
import { Repeat2 } from "lucide-react";

export default function UserTransactionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <PageTitle 
          title="My Transactions" 
          subtitle="View your borrowed and returned books"
          icon={Repeat2}
        />
        <UserTransactionList />
      </div>
    </div>
  );
}
