export default function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-[#2b2b2b] bg-[#181818] p-6">
      <p className="text-sm text-[#8f8f8f]">
        {label}
      </p>

      <p className="mt-2 text-4xl font-black text-[#f0c36a]">
        {value}
      </p>
    </div>
  );
}