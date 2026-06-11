"use client";
import { useState } from "react";
import { db } from "../lib/firebase";
import { doc, deleteDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { Search, Trash2, Edit, X, Save, Eye, Plus, MapPin, User, Mail, Phone, Map, Calendar, ShieldAlert } from "lucide-react";
import { getBadgeClass, formatDate } from "../lib/constants";

export default function CustomersTab({ customers, visits, users }: { customers: any[]; visits: any[]; users: any[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  // Edit Customer State
  const [showEditModal, setShowEditModal] = useState(false);

  // Add Customer State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "Retail",
    status: "Lead",
    createdBy: "",
    nextFollowUp: ""
  });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered = customers
    .filter(c => typeFilter === "All" || c.type === typeFilter)
    .filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditForm({ 
      name: c.name || "", 
      email: c.email || "", 
      phone: c.phone || "", 
      address: c.address || "", 
      type: c.type || "Retail", 
      status: c.status || "Lead",
      createdBy: c.createdBy || "",
      nextFollowUp: c.nextFollowUp ? (c.nextFollowUp.seconds ? new Date(c.nextFollowUp.seconds * 1000).toISOString().split('T')[0] : c.nextFollowUp.toDate ? c.nextFollowUp.toDate().toISOString().split('T')[0] : new Date(c.nextFollowUp).toISOString().split('T')[0]) : ""
    });
    setShowEditModal(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      const assignedRep = users.find(u => u.id === editForm.createdBy);
      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
        type: editForm.type,
        status: editForm.status,
        createdBy: editForm.createdBy,
        adminId: assignedRep?.adminId || null,
        updatedAt: new Date()
      };

      if (editForm.nextFollowUp) {
        updateData.nextFollowUp = new Date(editForm.nextFollowUp);
      } else {
        updateData.nextFollowUp = null;
      }

      await updateDoc(doc(db, "customers", editingId), updateData);
      setEditingId(null);
      setShowEditModal(false);
    } catch (err: any) {
      alert("Error updating customer: " + err.message);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "customers", id));
      setDeleteConfirm(null);
    } catch (err: any) {
      alert("Error deleting customer: " + err.message);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAdding(true);

    if (!addForm.name || !addForm.email || !addForm.phone) {
      setAddError("Please fill out all required fields.");
      setAdding(false);
      return;
    }

    try {
      const assignedRep = users.find(u => u.id === (addForm.createdBy || users[0]?.id));
      const docData: any = {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        address: addForm.address,
        type: addForm.type,
        status: addForm.status,
        createdBy: addForm.createdBy || users[0]?.id || "SuperAdmin",
        adminId: assignedRep?.adminId || null,
        createdAt: new Date(),
      };

      if (addForm.nextFollowUp) {
        docData.nextFollowUp = new Date(addForm.nextFollowUp);
      }

      await addDoc(collection(db, "customers"), docData);
      
      // Reset & close
      setShowAddModal(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        type: "Retail",
        status: "Lead",
        createdBy: users[0]?.id || "",
        nextFollowUp: ""
      });
    } catch (err: any) {
      setAddError(err.message || "An error occurred while creating the customer.");
    } finally {
      setAdding(false);
    }
  };

  const getCreator = (createdBy: string) => users.find(u => u.id === createdBy)?.displayName || "Unknown";
  const getCustomerVisits = (cid: string) => visits.filter(v => v.customerId === cid);

  return (
    <div className="animate-in w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 text-gray-900">All Customers</h2>
          <p className="text-gray-500 text-sm font-medium">{filtered.length} of {customers.length} customers</p>
        </div>
        <button
          onClick={() => {
            setAddError("");
            setAddForm({
              name: "",
              email: "",
              phone: "",
              address: "",
              type: "Retail",
              status: "Lead",
              createdBy: users[0]?.id || "",
              nextFollowUp: ""
            });
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="flex-1 max-w-md">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" placeholder="Search by name, email, phone..." />
        </div>
        <div className="flex gap-2">
          {["All", "Retail", "Wholesale", "Corporate", "Contractor", "Architect", "Individual"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${typeFilter === t ? "bg-black text-white border border-black" : "bg-white text-gray-500 border border-gray-200 hover:text-gray-900"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">Customer</th>
              <th className="text-left">Phone</th>
              <th className="text-left">Type</th>
              <th className="text-left">Status</th>
              <th className="text-left">Created By</th>
              <th className="text-left">Visits</th>
              <th className="text-left">Follow-Up</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const cv = getCustomerVisits(c.id);
              const isEditing = editingId === c.id;
              return (
                <tr key={c.id}>
                  <td>
                    <div>
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{c.email}</p>
                    </div>
                  </td>
                  <td className="text-sm text-gray-500 font-medium">
                    {c.phone}
                  </td>
                  <td>
                    <span className={`badge ${getBadgeClass(c.type)}`}>{c.type}</span>
                  </td>
                  <td>
                    <span className={`badge ${getBadgeClass(c.status || "")}`}>{c.status || "N/A"}</span>
                  </td>
                  <td className="text-sm text-gray-500 font-medium">{getCreator(c.createdBy)}</td>
                  <td className="text-amber-600 font-bold">{cv.length}</td>
                  <td className="text-sm text-gray-500 font-medium">{c.nextFollowUp ? formatDate(c.nextFollowUp) : "—"}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setViewCustomer(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => startEdit(c)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400 font-medium">No customers found.</div>}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !adding && setShowAddModal(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-in relative border border-gray-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Add New Customer</h3>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">Register a new customer profile</p>
              </div>
              <button type="button" onClick={() => !adding && setShowAddModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 mb-5 animate-in">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input type="text" required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  className="form-input" placeholder="e.g. Acme Corporation or Jane Smith" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email *</label>
                  <input type="email" required value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="form-input text-sm" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone *</label>
                  <input type="text" required value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                    className="form-input text-sm" placeholder="+962 7 9000 0000" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Address</label>
                <input type="text" value={addForm.address} onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                  className="form-input" placeholder="e.g. 123 Amman St, Jordan" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Customer Type</label>
                  <select value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })} className="form-select w-full">
                    <option>Retail</option>
                    <option>Wholesale</option>
                    <option>Corporate</option>
                    <option>Contractor</option>
                    <option>Architect</option>
                    <option>Individual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Initial Status</label>
                  <select value={addForm.status} onChange={e => setAddForm({ ...addForm, status: e.target.value })} className="form-select w-full">
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Managed By / Owner</label>
                  <select value={addForm.createdBy} onChange={e => setAddForm({ ...addForm, createdBy: e.target.value })} className="form-select w-full">
                    <option value="">-- Choose Staff --</option>
                    {users.filter((u: any) => u.role !== "Admin" && u.role !== "SuperAdmin").map(u => (
                      <option key={u.id} value={u.id}>{u.displayName} ({u.role || "Rep"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Next Follow-Up</label>
                  <input type="date" value={addForm.nextFollowUp} onChange={e => setAddForm({ ...addForm, nextFollowUp: e.target.value })}
                    className="form-input text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} disabled={adding} className="btn-outline flex-1 py-2.5">
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                  {adding ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Customer</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingId && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-in relative border border-gray-200 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit Customer</h3>
                <p className="text-gray-500 text-xs mt-0.5 font-medium">Update customer details</p>
              </div>
              <button type="button" onClick={() => setShowEditModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name *</label>
                <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="form-input" placeholder="e.g. Acme Corporation or Jane Smith" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email *</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="form-input text-sm" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone *</label>
                  <input type="text" required value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="form-input text-sm" placeholder="+962 7 9000 0000" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Address</label>
                <input type="text" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className="form-input" placeholder="e.g. 123 Amman St, Jordan" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Customer Type</label>
                  <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} className="form-select w-full">
                    <option>Retail</option>
                    <option>Wholesale</option>
                    <option>Corporate</option>
                    <option>Contractor</option>
                    <option>Architect</option>
                    <option>Individual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="form-select w-full">
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Managed By / Owner</label>
                  <select value={editForm.createdBy} onChange={e => setEditForm({ ...editForm, createdBy: e.target.value })} className="form-select w-full">
                    <option value="">-- Choose Staff --</option>
                    {users.filter((u: any) => u.role !== "Admin" && u.role !== "SuperAdmin").map(u => (
                      <option key={u.id} value={u.id}>{u.displayName} ({u.role || "Rep"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Next Follow-Up</label>
                  <input type="date" value={editForm.nextFollowUp} onChange={e => setEditForm({ ...editForm, nextFollowUp: e.target.value })}
                    className="form-input text-sm" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline flex-1 py-2.5">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Drawer (Side Panel) */}
      {viewCustomer && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setViewCustomer(null)}
          />
          {/* Drawer */}
          <div 
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">{viewCustomer.name}</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{viewCustomer.type} Customer</p>
              </div>
              <button onClick={() => setViewCustomer(null)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Customer Info Section */}
              <div className="p-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Customer Details</h4>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4"/> Email</span>
                    <span className="text-gray-900">{viewCustomer.email}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><Phone className="w-4 h-4"/> Phone</span>
                    <span className="text-gray-900">{viewCustomer.phone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><Map className="w-4 h-4"/> Address</span>
                    <span className="text-gray-900 text-right max-w-[200px] truncate">{viewCustomer.address || "—"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4"/> Status</span>
                    <span className={`badge ${getBadgeClass(viewCustomer.status || "")}`}>{viewCustomer.status || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><User className="w-4 h-4"/> Created By</span>
                    <span className="text-gray-900">{getCreator(viewCustomer.createdBy)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> GPS Log</span>
                    {viewCustomer.location ? (
                      <a href={`https://maps.google.com/?q=${viewCustomer.location.latitude},${viewCustomer.location.longitude}`} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline text-right">
                        {viewCustomer.location.latitude.toFixed(4)}, {viewCustomer.location.longitude.toFixed(4)}
                      </a>
                    ) : (
                      <span className="text-indigo-600 font-bold">—</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> Next Follow-Up</span>
                    <span className="text-gray-900 font-bold">{viewCustomer.nextFollowUp ? formatDate(viewCustomer.nextFollowUp) : "—"}</span>
                  </div>
                </div>
              </div>

              <div className="h-2 bg-gray-50 w-full" />

              {/* Visit History Section */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visit History</h4>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{getCustomerVisits(viewCustomer.id).length} Visits</span>
                </div>
                
                <div className="space-y-3">
                  {getCustomerVisits(viewCustomer.id).length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100/50">
                      <p className="text-xs font-medium text-gray-400">No visits recorded yet.</p>
                    </div>
                  ) : (
                    getCustomerVisits(viewCustomer.id).map((v: any) => (
                      <div key={v.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs hover:border-gray-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              {v.repName?.[0] || "R"}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-none">{v.repName}</p>
                              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{formatDate(v.date)}</p>
                            </div>
                          </div>
                          <span className={`badge ${getBadgeClass(v.outcome)}`}>{v.outcome}</span>
                        </div>
                        {v.notes && (
                          <div className="mt-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-600 italic leading-relaxed">"{v.notes}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
              <button onClick={() => setViewCustomer(null)} className="w-full btn-outline py-2.5 bg-white">
                Close Panel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Delete Customer?</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">This will permanently remove the customer and cannot be undone.</p>
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
