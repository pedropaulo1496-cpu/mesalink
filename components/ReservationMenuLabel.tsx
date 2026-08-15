import { UtensilsCrossed } from "lucide-react";

export default function ReservationMenuLabel({
  title,
  extraCount = 0,
  className = "",
}: {
  title: string;
  extraCount?: number;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-lg bg-[#F5EBDD] px-2 py-1.5 text-[10px] font-semibold leading-none text-[#684A27] ${className}`}
      title={title}
    >
      <UtensilsCrossed size={11} strokeWidth={2.2} className="shrink-0 text-[#A4773E]" />
      <span className="min-w-0 truncate">{title}</span>
      {extraCount > 0 && (
        <span className="shrink-0 rounded-md bg-white/80 px-1.5 py-0.5 text-[9px] font-black text-[#8A602C]">
          +{extraCount}
        </span>
      )}
    </div>
  );
}
