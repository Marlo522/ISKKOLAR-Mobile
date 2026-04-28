import api from "./api";

export const financialRecordsService = {
  /**
   * Retrieves the disbursement history for the authenticated scholar.
   * Uses the project's custom fetch wrapper.
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getScholarRecords: async () => {
    try {
      const response = await api.get("/assistance/financial-records");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch financial records:", error);
      throw error;
    }
  },

};
