"use client";
import { useState } from "react";
import { db, auth } from "../lib/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Search, Trash2, Edit, X, Save, Plus, Key, Mail, User, ShieldAlert } from "lucide-react";
import { getBadgeClass, formatDate } from "../lib/constants";

export default function UsersTab({ users, customers, visits, roleFilter, title }: {
  users: any[]; customers: any[]; visits: any[]; roleFilter: string; title: string;
}) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ displayName: "", email: "", password: "", adminId: "" });
  const [addError, setAddError] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // All admins in system for dropdown list
  const adminsList = users.filter(u => u.role === "Admin");

  const filtered = users
    .filter(u => u.role === roleFilter)
    .filter(u => !search || u.displayName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({ 
      displayName: user.displayName || "", 
      email: user.email || "", 
      role: user.role || roleFilter,
      adminId: user.adminId || "",
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updateData: any = {
        displayName: editForm.displayName,
        email: editForm.email,
        role: editForm.role,
      };
      
      if (editForm.role === "Rep") {
        updateData.adminId = editForm.adminId || "";
      } else {
        updateData.adminId = null; // Admins don't have an adminId
      }

      await updateDoc(doc(db, "users", editingId), updateData);
      
      // If password was edited, send to our secure API
      if (editForm.password) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          const res = await fetch("/api/update-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${idToken}`,
            },
            body: JSON.stringify({ uid: editingId, password: editForm.password }),
          });
          if (!res.ok) {
            const text = await res.text();
            console.error("Update user failed:", text);
            throw new Error(`Failed to update password. Server returned ${res.status}`);
          }
        }
      }
      
      // Always ensure their customers and visits have the correct adminId
      if (editForm.role === "Rep") {
        try {
          // Update customers
          const customersToUpdate = customers.filter(c => c.createdBy === editingId);
          for (const c of customersToUpdate) {
            if (c.adminId !== updateData.adminId) {
              await updateDoc(doc(db, "customers", c.id), { adminId: updateData.adminId });
            }
          }
          // Update visits
          const visitsToUpdate = visits.filter(v => v.createdBy === editingId || v.repId === editingId);
          for (const v of visitsToUpdate) {
            if (v.adminId !== updateData.adminId) {
              await updateDoc(doc(db, "visits", v.id), { adminId: updateData.adminId });
            }
          }
        } catch (syncError) {
          console.error("Error syncing Rep's adminId to customers/visits:", syncError);
        }
      }

      setEditingId(null);
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to delete a user.");
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Delete from Firebase Authentication first via our Next.js API
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: id }),
      });

      let errorMessage = "Failed to delete user from authentication.";
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          errorMessage = data.details || data.error || errorMessage;
        } catch (e) {
          console.error("Server returned non-JSON response:", text);
          errorMessage = `Server returned error ${res.status}: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      // Delete from Firestore
      await deleteDoc(doc(db, "users", id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error(err);
      alert("Error deleting user: " + err.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddingUser(true);

    if (roleFilter === "Rep" && !addForm.adminId) {
      setAddError("Please assign a managing Admin to this representative.");
      setAddingUser(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setAddError("You must be logged in to create a user.");
        setAddingUser(false);
        return;
      }
      const idToken = await currentUser.getIdToken();

      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: addForm.email,
          password: addForm.password,
          displayName: addForm.displayName,
          role: roleFilter,
        }),
      });

      let errorMessage = "Failed to create user.";
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          errorMessage = data.details || data.error || errorMessage;
        } catch (e) {
          console.error("Server returned non-JSON response:", text);
          errorMessage = `Server returned error ${res.status}: ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();

      // If rep, update their adminId
      if (roleFilter === "Rep" && addForm.adminId) {
         await updateDoc(doc(db, "users", data.uid), { adminId: addForm.adminId });
      }

      // Reset state and close modal
      setAddForm({ displayName: "", email: "", password: "", adminId: "" });
      setShowAddModal(false);
      alert(`${roleFilter} user created successfully!`);
    } catch (err: any) {
      console.error(err);
      setAddError(err.message || "An error occurred while creating the user.");
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className="animate-in w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-sm text-gray-500 font-medium">
            {filtered.length} {roleFilter.toLowerCase()}(s) in the system
          </p>
        </div>
        <button
          onClick={() => {
            setAddError("");
            setAddForm({ displayName: "", email: "", password: "", adminId: adminsList[0]?.id || "" });
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add {roleFilter}</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="form-input" placeholder={`Search ${roleFilter.toLowerCase()}s...`} />
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left pl-14">Name</th>
              <th className="text-left">Email</th>
              <th className="text-left">Password</th>
              {roleFilter === "Rep" && <th className="text-left">Managed By</th>}
              {/* For Admin: show Rep count. For Rep: show customer count */}
              <th className="text-left">{roleFilter === "Admin" ? "Reps" : "Customers"}</th>
              <th className="text-left">{roleFilter === "Admin" ? "Team Visits" : "Visits"}</th>
              <th className="text-left">Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              // For Admin: count reps assigned to them
              const repCount = users.filter(u => u.role === "Rep" && u.adminId === user.id).length;
              // For Admin: count all visits by their reps
              const adminRepIds = users.filter(u => u.role === "Rep" && u.adminId === user.id).map(u => u.id);
              const teamVisitCount = visits.filter(v => adminRepIds.includes(v.repId || v.createdBy)).length;
              // For Rep: count their own customers and visits
              const repCustomerCount = customers.filter(c => c.createdBy === user.id).length;
              const repVisitCount = visits.filter(v => (v.repId || v.createdBy) === user.id).length;

              const statA = roleFilter === "Admin" ? repCount : repCustomerCount;
              const statB = roleFilter === "Admin" ? teamVisitCount : repVisitCount;

              const admin = roleFilter === "Rep" ? users.find(u => u.id === user.adminId) : null;
              const isEditing = editingId === user.id;

              return (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        user.role === "Admin" ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                      }`}>
                        {user.displayName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm leading-none">{user.displayName}</p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-500 text-sm">
                    <span className="text-gray-400 text-xs">{user.email}</span>
                  </td>
                  <td>
                    <span className="text-gray-600 text-sm font-medium">••••••••</span>
                  </td>
                  {roleFilter === "Rep" && (
                    <td className="text-sm">
                      <span className="text-gray-600 font-medium">{admin?.displayName || "—"}</span>
                    </td>
                  )}

                  <td>
                    <span className="text-sm font-bold text-indigo-600">{statA}</span>
                  </td>
                  <td>
                    <span className="text-sm font-bold text-amber-600">{statB}</span>
                  </td>
                  <td className="text-gray-400 text-xs font-medium">{formatDate(user.createdAt)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => startEdit(user)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 font-medium">No {roleFilter.toLowerCase()}s found.</div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !addingUser && setShowAddModal(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-in relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create New {roleFilter}</h3>
                <p className="text-gray-500 text-xs mt-0.5">Register a new team member in Firebase Auth</p>
              </div>
              <button 
                onClick={() => !addingUser && setShowAddModal(false)} 
                disabled={addingUser}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-5">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 focus-within:border-black focus-within:bg-white transition-colors">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={addForm.displayName}
                    onChange={e => setAddForm({ ...addForm, displayName: e.target.value })}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 focus-within:border-black focus-within:bg-white transition-colors">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="e.g. john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Initial Password</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 focus-within:border-black focus-within:bg-white transition-colors">
                  <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="•••••••• (min 6 chars)"
                  />
                </div>
              </div>

              {roleFilter === "Rep" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Assign Managing Admin</label>
                    <select 
                      required
                      value={addForm.adminId}
                      onChange={e => setAddForm({ ...addForm, adminId: e.target.value })}
                      className="form-select w-full"
                    >
                      <option value="">-- Choose Admin --</option>
                      {adminsList.map(a => (
                        <option key={a.id} value={a.id}>{a.displayName} ({a.email})</option>
                      ))}
                    </select>
                  </div>

                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  disabled={addingUser}
                  className="btn-outline flex-1 py-2.5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingUser}
                  className="btn-primary flex-1 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {addingUser ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-transparent animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingId && (
        <div className="modal-overlay" onClick={() => setEditingId(null)}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full animate-in relative" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Edit {roleFilter}</h3>
                <p className="text-gray-500 text-xs mt-0.5">Update member details</p>
              </div>
              <button 
                onClick={() => setEditingId(null)} 
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 focus-within:border-black focus-within:bg-white transition-colors">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={editForm.displayName}
                    onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 focus-within:border-black focus-within:bg-white transition-colors">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="e.g. john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">New Password (Leave empty to keep current)</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 focus-within:border-black focus-within:bg-white transition-colors">
                  <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={editForm.password || ""}
                    onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    className="flex-1 bg-transparent border-none outline-none py-2.5 text-sm text-gray-900 placeholder-gray-400"
                    placeholder="Enter new password..."
                    minLength={6}
                  />
                </div>
              </div>

              {roleFilter === "Rep" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Assign Managing Admin</label>
                    <select 
                      required
                      value={editForm.adminId}
                      onChange={e => setEditForm({ ...editForm, adminId: e.target.value })}
                      className="form-select w-full py-2.5"
                    >
                      <option value="">-- Choose Admin --</option>
                      {adminsList.map(a => (
                        <option key={a.id} value={a.id}>{a.displayName} ({a.email})</option>
                      ))}
                    </select>
                  </div>

                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setEditingId(null)} 
                  className="btn-outline flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary flex-1 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full animate-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2 text-gray-900">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The user data will be permanently removed from Firestore.</p>
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
