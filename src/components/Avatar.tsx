export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 shadow-sm border border-black/5"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
