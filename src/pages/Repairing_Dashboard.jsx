"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import useMaintenanceHistoryStore from "../stores/useMaintenanceHistoryStore";
import {
  Wrench,
  IndianRupee,
  CheckCircle2,
  Clock,
  Search,
  X,
  TrendingUp,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  FileText,
  Camera,
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
  LineChart,
  Line,
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
  "#14b8a6",
];

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
  const [assignedToList, setAssignedToList] = useState([]);
  const [selectedAssignedTo, setSelectedAssignedTo] = useState("all");
  const [monthsList, setMonthsList] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [showMachineDropdown, setShowMachineDropdown] = useState(false);
  const machineDropdownRef = useRef(null);

  // Get admin done records from Zustand store
  const historyData = useMaintenanceHistoryStore((state) => state.historyData);
  const historyLoading = useMaintenanceHistoryStore((state) => state.isLoading);
  const fetchMaintenanceHistory = useMaintenanceHistoryStore(
    (state) => state.fetchMaintenanceHistory
  );

  const adminDoneRecords = useMemo(() => {
    return historyData.filter((item) => {
      const adminDone = item["col15"];
      return (
        adminDone !== null &&
        adminDone !== undefined &&
        adminDone.toString().trim() !== ""
      );
    });
  }, [historyData]);

  // Fetch maintenance history on mount if not already loaded
  useEffect(() => {
    if (historyData.length === 0 && !historyLoading) {
      fetchMaintenanceHistory();
    }
  }, [historyData.length, historyLoading, fetchMaintenanceHistory]);

  // Click away handler for machine dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        machineDropdownRef.current &&
        !machineDropdownRef.current.contains(event.target)
      ) {
        setShowMachineDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  // Stats
  const [stats, setStats] = useState({
    totalRepairs: 0,
    totalCost: 0,
    completedRepairs: 0,
    pendingRepairs: 0,
    inProgressRepairs: 0,
    avgCostPerRepair: 0,
  });

  // Chart data
  const [machineChartData, setMachineChartData] = useState([]);
  const [statusChartData, setStatusChartData] = useState([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState([]);
  const [assignedToChartData, setAssignedToChartData] = useState([]);

  // Parse date from various formats
  const parseDateFromString = (dateStr) => {
    if (!dateStr) return null;

    // Handle Date object from gviz
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

    // Handle DD/MM/YYYY HH:MM:SS format
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

    // Try standard date parsing
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
      const machinesSet = new Set();
      const statusSet = new Set();
      const assignedToSet = new Set();
      const repairRows = [];
      const machineCount = {};
      const assignedToCount = {};
      const monthlyData = {};

      let totalCost = 0;
      let completedCount = 0;
      let pendingCount = 0;
      let inProgressCount = 0;

      rows?.forEach((row, rowIndex) => {
        if (!row.c) return;

        const getVal = (idx) => {
          const cell = row.c[idx];
          if (!cell) return "";
          if (cell.f) return cell.f; // formatted value
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
        const machineName = getVal(4);
        const issueDetail = getVal(5);
        const partReplaced = getVal(6);
        const taskStartDate = getVal(7);
        const actualDate = getVal(8);
        const delay = getVal(9);
        const workDone = getVal(10);
        const photoUrl = getVal(11);
        const status = getVal(12) || "";
        const vendorName = getVal(13);
        const billCopyUrl = getVal(14);
        const billAmount = parseFloat(getVal(15)) || 0;
        const remarks = getVal(16);

        // Skip if no meaningful data
        if (!timestamp && !taskId && !machineName) return;

        // Add to sets for filters
        if (machineName) machinesSet.add(machineName);
        if (status) statusSet.add(status);
        if (assignedTo) assignedToSet.add(assignedTo);

        // Count by machine
        if (machineName) {
          machineCount[machineName] = (machineCount[machineName] || 0) + 1;
        }

        // Count by assigned to
        if (assignedTo) {
          assignedToCount[assignedTo] = (assignedToCount[assignedTo] || 0) + 1;
        }

        // Monthly trend data
        const date = parseDateFromString(timestamp);
        if (date) {
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { repairs: 0, cost: 0 };
          }
          monthlyData[monthKey].repairs += 1;
          monthlyData[monthKey].cost += billAmount;
        }

        // Calculate stats based on status
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

        const rowData = {
          _id: `row_${rowIndex}`,
          _rowIndex: rowIndex + 1,
          timestamp,
          taskId,
          formFilledBy,
          assignedTo,
          machineName,
          issueDetail,
          partReplaced,
          taskStartDate,
          actualDate,
          delay,
          workDone,
          photoUrl,
          status,
          vendorName,
          billCopyUrl,
          billAmount,
          remarks,
        };

        repairRows.push(rowData);
      });

      // Set lists
      setMachinesList(Array.from(machinesSet).sort());
      setStatusList(Array.from(statusSet).sort());
      setAssignedToList(Array.from(assignedToSet).sort());

      // Generate months list from data
      const sortedMonths = Object.keys(monthlyData).sort().reverse();
      const monthsListFormatted = sortedMonths.map((monthKey) => ({
        value: monthKey,
        label: new Date(monthKey + "-01").toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      }));
      setMonthsList(monthsListFormatted);

      // Set stats
      const avgCost = repairRows.length > 0 ? totalCost / repairRows.length : 0;
      setStats({
        totalRepairs: repairRows.length,
        totalCost: totalCost,
        completedRepairs: completedCount,
        pendingRepairs: pendingCount,
        inProgressRepairs: inProgressCount,
        avgCostPerRepair: avgCost,
      });

      // Prepare machine chart data (Top 10)
      const machineData = Object.entries(machineCount)
        .map(([name, count]) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          fullName: name,
          repairs: count,
        }))
        .sort((a, b) => b.repairs - a.repairs)
        .slice(0, 10);
      setMachineChartData(machineData);

      // Prepare assigned to chart data
      const assignedData = Object.entries(assignedToCount)
        .map(([name, count]) => ({
          name: name.length > 15 ? name.substring(0, 15) + "..." : name,
          fullName: name,
          tasks: count,
        }))
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 8);
      setAssignedToChartData(assignedData);

      // Prepare status chart data
      const statusCounts = {};
      repairRows.forEach((row) => {
        const s = row.status || "Pending";
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusData = Object.entries(statusCounts).map(
        ([name, value], index) => ({
          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
          fullName: name,
          value,
          color: COLORS[index % COLORS.length],
        })
      );
      setStatusChartData(statusData);

      // Prepare monthly trend data
      const trendData = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 months
        .map(([month, data]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          repairs: data.repairs,
          cost: Math.round(data.cost / 1000), // in thousands
        }));
      setMonthlyTrendData(trendData);

      setRepairData(repairRows.reverse()); // Newest first
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
        ? [
            item.taskId,
            item.machineName,
            item.issueDetail,
            item.assignedTo,
            item.vendorName,
          ]
            .join(" ")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true;

      const matchesMachine =
        selectedMachines.length > 0
          ? selectedMachines.includes(item.machineName)
          : true;

      const matchesStatus =
        selectedStatus !== "all" ? item.status === selectedStatus : true;

      const matchesAssignedTo =
        selectedAssignedTo !== "all"
          ? item.assignedTo === selectedAssignedTo
          : true;

      // Month filter
      let matchesMonth = true;
      if (selectedMonth !== "all") {
        const itemDate = parseDateFromString(item.timestamp);
        if (itemDate) {
          const itemMonthKey = `${itemDate.getFullYear()}-${String(
            itemDate.getMonth() + 1
          ).padStart(2, "0")}`;
          matchesMonth = itemMonthKey === selectedMonth;
        } else {
          matchesMonth = false;
        }
      }

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
        matchesSearch &&
        matchesMachine &&
        matchesMonth &&
        matchesStatus &&
        matchesAssignedTo &&
        matchesDateRange
      );
    });
  }, [
    repairData,
    searchTerm,
    selectedMachines,
    selectedStatus,
    selectedAssignedTo,
    selectedMonth,
    startDate,
    endDate,
  ]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMachines([]);
    setSelectedStatus("all");
    setSelectedAssignedTo("all");
    setSelectedMonth("all");
    setStartDate("");
    setEndDate("");
    setShowMachineDropdown(false);
  };

  const handleMachineSelection = (machine) => {
    setSelectedMachines((prev) =>
      prev.includes(machine)
        ? prev.filter((item) => item !== machine)
        : [...prev, machine]
    );
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s.includes("completed") || s.includes("done") || s.includes("पूर्ण"))
      return "bg-green-100 text-green-800";
    if (s.includes("progress")) return "bg-blue-100 text-blue-800";
    if (s.includes("observation")) return "bg-indigo-100 text-indigo-800";
    if (s.includes("temporary")) return "bg-purple-100 text-purple-800";
    if (s.includes("cancel")) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, color, subtext, trend }) => (
    <div
      className={`bg-white rounded-xl shadow-md border-l-4 ${color} p-5 hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="mt-1 text-xs text-gray-400">{subtext}</p>}
        </div>
        <div
          className={`p-3 rounded-xl ${color
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-orange-600 animate-spin" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="mb-4 text-red-600">{error}</p>
            <button
              onClick={fetchRepairData}
              className="px-6 py-2 text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700"
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Repairing Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of all repair and maintenance activities
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search
              className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID, machine, issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white shadow-md rounded-xl">
          <div className="flex flex-wrap items-end gap-4">
            {/* Month Filter */}
            <div className="flex flex-col min-w-[180px]">
              <label className="mb-1 text-sm font-medium text-gray-700">
                <Calendar size={14} className="inline mr-1" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Months</option>
                {monthsList.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Machine Filter - Multi-select Dropdown */}
            <div
              ref={machineDropdownRef}
              className="flex flex-col min-w-[200px] relative"
            >
              <label className="mb-1 text-sm font-medium text-gray-700">
                <Wrench size={14} className="inline mr-1" />
                Machine
              </label>
              <div
                onClick={() => setShowMachineDropdown(!showMachineDropdown)}
                className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-between min-h-[42px]"
              >
                <span className="text-gray-700 truncate">
                  {selectedMachines.length > 0
                    ? `${selectedMachines.length} selected`
                    : "All Machines"}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    showMachineDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {showMachineDropdown && (
                <div className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 top-full">
                  <div className="sticky top-0 p-2 bg-white border-b border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMachines([]);
                      }}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      Clear Selection
                    </button>
                  </div>
                  {machinesList.map((machine) => (
                    <div
                      key={machine}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMachineSelection(machine);
                      }}
                      className={`px-3 py-2 cursor-pointer hover:bg-orange-50 flex items-center gap-2 ${
                        selectedMachines.includes(machine)
                          ? "bg-orange-100"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMachines.includes(machine)}
                        onChange={() => {}}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700 truncate">
                        {machine}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex flex-col min-w-[150px]">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                {statusList.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To Filter */}
            <div className="flex flex-col min-w-[150px]">
              <label className="mb-1 text-sm font-medium text-gray-700">
                Assigned To
              </label>
              <select
                value={selectedAssignedTo}
                onChange={(e) => setSelectedAssignedTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Assignees</option>
                <option value="Pratap Kumar Rout">Pratap Kumar Rout</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">
                To
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Clear Filters */}
            {(selectedMachines.length > 0 ||
              selectedStatus !== "all" ||
              selectedAssignedTo !== "all" ||
              selectedMonth !== "all" ||
              startDate ||
              endDate ||
              searchTerm) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 text-red-700 transition-colors bg-red-100 rounded-lg hover:bg-red-200"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>

          {/* Selected Machines Tags */}
          {selectedMachines.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-gray-200">
              <span className="self-center text-xs text-gray-500">
                Selected Machines:
              </span>
              {selectedMachines.map((machine) => (
                <span
                  key={machine}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full"
                >
                  {machine.length > 20
                    ? machine.substring(0, 20) + "..."
                    : machine}
                  <button
                    onClick={() => handleMachineSelection(machine)}
                    className="hover:text-orange-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Repairs"
            value={stats.totalRepairs.toLocaleString()}
            icon={Wrench}
            color="border-blue-500"
            subtext="All time records"
          />
          <StatCard
            title="Total Cost"
            value={formatCurrency(stats.totalCost)}
            icon={IndianRupee}
            color="border-purple-500"
            subtext={`Avg: ${formatCurrency(stats.avgCostPerRepair)}/repair`}
          />
          <StatCard
            title="Completed"
            value={stats.completedRepairs.toLocaleString()}
            icon={CheckCircle2}
            color="border-green-500"
            subtext={`${(
              (stats.completedRepairs / stats.totalRepairs) * 100 || 0
            ).toFixed(1)}% completion`}
          />
          <StatCard
            title="Pending"
            value={stats.pendingRepairs.toLocaleString()}
            icon={Clock}
            color="border-amber-500"
            subtext={`${stats.inProgressRepairs} in progress`}
          />
        </div>

        {/* Data Table */}
        <div className="mb-6 overflow-hidden bg-white shadow-md rounded-xl">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Repair Records
              </h3>
              <span className="px-3 py-1 text-sm font-medium text-orange-700 bg-orange-100 rounded-full">
                {filteredData.length} of {repairData.length}
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto max-h-[500px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Task ID
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Machine
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Issue
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Part Replaced
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Assigned To
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Bill Amount
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                    Bill Copy
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase">
                    Work Done Photo
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.slice(0, 50).map((row) => (
                    <tr
                      key={row._id}
                      className="transition-colors hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-gray-900 align-middle whitespace-nowrap">
                        {row.taskId || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 align-middle whitespace-nowrap">
                        {formatDate(row.timestamp)}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-orange-700 align-middle">
                        {row.machineName || "—"}
                      </td>
                      <td
                        className="px-5 py-4 text-sm text-gray-600 align-middle max-w-[180px] truncate"
                        title={row.issueDetail}
                      >
                        {row.issueDetail || "—"}
                      </td>
                      <td
                        className="px-5 py-4 text-sm text-gray-700 align-middle max-w-[150px] truncate"
                        title={row.partReplaced}
                      >
                        {row.partReplaced || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700 align-middle">
                        {row.assignedTo || "—"}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900 align-middle">
                        {row.billAmount ? formatCurrency(row.billAmount) : "—"}
                      </td>
                      <td className="px-5 py-4 text-center align-middle">
                        {row.billCopyUrl ? (
                          <a
                            href={row.billCopyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 transition-colors bg-green-100 rounded-md hover:bg-green-200"
                          >
                            <FileText size={14} />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center align-middle">
                        {row.photoUrl ? (
                          <a
                            href={row.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 transition-colors bg-blue-100 rounded-md hover:bg-blue-200"
                          >
                            <Camera size={14} />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            row.status
                          )}`}
                        >
                          {row.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="10"
                      className="px-5 py-16 text-center text-gray-400"
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

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {filteredData.length > 0 ? (
              filteredData.slice(0, 30).map((row) => (
                <div
                  key={row._id}
                  className="p-4 border border-gray-200 rounded-xl bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">
                        {row.taskId} • {formatDate(row.timestamp)}
                      </p>
                      <p className="font-semibold text-orange-700">
                        {row.machineName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                        row.status
                      )}`}
                    >
                      {row.status || "Pending"}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                    {row.issueDetail || "No description"}
                  </p>
                  {row.partReplaced && (
                    <p className="mb-2 text-xs text-gray-600">
                      <span className="font-medium text-gray-500">Part:</span>{" "}
                      {row.partReplaced}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 text-sm border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {row.assignedTo || "Unassigned"}
                      </span>
                      {row.billCopyUrl && (
                        <a
                          href={row.billCopyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                        >
                          <FileText size={10} />
                          Bill
                        </a>
                      )}
                    </div>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(row.billAmount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-500">
                No repair records found
              </div>
            )}
          </div>
        </div>

        {/* Admin Done Records Section */}
        {historyLoading && (
          <div className="p-8 mb-6 bg-white shadow-md rounded-xl">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
              <span className="font-medium text-purple-600">
                Loading maintenance history...
              </span>
            </div>
          </div>
        )}
        {!historyLoading && (
          <div className="mb-6 overflow-hidden bg-white shadow-md rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-purple-800">
                  Admin Processed Records (Checklist Maintenance)
                </h3>
                <span className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-full">
                  {adminDoneRecords.length} records
                </span>
              </div>
              <p className="mt-1 text-sm text-purple-600">
                Tasks that have been reviewed and marked by admin
              </p>
            </div>

            {/* Desktop Table */}
            {adminDoneRecords.length > 0 && (
              <div className="hidden md:block overflow-x-auto max-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Task ID
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Company Name
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Task Description
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Task Start Date
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Actual
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                        Admin Done
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {adminDoneRecords.slice(0, 50).map((record, index) => (
                      <tr
                        key={record._id || index}
                        className="transition-colors hover:bg-purple-50/30"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {record.col1 || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-purple-700">
                          {record.col2 || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.col4 || "—"}
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate"
                          title={record.col5}
                        >
                          {record.col5 || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {record.col6 || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {record.col10 || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.col12 === "Yes"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {record.col12 || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.col15 === "Done"
                                ? "bg-green-100 text-green-800"
                                : record.col15 === "Not Done"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {record.col15 || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card View */}
            {adminDoneRecords.length > 0 && (
              <div className="md:hidden p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {adminDoneRecords.slice(0, 30).map((record, index) => (
                  <div
                    key={record._id || index}
                    className="p-4 border border-purple-200 rounded-xl bg-purple-50/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-500">{record.col1}</p>
                        <p className="font-semibold text-purple-700">
                          {record.col2}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          record.col15 === "Done"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {record.col15}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-gray-600 line-clamp-2">
                      {record.col5 || "No description"}
                    </p>
                    <div className="flex items-center justify-between pt-2 text-xs text-gray-500 border-t border-purple-200">
                      <span>{record.col4}</span>
                      <span>{record.col6}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {adminDoneRecords.length === 0 && (
              <div className="py-12 text-center">
                <div className="text-gray-400 mb-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto opacity-50" />
                </div>
                <p className="text-gray-500 font-medium">
                  No admin processed records yet
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Records will appear here once admin marks them as done
                </p>
              </div>
            )}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Bar Chart - Repairs by Machine */}
          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <Wrench size={20} className="text-orange-500" />
              Top 10 Machines by Repairs
            </h3>
            {machineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={machineChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" fontSize={12} stroke="#888888" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={11}
                    stroke="#888888"
                    width={120}
                  />
                  <Tooltip
                    formatter={(value, name, props) => [value, "Repairs"]}
                    labelFormatter={(label) =>
                      machineChartData.find((d) => d.name === label)
                        ?.fullName || label
                    }
                  />
                  <Bar dataKey="repairs" fill="#f97316" radius={[0, 4, 4, 0]} />
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
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <TrendingUp size={20} className="text-green-500" />
              Status Distribution
            </h3>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
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
                      <span className="text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No data available
              </div>
            )}
          </div>

          {/* Line Chart - Monthly Trend */}
          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <Calendar size={20} className="text-blue-500" />
              Monthly Repair Trend
            </h3>
            {monthlyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} stroke="#888888" />
                  <YAxis yAxisId="left" fontSize={12} stroke="#888888" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    fontSize={12}
                    stroke="#888888"
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="repairs"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ fill: "#f97316" }}
                    name="Repairs"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cost"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6" }}
                    name="Cost (₹K)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No trend data available
              </div>
            )}
          </div>

          {/* Bar Chart - Tasks by Assignee */}
          <div className="p-6 bg-white shadow-md rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
              <Users size={20} className="text-indigo-500" />
              Tasks by Assignee
            </h3>
            {assignedToChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assignedToChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    stroke="#888888"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} stroke="#888888" />
                  <Tooltip
                    formatter={(value) => [value, "Tasks"]}
                    labelFormatter={(label) =>
                      assignedToChartData.find((d) => d.name === label)
                        ?.fullName || label
                    }
                  />
                  <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Repairing_Dashboard;
