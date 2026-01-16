import { create } from "zustand";

// Configuration
const CONFIG = {
  APPS_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
  SHEET_NAME: "Checklist_mentainence",
};

// Helper: Parse Google Sheets date-time
const parseGoogleSheetsDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  if (
    typeof dateTimeStr === "string" &&
    dateTimeStr.match(/^\d{2}\/\d{2}\/\d{4}/)
  ) {
    return dateTimeStr;
  }
  if (typeof dateTimeStr === "string" && dateTimeStr.startsWith("Date(")) {
    const match = /Date\((\d+),(\d+),(\d+)\)/.exec(dateTimeStr);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      return `${day.toString().padStart(2, "0")}/${(month + 1)
        .toString()
        .padStart(2, "0")}/${year}`;
    }
  }
  try {
    const date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.error("Error parsing date-time:", error);
  }
  return dateTimeStr;
};

const isEmpty = (value) => {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
};

/**
 * Zustand store for maintenance history data
 */
const useMaintenanceHistoryStore = create((set, get) => ({
  // State
  historyData: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  // Actions
  setHistoryData: (data) =>
    set({
      historyData: data,
      lastFetched: new Date().toISOString(),
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error: error }),

  // Fetch maintenance history data directly
  fetchMaintenanceHistory: async () => {
    const state = get();

    // Skip if already loading or recently fetched (within 1 minute)
    if (state.isLoading) return;
    if (state.historyData.length > 0 && state.lastFetched) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (new Date(state.lastFetched) > oneMinuteAgo) {
        return;
      }
    }

    set({ isLoading: true, error: null });

    try {
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
          data = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("Invalid JSON response");
        }
      }

      const historyRows = [];
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

      const columnHeaders = [
        { id: "col0", label: "Timestamp", type: "string" },
        { id: "col1", label: "Task ID", type: "string" },
        { id: "col2", label: "Firm", type: "string" },
        { id: "col3", label: "Given By", type: "string" },
        { id: "col4", label: "Name", type: "string" },
        { id: "col5", label: "Task Description", type: "string" },
        { id: "col6", label: "Task Start Date", type: "datetime" },
        { id: "col7", label: "Freq", type: "string" },
        { id: "col8", label: "Enable Reminders", type: "string" },
        { id: "col9", label: "Require Attachment", type: "string" },
        { id: "col10", label: "Actual", type: "datetime" },
        { id: "col11", label: "Column L", type: "string" },
        { id: "col12", label: "Status", type: "string" },
        { id: "col13", label: "Remarks", type: "string" },
        { id: "col14", label: "Uploaded Image", type: "string" },
        { id: "col15", label: "Admin Done", type: "string" },
      ];

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

        const columnGValue = rowValues[6]; // Task Start Date
        const columnKValue = rowValues[10]; // Actual Date
        const columnMValue = rowValues[12]; // Status (DONE)

        // Skip rows marked as DONE
        if (columnMValue && columnMValue.toString().trim() === "DONE") {
          return;
        }

        const hasColumnG = !isEmpty(columnGValue);

        // Include ALL tasks that have a Task Start Date (both completed and pending)
        if (hasColumnG) {
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
          };

          columnHeaders.forEach((header, index) => {
            const cellValue = rowValues[index];
            if (
              header.type === "datetime" ||
              (cellValue && String(cellValue).startsWith("Date("))
            ) {
              rowData[header.id] = cellValue
                ? parseGoogleSheetsDateTime(String(cellValue))
                : "";
            } else {
              rowData[header.id] = cellValue !== null ? cellValue : "";
            }
          });

          historyRows.push(rowData);
        }
      });

      set({
        historyData: historyRows,
        isLoading: false,
        lastFetched: new Date().toISOString(),
      });

      console.log(
        "Maintenance history fetched:",
        historyRows.length,
        "records"
      );
    } catch (error) {
      console.error("Error fetching maintenance history:", error);
      set({
        isLoading: false,
        error: error.message,
      });
    }
  },

  // Get records where Admin Done (col15) is not null/empty
  getAdminDoneRecords: () => {
    const { historyData } = get();
    return historyData.filter((item) => {
      const adminDone = item["col15"];
      return (
        adminDone !== null &&
        adminDone !== undefined &&
        adminDone.toString().trim() !== ""
      );
    });
  },

  // Reset store
  reset: () =>
    set({
      historyData: [],
      isLoading: false,
      error: null,
      lastFetched: null,
    }),
}));

export default useMaintenanceHistoryStore;
