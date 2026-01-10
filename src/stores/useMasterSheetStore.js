import { create } from "zustand";

/**
 * Zustand store for master sheet options data
 * This store holds departments, givenBy, and doers options fetched from the master sheet
 */
const useMasterSheetStore = create((set, get) => ({
  // State
  departmentOptions: [],
  givenByOptions: [],
  doerOptions: [],
  isLoading: false,
  error: null,
  lastFetchedSection: null, // Track which section was last fetched

  // Actions
  setDepartmentOptions: (options) => set({ departmentOptions: options }),
  setGivenByOptions: (options) => set({ givenByOptions: options }),
  setDoerOptions: (options) => set({ doerOptions: options }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),

  // Fetch master sheet options
  fetchMasterSheetOptions: async (selectedSection) => {
    const state = get();

    // Skip if already loading or if data for this section already exists
    if (state.isLoading) return;
    if (
      state.lastFetchedSection === selectedSection &&
      state.departmentOptions.length > 0
    ) {
      return; // Data already fetched for this section
    }

    set({ isLoading: true, error: null });

    try {
      const masterSheetId = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
      const masterSheetName = "master";

      const url = `https://docs.google.com/spreadsheets/d/${masterSheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
        masterSheetName
      )}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch master data: ${response.status}`);
      }

      const text = await response.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      const jsonString = text.substring(jsonStart, jsonEnd + 1);
      const data = JSON.parse(jsonString);

      if (!data.table || !data.table.rows) {
        set({ isLoading: false });
        return;
      }

      // Extract options from columns A, B, and C
      const departments = [];
      const givenBy = [];
      const doers = [];

      // Process all rows starting from index 1 (skip header)
      data.table.rows.slice(1).forEach((row) => {
        // Column A (checklist) or Column H (maintenance) - Departments
        if (row.c) {
          let value = "";

          if (selectedSection === "checklist" && row.c[0] && row.c[0].v) {
            value = row.c[0].v.toString().trim();
          } else if (
            selectedSection === "maintenance" &&
            row.c[7] &&
            row.c[7].v
          ) {
            value = row.c[7].v.toString().trim();
          }

          if (value !== "") {
            departments.push(value);
          }
        }

        // Column B - Given By
        if (row.c && row.c[1] && row.c[1].v) {
          const value = row.c[1].v.toString().trim();
          if (value !== "") {
            givenBy.push(value);
          }
        }

        // Column D - Doers
        if (row.c && row.c[3] && row.c[3].v) {
          const value = row.c[3].v.toString().trim();
          if (value !== "") {
            doers.push(value);
          }
        }
      });

      // Remove duplicates and sort
      set({
        departmentOptions: [...new Set(departments)].sort(),
        givenByOptions: [...new Set(givenBy)].sort(),
        doerOptions: [...new Set(doers)].sort(),
        isLoading: false,
        lastFetchedSection: selectedSection,
      });
    } catch (error) {
      console.error("Error fetching master sheet options:", error);
      // Set default options if fetch fails
      set({
        departmentOptions: ["Department 1", "Department 2"],
        givenByOptions: ["User 1", "User 2"],
        doerOptions: ["Doer 1", "Doer 2"],
        isLoading: false,
        error: error.message,
      });
    }
  },

  // Reset store
  reset: () =>
    set({
      departmentOptions: [],
      givenByOptions: [],
      doerOptions: [],
      isLoading: false,
      error: null,
      lastFetchedSection: null,
    }),
}));

export default useMasterSheetStore;
