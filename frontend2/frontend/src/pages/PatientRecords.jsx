import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
} from "lucide-react";
import { useToast } from "../components/common/Toast";
import Spinner from "../components/common/Spinner";
import ErrorMessage from "../components/common/ErrorMessage";
import Modal, { ConfirmModal } from "../components/common/Modal";
import InputField from "../components/common/InputField";
import Button from "../components/common/Button";
import {
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../services/api";

const PatientRecords = () => {
  const { success, error } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Advanced filtering and sorting
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: "",
    dateFrom: "",
    dateTo: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const recordsPerPage = 10;

  // Risk level helpers
  const getRiskLevel = (predictions) => {
    if (!predictions || predictions.length === 0) return "Low";
    const maxConfidence = Math.max(...predictions.map((p) => p.confidence));
    if (maxConfidence >= 80) return "High";
    if (maxConfidence >= 60) return "Medium";
    return "Low";
  };

  const getRiskScore = (predictions) => {
    if (!predictions || predictions.length === 0) return 0;
    return Math.max(...predictions.map((p) => p.confidence));
  };

  // Fetch all patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Deduplicate by patient identity (name + mobile) to avoid repeated rows
  const uniquePatients = useMemo(() => {
    const latestByIdentity = new Map();

    patients.forEach((patient) => {
      if (!patient) return;

      const identityKey = `${(patient.fullname || "").trim().toLowerCase()}|${
        patient.mobile || patient._id
      }`;
      const existing = latestByIdentity.get(identityKey);
      const existingTimestamp = existing
        ? new Date(existing.updatedAt || existing.createdAt || 0).getTime()
        : 0;
      const currentTimestamp = new Date(
        patient.updatedAt || patient.createdAt || 0
      ).getTime();

      if (!existing || currentTimestamp > existingTimestamp) {
        latestByIdentity.set(identityKey, patient);
      }
    });

    return Array.from(latestByIdentity.values());
  }, [patients]);

  const fetchPatients = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await getAllPatients();
      setPatients(response.data || []);
    } catch (err) {
      setErrorMsg(err.message || "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  // Filter patients based on search query
  const filteredPatients = uniquePatients.filter((patient) => {
    const normalizedName = (patient.fullname || "").toLowerCase();
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesSearch =
      normalizedName.includes(normalizedQuery) ||
      (patient.mobile || "").includes(searchQuery);

    const matchesGender = !filters.gender || patient.gender === filters.gender;

    const patientDate = new Date(patient.createdAt);
    const matchesDateFrom =
      !filters.dateFrom || patientDate >= new Date(filters.dateFrom);
    const matchesDateTo =
      !filters.dateTo || patientDate <= new Date(filters.dateTo);

    return matchesSearch && matchesGender && matchesDateFrom && matchesDateTo;
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let aValue, bValue;

    switch (sortConfig.key) {
      case "fullname":
        aValue = a.fullname.toLowerCase();
        bValue = b.fullname.toLowerCase();
        break;
      case "age":
        aValue = a.age;
        bValue = b.age;
        break;
      case "createdAt":
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedPatients.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const paginatedPatients = sortedPatients.slice(
    startIndex,
    startIndex + recordsPerPage
  );

  // Sorting helper
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  // Filter reset
  const resetFilters = () => {
    setFilters({
      gender: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Object.values(filters).some((v) => v !== "") || searchQuery !== "";

  // View patient details
  const handleView = async (patientId) => {
    try {
      const response = await getPatientById(patientId);
      setSelectedPatient(response.data);
      setIsViewModalOpen(true);
    } catch (err) {
      error(err.message || "Failed to load patient details");
    }
  };

  // Open edit modal
  const handleEdit = async (patientId) => {
    try {
      const response = await getPatientById(patientId);
      setSelectedPatient(response.data);
      setEditFormData({
        fullname: response.data.fullname,
        age: response.data.age,
        gender: response.data.gender,
        mobile: response.data.mobile,
      });
      setIsEditModalOpen(true);
    } catch (err) {
      error(err.message || "Failed to load patient details");
    }
  };

  // Save edited patient
  const handleSaveEdit = async () => {
    try {
      await updatePatient(selectedPatient._id, editFormData);
      success("Patient updated successfully!");
      setIsEditModalOpen(false);
      fetchPatients(); // Refresh the list
    } catch (err) {
      error(err.message || "Failed to update patient");
    }
  };

  // Delete patient
  const handleDelete = async () => {
    try {
      await deletePatient(selectedPatient._id);
      success("Patient deleted successfully!");
      setIsDeleteModalOpen(false);
      setSelectedPatient(null);
      fetchPatients(); // Refresh the list
    } catch (err) {
      error(err.message || "Failed to delete patient");
    }
  };

  // Export to PDF (basic implementation - can be enhanced with jsPDF library)
  const handleExportPDF = (patient) => {
    const printContent = `
      PATIENT MEDICAL REPORT
      =====================
      
      Patient Information:
      Name: ${patient.fullname}
      Age: ${patient.age}
      Gender: ${patient.gender}
      Mobile: ${patient.mobile || "N/A"}
      Date: ${new Date(patient.createdAt).toLocaleString()}
      Risk Level: ${getRiskLevel(patient.predictions)}
      
      ${
        patient.predictions && patient.predictions.length > 0
          ? `
      Predicted Diseases:
      ${patient.predictions
        .map((p, i) => `${i + 1}. ${p.name} - ${p.confidence}% confidence`)
        .join("\n      ")}
      `
          : "No disease predictions"
      }
      
      Clinical Data:
      ${Object.keys(patient.clinicalData || {}).length} parameters recorded
      
      Generated: ${new Date().toLocaleString()}
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Report - ${patient.fullname}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <pre>${printContent}</pre>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Risk level badge
  const getRiskBadge = (predictions) => {
    if (!predictions || predictions.length === 0)
      return <span className="text-emerald-600 font-medium">Low Risk</span>;
    const maxConfidence = Math.max(...predictions.map((p) => p.confidence));
    if (maxConfidence >= 80)
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-semibold">
          High Risk
        </span>
      );
    if (maxConfidence >= 60)
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
          Medium Risk
        </span>
      );
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
        Low Risk
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Patient Records
              </h1>
              <p className="text-slate-500 text-sm">
                {filteredPatients.length} patients found
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-100 text-blue-700"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && !showFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, gender: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => {
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <ErrorMessage message={errorMsg} onClose={() => setErrorMsg("")} />
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort("fullname")}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Name {getSortIcon("fullname")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("age")}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Age {getSortIcon("age")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                  Gender
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                  Mobile
                </th>
                <th
                  onClick={() => handleSort("createdAt")}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Date {getSortIcon("createdAt")}
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No patients found</p>
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {patient.fullname}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.age}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.gender}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {patient.mobile || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(patient._id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(patient)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Export PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(patient._id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {startIndex + 1} to{" "}
              {Math.min(startIndex + recordsPerPage, sortedPatients.length)} of{" "}
              {sortedPatients.length} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Patient Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-semibold text-slate-900">
                  {selectedPatient.fullname}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Age</p>
                <p className="font-semibold text-slate-900">
                  {selectedPatient.age}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Gender</p>
                <p className="font-semibold text-slate-900">
                  {selectedPatient.gender}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Mobile</p>
                <p className="font-semibold text-slate-900">
                  {selectedPatient.mobile || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Risk Level</p>
                {getRiskBadge(selectedPatient.predictions)}
              </div>
              <div>
                <p className="text-sm text-slate-500">Date Registered</p>
                <p className="font-semibold text-slate-900">
                  {new Date(selectedPatient.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedPatient.predictions &&
              selectedPatient.predictions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Predicted Diseases
                  </h3>
                  <div className="space-y-2">
                    {selectedPatient.predictions.map((pred, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-lg flex justify-between"
                      >
                        <span className="text-slate-900">{pred.name}</span>
                        <span className="font-semibold text-rose-600">
                          {pred.confidence}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {selectedPatient.clinicalData && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Clinical Data Summary
                </h3>
                <p className="text-sm text-slate-600">
                  {Object.keys(selectedPatient.clinicalData).length} parameters
                  recorded
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient"
        footer={
          <>
            <Button
              onClick={() => setIsEditModalOpen(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <InputField
            label="Full Name"
            value={editFormData.fullname || ""}
            onChange={(name, value) =>
              setEditFormData((prev) => ({ ...prev, fullname: value }))
            }
          />
          <InputField
            label="Age"
            type="number"
            value={editFormData.age || ""}
            onChange={(name, value) =>
              setEditFormData((prev) => ({ ...prev, age: value }))
            }
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Gender
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none bg-slate-50"
              value={editFormData.gender || ""}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, gender: e.target.value }))
              }
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <InputField
            label="Mobile"
            value={editFormData.mobile || ""}
            onChange={(name, value) =>
              setEditFormData((prev) => ({ ...prev, mobile: value }))
            }
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Patient"
        message={`Are you sure you want to delete ${selectedPatient?.fullname}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default PatientRecords;
