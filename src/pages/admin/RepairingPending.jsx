"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Upload,
  X,
  Search,
  Edit,
  Save,
  XCircle,
  Wrench,
  Loader2,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import useMaintenanceFormStore from "../../stores/useMaintenanceFormStore";

// Configuration object for Repairing Pending
const CONFIG = {
  APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
  DRIVE_FOLDER_ID: "1Y1lg8X7qFA4KgvcaVA_ywKx1gOnZ2ZO6",
  SHEET_NAME: "Maitenence_Form",
  PAGE_CONFIG: {
    title: "Repairing Tasks",
    historyTitle: "Repairing Pending Tasks",
    description: "Showing pending repairing/maintenance tasks",
    historyDescription: "View of pending repairing tasks awaiting completion",
  },
};

// Column mapping for Maitenence_Form sheet
// A: Time Stamp (col0)
// B: Task ID (col1)
// C: Form Filled By Name (col2)
// D: To Assign Person (col3)
// E: Machine Name (col4)
// F: Issue Detail (col5)
// G: Part Replaced (col6)
// H: Task Start Date (col7)
// I: Actual (col8)
// J: Delay (col9)
// K: Work Done (col10)
// L: Photo of Work Done (col11)
// M: Status (col12)
// N: Vendor Name (col13)
// O: Bill copy (col14)
// P: Bill Amount (col15)
// Q: Remarks (col16)

