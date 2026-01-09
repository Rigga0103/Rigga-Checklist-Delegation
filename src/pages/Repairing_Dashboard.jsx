"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wrench,
  IndianRupee,
  CheckCircle2,
  Clock,
  Search,
  X,
  Filter,
  TrendingUp,
  Loader2,
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
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

const Repairing_Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repairData, setRepairData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter states
  const [machinesList, setMachinesList] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");

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

  // Parse date from various formats
  const parseDateFromString = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    // Handle DD/MM/YYYY HH:MM:SS format
    if (dateStr.includes("/")) {
      const datePart = dateStr.includes(" ") ? dateStr.split(" ")[0] : dateStr;
      const parts = datePart.split("/");
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }

    // Try standard date parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

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
      const machinesSet = new Set();
      const statusSet = new Set();
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

        if (machineName) machinesSet.add(machineName);
        if (status) statusSet.add(status);

        // Count by machine
        machineCount[machineName] = (machineCount[machineName] || 0) + 1;

        // Calculate stats - use includes() for better matching of status strings
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

        const rowData = {
          _id: `row_${rowIndex}`,
          _rowIndex: rowIndex + 1,
          timestamp: rowValues[0] || "",
          formFilledBy: rowValues[1] || "",
          machineName: machineName,
          partReplaced: rowValues[3] || "",
          workDone: rowValues[4] || "",
          photoUrl: rowValues[5] || "",
          remarks: rowValues[6] || "",
          status: status,
          billAmount: billAmount,
          billCopy: rowValues[9] || "",
          vendorName: rowValues[10] || "",
        };

        repairRows.push(rowData);
      });

      // Set lists
      setMachinesList(Array.from(machinesSet).sort());
      setStatusList(Array.from(statusSet).sort());

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
          name: name.substring(0, 20),
          repairs: count,
        }))
        .sort((a, b) => b.repairs - a.repairs)
        .slice(0, 10);
      setMachineChartData(machineData);

      // Prepare status chart data
      const statusCounts = {};
      repairRows.forEach((row) => {
        const s = row.status || "Pending";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(
        ([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length],
        })
      );
      setStatusChartData(statusData);

      setRepairData(repairRows);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching repair data:", error);
      setError("Failed to load repair data: " + error.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairData();
  }, [fetchRepairData]);

  // Filter data
  const filteredData = useMemo(() => {
    return repairData.filter((item) => {
      const matchesSearch = searchTerm
        ? Object.values(item).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        : true;

      const matchesMachine =
        selectedMachines.length > 0
          ? selectedMachines.includes(item.machineName)
          : true;

      const matchesStatus =
        selectedStatus !== "all"
          ? item.status.toLowerCase() === selectedStatus.toLowerCase()
          : true;

      let matchesDateRange = true;
      if (startDate || endDate) {
        const itemDate = parseDateFromString(item.timestamp);
        if (!itemDate) return false;
        if (startDate) {
          const startDateObj = new Date(startDate);
          startDateObj.setHours(0, 0, 0, 0);
          if (itemDate < startDateObj) matchesDateRange = false;
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999);
          if (itemDate > endDateObj) matchesDateRange = false;
        }
      }

      return (
        matchesSearch && matchesMachine && matchesStatus && matchesDateRange
      );
    });
  }, [
    repairData,
    searchTerm,
    selectedMachines,
    selectedStatus,
    startDate,
    endDate,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMachines([]);
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const handleMachineSelection = (machine) => {
    setSelectedMachines((prev) => {
      if (prev.includes(machine)) {
        return prev.filter((item) => item !== machine);
      } else {
        return [...prev, machine];
      }
    });
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div
      className={`bg-white rounded-xl shadow-md border-l-4 ${color} p-6 hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
        </div>
        <div
          className={`p-3 rounded-full ${color
            .replace("border-", "bg-")
            .replace("-500", "-100")}`}
        >
          <Icon className={`w-6 h-6 ${color.replace("border-", "text-")}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
            <p className="text-gray-600">Loading repairing dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={fetchRepairData}
              className="px-4 py-2 mt-4 text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Repairing Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of all repair and maintenance activities
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
              size={18}
            />
            <input
              type="text"
              placeholder="Search repairs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Repairs"
            value={stats.totalRepairs}
            icon={Wrench}
            color="border-blue-500"
            subtext="All repair records"
          />
          <StatCard
            title="Total Cost"
            value={`₹${stats.totalCost.toLocaleString()}`}
            icon={IndianRupee}
            color="border-purple-500"
            subtext="Sum of all bill amounts"
          />
          <StatCard
            title="Completed"
            value={stats.completedRepairs}
            icon={CheckCircle2}
            color="border-green-500"
            subtext={`${(
              (stats.completedRepairs / stats.totalRepairs) * 100 || 0
            ).toFixed(1)}% completion rate`}
          />
          <StatCard
            title="Pending"
            value={stats.pendingRepairs}
            icon={Clock}
            color="border-amber-500"
            subtext="Awaiting completion"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Bar Chart - Repairs by Machine */}
          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Repairs by Machine (Top 10)
            </h3>
            {machineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={machineChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" fontSize={12} stroke="#888888" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={10}
                    stroke="#888888"
                    width={100}
                    tickFormatter={(value) =>
                      value.length > 15 ? value.substring(0, 15) + "..." : value
                    }
                  />
                  <Tooltip />
                  <Bar dataKey="repairs" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Pie Chart - Status Distribution */}
          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Status Distribution
            </h3>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white shadow-md rounded-xl">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                {statusList.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Clear Filters */}
            {(selectedMachines.length > 0 ||
              selectedStatus !== "all" ||
              startDate ||
              endDate ||
              searchTerm) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 mt-5 text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
              >
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Selected Machines */}
          {selectedMachines.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedMachines.map((machine) => (
                <span
                  key={machine}
                  className="inline-flex items-center px-3 py-1 text-sm text-indigo-700 bg-indigo-100 rounded-full"
                >
                  {machine}
                  <button
                    onClick={() => handleMachineSelection(machine)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-hidden bg-white shadow-md rounded-xl">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Repair Records
              </h3>
              <span className="text-sm text-gray-500">
                Showing {filteredData.length} of {repairData.length} records
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Machine
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Work Done
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Bill Amount
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    Filled By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {row.timestamp ? row.timestamp.split(" ")[0] : "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {row.machineName || "—"}
                      </td>
                      <td
                        className="px-4 py-4 text-sm text-gray-900 max-w-[200px] truncate"
                        title={row.workDone}
                      >
                        {row.workDone || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {row.vendorName || "—"}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {row.billAmount
                          ? `₹${row.billAmount.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.status?.toLowerCase().includes("completed") ||
                            row.status?.toLowerCase().includes("done") ||
                            row.status?.toLowerCase().includes("पूर्ण")
                              ? "bg-green-100 text-green-800"
                              : row.status?.toLowerCase().includes("pending")
                              ? "bg-yellow-100 text-yellow-800"
                              : row.status?.toLowerCase().includes("cancel")
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {row.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {row.formFilledBy || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      No repair records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <div
                  key={row._id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {row.machineName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {row.timestamp?.split(" ")[0]}
                      </p>
                    </div>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.status?.toLowerCase().includes("completed") ||
                        row.status?.toLowerCase().includes("done") ||
                        row.status?.toLowerCase().includes("पूर्ण")
                          ? "bg-green-100 text-green-800"
                          : row.status?.toLowerCase().includes("cancel")
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-600">
                    {row.workDone || "No description"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Vendor: {row.vendorName || "N/A"}
                    </span>
                    <span className="font-semibold text-indigo-600">
                      {row.billAmount
                        ? `₹${row.billAmount.toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                No repair records found
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Repairing_Dashboard;
