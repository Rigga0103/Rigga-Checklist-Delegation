import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CheckCircle2, X, Search, Loader2 } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";

const SHEET_ID = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
const FORM_SHEET = "Maitenence_Form";
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec";

const Repairing_History = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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

  // Parse date from DD/MM/YYYY format
  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const datePart = dateStr.includes(" ") ? dateStr.split(" ")[0] : dateStr;
    const parts = datePart.split("/");
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  // Fetch data from Google Sheets
  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${FORM_SHEET}`
      );
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));

      const rows = json.table.rows;

      const machinesSet = new Set();
      const filledBySet = new Set();
      const historyRows = [];

      rows?.forEach((row, rowIndex) => {
        // Check if row has cells
        if (!row.c) return;

        const rowValues = row.c.map((cell) =>
          cell && cell.v !== undefined ? cell.v : ""
        );

        // Extract data based on column structure:
        // 0: Timestamp, 1: Form Filled By, 2: Machine Name, 3: Part Replaced,
        // 4: Work Done, 5: Photo URL, 6: Remarks, 7: Status,
        // 8: Bill Amount, 9: Bill Copy, 10: Vendor Name

        const formFilledBy = rowValues[1] || "";
        const machineName = rowValues[2] || "";

        if (formFilledBy) filledBySet.add(formFilledBy);
        if (machineName) machinesSet.add(machineName);

        const rowData = {
          _id: `row_${rowIndex}`,
          _rowIndex: rowIndex + 1,
          timestamp: rowValues[0] || "",
          formFilledBy: formFilledBy,
          machineName: machineName,
          partReplaced: rowValues[3] || "",
          workDone: rowValues[4] || "",
          photoUrl: rowValues[5] || "",
          remarks: rowValues[6] || "",
          status: rowValues[7] || "",
          billAmount: rowValues[8] || "",
          billCopy: rowValues[9] || "",
          vendorName: rowValues[10] || "",
        };

        historyRows.push(rowData);
      });

      setMachinesList(Array.from(machinesSet).sort());
      setFilledByList(Array.from(filledBySet).sort());
      setHistoryData(historyRows);
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMachineDropdown && !event.target.closest(".machine-dropdown")) {
        setShowMachineDropdown(false);
      }
      if (showFilledByDropdown && !event.target.closest(".filledby-dropdown")) {
        setShowFilledByDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMachineDropdown, showFilledByDropdown]);

  const handleMachineSelection = (machine) => {
    setSelectedMachines((prev) => {
      if (prev.includes(machine)) {
        return prev.filter((item) => item !== machine);
      } else {
        return [...prev, machine];
      }
    });
  };

  const handleFilledBySelection = (person) => {
    setSelectedFilledBy((prev) => {
      if (prev.includes(person)) {
        return prev.filter((item) => item !== person);
      } else {
        return [...prev, person];
      }
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMachines([]);
    setSelectedFilledBy([]);
    setStartDate("");
    setEndDate("");
  };

  // Filter data
  const filteredHistoryData = useMemo(() => {
    return historyData
      .filter((item) => {
        const matchesSearch = searchTerm
          ? Object.values(item).some(
              (value) =>
                value &&
                value
                  .toString()
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
            )
          : true;

        const matchesMachine =
          selectedMachines.length > 0
            ? selectedMachines.includes(item.machineName)
            : true;

        const matchesFilledBy =
          selectedFilledBy.length > 0
            ? selectedFilledBy.includes(item.formFilledBy)
            : true;

        let matchesDateRange = true;
        if (startDate || endDate) {
          const itemDate = parseDateFromDDMMYYYY(item.timestamp);
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
          matchesSearch && matchesMachine && matchesFilledBy && matchesDateRange
        );
      })
      .sort((a, b) => {
        const dateA = parseDateFromDDMMYYYY(a.timestamp);
        const dateB = parseDateFromDDMMYYYY(b.timestamp);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });
  }, [
    historyData,
    searchTerm,
    selectedMachines,
    selectedFilledBy,
    startDate,
    endDate,
  ]);

  const getStatistics = () => {
    return {
      totalRecords: historyData.length,
      filteredTotal: filteredHistoryData.length,
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
            <p className="text-gray-600">Loading repairing history...</p>
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
          <h1 className="text-2xl font-bold tracking-tight text-center text-purple-700 sm:text-left">
            Repairing History
          </h1>

          <div className="flex flex-col w-full gap-3 sm:flex-row sm:items-center sm:gap-4 sm:w-auto">
            {/* Search box */}
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2"
                size={18}
              />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="flex items-center justify-between px-4 py-3 text-green-700 border border-green-200 rounded-md bg-green-50">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage("")}
              className="text-green-500 hover:text-green-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-red-800 rounded-md bg-red-50">
            {error}{" "}
            <button
              className="ml-2 underline"
              onClick={() => fetchHistoryData()}
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-hidden bg-white border border-purple-200 rounded-lg shadow-md">
          <div className="p-4 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <h2 className="font-medium text-purple-700">
              Repairing Form Submissions
            </h2>
            <p className="text-sm text-purple-600">
              View all submitted repairing form entries
            </p>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-purple-100 bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Machine Filter */}
              {machinesList.length > 0 && (
                <div className="flex flex-col machine-dropdown">
                  <span className="mb-2 text-sm font-medium text-purple-700">
                    Filter by Machine:
                  </span>
                  <div className="relative min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search machines..."
                      value={machineSearchTerm}
                      onChange={(e) => setMachineSearchTerm(e.target.value)}
                      onFocus={() => setShowMachineDropdown(true)}
                      className="w-full p-2 pr-8 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Search
                      className="absolute text-gray-400 transform -translate-y-1/2 right-2 top-1/2"
                      size={18}
                    />
                    {showMachineDropdown && (
                      <div className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60">
                        {machinesList
                          .filter((machine) =>
                            machine
                              .toLowerCase()
                              .includes(machineSearchTerm.toLowerCase())
                          )
                          .map((machine, idx) => (
                            <div
                              key={idx}
                              className="flex items-center px-3 py-2 cursor-pointer hover:bg-purple-50"
                              onClick={() => handleMachineSelection(machine)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedMachines.includes(machine)}
                                onChange={() => {}}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded pointer-events-none focus:ring-purple-500"
                              />
                              <label className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer">
                                {machine}
                              </label>
                            </div>
                          ))}
                      </div>
                    )}
                    {selectedMachines.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedMachines.map((machine, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded-md"
                          >
                            {machine}
                            <button
                              onClick={() => handleMachineSelection(machine)}
                              className="ml-1 text-purple-600 hover:text-purple-800"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Filled By Filter */}
              {filledByList.length > 0 && (
                <div className="flex flex-col filledby-dropdown">
                  <span className="mb-2 text-sm font-medium text-purple-700">
                    Filter by Filled By:
                  </span>
                  <div className="relative min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={filledBySearchTerm}
                      onChange={(e) => setFilledBySearchTerm(e.target.value)}
                      onFocus={() => setShowFilledByDropdown(true)}
                      className="w-full p-2 pr-8 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Search
                      className="absolute text-gray-400 transform -translate-y-1/2 right-2 top-1/2"
                      size={18}
                    />
                    {showFilledByDropdown && (
                      <div className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60">
                        {filledByList
                          .filter((person) =>
                            person
                              .toLowerCase()
                              .includes(filledBySearchTerm.toLowerCase())
                          )
                          .map((person, idx) => (
                            <div
                              key={idx}
                              className="flex items-center px-3 py-2 cursor-pointer hover:bg-purple-50"
                              onClick={() => handleFilledBySelection(person)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedFilledBy.includes(person)}
                                onChange={() => {}}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded pointer-events-none focus:ring-purple-500"
                              />
                              <label className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer">
                                {person}
                              </label>
                            </div>
                          ))}
                      </div>
                    )}
                    {selectedFilledBy.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedFilledBy.map((person, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 text-xs text-purple-700 bg-purple-100 rounded-md"
                          >
                            {person}
                            <button
                              onClick={() => handleFilledBySelection(person)}
                              className="ml-1 text-purple-600 hover:text-purple-800"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              <div className="flex flex-col">
                <span className="mb-2 text-sm font-medium text-purple-700">
                  Filter by Date Range:
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <label
                      htmlFor="start-date"
                      className="mr-1 text-sm text-gray-700"
                    >
                      From
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="p-1 text-sm border border-gray-200 rounded-md"
                    />
                  </div>
                  <div className="flex items-center">
                    <label
                      htmlFor="end-date"
                      className="mr-1 text-sm text-gray-700"
                    >
                      To
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="p-1 text-sm border border-gray-200 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedMachines.length > 0 ||
                selectedFilledBy.length > 0 ||
                startDate ||
                endDate ||
                searchTerm) && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="p-4 border-b border-purple-100 bg-blue-50">
            <div className="flex flex-col">
              <h3 className="mb-2 text-sm font-medium text-blue-700">
                Statistics:
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="px-3 py-2 bg-white rounded-md shadow-sm">
                  <span className="text-xs text-gray-500">Total Records</span>
                  <div className="text-lg font-semibold text-blue-600">
                    {getStatistics().totalRecords}
                  </div>
                </div>
                {(selectedMachines.length > 0 ||
                  selectedFilledBy.length > 0 ||
                  startDate ||
                  endDate ||
                  searchTerm) && (
                  <div className="px-3 py-2 bg-white rounded-md shadow-sm">
                    <span className="text-xs text-gray-500">
                      Filtered Results
                    </span>
                    <div className="text-lg font-semibold text-blue-600">
                      {getStatistics().filteredTotal}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block h-[calc(100vh-400px)] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                    Timestamp
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Form Filled By
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Machine Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Part Replaced
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    Work Done
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    Photo
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                    Remarks
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 min-w-[100px]">
                    Bill Amount
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 min-w-[100px]">
                    Bill Copy
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 min-w-[120px]">
                    Vendor Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistoryData.length > 0 ? (
                  filteredHistoryData.map((row) => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[140px]">
                        {row.timestamp || "—"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px]">
                        {row.formFilledBy || "—"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px]">
                        {row.machineName || "—"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px]">
                        {row.partReplaced || "—"}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px]">
                        {row.workDone || "—"}
                      </td>
                      <td className="px-3 py-4 min-w-[100px]">
                        {row.photoUrl ? (
                          <a
                            href={row.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 underline hover:text-blue-800"
                          >
                            <img
                              src={row.photoUrl}
                              alt="Photo"
                              className="object-cover w-8 h-8 mr-2 rounded-md"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">No photo</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[150px]">
                        {row.remarks || "—"}
                      </td>
                      <td className="px-3 py-4 min-w-[80px]">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.status?.toLowerCase() === "completed"
                              ? "bg-green-100 text-green-800"
                              : row.status?.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {row.status || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 bg-yellow-50 min-w-[100px]">
                        {row.billAmount ? `₹${row.billAmount}` : "—"}
                      </td>
                      <td className="px-3 py-4 bg-yellow-50 min-w-[100px]">
                        {row.billCopy ? (
                          <a
                            href={row.billCopy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            View Bill
                          </a>
                        ) : (
                          <span className="text-gray-400">No bill</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 bg-yellow-50 min-w-[120px]">
                        {row.vendorName || "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {searchTerm ||
                      selectedMachines.length > 0 ||
                      selectedFilledBy.length > 0 ||
                      startDate ||
                      endDate
                        ? "No records matching your filters"
                        : "No repairing records found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4 p-4 max-h-[calc(100vh-400px)] overflow-auto">
            {filteredHistoryData.length > 0 ? (
              filteredHistoryData.map((row) => (
                <div
                  key={row._id}
                  className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">
                        Timestamp:
                      </span>
                      <span className="text-sm text-gray-900">
                        {row.timestamp || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">
                        Filled By:
                      </span>
                      <span className="text-gray-900">
                        {row.formFilledBy || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">
                        Machine:
                      </span>
                      <span className="text-gray-900">
                        {row.machineName || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">
                        Part Replaced:
                      </span>
                      <span className="text-gray-900">
                        {row.partReplaced || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">
                        Work Done:
                      </span>
                      <span className="text-gray-900">
                        {row.workDone || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.status?.toLowerCase() === "completed"
                            ? "bg-green-100 text-green-800"
                            : row.status?.toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {row.status || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium text-gray-700">
                        Remarks:
                      </span>
                      <span className="text-sm text-gray-900">
                        {row.remarks || "—"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 px-4 pt-2 pb-2 -mx-4 rounded-b-lg bg-yellow-50">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Bill Amount:
                        </span>
                        <p className="text-gray-900">
                          {row.billAmount ? `₹${row.billAmount}` : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Vendor:
                        </span>
                        <p className="text-gray-900">{row.vendorName || "—"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Photo:
                        </span>
                        {row.photoUrl ? (
                          <a
                            href={row.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          Bill Copy:
                        </span>
                        {row.billCopy ? (
                          <a
                            href={row.billCopy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500">
                {searchTerm ||
                selectedMachines.length > 0 ||
                selectedFilledBy.length > 0 ||
                startDate ||
                endDate
                  ? "No records matching your filters"
                  : "No repairing records found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Repairing_History;
