import React, { useState, useEffect } from "react";
import { Upload, Send, Loader2, X } from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";

const SHEET_ID = "1pjNOV1ogLtiMm-Ow9_UVbsd3oN52jA5FdLGLgKwqlcw";
const MASTER_SHEET = "Master";
const FORM_SHEET = "Maitenence_Form";

const Maintenance_Form = () => {
  const [formData, setFormData] = useState({
    formFilledBy: "",
    machineName: "",
    partReplaced: "",
    workDone: "",
    photo: null,
    remarks: "",
    status: "",
  });

  const [dropdownData, setDropdownData] = useState({
    formFilledByList: [],
    machineNameList: [],
    workDoneList: [],
    statusList: [],
  });

  const [customInputs, setCustomInputs] = useState({
    formFilledBy: false,
    machineName: false,
    workDone: false,
    status: false,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${MASTER_SHEET}`
      );
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));

      const rows = json.table.rows;

      // Extract unique values from columns (skip header)
      const formFilledByList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[9]?.v)
            .filter(Boolean)
        ),
      ];
      const machineNameList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[7]?.v)
            .filter(Boolean)
        ),
      ];
      const workDoneList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[10]?.v)
            .filter(Boolean)
        ),
      ];
      const statusList = [
        ...new Set(
          rows
            .slice(1)
            .map((row) => row.c[11]?.v)
            .filter(Boolean)
        ),
      ];

      setDropdownData({
        formFilledByList: [...formFilledByList, "Other"],
        machineNameList: [...machineNameList, "Other"],
        workDoneList: [...workDoneList, "Other"],
        statusList: [...statusList, "Other"],
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching master data:", error);
      setMessage({
        type: "error",
        text: "Failed to load form data. Please refresh.",
      });
      setLoading(false);
    }
  };

  const handleDropdownChange = (field, value) => {
    if (value === "Other") {
      setCustomInputs((prev) => ({ ...prev, [field]: true }));
      setFormData((prev) => ({ ...prev, [field]: "" }));
    } else {
      setCustomInputs((prev) => ({ ...prev, [field]: false }));
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
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

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.formFilledBy ||
      !formData.machineName ||
      !formData.partReplaced ||
      !formData.workDone ||
      !formData.status
    ) {
      setMessage({ type: "error", text: "Please fill all required fields." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      let photoBase64 = "";
      if (formData.photo) {
        photoBase64 = await convertFileToBase64(formData.photo);
      }

      // Use this updated URL (your actual Apps Script URL)
      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: FORM_SHEET,
            data: JSON.stringify([
              timestamp,
              formData.formFilledBy,
              formData.machineName,
              formData.partReplaced,
              formData.workDone,
              photoBase64,
              formData.remarks,
              formData.status,
            ]),
          }),
        }
      );

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "Form submitted successfully!" });

        // Reset form
        setFormData({
          formFilledBy: "",
          machineName: "",
          partReplaced: "",
          workDone: "",
          photo: null,
          remarks: "",
          status: "",
        });
        setCustomInputs({
          formFilledBy: false,
          machineName: false,
          workDone: false,
          status: false,
        });
        setPhotoPreview(null);
      } else {
        setMessage({
          type: "error",
          text: result.message || "Failed to submit form.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setMessage({
        type: "error",
        text: "Failed to submit form. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>

    
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Maintenance Form
          </h1>
          <p className="text-gray-600 mb-8">
            Fill in the details below to submit a maintenance.
          </p>

          {message.text && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
                <p>{message.text}</p>
                <h1><X/></h1>
            </div>
          )}

          <div className="space-y-6">
            {/* Form Filled By */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Form Filled By <span className="text-red-500">*</span>
              </label>
              {!customInputs.formFilledBy ? (
                <select
                  value={formData.formFilledBy}
                  onChange={(e) =>
                    handleDropdownChange("formFilledBy", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select person...</option>
                  {dropdownData.formFilledByList.map((item, idx) => (
                    <option key={idx} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.formFilledBy}
                  onChange={(e) =>
                    handleInputChange("formFilledBy", e.target.value)
                  }
                  placeholder="Enter name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Machine Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Machine Name <span className="text-red-500">*</span>
              </label>
              {!customInputs.machineName ? (
                <select
                  value={formData.machineName}
                  onChange={(e) =>
                    handleDropdownChange("machineName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select machine...</option>
                  {dropdownData.machineNameList.map((item, idx) => (
                    <option key={idx} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.machineName}
                  onChange={(e) =>
                    handleInputChange("machineName", e.target.value)
                  }
                  placeholder="Enter machine name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Part Replaced */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Part Replaced <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.partReplaced}
                onChange={(e) =>
                  handleInputChange("partReplaced", e.target.value)
                }
                placeholder="Enter part name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            {/* Work Done */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Work Done <span className="text-red-500">*</span>
              </label>
              {!customInputs.workDone ? (
                <select
                  value={formData.workDone}
                  onChange={(e) =>
                    handleDropdownChange("workDone", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select work done...</option>
                  {dropdownData.workDoneList.map((item, idx) => (
                    <option key={idx} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.workDone}
                  onChange={(e) =>
                    handleInputChange("workDone", e.target.value)
                  }
                  placeholder="Enter work done..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photo of Work Done
              </label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.photo
                        ? formData.photo.name
                        : "Click to upload photo"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Enter any additional remarks..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              {!customInputs.status ? (
                <select
                  value={formData.status}
                  onChange={(e) =>
                    handleDropdownChange("status", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Select status...</option>
                  {dropdownData.statusList.map((item, idx) => (
                    <option key={idx} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  placeholder="Enter status..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Form
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
};

export default Maintenance_Form;
