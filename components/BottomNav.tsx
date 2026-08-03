import Link from "next/link";

export default function BottomNav({ id }: { id: string }) {
  const items = [
    { href: `/restaurants/${id}`, icon: "⌂", label: "Dash" },
    { href: `/restaurants/${id}/day`, icon: "⚡", label: "Hoje" },
    { href: `/restaurants/${id}/calendar`, icon: "📅", label: "Calend." },
    { href: `/restaurants/${id}/ordering`, icon: "📲", label: "QR" },
    { href: `/restaurants/${id}/tables`, icon: "▦", label: "Sala" },
    { href: `/restaurants/${id}/marketing`, icon: "📣", label: "Mkt." },
    { href: `/restaurants/${id}/settings`, icon: "⚙️", label: "Def." },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E1D0B8] bg-[#F5EFE6]/95 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl lg:hidden">
      <div className="grid grid-cols-7">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[#6B6258] active:bg-[#FFF9F0] active:text-[#16120E]"
          >
            <span className="text-[18px] leading-none">{item.icon}</span>
            <span className="text-[8px] font-black leading-none">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
