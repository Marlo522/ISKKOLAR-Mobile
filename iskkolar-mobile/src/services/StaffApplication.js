import api from "./api";

const appendPayload = (formData, payload) => {
	if (!payload || typeof payload !== "object") return;

	Object.entries(payload).forEach(([key, value]) => {
		if (value === undefined || value === null) return;
		if (Array.isArray(value) || typeof value === "object") {
			formData.append(key, JSON.stringify(value));
			return;
		}
		formData.append(key, String(value));
	});
};

const appendFile = (formData, apiField, file) => {
	if (!file?.uri) return;
	formData.append(apiField, {
		uri: file.uri,
		type: file.mimeType || file.type || "application/pdf",
		name: file.name || file.fileName || apiField + ".pdf",
	});
};

const appendFiles = (formData, files = {}) => {
	Object.entries(files).forEach(([key, file]) => appendFile(formData, key, file));
};

const normalizeApiError = (error, fallbackMessage) => {
	if (error?.status) {
		return {
			status: error.status,
			message: error.message || fallbackMessage,
			errors: Array.isArray(error.errors) ? error.errors : [],
			data: error.data || null,
		};
	}

	return {
		status: 0,
		message: fallbackMessage || "Unexpected error occurred.",
		errors: [],
		data: null,
	};
};

const createKkfiStepValidator = (basePath, fallbackMessage) => async (step, payload, files = {}) => {
	try {
		const formData = new FormData();
		appendPayload(formData, payload);

		// KKFI step 1 may include academic documents that are server-validated.
		if (step === 1) {
			appendFiles(formData, files);
		}

		const response = await api(`/scholarships/${basePath}/validate-step?step=${step}`, {
			method: "POST",
			body: formData,
		});

		return response;
	} catch (error) {
		throw normalizeApiError(error, fallbackMessage);
	}
};

const createKkfiSubmitter = (basePath, fallbackMessage) => async (payload, files) => {
	try {
		const formData = new FormData();
		appendPayload(formData, payload);
		appendFiles(formData, files);

		const response = await api(`/scholarships/${basePath}/apply`, {
			method: "POST",
			body: formData,
		});

		if (!response?.success) {
			throw response || {
				success: false,
				message: "Submission failed. Please try again.",
			};
		}

		return response;
	} catch (error) {
		throw normalizeApiError(error, fallbackMessage);
	}
};

const createKkfiListLoader = (basePath, fallbackMessage) => async () => {
	try {
		const response = await api(`/scholarships/${basePath}/my-applications`, { method: "GET" });
		return response?.data || [];
	} catch (error) {
		throw normalizeApiError(error, fallbackMessage);
	}
};

const createKkfiByIdLoader = (basePath, fallbackMessage) => async (id) => {
	try {
		const response = await api(`/scholarships/${basePath}/${id}`, { method: "GET" });
		return response?.data || null;
	} catch (error) {
		throw normalizeApiError(error, fallbackMessage);
	}
};

export const lookupStaffByStaffId = async (staffId) => {
	try {
		const response = await api(`/scholarships/staff/${encodeURIComponent(staffId)}`, { method: "GET" });
		return response?.data || null;
	} catch (error) {
		throw normalizeApiError(error, "Failed to look up staff record.");
	}
};

export const validateChildDesignationStep = createKkfiStepValidator("child-designation", "Step validation failed.");

export const submitChildDesignationApplication = createKkfiSubmitter(
	"child-designation",
	"Failed to submit child designation application."
);

export const getMyChildDesignationApplications = createKkfiListLoader(
	"child-designation",
	"Failed to load child designation applications."
);

export const checkOngoingChildDesignationApplication = async () => {
	try {
		const applications = await getMyChildDesignationApplications();
		const ongoingApp = applications.find(
			(app) =>
				app.status === "pending" ||
				app.status === "under_review" ||
				app.status === "initial_passed" ||
				app.status === "for_review"
		);
		return ongoingApp || null;
	} catch (error) {
		throw normalizeApiError(error, "Failed to check ongoing applications.");
	}
};

export const getChildDesignationApplicationById = createKkfiByIdLoader(
	"child-designation",
	"Failed to load application details."
);

export const validateStaffAdvancementStep = createKkfiStepValidator("staff-advancement", "Step validation failed.");

export const submitStaffAdvancementApplication = createKkfiSubmitter(
	"staff-advancement",
	"Failed to submit staff advancement application."
);

export const getMyStaffAdvancementApplications = createKkfiListLoader(
	"staff-advancement",
	"Failed to load staff advancement applications."
);

export const checkOngoingStaffAdvancementApplication = async () => {
	try {
		const applications = await getMyStaffAdvancementApplications();
		const ongoingApp = applications.find(
			(app) =>
				app.status === "pending" ||
				app.status === "under_review" ||
				app.status === "initial_passed" ||
				app.status === "for_review"
		);
		return ongoingApp || null;
	} catch (error) {
		throw normalizeApiError(error, "Failed to check ongoing applications.");
	}
};

export const getStaffAdvancementApplicationById = createKkfiByIdLoader(
	"staff-advancement",
	"Failed to load application details."
);
