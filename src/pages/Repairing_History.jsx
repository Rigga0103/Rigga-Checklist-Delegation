"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Search,
  Loader2,
  Filter,
  Download,
  Eye,
  FileText,
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import * as XLSX from "xlsx";

const SHEET_ID = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
const FORM_SHEET = "Maitenence_Form";

const Repairing_History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filter states
  const [machinesList, setMachinesList] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [machineSearchTerm, setMachineSearchTerm] = useState("");
  const [showMachineDropdown, setShowMachineDropdown] = useState(false);

  const [filledByList, setFilledByList] = useState([]);
  const [selectedFilledBy, setSelectedFilledBy] = useState([]);
  const [filledBySearchTerm, setFilledBySearchTerm] = useState("");
  const [showFilledByDropdown, setShowFilledByDropdown] = useState(false);

  const [statusList, setStatusList] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Parse date helper
  const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    try {
      // Handle "Date(year,month,day)" format from gviz
      if (dateStr.startsWith("Date(")) {
        const parts = dateStr.slice(5, -1).split(",");
        return new Date(parts[0], parts[1], parts[2]);
      }
      // Handle DD/MM/YYYY
      if (dateStr.includes("/")) {
        const parts = dateStr.split(" ")[0].split("/");
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
      return new Date(dateStr);
    } catch (e) {
      return null;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Fetch data from Google Sheets
  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      // Construct query to get all columns A to Q
      const query = "SELECT A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q";
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${FORM_SHEET}&tq=${encodeURIComponent(
        query
      )}`;

      const response = await fetch(url);
      const text = await response.text();
      // Remove "/*O_o*/" and "google.visualization.Query.setResponse(" and ");"
      const jsonString = text.substring(47).slice(0, -2);
      const json = JSON.parse(jsonString);

      const rows = json.table.rows;
      const machinesSet = new Set();
      const filledBySet = new Set();
      const statusSet = new Set();
      const historyRows = [];

      rows.forEach((row, rowIndex) => {
        if (!row.c) return;
        const getVal = (idx) => (row.c[idx] ? row.c[idx].v : "");

        // Mapping based on Maitenence_Form columns:
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

        const item = {
          id: `row-${rowIndex}`,
          timestamp: getVal(0),
          taskId: getVal(1),
          filledBy: getVal(2),
          assignedTo: getVal(3),
          machineName: getVal(4),
          issueDetail: getVal(5),
          partReplaced: getVal(6),
          taskStartDate: getVal(7),
          actualDate: getVal(8),
          workDone: getVal(10),
          photoUrl: getVal(11),
          status: getVal(12),
          vendorName: getVal(13),
          billCopyUrl: getVal(14),
          billAmount: getVal(15),
          remarks: getVal(16),
        };

        // Only show in history if:
        // 1. Actual date is filled (task is completed)
        // 2. Status is also present
        const hasActualDate =
          item.actualDate && String(item.actualDate).trim() !== "";
        const hasStatus = item.status && String(item.status).trim() !== "";

        if (hasActualDate && hasStatus) {
          historyRows.push(item);
          if (item.machineName) machinesSet.add(item.machineName);
          if (item.filledBy) filledBySet.add(item.filledBy);
          if (item.status) statusSet.add(item.status);
        }
      });

      setHistoryData(historyRows.reverse()); // Newest first
      setMachinesList(Array.from(machinesSet).sort());
      setFilledByList(Array.from(filledBySet).sort());
      setStatusList(Array.from(statusSet).sort());
      setLoading(false);
    } catch (error) {
      console.error("Error fetching history data:", error);
      setError("Failed to load history data: " + error.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".filter-dropdown")) {
        setShowMachineDropdown(false);
        setShowFilledByDropdown(false);
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelection = (item, currentList, setList) => {
    if (currentList.includes(item)) {
      setList(currentList.filter((i) => i !== item));
    } else {
      setList([...currentList, item]);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMachines([]);
    setSelectedFilledBy([]);
    setSelectedStatus([]);
    setStartDate("");
    setEndDate("");
  };

  const filteredHistoryData = useMemo(() => {
    return historyData.filter((item) => {
      // Text Search
      const searchContent = [
        item.taskId,
        item.machineName,
        item.filledBy,
        item.issueDetail,
        item.remarks,
        item.vendorName,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchTerm
        ? searchContent.includes(searchTerm.toLowerCase())
        : true;

      // Filter matches
      const matchesMachine =
        selectedMachines.length === 0 ||
        selectedMachines.includes(item.machineName);
      const matchesFilledBy =
        selectedFilledBy.length === 0 ||
        selectedFilledBy.includes(item.filledBy);
      const matchesStatus =
        selectedStatus.length === 0 || selectedStatus.includes(item.status);

      // Date Range
      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = parseDate(item.timestamp);
        if (itemDate) {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) matchesDate = false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) matchesDate = false;
          }
        }
      }

      return (
        matchesSearch &&
        matchesMachine &&
        matchesFilledBy &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    historyData,
    searchTerm,
    selectedMachines,
    selectedFilledBy,
    selectedStatus,
    startDate,
    endDate,
  ]);

  const exportToExcel = () => {
    const exportData = filteredHistoryData.map((item) => ({
      Timestamp: formatDate(item.timestamp),
      "Task ID": item.taskId,
      "Filled By": item.filledBy,
      "Assigned To": item.assignedTo,
      Machine: item.machineName,
      Issue: item.issueDetail,
      "Part Replaced": item.partReplaced,
      Status: item.status,
      "Bill Amount": item.billAmount,
      Vendor: item.vendorName,
      Remarks: item.remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Repair History");
    XLSX.writeFile(wb, "Repair_History.xlsx");
  };

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s.includes("completed") || s.includes("done"))
      return "bg-green-100 text-green-800";
    if (s.includes("pending") || s.includes("assigned"))
      return "bg-yellow-100 text-yellow-800";
    if (s.includes("cancel")) return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Repairing History
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and filter all maintenance and repair records
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-grow md:flex-grow-0 md:w-64">
              <Search
                className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Search ID, machine, issue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
            <Filter size={18} />
            Filters
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Machine Dropdown */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => {
                  setShowMachineDropdown(!showMachineDropdown);
                  setShowFilledByDropdown(false);
                  setShowStatusDropdown(false);
                }}
                className={`flex items-center justify-between w-full md:w-48 px-3 py-2 text-sm border rounded-lg ${
                  selectedMachines.length > 0
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                <span className="truncate">
                  {selectedMachines.length > 0
                    ? `${selectedMachines.length} Machine(s)`
                    : "All Machines"}
                </span>
                <span className="text-xs">▼</span>
              </button>
              {showMachineDropdown && (
                <div className="absolute z-20 w-64 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[300px] overflow-hidden flex flex-col">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={machineSearchTerm}
                    onChange={(e) => setMachineSearchTerm(e.target.value)}
                    className="w-full p-2 mb-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex-1 overflow-y-auto">
                    {machinesList
                      .filter((m) =>
                        m
                          .toLowerCase()
                          .includes(machineSearchTerm.toLowerCase())
                      )
                      .map((machine) => (
                        <div
                          key={machine}
                          onClick={() =>
                            handleSelection(
                              machine,
                              selectedMachines,
                              setSelectedMachines
                            )
                          }
                          className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMachines.includes(machine)}
                            readOnly
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded pointer-events-none focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 truncate">
                            {machine}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filled By Dropdown */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => {
                  setShowFilledByDropdown(!showFilledByDropdown);
                  setShowMachineDropdown(false);
                  setShowStatusDropdown(false);
                }}
                className={`flex items-center justify-between w-full md:w-48 px-3 py-2 text-sm border rounded-lg ${
                  selectedFilledBy.length > 0
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                <span className="truncate">
                  {selectedFilledBy.length > 0
                    ? `${selectedFilledBy.length} Person(s)`
                    : "Filled By"}
                </span>
                <span className="text-xs">▼</span>
              </button>
              {showFilledByDropdown && (
                <div className="absolute z-20 w-64 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[300px] overflow-hidden flex flex-col">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filledBySearchTerm}
                    onChange={(e) => setFilledBySearchTerm(e.target.value)}
                    className="w-full p-2 mb-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-orange-500"
                  />
                  <div className="flex-1 overflow-y-auto">
                    {filledByList
                      .filter((p) =>
                        p
                          .toLowerCase()
                          .includes(filledBySearchTerm.toLowerCase())
                      )
                      .map((person) => (
                        <div
                          key={person}
                          onClick={() =>
                            handleSelection(
                              person,
                              selectedFilledBy,
                              setSelectedFilledBy
                            )
                          }
                          className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFilledBy.includes(person)}
                            readOnly
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded pointer-events-none focus:ring-orange-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 truncate">
                            {person}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative filter-dropdown">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowMachineDropdown(false);
                  setShowFilledByDropdown(false);
                }}
                className={`flex items-center justify-between w-full md:w-48 px-3 py-2 text-sm border rounded-lg ${
                  selectedStatus.length > 0
                    ? "border-orange-500 bg-orange-50 text-orange-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                <span className="truncate">
                  {selectedStatus.length > 0
                    ? `${selectedStatus.length} Status(es)`
                    : "All Status"}
                </span>
                <span className="text-xs">▼</span>
              </button>
              {showStatusDropdown && (
                <div className="absolute z-20 w-56 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-[300px] overflow-y-auto">
                  {statusList.map((status) => (
                    <div
                      key={status}
                      onClick={() =>
                        handleSelection(
                          status,
                          selectedStatus,
                          setSelectedStatus
                        )
                      }
                      className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes(status)}
                        readOnly
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded pointer-events-none focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 truncate">
                        {status || "Empty"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Reset Button */}
            {(selectedMachines.length > 0 ||
              selectedFilledBy.length > 0 ||
              selectedStatus.length > 0 ||
              startDate ||
              endDate ||
              searchTerm) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm font-medium text-red-600 transition-colors rounded-lg bg-red-50 hover:bg-red-100"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Total Records
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {filteredHistoryData.length}
            </p>
          </div>
          <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Total Cost
            </p>
            <p className="mt-1 text-2xl font-bold text-orange-600">
              {formatCurrency(
                filteredHistoryData.reduce(
                  (sum, item) => sum + (Number(item.billAmount) || 0),
                  0
                )
              )}
            </p>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden bg-white border border-gray-200 shadow-md rounded-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="w-10 h-10 mb-4 text-orange-500 animate-spin" />
              <p className="text-gray-500">Loading history data...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              <p>{error}</p>
              <button
                onClick={fetchHistoryData}
                className="mt-4 text-sm font-medium underline hover:text-red-700"
              >
                Retry
              </button>
            </div>
          ) : filteredHistoryData.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No records found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                      Date & Task ID
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                      Machine & Issue
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                      Personnel
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                      Work Details
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                      Bill Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase whitespace-nowrap">
                      Bill Copy
                    </th>
                    <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase whitespace-nowrap">
                      Work Done Photo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistoryData.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(item.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {item.taskId}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top min-w-[200px]">
                        <div className="text-sm font-semibold text-orange-700">
                          {item.machineName}
                        </div>
                        <div
                          className="text-xs text-gray-600 line-clamp-2"
                          title={item.issueDetail}
                        >
                          {item.issueDetail || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="text-xs">
                          <span className="text-gray-500">Req:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {item.filledBy}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Doer:</span>{" "}
                          <span className="font-medium text-gray-900">
                            {item.assignedTo || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center align-top">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top min-w-[200px]">
                        <div className="space-y-1 text-xs text-gray-700">
                          {item.partReplaced && (
                            <div>
                              <span className="font-medium text-gray-500">
                                Part:
                              </span>{" "}
                              {item.partReplaced}
                            </div>
                          )}
                          {item.workDone && (
                            <div>
                              <span className="font-medium text-gray-500">
                                Work:
                              </span>{" "}
                              {item.workDone}
                            </div>
                          )}
                          {item.remarks && (
                            <div className="italic text-gray-500">
                              "{item.remarks}"
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(item.billAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.vendorName}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center align-top whitespace-nowrap">
                        {item.billCopyUrl ? (
                          <a
                            href={item.billCopyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                            title="View Bill"
                          >
                            <FileText size={14} />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center align-top whitespace-nowrap">
                        {item.photoUrl ? (
                          <a
                            href={item.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200"
                            title="View Photo"
                          >
                            <Eye size={14} />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Card View (visible on small screens only if we hide table via CSS, but normally we use hidden classes) */}
              {/* Note: The parent div has overflow-x-auto, so table scrolls on mobile. 
                  However, cards are often better. Let's add a conditional render for mobile. */}
            </div>
          )}
        </div>

        {/* Mobile View - Cards (Hidden on md+) */}
        <div className="space-y-4 md:hidden">
          {!loading &&
            !error &&
            filteredHistoryData.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">
                      {item.taskId} • {formatDate(item.timestamp)}
                    </span>
                    <h3 className="font-bold text-orange-700">
                      {item.machineName}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.status || "Pending"}
                  </span>
                </div>

                <div className="mb-3 text-sm text-gray-700">
                  <p className="mb-1">
                    <span className="font-semibold">Issue:</span>{" "}
                    {item.issueDetail}
                  </p>
                  {(item.partReplaced || item.workDone) && (
                    <div className="p-2 text-xs rounded bg-gray-50">
                      {item.partReplaced && <p>Part: {item.partReplaced}</p>}
                      {item.workDone && <p>Work: {item.workDone}</p>}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    {item.photoUrl && (
                      <a
                        href={item.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600"
                      >
                        <Eye size={14} /> Photo
                      </a>
                    )}
                    {item.billCopyUrl && (
                      <a
                        href={item.billCopyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600"
                      >
                        <FileText size={14} /> Bill
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{item.vendorName}</p>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.billAmount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Repairing_History;
