import React, { useEffect, useState } from "react";
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
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  DollarSign,
  BarChart2,
  Calendar,
} from "lucide-react";
import axios from "axios";

const MaintenanceDashboard = () => {
  // Get user from sessionStorage (matching existing Dashboard.jsx pattern)
  const username = sessionStorage.getItem("username");
  const userRole = sessionStorage.getItem("role");
  const user = { name: username, role: userRole, username };

  const [sheetDate, setSheetData] = useState([]);

  // Use the same spreadsheet as Dashboard.jsx
  const SPREADSHEET_ID = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
  const SHEET_NAME = "Checklist_mentainence";

  const [loaderSheetData, setLoaderSheetData] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [maintenanceTasks, setMaintenanceTasks] = useState([]);
  const [repairTasks, setRepairTasks] = useState([]);
  const [totalMaintenanceTasksCompleted, setTotalMaintenanceTasksCompleted] =
    useState(0);
  const [totalMaintenanceTasksOverdue, setTotalMaintenanceTasksOverdue] =
    useState(0);
  const [totalRepairTasksCompleted, setTotalRepairTasksCompleted] = useState(0);
  const [totalRepairTasksOverdue, setTotalRepairTasksOverdue] = useState(0);
  const [repairCompletedTasks, setRepairCompletedTasks] = useState([]);
  const [maintenanceCompletedTasks, setMaintenanceCompletedTasks] = useState(
    []
  );

  const [userMachineData, setUserMachineData] = useState([]);
  const [allMachineData, setAllMachineData] = useState([]);
  const [loaderUserMachineData, setLoaderUserMachineData] = useState(false);

  // Parse gviz format (same as Dashboard.jsx)
  const parseGvizData = (text) => {
    // Extract JSON from gviz response
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("Invalid gviz response format");
      return [];
    }
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonString);

    if (!data.table || !data.table.cols || !data.table.rows) {
      console.error("Invalid table structure in gviz response");
      return [];
    }

    const headers = data.table.cols.map((col) => col.label);
    const rows = data.table.rows;

    return rows.map((rowObj) => {
      const row = rowObj.c;
      const rowData = {};
      row.forEach((cell, i) => {
        // Handle formatted values (f) and raw values (v)
        rowData[headers[i]] = cell ? cell.f || cell.v || "" : "";
      });
      return rowData;
    });
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoadingTasks(true);
      try {
        const response = await fetch(
          `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`
        );
        const text = await response.text();
        const formattedMaintenance = parseGvizData(text);

        // Debug: log the column names and sample data
        console.log("=== MAINTENANCE DEBUG ===");
        console.log("Total rows fetched:", formattedMaintenance.length);
        if (formattedMaintenance.length > 0) {
          console.log(
            "Available columns:",
            Object.keys(formattedMaintenance[0])
          );
          console.log("Sample task:", formattedMaintenance[0]);
          console.log(
            "Sample Actual value:",
            formattedMaintenance[0]["Actual"]
          );

          // Count tasks with Actual filled
          const tasksWithActual = formattedMaintenance.filter(
            (t) => t["Actual"] && t["Actual"] !== ""
          );
          console.log("Tasks with Actual filled:", tasksWithActual.length);
          if (tasksWithActual.length > 0) {
            console.log("Sample completed task:", tasksWithActual[0]);
          }
        }

        let filteredMaintenance = formattedMaintenance;

        // Filter by user if not admin (use "Name" column from user's data structure)
        if (user?.role !== "admin") {
          const currentUserName = user?.name?.trim().toLowerCase();

          filteredMaintenance = formattedMaintenance.filter(
            (task) =>
              task["Name"]?.toString().trim().toLowerCase() === currentUserName
          );
        }

        setMaintenanceTasks(filteredMaintenance);
        setAllMachineData(formattedMaintenance);
        setUserMachineData(filteredMaintenance);

        // Check if "Actual" (column K) has data - task is complete when both Task Start Date and Actual are filled
        const maintenanceCompleted = filteredMaintenance.filter((task) => {
          const taskStartDate = task["Task Start Date"];
          const actual = task["Actual"];
          // Task is complete if both Task Start Date AND Actual have values
          const hasStartDate =
            taskStartDate !== null &&
            taskStartDate !== undefined &&
            taskStartDate !== "" &&
            String(taskStartDate).trim() !== "";
          const hasActual =
            actual !== null &&
            actual !== undefined &&
            actual !== "" &&
            String(actual).trim() !== "";
          return hasStartDate && hasActual;
        });
        console.log(
          "Completed tasks after filter:",
          maintenanceCompleted.length,
          "Sample Actual values:",
          filteredMaintenance.slice(0, 5).map((t) => t["Actual"])
        );
        setTotalMaintenanceTasksCompleted(maintenanceCompleted.length);
        setMaintenanceCompletedTasks(maintenanceCompleted);

        // Overdue: Task Start Date is in the past AND Actual is empty
        const today = new Date();
        const maintenanceOverdue = filteredMaintenance.filter((task) => {
          const taskStartDate = new Date(task["Task Start Date"]);
          const actual = task["Actual"];
          const hasNoActual =
            !actual || actual === "" || String(actual).trim() === "";
          return (
            task["Task Start Date"] && hasNoActual && taskStartDate < today
          );
        }).length;
        setTotalMaintenanceTasksOverdue(maintenanceOverdue);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [user?.name, user?.role]);

  const formatSheetData = (sheetData) => {
    if (!sheetData || !sheetData.cols || !sheetData.rows) {
      console.error("Invalid sheet data:", sheetData);
      return [];
    }

    const columns = sheetData.cols.map((col) => col.label);
    const rows = sheetData.rows;

    return rows.map((row) => {
      const obj = {};
      row.c.forEach((cell, i) => {
        obj[columns[i]] = cell?.v || "";
      });
      return obj;
    });
  };

  const getMaintenanceCostData = () => {
    const maintenanceCostsByMachine = {};

    maintenanceCompletedTasks.forEach((task) => {
      if (
        task["Serial No"] &&
        task["Maintenace Cost"] &&
        task["Task Start Date"] &&
        task["Actual Date"] &&
        task["Task Start Date"] !== "" &&
        task["Actual Date"] !== ""
      ) {
        const machineName = task["Serial No"];
        const maintenanceCost = parseFloat(task["Maintenace Cost"]) || 0;

        if (maintenanceCostsByMachine[machineName]) {
          maintenanceCostsByMachine[machineName] += maintenanceCost;
        } else {
          maintenanceCostsByMachine[machineName] = maintenanceCost;
        }
      }
    });

    return Object.keys(maintenanceCostsByMachine).map((machineName) => ({
      name: machineName,
      maintenanceCost: maintenanceCostsByMachine[machineName],
    }));
  };

  const maintenanceCostData = getMaintenanceCostData();

  const departmentCostMap = {};

  maintenanceCompletedTasks.forEach((task) => {
    const department = task.Department;
    const cost = parseFloat(task["Maintenace Cost"]) || 0;

    if (department && department !== "") {
      if (!departmentCostMap[department]) {
        departmentCostMap[department] = 0;
      }
      departmentCostMap[department] += cost;
    }
  });

  const departmentCostData = Object.keys(departmentCostMap).map(
    (department) => ({
      name: department,
      cost: departmentCostMap[department],
    })
  );

  // Count frequency of tasks from "Freq" column
  const getFrequencyData = () => {
    const frequencyCounts = {};

    // Count frequencies from all maintenance tasks
    maintenanceTasks.forEach((task) => {
      const frequency = task["Freq"] || task["Frequency"];
      if (frequency && frequency !== "" && String(frequency).trim() !== "") {
        const freqKey = String(frequency).trim();
        if (frequencyCounts[freqKey]) {
          frequencyCounts[freqKey]++;
        } else {
          frequencyCounts[freqKey] = 1;
        }
      }
    });

    // Convert to array format for chart
    return Object.keys(frequencyCounts).map((frequency) => ({
      name: frequency,
      repairs: frequencyCounts[frequency],
    }));
  };

  const frequentRepairData = getFrequencyData();

  const totalMaintenanceCost = maintenanceCompletedTasks.reduce((sum, task) => {
    return sum + (parseFloat(task["Maintenace Cost"]) || 0);
  }, 0);

  const totalCost = totalMaintenanceCost;

  const fetchUserMachineData = async () => {
    if (!user?.username) {
      return;
    }

    try {
      setLoaderUserMachineData(true);

      const SHEET_NAME = "Maitenance Task Assign";

      const res = await fetch(
        `${SCRIPT_URL}?action=getRawData&sheetId=${SHEET_Id}&sheet=${SHEET_NAME}&pageSize=50000`
      );

      const result = await res.json();

      let rows = [];
      let headers = [];

      if (result.success && result.table) {
        headers = result.table.cols.map((col) => col.label);
        rows = result.table.rows.map((rowObj) => {
          const row = rowObj.c;
          const rowData = {};
          row.forEach((cell, i) => {
            rowData[headers[i]] = cell?.v || "";
          });
          return rowData;
        });
      } else if (result.success && result.rows && result.headers) {
        headers = result.headers;
        rows = result.rows.map((rowArr) => {
          const rowData = {};
          headers.forEach((header, i) => {
            rowData[header] = rowArr[i] || "";
          });
          return rowData;
        });
      } else {
        console.error("fetchUserMachineData API failed:", result);
      }

      if (rows.length > 0) {
        const userRows = rows
          .filter((row) => {
            const doerName = row["Doer Name"]?.toString().trim();
            const trimmedUserName = user.username?.toString().trim();
            return (
              doerName &&
              (doerName === trimmedUserName ||
                doerName.toLowerCase() === trimmedUserName.toLowerCase())
            );
          })
          .map((row) => ({
            "Machine Name": row["Machine Name"],
            "Serial No": row["Serial No"],
          }));

        setUserMachineData(userRows);
        setAllMachineData(rows);
      }
    } catch (error) {
      console.error("Failed to fetch user machine data", error);
    } finally {
      setLoaderUserMachineData(false);
    }
  };

  const getUniqueMachinesCount = (data) => {
    const unique = new Set(
      data.map((item) => item["Serial No"] || item["Machine Name"])
    );
    return unique.size;
  };

  useEffect(() => {
    if (user?.username) {
      fetchUserMachineData();
    }
  }, [user?.username]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          Maintenance Dashboard 
        </h1>
        {loadingTasks && (
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-4 h-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Loading data...</span>
          </div>
        )}
      </div>

      {/* Summary Stats for maintenance */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="flex items-start p-6 bg-white shadow rounded-xl">
          <div className="p-3 mr-4 bg-blue-100 rounded-full">
            <Wrench size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Machines</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {user?.role === "admin"
                ? getUniqueMachinesCount(allMachineData)
                : getUniqueMachinesCount(userMachineData)}
            </h3>
          </div>
        </div>

        <div className="flex items-start p-6 bg-white shadow rounded-xl">
          <div className="p-3 mr-4 bg-indigo-100 rounded-full">
            <Calendar size={24} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tasks</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {maintenanceTasks?.length}
            </h3>
          </div>
        </div>

        <div className="flex items-start p-6 bg-white shadow rounded-xl">
          <div className="p-3 mr-4 bg-green-100 rounded-full">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Maintenance Complete
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalMaintenanceTasksCompleted}
            </h3>
          </div>
        </div>

        <div className="flex items-start p-6 bg-white shadow rounded-xl">
          <div className="p-3 mr-4 rounded-full bg-amber-100">
            <Clock size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Tasks Pending
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {maintenanceTasks.length - totalMaintenanceTasksCompleted}
            </h3>
          </div>
        </div>

        <div className="flex items-start p-6 bg-white shadow rounded-xl">
          <div className="p-3 mr-4 bg-red-100 rounded-full">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              Total Tasks Overdue
            </p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalMaintenanceTasksOverdue}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="col-span-1 p-6 bg-white shadow rounded-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="flex items-center text-lg font-bold text-gray-800">
              <Wrench size={20} className="mr-2 text-indigo-600" />
              Frequent Maintenance
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequentRepairData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="repairs"
                  name="Number of Repairs"
                  fill="#EF4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;
