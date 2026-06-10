export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PENDING:
      "bg-yellow-500/15 text-yellow-300 border-yellow-500/20",

    CONFIRMED:
      "bg-blue-500/15 text-blue-300 border-blue-500/20",

    SEATED:
      "bg-green-500/15 text-green-300 border-green-500/20",

    FINISHED:
      "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",

    CANCELLED:
      "bg-red-500/15 text-red-300 border-red-500/20",

    REJECTED:
      "bg-red-500/15 text-red-300 border-red-500/20",

    NO_SHOW:
      "bg-orange-500/15 text-orange-300 border-orange-500/20",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${
        styles[status] ??
        "bg-zinc-500/15 text-zinc-300 border-zinc-500/20"
      }`}
    >
      {status}
    </span>
  );
}