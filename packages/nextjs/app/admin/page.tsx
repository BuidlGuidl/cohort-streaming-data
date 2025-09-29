"use client";

import { useState } from "react";
import { AdminCsvUpload } from "~~/components/scaffold-eth/AdminCsvUpload";

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check - in production, use proper authentication
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === "admin123") {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-2xl mb-4">🔐 Admin Access</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Admin Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}
              <button type="submit" className="btn btn-primary w-full">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Admin Dashboard</h1>
        <button onClick={() => setIsAuthenticated(false)} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>

      <AdminCsvUpload />
    </div>
  );
};

export default AdminPage;
// Trigger deployment Mon Sep 29 14:05:39 MDT 2025
// Force redeploy - Mon Sep 29 17:36:40 MDT 2025
