"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { CheckCircle2, X } from "lucide-react"

const CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec",
  DRIVE_FOLDER_ID: "1LPsmRqzqvp6b7aY9FS1NfiiK0LV03v03",
  SOURCE_SHEET_NAME: "Delegation",
  TARGET_SHEET_NAME: "Delegation Done",
  PAGE_CONFIG: {
    title: "Delegation Tasks",
    description: "Showing all pending tasks",
  },
}

function DelegationPage({ searchTerm, nameFilter, freqFilter }) {
  const [tasks, setTasks] = useState([])
  const [successMessage, setSuccessMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [isInitialized, setIsInitialized] = useState(false)

  const formatDateTime = useCallback((dateStr) => {
    if (!dateStr) return "—"
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, "0")
      const minutes = date.getMinutes().toString().padStart(2, "0")
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch {
      return dateStr
    }
  }, [])

  useEffect(() => {
    const role = sessionStorage.getItem("role")
    const user = sessionStorage.getItem("username")
    setUserRole(role || "")
    setUsername(user || "")
    setIsInitialized(true)
  }, [])

  const fetchData = useCallback(async () => {
    if (!isInitialized || !username) return
    
    try {
      setLoading(true)
      setError(null)

      const tasksRes = await fetch(`${CONFIG.APPS_SCRIPT_URL}?sheet=${CONFIG.SOURCE_SHEET_NAME}&action=fetch`)

      if (!tasksRes.ok) throw new Error("Failed to fetch tasks")
      
      const tasksData = await tasksRes.json()

      const currentUsername = username.toLowerCase()
      const processedTasks = tasksData.table.rows.slice(1).map((row, index) => {
        const rowData = {
          _id: `task_${index}_${Math.random().toString(36).substr(2, 9)}`,
          _rowIndex: index + 2,
        }

        row.c.forEach((cell, colIndex) => {
          rowData[`col${colIndex}`] = cell?.v || ""
        })

        return rowData
      }).filter(task => 
        userRole === "admin" || 
        task.col4?.toLowerCase() === currentUsername
      )

      setTasks(processedTasks)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data: " + err.message)
      setLoading(false)
    }
  }, [userRole, username, isInitialized])

  useEffect(() => {
    if (isInitialized) {
      fetchData()
    }
  }, [fetchData, isInitialized])

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        Object.values(task).some(
          value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }
    
    // Apply name filter
    if (nameFilter) {
      filtered = filtered.filter(task => task.col4 === nameFilter)
    }
    
    // Apply frequency filter
    if (freqFilter) {
      filtered = filtered.filter(task => task.col7 === freqFilter)
    }
    
    return filtered
  }, [tasks, searchTerm, nameFilter, freqFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                {successMessage}
              </div>
              <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700">
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
              <h2 className="text-purple-700 font-medium">
                Pending {CONFIG.SOURCE_SHEET_NAME} Tasks
              </h2>
              <p className="text-purple-600 text-sm">
                {CONFIG.PAGE_CONFIG.description}
              </p>
            </div>

            {!isInitialized || loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-purple-600">Loading data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
                {error}{" "}
                <button className="underline ml-2" onClick={fetchData}>
                  Try again
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto relative" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">
                        Task Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                        Task Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Freq
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Enable Reminders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Require Attachment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 overflow-y-auto">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <tr key={task._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal">
                              {task.col4 || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[300px] max-w-[400px]">
                            <div className="text-sm text-gray-900 whitespace-normal">
                              {task.col5 || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[140px]">
                            <div className="text-sm text-gray-900 whitespace-normal">
                              {formatDateTime(task.col6) || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[100px]">
                            <div className="text-sm text-gray-900 whitespace-normal">
                              {task.col7 || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal">
                              {task.col8 || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 min-w-[120px]">
                            <div className="text-sm text-gray-900 whitespace-normal">
                              {task.col9 || "—"}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          {searchTerm || nameFilter || freqFilter 
                            ? "No tasks matching your filters" 
                            : "No pending tasks found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DelegationPage