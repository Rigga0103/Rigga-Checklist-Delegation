import { create } from "zustand";

const SHEET_ID = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
const MASTER_SHEET = "Master";

/**
 * Zustand store for maintenance form dropdown data
 * This store holds form dropdown options fetched from the master sheet
 */
const useMaintenanceFormStore = create((set, get) => ({
  // State
  formFilledByList: [],
  machineNameList: [],
  toAssignPersonList: [],
  workDoneList: [],
  statusList: [],
  isLoading: false,
  error: null,
  hasFetched: false, // Track if data has been fetched

  // Actions
  setFormFilledByList: (options) => set({ formFilledByList: options }),
  setMachineNameList: (options) => set({ machineNameList: options }),
  setToAssignPersonList: (options) => set({ toAssignPersonList: options }),
  setWorkDoneList: (options) => set({ workDoneList: options }),
  setStatusList: (options) => set({ statusList: options }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),

  // Fetch master data for dropdowns
  fetchMasterData: async () => {
    const state = get();

    // Skip if already loading or if data already fetched
    if (state.isLoading || state.hasFetched) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${MASTER_SHEET}`
      );
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));

      const rows = json.table.rows;

      // Extract unique values from columns (skip header)
      // Column J (index 9) - Form Filled By
      const formFilledByList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[9]?.v)
            .filter(Boolean)
        ),
      ];

      // Column H (index 7) - Machine Name
      const machineNameList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[7]?.v)
            .filter(Boolean)
        ),
      ];

      // Column D (index 3) - To Assign Person (using doers column)
      const toAssignPersonList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[3]?.v)
            .filter(Boolean)
        ),
      ];

      // Column K (index 10) - Work Done
      const workDoneList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[10]?.v)
            .filter(Boolean)
        ),
      ];

      // Column L (index 11) - Status
      const statusList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[11]?.v)
            .filter(Boolean)
        ),
      ];

      set({
        formFilledByList: [...formFilledByList, "Other"],
        machineNameList: [...machineNameList, "Other"],
        toAssignPersonList: [...toAssignPersonList, "Other"],
        workDoneList: [...workDoneList, "Other"],
        statusList: [...statusList, "Other"],
        isLoading: false,
        hasFetched: true,
      });
    } catch (error) {
      console.error("Error fetching master data:", error);
      set({
        formFilledByList: ["Other"],
        machineNameList: ["Other"],
        toAssignPersonList: ["Other"],
        workDoneList: ["Other"],
        statusList: ["Other"],
        isLoading: false,
        error: error.message,
        hasFetched: true,
      });
    }
  },

  // Reset store
  reset: () =>
    set({
      formFilledByList: [],
      machineNameList: [],
      toAssignPersonList: [],
      workDoneList: [],
      statusList: [],
      isLoading: false,
      error: null,
      hasFetched: false,
    }),
}));

export default useMaintenanceFormStore;
