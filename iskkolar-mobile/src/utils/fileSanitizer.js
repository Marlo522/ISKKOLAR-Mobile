import { Alert } from "react-native";

/**
 * Sanitizes a file name by removing characters that are not alphanumeric,
 * dashes, underscores, or dots.
 * @param {string} filename The original file name
 * @returns {string} The sanitized file name
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return "file";
  // Extract base name and extension
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) {
    let cleanName = filename.replace(/\s+/g, "_");
    return cleanName.replace(/[^a-zA-Z0-9\-_]/g, "");
  }
  const name = filename.substring(0, dotIndex);
  const ext = filename.substring(dotIndex);
  
  let cleanName = name.replace(/\s+/g, "_");
  cleanName = cleanName.replace(/[^a-zA-Z0-9\-_]/g, "");
  
  let cleanExt = ext.replace(/[^a-zA-Z0-9_.]/g, "");
  
  return cleanName + cleanExt;
};

/**
 * Validates if the file is an image or PDF.
 * Displays an Alert if validation fails.
 * @param {object} file The file object containing name and mimeType/type
 * @returns {object|null} The sanitized file object if valid, null otherwise.
 */
export const validateAndSanitizeFile = (file) => {
  if (!file) return null;

  const filename = file.name || file.fileName || (file.uri ? file.uri.split("/").pop() : "");
  const mimeType = file.type || file.mimeType || "";

  if (!filename) {
    Alert.alert("Invalid File", "Could not determine the file name.");
    return null;
  }

  const ext = filename.split(".").pop().toLowerCase();

  // Explicitly blocked extensions and types
  const blockedExtensions = ["docx", "doc", "docm", "dot", "dotx", "xls", "xlsx", "ppt", "pptx"];
  if (
    blockedExtensions.includes(ext) ||
    (mimeType && (mimeType.includes("officedocument") || mimeType.includes("msword")))
  ) {
    Alert.alert(
      "Invalid File Type",
      "Microsoft Word and office documents are not allowed. Please choose only images (JPG, PNG, etc.) or PDF files."
    );
    return null;
  }

  const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "gif", "webp", "bmp"];
  const hasAllowedExt = allowedExtensions.includes(ext);
  const isImageMime = mimeType && mimeType.startsWith("image/");
  const isPdfMime = mimeType && (mimeType === "application/pdf" || mimeType.includes("pdf"));

  if (!hasAllowedExt && !isImageMime && !isPdfMime) {
    Alert.alert(
      "Invalid File Type",
      "Please choose only images (JPG, PNG, etc.) or PDF files."
    );
    return null;
  }

  const cleanFilename = sanitizeFilename(filename);
  const cleanMimeType = isPdfMime
    ? "application/pdf"
    : isImageMime
    ? mimeType
    : ext === "pdf"
    ? "application/pdf"
    : `image/${ext === "jpg" ? "jpeg" : ext}`;

  // Return the sanitized file object, supporting both properties name/fileName and type/mimeType
  return {
    ...file,
    name: cleanFilename,
    fileName: cleanFilename,
    type: cleanMimeType,
    mimeType: cleanMimeType,
  };
};
