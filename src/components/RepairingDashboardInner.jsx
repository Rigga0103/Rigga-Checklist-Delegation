"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wrench,
  IndianRupee,
  CheckCircle2,
  Clock,
  Search,
  X,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const SHEET_ID = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
const FORM_SHEET = "Maitenence_Form";

const COLORS = ["#22c55e", "#facc15", "#ef4444", "#3b82f6", "#8b5cf6"];

const RepairingDashboardInner = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repairData, setRepairData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Stats
  const [stats, setStats] = useState({
    totalRepairs: 0,
    totalCost: 0,
    completedRepairs: 0,
    pendingRepairs: 0,
  });

  // Chart data
  const [machineChartData, setMachineChartData] = useState([]);
  const [statusChartData, setStatusChartData] = useState([]);

  // Fetch data from Google Sheets
  const fetchRepairData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${FORM_SHEET}`
      );
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));

      const rows = json.table.rows;
      const repairRows = [];
      const machineCount = {};

      let totalCost = 0;
      let completedCount = 0;
      let pendingCount = 0;

      rows?.forEach((row, rowIndex) => {
        if (!row.c) return;

        const rowValues = row.c.map((cell) =>
          cell && cell.v !== undefined ? cell.v : ""
        );

        const machineName = rowValues[2] || "Unknown";
        const status = rowValues[7] || "Pending";
        const billAmount = parseFloat(rowValues[8]) || 0;

        // Count by machine
        machineCount[machineName] = (machineCount[machineName] || 0) + 1;

        // Calculate stats
        totalCost += billAmount;
        const statusLower = status.toLowerCase();
        if (
          statusLower.includes("completed") ||
          statusLower.includes("done") ||
          statusLower.includes("पूर्ण")
        ) {
          completedCount++;
        } else if (!statusLower.includes("cancel")) {
          pendingCount++;
        }

        repairRows.push({
          _id: `row_${rowIndex}`,
          timestamp: rowValues[0] || "",
          formFilledBy: rowValues[1] || "",
          machineName: machineName,
          workDone: rowValues[4] || "",
          status: status,
          billAmount: billAmount,
          vendorName: rowValues[10] || "",
        });
      });

      // Set stats
      setStats({
        totalRepairs: repairRows.length,
        totalCost: totalCost,
        completedRepairs: completedCount,
        pendingRepairs: pendingCount,
      });

      // Prepare machine chart data
      const machineData = Object.entries(machineCount)
        .map(([name, count]) => ({
          name: name.substring(0, 15),
          repairs: count,
        }))
        .sort((a, b) => b.repairs - a.repairs)
        .slice(0, 8);
      setMachineChartData(machineData);

      // Prepare status chart data
      const statusCounts = { Completed: completedCount, Pending: pendingCount };
      const statusData = Object.entries(statusCounts).map(
        ([name, value], index) => ({
          name,
          value,
          color: name === "Completed" ? "#22c55e" : "#facc15",
        })
      );
      setStatusChartData(statusData);

      setRepairData(repairRows);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching repair data:", error);
      setError("Failed to load repair data");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairData();
  }, [fetchRepairData]);

  // Filter data
  const filteredData = useMemo(() => {
    return repairData.filter((item) => {
      if (!searchTerm) return true;
      return Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [repairData, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-indigo-600 animate-spin" />
          <p className="text-gray-500">Loading repairing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
        {error}
        <button
          onClick={fetchRepairData}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Repairing Dashboard</h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border-l-4 border-l-blue-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Repairs</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalRepairs}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-l-purple-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <IndianRupee className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{stats.totalCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-l-green-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.completedRepairs}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border-l-4 border-l-amber-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.pendingRepairs}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Repairs by Machine
          </h3>
          {machineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={machineChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={10}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="repairs" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Status Distribution
          </h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Recent Repairs Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">
            Recent Repairs ({filteredData.length})
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[300px]">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Machine
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Work Done
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredData.slice(0, 10).map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">
                    {row.timestamp?.split(" ")[0] || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{row.machineName}</td>
                  <td className="px-4 py-2 text-gray-700 max-w-[200px] truncate">
                    {row.workDone || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 font-medium">
                    {row.billAmount
                      ? `₹${row.billAmount.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        row.status?.toLowerCase().includes("completed") ||
                        row.status?.toLowerCase().includes("done")
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {row.status?.split(" ")[0] || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No repair records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RepairingDashboardInner;
