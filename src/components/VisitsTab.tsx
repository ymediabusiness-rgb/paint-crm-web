"use client";
import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, deleteDoc, collection, addDoc, updateDoc } from "firebase/firestore";
import { Search, Trash2, Eye, X, MapPin, Edit, Plus, AlertCircle } from "lucide-react";
import { getBadgeClass, formatDate } from "../lib/constants";

const normalizeOutcome = (outcome?: string) => {
  if (!outcome) return "Other";
  const lower = outcome.toLowerCase();
  if (lower === "sold") return "Sold";
  if (lower === "interested") return "Interested";
  if (lower === "follow-up") return "Follow-up";
  if (lower === "not interested") return "Not Interested";
  return "Other";
};

export default function VisitsTab({ 
  visits, 
  users, 
  customers = [] 
}: { 
  visits: any[]; 
  users: any[]; 
  customers?: any[];
}) {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("All");
  const [viewVisit, setViewVisit] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Add Visit States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    customerId: "",
    repId: "",
    outcome: "Interested",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit Visit States
  const [editingVisit, setEditingVisit] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    customerId: "",
    repId: "",
    outcome: "Interested",
    date: "",
    notes: ""
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = visits
    .map(v => {
      const repUser = users.find(u => u.id === (v.repId || v.createdBy));
      const actualRepName = repUser ? (repUser.displayName || repUser.email?.split("@")[0] || "Representative") : (v.repName || "Representative");
      return { ...v, actualRepName };
    })
    .filter(v => outcomeFilter === "All" || normalizeOutcome(v.outcome) === outcomeFilter)
    .filter(v => 
      !search || 
      v.customerName?.toLowerCase().includes(search.toLowerCase()) || 
      v.actualRepName?.toLowerCase().includes(search.toLowerCase()) || 
      v.notes?.toLowerCase().includes(search.toLowerCase())
    );

  const confirmDelete = async (id: string) => {
    await deleteDoc(doc(db, "visits", id));
    setDeleteConfirm(null);
  };

  const handleAddVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAdding(true);

    const targetCustomerId = addForm.customerId || (customers[0]?.id || "");
    const targetRepId = addForm.repId || (users[0]?.id || "");

    if (!targetCustomerId || !targetRepId) {
      setAddError("Please make sure a Customer and Representative are selected.");
      setAdding(false);
      return;
    }

    const selectedCustomer = customers.find(c => c.id === targetCustomerId);
    const selectedRep = users.find(u => u.id === targetRepId);

    if (!selectedCustomer) {
      setAddError("Selected customer is invalid.");
      setAdding(false);
      return;
    }
    if (!selectedRep) {
      setAddError("Selected representative is invalid.");
      setAdding(false);
      return;
    }

    try {
      const docData: any = {
        customerId: targetCustomerId,
        customerName: selectedCustomer.name || "Unknown Customer",
        repId: targetRepId,
        repName: selectedRep.displayName || selectedRep.name || "Unknown Representative",
        adminId: selectedRep.adminId || null,
        outcome: addForm.outcome,
        date: new Date(addForm.date),
        notes: addForm.notes,
        createdAt: new Date(),
      };

      await addDoc(collection(db, "visits"), docData);
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || "An error occurred while creating the visit.");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (v: any) => {
    setEditingVisit(v);
    
    let formattedDate = "";
    if (v.date) {
      const d = v.date.toDate ? v.date.toDate() : new Date(v.date);
      formattedDate = d.toISOString().split("T")[0];
    } else {
      formattedDate = new Date().toISOString().split("T")[0];
    }

    setEditForm({
      customerId: v.customerId || "",
      repId: v.repId || "",
      outcome: v.outcome || "Interested",
      date: formattedDate,
      notes: v.notes || ""
    });
    setEditError("");
  };

  const handleEditVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVisit) return;
    setEditError("");
    setSaving(true);

    if (!editForm.customerId || !editForm.repId) {
      setEditError("Customer and representative are required.");
      setSaving(false);
      return;
    }

    const selectedCustomer = customers.find(c => c.id === editForm.customerId);
    const selectedRep = users.find(u => u.id === editForm.repId);

    if (!selectedCustomer) {
      setEditError("Selected customer is invalid.");
      setSaving(false);
      return;
    }
    if (!selectedRep) {
      setEditError("Selected representative is invalid.");
      setSaving(false);
      return;
    }

    try {
      const docData: any = {
        customerId: editForm.customerId,
        customerName: selectedCustomer.name || "Unknown Customer",
        repId: editForm.repId,
        repName: selectedRep.displayName || selectedRep.name || "Unknown Representative",
        adminId: selectedRep.adminId || null,
        outcome: editForm.outcome,
        date: new Date(editForm.date),
        notes: editForm.notes,
      };

      docData.location = null;

      await updateDoc(doc(db, "visits", editingVisit.id), docData);
      setEditingVisit(null);
    } catch (err: any) {
      setEditError(err.message || "An error occurred while updating the visit.");
    } finally {
      setSaving(false);
    }
  };

  const outcomeCounts = {
    All: visits.length,
    Sold: visits.filter(v => normalizeOutcome(v.outcome) === "Sold").length,
    Interested: visits.filter(v => normalizeOutcome(v.outcome) === "Interested").length,
    "Follow-up": visits.filter(v => normalizeOutcome(v.outcome) === "Follow-up").length,
    "Not Interested": visits.filter(v => normalizeOutcome(v.outcome) === "Not Interested").length,
    Other: visits.filter(v => normalizeOutcome(v.outcome) === "Other").length,
  };

  return (
    <div className="animate-in w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-gray-900">All Visits</h2>
          <p className="text-gray-500 text-sm">{filtered.length} visits recorded across the network</p>
        </div>
        <button 
          onClick={() => {
            setAddError("");
            const initialRep = users.filter(u => u.role !== "Admin" && u.role !== "SuperAdmin")[0];
            const initialCust = customers.find(c => c.createdBy === initialRep?.id);
            setAddForm({
              customerId: initialCust?.id || "",
              repId: initialRep?.id || "",
              outcome: "Interested",
              date: new Date().toISOString().split("T")[0],
              notes: ""
            });
            setShowAddModal(true);
          }} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Visit
        </button>
      </div>

      {/* Outcome Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(Object.entries(outcomeCounts) as [string, number][]).map(([key, count]) => (
          <button key={key} onClick={() => setOutcomeFilter(key)}
            className={`p-3 rounded-xl text-center transition-all border ${outcomeFilter === key ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-gray-200 text-gray-500 hover:text-gray-900"}`}>
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider">{key}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="form-input" placeholder="Search by customer, rep, or notes..." />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Customer</th>
              <th className="text-left">Rep</th>
              <th className="text-left">Outcome</th>
              <th className="text-left">Date</th>
              <th className="text-left">Notes</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td className="font-medium text-gray-900">{v.customerName}</td>
                <td className="text-sm text-gray-500">{v.actualRepName}</td>
                <td><span className={`badge ${getBadgeClass(normalizeOutcome(v.outcome))}`}>{normalizeOutcome(v.outcome)}</span></td>
                <td className="text-sm text-gray-500">{formatDate(v.date)}</td>
                <td className="text-sm text-gray-500 max-w-[200px] truncate">{v.notes || "—"}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewVisit(v)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No visits found.</div>}
      </div>

      {/* Add Visit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full animate-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Visit Record</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddVisit} className="space-y-4">
              {addError && (
                <div className="text-red-600 text-xs font-medium bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Representative *</label>
                <select 
                  value={addForm.repId} 
                  onChange={e => {
                    const newRepId = e.target.value;
                    const validCustomers = customers.filter(c => c.createdBy === newRepId);
                    setAddForm({ 
                      ...addForm, 
                      repId: newRepId, 
                      customerId: validCustomers.some(c => c.id === addForm.customerId) ? addForm.customerId : (validCustomers[0]?.id || "")
                    });
                  }}
                  className="form-input w-full"
                  required
                >
                  <option value="" disabled>Select Representative</option>
                  {users.filter(u => u.role !== "Admin" && u.role !== "SuperAdmin").map(u => (
                    <option key={u.id} value={u.id} className="bg-white text-gray-900">
                      {u.displayName || u.name} ({u.role || "Rep"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer *</label>
                <select 
                  value={addForm.customerId} 
                  onChange={e => setAddForm({ ...addForm, customerId: e.target.value })}
                  className="form-input w-full"
                  required
                  disabled={!addForm.repId}
                >
                  <option value="" disabled>Select Customer</option>
                  {customers.filter(c => c.createdBy === addForm.repId).map(c => (
                    <option key={c.id} value={c.id} className="bg-white text-gray-900">
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Outcome *</label>
                  <select 
                    value={addForm.outcome} 
                    onChange={e => setAddForm({ ...addForm, outcome: e.target.value })}
                    className="form-input w-full"
                    required
                  >
                    <option value="Sold" className="bg-white text-emerald-600">Sold</option>
                    <option value="Interested" className="bg-white text-blue-600">Interested</option>
                    <option value="Follow-up" className="bg-white text-amber-600">Follow-up</option>
                    <option value="Not Interested" className="bg-white text-rose-600">Not Interested</option>
                    <option value="Other" className="bg-white text-purple-600">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date *</label>
                  <input 
                    type="date" 
                    value={addForm.date} 
                    onChange={e => setAddForm({ ...addForm, date: e.target.value })}
                    className="form-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea 
                  value={addForm.notes} 
                  onChange={e => setAddForm({ ...addForm, notes: e.target.value })}
                  className="form-input w-full h-24 resize-none"
                  placeholder="Details about the visit discussion..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="btn-primary flex-1">
                  {adding ? "Adding..." : "Add Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Visit Modal */}
      {editingVisit && (
        <div className="modal-overlay" onClick={() => setEditingVisit(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full animate-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Visit Record</h3>
              <button onClick={() => setEditingVisit(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleEditVisit} className="space-y-4">
              {editError && (
                <div className="text-red-600 text-xs font-medium bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Representative *</label>
                <select 
                  value={editForm.repId} 
                  onChange={e => {
                    const newRepId = e.target.value;
                    const validCustomers = customers.filter(c => c.createdBy === newRepId);
                    setEditForm({ 
                      ...editForm, 
                      repId: newRepId, 
                      customerId: validCustomers.some(c => c.id === editForm.customerId) ? editForm.customerId : (validCustomers[0]?.id || "")
                    });
                  }}
                  className="form-input w-full"
                  required
                >
                  <option value="" disabled>Select Representative</option>
                  {users.filter(u => u.role !== "Admin" && u.role !== "SuperAdmin").map(u => (
                    <option key={u.id} value={u.id} className="bg-white text-gray-900">
                      {u.displayName || u.name} ({u.role || "Rep"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer *</label>
                <select 
                  value={editForm.customerId} 
                  onChange={e => setEditForm({ ...editForm, customerId: e.target.value })}
                  className="form-input w-full"
                  required
                  disabled={!editForm.repId}
                >
                  <option value="" disabled>Select Customer</option>
                  {customers.filter(c => c.createdBy === editForm.repId).map(c => (
                    <option key={c.id} value={c.id} className="bg-white text-gray-900">
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Outcome *</label>
                  <select 
                    value={editForm.outcome} 
                    onChange={e => setEditForm({ ...editForm, outcome: e.target.value })}
                    className="form-input w-full"
                    required
                  >
                    <option value="Sold" className="bg-white text-emerald-600">Sold</option>
                    <option value="Interested" className="bg-white text-blue-600">Interested</option>
                    <option value="Follow-up" className="bg-white text-amber-600">Follow-up</option>
                    <option value="Not Interested" className="bg-white text-rose-600">Not Interested</option>
                    <option value="Other" className="bg-white text-purple-600">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date *</label>
                  <input 
                    type="date" 
                    value={editForm.date} 
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    className="form-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                <textarea 
                  value={editForm.notes} 
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="form-input w-full h-24 resize-none"
                  placeholder="Details about the visit discussion..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingVisit(null)} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail */}
      {viewVisit && (
        <div className="modal-overlay" onClick={() => setViewVisit(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-md w-full animate-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Visit Details</h3>
              <button onClick={() => setViewVisit(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-900">{viewVisit.customerName}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Representative</span><span className="text-gray-900">{viewVisit.actualRepName}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Outcome</span><span className={`badge ${getBadgeClass(normalizeOutcome(viewVisit.outcome))}`}>{normalizeOutcome(viewVisit.outcome)}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Date</span><span className="text-gray-900">{formatDate(viewVisit.date)}</span></div>
              <div className="py-2"><p className="text-gray-500 mb-1">Notes</p><p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{viewVisit.notes || "No notes provided."}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Delete Visit?</h3>
            <p className="text-sm text-gray-500 mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-outline flex-1">Cancel</button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
