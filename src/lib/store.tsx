import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

export type Txn = {
  id: string;
  type: "debit" | "credit";
  amount: number;
  note?: string;
  at: number;
};

export type Customer = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  txns: Txn[];
  createdAt: number;
  deletedAt?: number;
};

type Ctx = {
  customers: Customer[];
  loading: boolean;
  addCustomer: (c: { name: string; phone?: string; address?: string; notes?: string; opening?: number }) => Promise<string | undefined>;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, "id" | "txns" | "createdAt">>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addTxn: (id: string, t: Omit<Txn, "id" | "at">) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
  balanceOf: (c: Customer) => number;
  statusOf: (c: Customer) => "settled" | "partial" | "pending";
  totals: () => { pending: number; pendingCount: number; partialCount: number; settledToday: number };
};

const StoreContext = createContext<Ctx | null>(null);

const balanceOf = (c: Customer) =>
  c.txns.reduce((s, t) => s + (t.type === "debit" ? t.amount : -t.amount), 0);

const statusOf = (c: Customer) => {
  const bal = balanceOf(c);
  if (bal <= 0) return "settled";
  const hasPaid = c.txns.some(t => t.type === "credit");
  if (hasPaid) return "partial";
  return "pending";
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCustomers = async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    // Fetch customers
    const { data: custData, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id);

    if (custErr) {
      console.error("Error fetching customers", custErr);
      setLoading(false);
      return;
    }

    // Fetch txns
    const { data: txnData, error: txnErr } = await supabase
      .from('txns')
      .select('*')
      .eq('user_id', user.id);

    if (txnErr) {
      console.error("Error fetching txns", txnErr);
      setLoading(false);
      return;
    }

    // Map DB rows to our local type
    const parsedCustomers: Customer[] = custData.map((c: any) => {
      const cTxns = txnData
        .filter((t: any) => t.customer_id === c.id)
        .map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          note: t.note,
          at: Number(t.at)
        }));

      return {
        id: c.id,
        name: c.name,
        phone: c.phone || undefined,
        address: c.address || undefined,
        notes: c.notes || undefined,
        createdAt: Number(c.created_at),
        deletedAt: c.deleted_at ? Number(c.deleted_at) : undefined,
        txns: cTxns,
      };
    });

    // Sort by most recently added
    parsedCustomers.sort((a, b) => b.createdAt - a.createdAt);
    setCustomers(parsedCustomers);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const addCustomer: Ctx["addCustomer"] = async ({ name, phone, address, notes, opening }) => {
    if (!user) {
      alert("Not logged in. Please login first.");
      return undefined;
    }
    const now = Date.now();

    // 1. Insert Customer
    console.log("Adding customer for user:", user.id, { name, phone, address, notes });
    const { data: cData, error: cErr } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name,
        phone,
        address,
        notes,
        created_at: now
      })
      .select()
      .single();

    if (cErr) {
      console.error("Supabase insert error:", cErr);
      alert("Error saving customer: " + cErr.message + "\n\nHint: Run the SQL in Supabase SQL Editor.");
      return undefined;
    }

    const newCustomer = {
      id: cData.id,
      name,
      phone,
      address,
      notes,
      createdAt: now,
      txns: [] as Txn[]
    };

    // 2. Insert Opening Balance if any
    if (opening && opening > 0) {
      const { data: tData, error: tErr } = await supabase
        .from('txns')
        .insert({
          customer_id: cData.id,
          user_id: user.id,
          type: 'debit',
          amount: opening,
          note: 'Opening balance',
          at: now
        })
        .select()
        .single();

      if (!tErr && tData) {
        newCustomer.txns.push({
          id: tData.id,
          type: 'debit',
          amount: Number(tData.amount),
          note: tData.note,
          at: Number(tData.at)
        });
      }
    }

    // Optimistic UI update
    setCustomers((cs) => [newCustomer, ...cs]);
    return cData.id;
  };

  const updateCustomer: Ctx["updateCustomer"] = async (id, updates) => {
    if (!user) return;
    
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    await supabase
      .from('customers')
      .update(updates)
      .eq('id', id);
  };

  const deleteCustomer: Ctx["deleteCustomer"] = async (id) => {
    if (!user) return;
    const now = Date.now();
    
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, deletedAt: now } : c)));

    await supabase
      .from('customers')
      .update({ deleted_at: now })
      .eq('id', id);
  };

  const addTxn: Ctx["addTxn"] = async (id, t) => {
    if (!user) return;
    const now = Date.now();

    // Optimistic ID, will be overwritten on next fetch, but enough for immediate UI
    const tempId = "t_" + Math.random().toString(36).slice(2, 9);
    const newTxn: Txn = { ...t, id: tempId, at: now };

    setCustomers((cs) => cs.map((c) => 
      c.id === id ? { ...c, txns: [...c.txns, newTxn] } : c
    ));

    await supabase
      .from('txns')
      .insert({
        customer_id: id,
        user_id: user.id,
        type: t.type,
        amount: t.amount,
        note: t.note,
        at: now
      });
  };

  const getCustomer = (id: string) => customers.find((c) => c.id === id && !c.deletedAt);

  const totals = () => {
    let pending = 0, pendingCount = 0, partialCount = 0, settledToday = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const c of customers) {
      if (c.deletedAt) continue;
      
      const b = balanceOf(c);
      const s = statusOf(c);

      if (b > 0) {
        pending += b;
        pendingCount++;
        if (s === "partial") partialCount++;
      }
      for (const t of c.txns) {
        if (t.type === "credit" && t.at >= startOfDay.getTime()) settledToday += t.amount;
      }
    }
    return { pending, pendingCount, partialCount, settledToday };
  };

  const activeCustomers = customers.filter(c => !c.deletedAt);

  return (
    <StoreContext.Provider value={{ 
      customers: activeCustomers, 
      loading,
      addCustomer, 
      updateCustomer,
      deleteCustomer,
      addTxn, 
      getCustomer, 
      balanceOf, 
      statusOf,
      totals 
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
