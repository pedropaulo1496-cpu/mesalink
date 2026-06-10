import Link from "next/link";

export default function Sidebar({
  restaurantId,
}: {
  restaurantId: string;
}) {
  return (
    <aside className="w-64 border-r border-[#2b2b2b] bg-[#111111] p-6">
      <Link
        href={`/restaurants/${restaurantId}`}
        className="text-3xl font-black"
      >
        Mesa<span className="text-[#f0c36a]">Link</span>
      </Link>

      <nav className="mt-10 space-y-2">
        <SidebarItem
          href={`/restaurants/${restaurantId}`}
          label="Dashboard"
        />

        <SidebarItem
          href={`/restaurants/${restaurantId}/reservations`}
          label="Reservas"
        />

        <SidebarItem
          href={`/restaurants/${restaurantId}/calendar`}
          label="Calendário"
        />

        <SidebarItem
          href={`/restaurants/${restaurantId}/customers`}
          label="Clientes"
        />

        <SidebarItem
          href={`/restaurants/${restaurantId}/tables`}
          label="Mesas"
        />

        <SidebarItem
          href={`/restaurants/${restaurantId}/qr`}
          label="QR Code"
        />

        <SidebarItem
          href={`/restaurants/${restaurantId}/settings`}
          label="Configurações"
        />
      </nav>
    </aside>
  );
}

function SidebarItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-4 py-3 text-[#bcbcbc] hover:bg-[#181818] hover:text-white"
    >
      {label}
    </Link>
  );
}