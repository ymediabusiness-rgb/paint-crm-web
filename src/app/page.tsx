"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc } from "firebase/firestore";
import { SUPER_ADMIN_EMAIL } from "../lib/constants";

import LoginScreen from "../components/LoginScreen";
import Sidebar from "../components/Sidebar";
import DashboardTab from "../components/DashboardTab";
import UsersTab from "../components/UsersTab";
import CustomersTab from "../components/CustomersTab";
import VisitsTab from "../components/VisitsTab";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  const [usersList, setUsersList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [visitsList, setVisitsList] = useState<any[]>([]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if this is the super admin
        if (currentUser.email !== SUPER_ADMIN_EMAIL) {
          await signOut(auth);
          setError("Access denied. Only the Super Admin can access this portal.");
          setUser(null);
        } else {
          // Ensure SuperAdmin doc exists in Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists() || userDoc.data()?.role !== "SuperAdmin") {
            await setDoc(doc(db, "users", currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || "Super Admin",
              role: "SuperAdmin",
            }, { merge: true });
          }
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore listeners
  useEffect(() => {
    if (!user) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const u: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        u.push({ id: d.id, ...data, role: data.role || 'Rep' });
      });
      setUsersList(u);
    });

    const unsubCustomers = onSnapshot(collection(db, "customers"), (snap) => {
      const c: any[] = [];
      snap.forEach(d => c.push({ id: d.id, ...d.data() }));
      setCustomersList(c);
    });

    const unsubVisits = onSnapshot(collection(db, "visits"), (snap) => {
      const v: any[] = [];
      snap.forEach(d => v.push({ id: d.id, ...d.data() }));
      // Sort by date descending
      v.sort((a, b) => {
        const dateA = a.date?.seconds ? a.date.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0);
        const dateB = b.date?.seconds ? b.date.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0);
        return dateB - dateA;
      });
      setVisitsList(v);
    });

    return () => { unsubUsers(); unsubCustomers(); unsubVisits(); };
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EFECE5]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} error={error} onSubmit={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#EFECE5] text-gray-900 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => signOut(auth)} />

      <main className="ml-[240px] p-8 min-h-screen">
        {activeTab === "dashboard" && <DashboardTab users={usersList} customers={customersList} visits={visitsList} setActiveTab={setActiveTab} />}
        {activeTab === "admins" && <UsersTab users={usersList} customers={customersList} visits={visitsList} roleFilter="Admin" title="Admin Management" />}
        {activeTab === "reps" && <UsersTab users={usersList} customers={customersList} visits={visitsList} roleFilter="Rep" title="Representatives Management" />}
        {activeTab === "customers" && <CustomersTab customers={customersList} visits={visitsList} users={usersList} />}
        {activeTab === "visits" && <VisitsTab visits={visitsList} users={usersList} customers={customersList} />}
      </main>
    </div>
  );
}
