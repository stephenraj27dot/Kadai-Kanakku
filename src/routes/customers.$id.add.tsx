import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { TxnForm } from "@/components/TxnForm";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/customers/$id/add")({
  component: AddBalance,
});

function AddBalance() {
  const { id } = Route.useParams();
  const { getCustomer, addTxn } = useStore();
  const navigate = useNavigate();
  const c = getCustomer(id);
  if (!c) return <Navigate to="/customers" />;

  return (
    <TxnForm
      kind="debit"
      customer={c}
      onSubmit={(amount, note) => {
        addTxn(id, { type: "debit", amount, note });
        navigate({ to: "/customers/$id", params: { id } });
      }}
      back={`/customers/${id}`}
    />
  );
}
