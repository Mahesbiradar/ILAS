import { Outlet, Link } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-5 hidden md:block">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">ILAS</h1>
        <nav className="space-y-4">
          <Link className="block hover:text-blue-600" to="/">Dashboard</Link>
          <Link className="block hover:text-blue-600" to="/books">Books</Link>
          <Link className="block hover:text-blue-600" to="/members">Members</Link>
          <Link className="block hover:text-blue-600" to="/transactions">Transactions</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Innovative Library Automation System</h2>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Logout</button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
