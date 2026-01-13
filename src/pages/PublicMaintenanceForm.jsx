import React, { useState, useEffect } from "react";
import { Send, Loader2, X, Wrench } from "lucide-react";
import useMaintenanceFormStore from "../stores/useMaintenanceFormStore";
import QRCodeGenerator from "../components/QRCodeGenerator";

const FORM_SHEET = "Maitenence_Form";

/**
 * Public Maintenance Form - Accessible without login
 * This form is designed to be accessed via QR code by anyone
 */
const PublicMaintenanceForm = () => {
  const [formData, setFormData] = useState({
    formFilledBy: "",
    machineName: "",
    issueDetail: "",
    toAssignPerson: "",
  });

  const [customInputs, setCustomInputs] = useState({
    formFilledBy: false,
    machineName: false,
    toAssignPerson: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Get dropdown data from Zustand store
  const {
    formFilledByList,
    machineNameList,
    toAssignPersonList,
    isLoading,
    fetchMasterData,
  } = useMaintenanceFormStore();

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

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

  const handleSubmit = async () => {
    // Validation
    if (
      !formData.formFilledBy ||
      !formData.machineName ||
      !formData.issueDetail ||
      !formData.toAssignPerson
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

      const response = await fetch(
        `https://script.google.com/macros/s/AKfycbzXzqnKmbeXw3i6kySQcBOwxHQA7y8WBFfEe69MPbCR-jux0Zte7-TeSKi8P4CIFkhE/exec`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: FORM_SHEET,
            action: "insertBasicRepair",
            data: JSON.stringify([
              timestamp,
              "",
              formData.formFilledBy,
              formData.toAssignPerson,
              formData.machineName,
              formData.issueDetail,
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ]),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          text: "Repair request submitted successfully! The admin will complete the remaining details.",
        });

        setFormData({
          formFilledBy: "",
          machineName: "",
          issueDetail: "",
          toAssignPerson: "",
        });
        setCustomInputs({
          formFilledBy: false,
          machineName: false,
          toAssignPerson: false,
        });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-indigo-600 animate-spin" />
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* QR Code Generator - Floating button in top-right corner */}
      <QRCodeGenerator
        title="Share This Form"
        description="Scan this QR code to open the Repairing Request Form on another device"
        position="top-right"
        size={220}
      />

      {/* Header */}
      <div className="px-4 py-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Repairing Request Form
          </h1>
          <p className="mt-2 text-indigo-100">
            Submit a repair request for machinery issues
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="p-6 bg-white shadow-xl sm:p-8 rounded-2xl">
            <p className="mb-6 text-gray-600">
              Fill in the basic details below and the admin will complete the
              remaining information.
            </p>

            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                <p>{message.text}</p>
                <button
                  onClick={() => setMessage({ type: "", text: "" })}
                  className="ml-2 hover:opacity-70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="space-y-6">
              {/* Form Filled By */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
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
                    {formFilledByList.map((item, idx) => (
                      <option key={idx} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.formFilledBy}
                      onChange={(e) =>
                        handleInputChange("formFilledBy", e.target.value)
                      }
                      placeholder="Enter name..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInputs((prev) => ({
                          ...prev,
                          formFilledBy: false,
                        }));
                        setFormData((prev) => ({ ...prev, formFilledBy: "" }));
                      }}
                      className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* To Assign Person */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  To Assign Person <span className="text-red-500">*</span>
                </label>
                {!customInputs.toAssignPerson ? (
                  <select
                    value={formData.toAssignPerson}
                    onChange={(e) =>
                      handleDropdownChange("toAssignPerson", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select person to assign...</option>
                    {toAssignPersonList.map((item, idx) => (
                      <option key={idx} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.toAssignPerson}
                      onChange={(e) =>
                        handleInputChange("toAssignPerson", e.target.value)
                      }
                      placeholder="Enter person name..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInputs((prev) => ({
                          ...prev,
                          toAssignPerson: false,
                        }));
                        setFormData((prev) => ({
                          ...prev,
                          toAssignPerson: "",
                        }));
                      }}
                      className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* Machine Name */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
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
                    {machineNameList.map((item, idx) => (
                      <option key={idx} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.machineName}
                      onChange={(e) =>
                        handleInputChange("machineName", e.target.value)
                      }
                      placeholder="Enter machine name..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInputs((prev) => ({
                          ...prev,
                          machineName: false,
                        }));
                        setFormData((prev) => ({ ...prev, machineName: "" }));
                      }}
                      className="px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>

              {/* Issue Detail */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Issue Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.issueDetail}
                  onChange={(e) =>
                    handleInputChange("issueDetail", e.target.value)
                  }
                  placeholder="Describe the issue in detail..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center justify-center w-full gap-2 py-4 font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </button>

              <p className="text-sm text-center text-gray-500">
                After submission, the admin will fill in additional details like
                Part Replaced, Work Done, Status, etc.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-sm text-center text-gray-400">
            © {new Date().getFullYear()} Repairing Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicMaintenanceForm;
