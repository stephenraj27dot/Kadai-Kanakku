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
  totals: () => { pending: number; pendingCount: number; partialCount: number; settledToday: number; salesToday: number; settledThisMonth: number; salesThisMonth: number; };
};

const StoreContext = createContext<Ctx | null>(null);

export const balanceOf = (c: Customer) =>
  c.txns.reduce((s, t) => s + (t.type === "debit" ? t.amount : -t.amount), 0);

export const statusOf = (c: Customer) => {
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
    
    const { data, error } = await supabase
      .from('customers')
      .select('*, txns(*)')
      .eq('user_id', user.id);

    if (error) {
      console.error("Error fetching data", error);
      setLoading(false);
      return;
    }

    const parsed: Customer[] = data.map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || undefined,
      address: c.address || undefined,
      notes: c.notes || undefined,
      createdAt: Number(c.created_at),
      deletedAt: c.deleted_at ? Number(c.deleted_at) : undefined,
      txns: (c.txns || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        note: t.note,
        at: Number(t.at)
      })).sort((a: any, b: any) => b.at - a.at),
    }));

    setCustomers(parsed.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();

    if (!user) return;

    // Real-time sync for global store
    const channel = supabase.channel('global_store_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'txns' }, () => {
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchCustomers();
      })
      .subscribe();

    // Polling fallback every 15s — Supabase Realtime + RLS won't notify
    // the owner when a *different* auth user (customer) inserts a txn row.
    const poll = setInterval(() => {
      fetchCustomers();
    }, 15_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [user]);

  const totals = () => {
    let pending = 0, pendingCount = 0, partialCount = 0;
    let settledToday = 0, salesToday = 0;
    let settledThisMonth = 0, salesThisMonth = 0;
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

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
        if (t.at >= startOfMonth.getTime()) {
          if (t.type === "credit") settledThisMonth += t.amount;
          if (t.type === "debit") salesThisMonth += t.amount;
        }
        if (t.at >= startOfDay.getTime()) {
          if (t.type === "credit") settledToday += t.amount;
          if (t.type === "debit") salesToday += t.amount;
        }
      }
    }
    return { pending, pendingCount, partialCount, settledToday, salesToday, settledThisMonth, salesThisMonth };
  };

  const addCustomer: Ctx["addCustomer"] = async ({ name, phone, address, notes, opening }) => {
    if (!user) return undefined;
    const now = Date.now();
    const { data: cData, error: cErr } = await supabase
      .from('customers')
      .insert({ user_id: user.id, name, phone, address, notes, created_at: now })
      .select().single();

    if (cErr) return undefined;
    const newCustomer = { id: cData.id, name, phone, address, notes, createdAt: now, txns: [] as Txn[] };

    if (opening && opening > 0) {
      const { data: tData } = await supabase
        .from('txns')
        .insert({ customer_id: cData.id, user_id: user.id, type: 'debit', amount: opening, note: 'Opening balance', at: now })
        .select().single();
      if (tData) newCustomer.txns.push({ id: tData.id, type: 'debit', amount: Number(tData.amount), note: tData.note, at: Number(tData.at) });
    }
    setCustomers((cs) => [newCustomer, ...cs]);
    return cData.id;
  };

  const updateCustomer: Ctx["updateCustomer"] = async (id, updates) => {
    if (!user) return;
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    await supabase.from('customers').update(updates).eq('id', id);
  };

  const deleteCustomer: Ctx["deleteCustomer"] = async (id) => {
    if (!user) return;
    const now = Date.now();
    setCustomers((cs) => cs.map((c) => (c.id === id ? { ...c, deletedAt: now } : c)));
    await supabase.from('customers').update({ deleted_at: now }).eq('id', id);
  };

  const addTxn: Ctx["addTxn"] = async (id, t) => {
    if (!user) return;
    const now = Date.now();
    const newTxn: Txn = { ...t, id: "temp_" + now, at: now };
    setCustomers((cs) => cs.map((c) => c.id === id ? { ...c, txns: [newTxn, ...c.txns] } : c));
    await supabase.from('txns').insert({ customer_id: id, user_id: user.id, type: t.type, amount: t.amount, note: t.note, at: now });
  };

  return (
    <StoreContext.Provider value={{
      customers: customers.filter(c => !c.deletedAt),
      loading, addCustomer, updateCustomer, deleteCustomer, addTxn,
      getCustomer: (id) => customers.find(c => c.id === id && !c.deletedAt),
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
