"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wrench,
  IndianRupee,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  TrendingUp,
  Users,
  FileText,
  Camera,
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

const COLORS = [
  "#22c55e",
  "#facc15",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

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
    inProgressRepairs: 0,
  });

  // Chart data
  const [machineChartData, setMachineChartData] = useState([]);
  const [statusChartData, setStatusChartData] = useState([]);
  const [assigneeChartData, setAssigneeChartData] = useState([]);

  // Parse date helper
  const parseDateFromString = (dateStr) => {
    if (!dateStr) return null;

    if (typeof dateStr === "object" && dateStr.v) {
      dateStr = dateStr.v;
    }

    if (typeof dateStr !== "string") {
      dateStr = String(dateStr);
    }

    // Handle "Date(year,month,day)" format from gviz
    if (dateStr.startsWith("Date(")) {
      const parts = dateStr.slice(5, -1).split(",");
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]),
        parseInt(parts[2])
      );
    }

    // Handle DD/MM/YYYY format
    if (dateStr.includes("/")) {
      const datePart = dateStr.includes(" ") ? dateStr.split(" ")[0] : dateStr;
      const parts = datePart.split("/");
      if (parts.length === 3) {
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      }
    }

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = parseDateFromString(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch data from Google Sheets
  const fetchRepairData = useCallback(async () => {
    try {
      setLoading(true);
      const query = "SELECT A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q";
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${FORM_SHEET}&tq=${encodeURIComponent(
        query
      )}`;

      const response = await fetch(url);
      const text = await response.text();
      const jsonString = text.substring(47).slice(0, -2);
      const json = JSON.parse(jsonString);

      const rows = json.table.rows;
      const repairRows = [];
      const machineCount = {};
      const assigneeCount = {};
      const statusCounts = {};

      let totalCost = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let inProgressCount = 0;

      rows?.forEach((row, rowIndex) => {
        if (!row.c) return;

        const getVal = (idx) => {
          const cell = row.c[idx];
          if (!cell) return "";
          if (cell.f) return cell.f;
          return cell.v !== undefined ? cell.v : "";
        };

        // Correct column mapping based on Maitenence_Form:
        // A(0): Timestamp
        // B(1): Task ID
        // C(2): Form Filled By
        // D(3): Assigned To
        // E(4): Machine Name
        // F(5): Issue Detail
        // G(6): Part Replaced
        // H(7): Task Start Date
        // I(8): Actual Date
        // J(9): Delay
        // K(10): Work Done
        // L(11): Photo
        // M(12): Status
        // N(13): Vendor Name
        // O(14): Bill Copy
        // P(15): Bill Amount
        // Q(16): Remarks

        const timestamp = getVal(0);
        const taskId = getVal(1);
        const formFilledBy = getVal(2);
        const assignedTo = getVal(3);
        const machineName = getVal(4) || "Unknown";
        const issueDetail = getVal(5);
        const partReplaced = getVal(6);
        const workDone = getVal(10);
        const photoUrl = getVal(11);
        const status = getVal(12) || "";
        const vendorName = getVal(13);
        const billCopyUrl = getVal(14);
        const billAmount = parseFloat(getVal(15)) || 0;

        // Skip if no meaningful data
        if (!timestamp && !taskId && !machineName) return;

        // Count by machine
        if (machineName) {
          machineCount[machineName] = (machineCount[machineName] || 0) + 1;
        }

        // Count by assignee
        if (assignedTo) {
          assigneeCount[assignedTo] = (assigneeCount[assignedTo] || 0) + 1;
        }

        // Count by status
        const statusKey = status || "Pending";
        statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

        // Calculate stats
        totalCost += billAmount;
        const statusLower = status.toLowerCase();

        if (
          statusLower.includes("completed") ||
          statusLower.includes("done") ||
          statusLower.includes("पूर्ण")
        ) {
          completedCount++;
        } else if (
          statusLower.includes("progress") ||
          statusLower.includes("observation") ||
          statusLower.includes("temporary")
        ) {
          inProgressCount++;
        } else if (!statusLower.includes("cancel")) {
          pendingCount++;
        }

        repairRows.push({
          _id: `row_${rowIndex}`,
          timestamp,
          taskId,
          formFilledBy,
          assignedTo,
          machineName,
          issueDetail,
          partReplaced,
          workDone,
          photoUrl,
          status,
          vendorName,
          billCopyUrl,
          billAmount,
        });
      });

      // Set stats
      setStats({
        totalRepairs: repairRows.length,
        totalCost: totalCost,
        completedRepairs: completedCount,
        pendingRepairs: pendingCount,
        inProgressRepairs: inProgressCount,
      });

      // Prepare machine chart data (Top 8)
      const machineData = Object.entries(machineCount)
        .map(([name, count]) => ({
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          fullName: name,
          repairs: count,
        }))
        .sort((a, b) => b.repairs - a.repairs)
        .slice(0, 8);
      setMachineChartData(machineData);

      // Prepare assignee chart data (Top 6)
      const assigneeData = Object.entries(assigneeCount)
        .map(([name, count]) => ({
          name: name.length > 12 ? name.substring(0, 12) + "..." : name,
          fullName: name,
          tasks: count,
        }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 6);
      setAssigneeChartData(assigneeData);

      // Prepare status chart data
      const statusData = Object.entries(statusCounts).map(
        ([name, value], index) => ({
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          fullName: name,
          value,
          color: COLORS[index % COLORS.length],
        })
      );
      setStatusChartData(statusData);

      setRepairData(repairRows.reverse()); // Newest first
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
      return [
        item.taskId,
        item.machineName,
        item.issueDetail,
        item.assignedTo,
        item.vendorName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    });
  }, [repairData, searchTerm]);

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-700";
    const s = status.toLowerCase();
    if (s.includes("completed") || s.includes("done") || s.includes("पूर्ण"))
      return "bg-green-100 text-green-700";
    if (s.includes("progress")) return "bg-blue-100 text-blue-700";
    if (s.includes("observation")) return "bg-indigo-100 text-indigo-700";
    if (s.includes("temporary")) return "bg-purple-100 text-purple-700";
    if (s.includes("cancel")) return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-2 text-orange-600 animate-spin" />
          <p className="text-gray-500">Loading repairing data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 rounded-lg bg-red-50">
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
        <h2 className="text-xl font-bold text-gray-800">Repairing Overview</h2>
        <div className="relative">
          <Search
            className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48 py-2 pr-3 text-sm border border-gray-200 rounded-lg pl-9 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="p-4 bg-white border-l-4 rounded-lg shadow-md border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Repairs</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.totalRepairs.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-l-4 rounded-lg shadow-md border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <IndianRupee className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.totalCost)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-l-4 rounded-lg shadow-md border-l-green-500">
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

        <div className="p-4 bg-white border-l-4 rounded-lg shadow-md border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.pendingRepairs}
              </p>
              {stats.inProgressRepairs > 0 && (
                <p className="text-xs text-blue-600">
                  {stats.inProgressRepairs} in progress
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
            <Wrench size={16} className="text-orange-500" />
            Top Machines by Repairs
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
                  width={100}
                />
                <Tooltip
                  formatter={(value) => [value, "Repairs"]}
                  labelFormatter={(label) =>
                    machineChartData.find((d) => d.name === label)?.fullName ||
                    label
                  }
                />
                <Bar dataKey="repairs" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
              No data
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg shadow-md">
          <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
            <TrendingUp size={16} className="text-green-500" />
            Status Distribution
          </h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload.fullName,
                  ]}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
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
      <div className="overflow-hidden bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Recent Repairs
            </h3>
            <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
              {filteredData.length} records
            </span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[300px]">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Task ID
                </th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Machine
                </th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Part Replaced
                </th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Assigned To
                </th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Bill Amount
                </th>
                <th className="px-4 py-2 text-xs font-medium text-center text-gray-500 uppercase">
                  Bill Copy
                </th>
                <th className="px-4 py-2 text-xs font-medium text-center text-gray-500 uppercase">
                  Work Done Photo
                </th>
                <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredData.slice(0, 15).map((row) => (
                <tr key={row._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {row.taskId || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {formatDate(row.timestamp)}
                  </td>
                  <td className="px-4 py-2 font-medium text-orange-700">
                    {row.machineName}
                  </td>
                  <td
                    className="px-4 py-2 text-gray-600 max-w-[120px] truncate"
                    title={row.partReplaced}
                  >
                    {row.partReplaced || "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {row.assignedTo || "—"}
                  </td>
                  <td className="px-4 py-2 font-semibold text-gray-900">
                    {row.billAmount ? formatCurrency(row.billAmount) : "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {row.billCopyUrl ? (
                      <a
                        href={row.billCopyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                      >
                        <FileText size={12} />
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {row.photoUrl ? (
                      <a
                        href={row.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                      >
                        <Camera size={12} />
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                        row.status
                      )}`}
                    >
                      {row.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No repair records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Bottom spacing */}
          <div className="h-4 bg-white"></div>
        </div>
      </div>
      {/* Extra bottom margin */}
      <div className="h-6"></div>
    </div>
  );
};

export default RepairingDashboardInner;