function RepairingPending() {
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState("");

  // Admin history selection states
  const [selectedHistoryItems, setSelectedHistoryItems] = useState([]);
  const [markingAsDone, setMarkingAsDone] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    itemCount: 0,
  });

  // Edit Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    partReplaced: "",
    taskStartDate: "",
    workDone: "",
    photo: null,
    status: "",
    vendorName: "",
    billCopy: null,
    billAmount: "",
    remarks: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [billCopyPreview, setBillCopyPreview] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Get dropdown data from Zustand store
  const { workDoneList, statusList, fetchMasterData } =
    useMaintenanceFormStore();

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  // Format date-time to DD/MM/YYYY HH:MM:SS
  const formatDateTimeToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatDateToDDMMYYYY = (date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const isEmpty = (value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  };

  useEffect(() => {
    const role = sessionStorage.getItem("role");
    const user = sessionStorage.getItem("username");
    setUserRole(role || "");
    setUsername(user || "");
  }, []);

  const parseGoogleSheetsDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    if (
      typeof dateTimeStr === "string" &&
      dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/)
    ) {
      return dateTimeStr;
    }
    if (
      typeof dateTimeStr === "string" &&
      dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}$/)
    ) {
      return dateTimeStr;
    }
    if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
      const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateTimeStr);
      if (match) {
        const year = Number.parseInt(match[1], 10);
        const month = Number.parseInt(match[2], 10);
        const day = Number.parseInt(match[3], 10);
        return `${day.toString().padStart(2, "0")}/${(month + 1)
          .toString()
          .padStart(2, "0")}/${year}`;
      }
    }
    try {
      const date = new Date(dateTimeStr);
      if (!isNaN(date.getTime())) {
        if (
          typeof dateTimeStr === "string" &&
          (dateTimeStr.includes(":") || dateTimeStr.includes("T"))
        ) {
          return formatDateTimeToDDMMYYYY(date);
        } else {
          return formatDateToDDMMYYYY(date);
        }
      }
    } catch (error) {
      console.error("Error parsing date-time:", error);
    }
    return dateTimeStr;
  };

  const parseDateFromDDMMYYYY = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const datePart = dateStr.includes(" ") ? dateStr.split(" ")[0] : dateStr;
    const parts = datePart.split("/");
    if (parts.length !== 3) return null;
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedMembers([]);
    setStartDate("");
    setEndDate("");
  };

  // Edit Modal functions
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditFormData({
      partReplaced: item.col6 || "",
      taskStartDate: item.col7 || "",
      workDone: item.col10 || "",
      photo: null,
      status: item.col12 || "",
      vendorName: item.col13 || "",
      billCopy: null,
      billAmount: item.col15 || "",
      remarks: item.col16 || "",
    });
    setPhotoPreview(item.col11 || null);
    setBillCopyPreview(item.col14 || null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    setEditFormData({
      partReplaced: "",
      taskStartDate: "",
      workDone: "",
      photo: null,
      status: "",
      vendorName: "",
      billCopy: null,
      billAmount: "",
      remarks: "",
    });
    setPhotoPreview(null);
    setBillCopyPreview(null);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBillCopyChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData((prev) => ({ ...prev, billCopy: file }));
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setBillCopyPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setBillCopyPreview(file.name);
      }
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveEditModal = async () => {
    if (!editingItem) return;
    setSavingEdit(true);

    try {
      let photoBase64 = "";
      if (editFormData.photo) {
        photoBase64 = await convertFileToBase64(editFormData.photo);
      }

      let billCopyBase64 = "";
      if (editFormData.billCopy) {
        billCopyBase64 = await convertFileToBase64(editFormData.billCopy);
      }

      // Format task start date if provided
      let formattedStartDate = editFormData.taskStartDate;
      if (
        editFormData.taskStartDate &&
        !editFormData.taskStartDate.includes("/")
      ) {
        // Convert from YYYY-MM-DD to DD/MM/YYYY
        const parts = editFormData.taskStartDate.split("-");
        if (parts.length === 3) {
          formattedStartDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }

      // Generate current timestamp for the "Actual" field
      const actualTimestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      const updateData = {
        rowIndex: editingItem._rowIndex,
        taskId: editingItem._taskId,
        partReplaced: editFormData.partReplaced,
        taskStartDate: formattedStartDate,
        actualDate: actualTimestamp, // Column I: Actual - current timestamp
        workDone: editFormData.workDone,
        photoBase64: photoBase64,
        status: editFormData.status,
        vendorName: editFormData.vendorName,
        billCopyBase64: billCopyBase64,
        billAmount: editFormData.billAmount,
        remarks: editFormData.remarks,
      };

      console.log("=== UPDATE REPAIR DETAILS REQUEST ===");
      console.log("Row Index:", editingItem._rowIndex);
      console.log("Update Data:", updateData);

      const formData = new FormData();
      formData.append("sheetName", CONFIG.SHEET_NAME);
      formData.append("action", "updateRepairDetails");
      formData.append("rowData", JSON.stringify(updateData));

      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Raw Response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", responseText);
        throw new Error(
          "Invalid response from server: " + responseText.substring(0, 200)
        );
      }

      console.log("Parsed Result:", result);

      if (result.success) {
        setSuccessMessage("Repair details updated successfully!");
        closeEditModal();
        // Refresh data
        setTimeout(() => {
          fetchSheetData();
        }, 1000);
      } else {
        throw new Error(result.error || "Failed to update repair details");
      }
    } catch (error) {
      console.error("Error saving edit:", error);
      setSuccessMessage(`Failed to update: ${error.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Admin functions for history management
  const handleMarkMultipleDone = async () => {
    if (selectedHistoryItems.length === 0) return;
    if (markingAsDone) return;
    setConfirmationModal({
      isOpen: true,
      itemCount: selectedHistoryItems.length,
    });
  };

  const ConfirmationModal = ({ isOpen, itemCount, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 mr-4 text-yellow-600 bg-yellow-100 rounded-full">
              <Wrench className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Mark Repairs as Complete
            </h2>
          </div>
          <p className="mb-6 text-center text-gray-600">
            Are you sure you want to mark {itemCount}{" "}
            {itemCount === 1 ? "repair" : "repairs"} as complete?
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-white transition-colors bg-green-600 rounded-md hover:bg-green-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const confirmMarkDone = async () => {
    setConfirmationModal({ isOpen: false, itemCount: 0 });
    setMarkingAsDone(true);

    try {
      const submissionData = selectedHistoryItems.map((historyItem) => ({
        taskId: historyItem._taskId || historyItem["col1"],
        rowIndex: historyItem._rowIndex,
        // Use new "Completed" status format
        status: "✅ Completed (कार्य पूर्ण)",
      }));

      const formData = new FormData();
      formData.append("sheetName", CONFIG.SHEET_NAME);
      formData.append("action", "updateStatus");
      formData.append("rowData", JSON.stringify(submissionData));

      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        setHistoryData((prev) =>
          prev.filter(
            (item) =>
              !selectedHistoryItems.some(
                (selected) => selected._id === item._id
              )
          )
        );
        setSelectedHistoryItems([]);
        setSuccessMessage(
          `Successfully marked ${selectedHistoryItems.length} repairs as complete!`
        );
        setTimeout(() => {
          fetchSheetData();
        }, 2000);
      } else {
        throw new Error(result.error || "Failed to mark repairs as complete");
      }
    } catch (error) {
      console.error("Error marking repairs as complete:", error);
      setSuccessMessage(`Failed to mark repairs as complete: ${error.message}`);
    } finally {
      setMarkingAsDone(false);
    }
  };

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
        const matchesMember =
          selectedMembers.length > 0
            ? selectedMembers.includes(item["col3"])
            : true;
        let matchesDateRange = true;
        if (startDate || endDate) {
          const itemDate = parseDateFromDDMMYYYY(item["col7"]);
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
        return matchesSearch && matchesMember && matchesDateRange;
      })
      .sort((a, b) => {
        const dateStrA = a["col0"] || "";
        const dateStrB = b["col0"] || "";
        const dateA = parseDateFromDDMMYYYY(dateStrA);
        const dateB = parseDateFromDDMMYYYY(dateStrB);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });
  }, [historyData, searchTerm, selectedMembers, startDate, endDate]);

  const getTaskStatistics = () => {
    const totalPending = historyData.length;
    const memberStats =
      selectedMembers.length > 0
        ? selectedMembers.reduce((stats, member) => {
            const memberTasks = historyData.filter(
              (task) => task["col3"] === member
            ).length;
            return { ...stats, [member]: memberTasks };
          }, {})
        : {};
    const filteredTotal = filteredHistoryData.length;
    return { totalPending, memberStats, filteredTotal };
  };

  const handleMemberSelection = (member) => {
    setSelectedMembers((prev) => {
      if (prev.includes(member)) {
        return prev.filter((item) => item !== member);
      } else {
        return [...prev, member];
      }
    });
  };

  const getFilteredMembersList = () => {
    if (userRole === "admin") {
      return membersList;
    } else {
      return membersList.filter(
        (member) => member.toLowerCase() === username.toLowerCase()
      );
    }
  };

  const fetchSheetData = useCallback(async () => {
    try {
      setLoading(true);
      const pendingRepairs = [];
      const response = await fetch(
        `${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.SHEET_NAME}&action=fetch`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        const jsonStart = text.indexOf("{");
        const jsonEnd = text.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = text.substring(jsonStart, jsonEnd + 1);
          data = JSON.parse(jsonString);
        } else {
          throw new Error("Invalid JSON response from server");
        }
      }

      const currentUsername = sessionStorage.getItem("username");
      const currentUserRole = sessionStorage.getItem("role");

      const membersSet = new Set();
      let rows = [];
      if (data.table && data.table.rows) {
        rows = data.table.rows;
      } else if (Array.isArray(data)) {
        rows = data;
      } else if (data.values) {
        rows = data.values.map((row) => ({
          c: row.map((val) => ({ v: val })),
        }));
      }

      rows.forEach((row, rowIndex) => {
        if (rowIndex === 0) return;
        let rowValues = [];
        if (row.c) {
          rowValues = row.c.map((cell) =>
            cell && cell.v !== undefined ? cell.v : ""
          );
        } else if (Array.isArray(row)) {
          rowValues = row;
        } else {
          return;
        }

        const assignedTo = rowValues[3] || "Unassigned";
        membersSet.add(assignedTo);

        const isUserMatch =
          currentUserRole === "admin" ||
          assignedTo.toLowerCase() === currentUsername.toLowerCase();
        if (!isUserMatch && currentUserRole !== "admin") return;

        const actualDate = rowValues[8];
        const status = rowValues[12];

        // Filter Logic:
        // 1. If "Actual" (Column I) has a date, it means task is done -> HIDE IT
        // 2. If "Status" is Completed or Cancelled -> HIDE IT
        if (!isEmpty(actualDate)) {
          return;
        }

        if (
          status &&
          (status.toString().trim().includes("Completed") ||
            status.toString().trim().includes("Cancelled"))
        ) {
          return;
        }

        const googleSheetsRowIndex = rowIndex + 1;
        const taskId = rowValues[1] || "";
        const stableId = taskId
          ? `task_${taskId}_${googleSheetsRowIndex}`
          : `row_${googleSheetsRowIndex}_${Math.random()
              .toString(36)
              .substring(2, 15)}`;

        const rowData = {
          _id: stableId,
          _rowIndex: googleSheetsRowIndex,
          _taskId: taskId,
          col0: rowValues[0]
            ? parseGoogleSheetsDateTime(String(rowValues[0]))
            : "",
          col1: rowValues[1] || "",
          col2: rowValues[2] || "",
          col3: rowValues[3] || "",
          col4: rowValues[4] || "",
          col5: rowValues[5] || "",
          col6: rowValues[6] || "",
          col7: rowValues[7]
            ? parseGoogleSheetsDateTime(String(rowValues[7]))
            : "",
          col8: rowValues[8]
            ? parseGoogleSheetsDateTime(String(rowValues[8]))
            : "",
          col9: rowValues[9] || "",
          col10: rowValues[10] || "",
          col11: rowValues[11] || "",
          col12: rowValues[12] || "",
          col13: rowValues[13] || "",
          col14: rowValues[14] || "",
          col15: rowValues[15] || "",
          col16: rowValues[16] || "",
        };

        pendingRepairs.push(rowData);
      });

      setMembersList(Array.from(membersSet).sort());
      setHistoryData(pendingRepairs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      setError("Failed to load repair data: " + error.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMemberDropdown && !event.target.closest(".relative")) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMemberDropdown]);

  // Render Edit Modal inline (not as a nested component to prevent focus loss)
  const renderEditModal = () => {
    if (!editModalOpen || !editingItem) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Edit Repair Details
            </h2>
            <button
              onClick={closeEditModal}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Read-only info */}
            <div className="p-4 rounded-lg bg-gray-50">
              <h3 className="mb-3 font-semibold text-gray-700">
                Request Info (Read-only)
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Task ID:</span>
                  <span className="ml-2 font-medium">
                    {editingItem.col1 || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Form Filled By:</span>
                  <span className="ml-2 font-medium">
                    {editingItem.col2 || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Assigned To:</span>
                  <span className="ml-2 font-medium">
                    {editingItem.col3 || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Machine:</span>
                  <span className="ml-2 font-medium text-orange-700">
                    {editingItem.col4 || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Issue Detail:</span>
                  <p className="mt-1 font-medium">{editingItem.col5 || "—"}</p>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Part Replaced */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Part Replaced
                </label>
                <input
                  type="text"
                  value={editFormData.partReplaced}
                  onChange={(e) =>
                    handleEditInputChange("partReplaced", e.target.value)
                  }
                  placeholder="Enter part name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Work Done */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Work Done
                </label>
                <select
                  value={editFormData.workDone}
                  onChange={(e) =>
                    handleEditInputChange("workDone", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select work done...</option>
                  {workDoneList
                    .filter((item) => item !== "Other")
                    .map((item, idx) => (
                      <option key={idx} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    handleEditInputChange("status", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select status...</option>
                  {statusList
                    .filter((item) => item !== "Other")
                    .map((item, idx) => (
                      <option key={idx} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </div>

              {/* Vendor Name */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={editFormData.vendorName}
                  onChange={(e) =>
                    handleEditInputChange("vendorName", e.target.value)
                  }
                  placeholder="Enter vendor name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Bill Amount */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Bill Amount (₹)
                </label>
                <input
                  type="number"
                  value={editFormData.billAmount}
                  onChange={(e) =>
                    handleEditInputChange("billAmount", e.target.value)
                  }
                  placeholder="Enter bill amount..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Remarks
              </label>
              <textarea
                value={editFormData.remarks}
                onChange={(e) =>
                  handleEditInputChange("remarks", e.target.value)
                }
                placeholder="Enter any additional remarks..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Photo of Work Done */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Photo of Work Done
              </label>
              <div className="flex items-start gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="p-4 text-center transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-500">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {editFormData.photo
                        ? editFormData.photo.name
                        : "Click to upload photo"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="object-cover w-24 h-24 rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bill Copy */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Bill Copy
              </label>
              <div className="flex items-start gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="p-4 text-center transition-colors border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-500">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {editFormData.billCopy
                        ? editFormData.billCopy.name
                        : "Click to upload bill copy"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleBillCopyChange}
                    className="hidden"
                  />
                </label>
                {billCopyPreview &&
                  typeof billCopyPreview === "string" &&
                  billCopyPreview.startsWith("http") && (
                    <div className="flex-shrink-0">
                      <a
                        href={billCopyPreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View existing bill
                      </a>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 flex justify-end gap-3 p-4 bg-white border-t">
            <button
              onClick={closeEditModal}
              className="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEditModal}
              disabled={savingEdit}
              className="flex items-center gap-2 px-4 py-2 text-white transition-colors bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingEdit ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-center text-orange-700 sm:text-left">
            <Wrench className="w-6 h-6" />
            {CONFIG.PAGE_CONFIG.historyTitle}
          </h1>

          <div className="flex flex-col w-full gap-3 sm:flex-row sm:items-center sm:gap-4 sm:w-auto">
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
                className="w-full py-2 pl-10 pr-4 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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

        <div className="overflow-hidden bg-white border border-orange-200 rounded-lg shadow-md">
          <div className="p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50">
            <h2 className="flex items-center gap-2 font-medium text-orange-700">
              <Wrench className="w-5 h-5" />
              Pending Repair Tasks
            </h2>
            <p className="text-sm text-orange-600">
              {`${CONFIG.PAGE_CONFIG.historyDescription} for ${
                userRole === "admin" ? "all" : "your"
              } assignments`}
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <div className="inline-block w-8 h-8 mb-4 border-t-2 border-b-2 border-orange-500 rounded-full animate-spin"></div>
              <p className="text-orange-600">Loading repair data...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-800 rounded-md bg-red-50">
              {error}{" "}
              <button
                className="ml-2 underline"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="p-4 border-b border-orange-100 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {getFilteredMembersList().length > 0 &&
                    userRole === "admin" && (
                      <div className="flex flex-col">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-orange-700">
                            Filter by Assigned Person:
                          </span>
                        </div>
                        <div className="relative min-w-[250px]">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search members..."
                              value={memberSearchTerm}
                              onChange={(e) =>
                                setMemberSearchTerm(e.target.value)
                              }
                              onFocus={() => setShowMemberDropdown(true)}
                              className="w-full p-2 pr-8 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <Search
                              className="absolute text-gray-400 transform -translate-y-1/2 right-2 top-1/2"
                              size={18}
                            />
                          </div>

                          {showMemberDropdown && (
                            <div className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60">
                              {getFilteredMembersList()
                                .filter((member) =>
                                  member
                                    .toLowerCase()
                                    .includes(memberSearchTerm.toLowerCase())
                                )
                                .map((member, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center px-3 py-2 cursor-pointer hover:bg-orange-50"
                                    onClick={() =>
                                      handleMemberSelection(member)
                                    }
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedMembers.includes(member)}
                                      onChange={() => {}}
                                      className="w-4 h-4 text-orange-600 border-gray-300 rounded pointer-events-none focus:ring-orange-500"
                                    />
                                    <label className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer">
                                      {member}
                                    </label>
                                  </div>
                                ))}
                              {getFilteredMembersList().filter((member) =>
                                member
                                  .toLowerCase()
                                  .includes(memberSearchTerm.toLowerCase())
                              ).length === 0 && (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  No members found
                                </div>
                              )}
                            </div>
                          )}

                          {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedMembers.map((member, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 text-xs text-orange-700 bg-orange-100 rounded-md"
                                >
                                  {member}
                                  <button
                                    onClick={() =>
                                      handleMemberSelection(member)
                                    }
                                    className="ml-1 text-orange-600 hover:text-orange-800"
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
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-orange-700">
                        Filter by Date Range:
                      </span>
                    </div>
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
                  {(selectedMembers.length > 0 ||
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

              <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                itemCount={confirmationModal.itemCount}
                onConfirm={confirmMarkDone}
                onCancel={() =>
                  setConfirmationModal({ isOpen: false, itemCount: 0 })
                }
              />

              {/* Task Statistics */}
              <div className="p-4 border-b border-orange-100 bg-orange-50">
                <div className="flex flex-col">
                  <h3 className="mb-2 text-sm font-medium text-orange-700">
                    Repair Statistics:
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="px-3 py-2 bg-white rounded-md shadow-sm">
                      <span className="text-xs text-gray-500">
                        Total Pending
                      </span>
                      <div className="text-lg font-semibold text-orange-600">
                        {getTaskStatistics().totalPending}
                      </div>
                    </div>
                    {(selectedMembers.length > 0 ||
                      startDate ||
                      endDate ||
                      searchTerm) && (
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm">
                        <span className="text-xs text-gray-500">
                          Filtered Results
                        </span>
                        <div className="text-lg font-semibold text-orange-600">
                          {getTaskStatistics().filteredTotal}
                        </div>
                      </div>
                    )}
                    {selectedMembers.map((member) => (
                      <div
                        key={member}
                        className="px-3 py-2 bg-white rounded-md shadow-sm"
                      >
                        <span className="text-xs text-gray-500">{member}</span>
                        <div className="text-lg font-semibold text-indigo-600">
                          {getTaskStatistics().memberStats[member]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block h-[calc(100vh-300px)] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[80px]">
                        Task ID
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[120px]">
                        Form Filled By
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[120px]">
                        Assigned To
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[120px]">
                        Machine Name
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[200px]">
                        Issue Detail
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase bg-yellow-50 min-w-[100px]">
                        Status
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[120px]">
                        Part Replaced
                      </th>
                      <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[100px]">
                        Bill Amount
                      </th>
                      {userRole === "admin" && (
                        <th className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase min-w-[80px]">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistoryData.length > 0 ? (
                      filteredHistoryData.map((repair) => (
                        <tr key={repair._id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 min-w-[80px]">
                            <div className="text-sm font-medium text-gray-900">
                              {repair["col1"] || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900">
                              {repair["col2"] || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900">
                              {repair["col3"] || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm font-medium text-orange-700">
                              {repair["col4"] || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[200px]">
                            <div
                              className="text-sm text-gray-900"
                              title={repair["col5"]}
                            >
                              {repair["col5"]?.length > 50
                                ? repair["col5"].substring(0, 50) + "..."
                                : repair["col5"] || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 bg-yellow-50 min-w-[100px]">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                repair["col12"] &&
                                repair["col12"].includes("Completed")
                                  ? "bg-green-100 text-green-800"
                                  : repair["col12"] &&
                                    repair["col12"].includes("In Progress")
                                  ? "bg-blue-100 text-blue-800"
                                  : repair["col12"] &&
                                    repair["col12"].includes(
                                      "Under Observation"
                                    )
                                  ? "bg-indigo-100 text-indigo-800"
                                  : repair["col12"] &&
                                    repair["col12"].includes("Temporary Fix")
                                  ? "bg-purple-100 text-purple-800"
                                  : repair["col12"] &&
                                    repair["col12"].includes("Cancelled")
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {repair["col12"] || "Pending"}
                            </span>
                          </td>
                          <td className="px-3 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900">
                              {repair["col6"] || "—"}
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[100px]">
                            <div className="text-sm font-medium text-green-700">
                              {repair["col15"] ? `₹${repair["col15"]}` : "—"}
                            </div>
                          </td>
                          {userRole === "admin" && (
                            <td className="px-3 py-4 min-w-[80px]">
                              <button
                                onClick={() => openEditModal(repair)}
                                className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                              >
                                <Edit className="w-4 h-4" />
                                Process
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={userRole === "admin" ? 10 : 8}
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          {searchTerm ||
                          selectedMembers.length > 0 ||
                          startDate ||
                          endDate
                            ? "No pending repairs matching your filters"
                            : "No pending repairs found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-4 p-4 max-h-[calc(100vh-300px)] overflow-auto">
                {filteredHistoryData.length > 0 ? (
                  filteredHistoryData.map((repair) => (
                    <div
                      key={repair._id}
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs text-gray-500">
                              Machine
                            </span>
                            <p className="font-medium text-orange-700">
                              {repair["col4"] || "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">
                              Task ID
                            </span>
                            <p className="font-medium">
                              {repair["col1"] || "—"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-gray-500">
                            Issue Detail
                          </span>
                          <p className="text-sm text-gray-900">
                            {repair["col5"] || "—"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500">
                              Assigned To
                            </span>
                            <p className="text-sm text-gray-900">
                              {repair["col3"] || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">
                              Status
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                repair["col12"] === "Done"
                                  ? "bg-green-100 text-green-800"
                                  : repair["col12"] === "In Progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {repair["col12"] || "Pending"}
                            </span>
                          </div>
                        </div>

                        {userRole === "admin" && (
                          <div className="pt-2 border-t">
                            <button
                              onClick={() => openEditModal(repair)}
                              className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700"
                            >
                              <Edit className="w-4 h-4" />
                              Edit Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    {searchTerm ||
                    selectedMembers.length > 0 ||
                    startDate ||
                    endDate
                      ? "No pending repairs matching your filters"
                      : "No pending repairs found"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {renderEditModal()}
    </AdminLayout>
  );
}

export default RepairingPending;
