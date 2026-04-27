import api from "./api";

export const financialRecordsService = {
  /**
   * Retrieves the disbursement history for the authenticated scholar.
   * Uses the project's custom fetch wrapper.
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getScholarRecords: async () => {
    try {
      // The 'api' import in this project is a function wrapper around fetch,
      // not an axios instance with .get() methods.
      const response = await api("/assistance/financial-records", { method: "GET" });
      return response;
    } catch (error) {
      console.error("Failed to fetch financial records:", error);
      throw error;
    }
  },
};
