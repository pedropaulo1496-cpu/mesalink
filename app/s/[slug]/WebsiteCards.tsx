import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#E1D0B8] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#9B6F3B] shadow-sm">
      {children}
    </span>
  );
}

export function MiniLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 text-sm">
      <span className="font-semibold text-[#9B8F82]">{label}</span>
      <span className="font-semibold text-[#16120E]">{value}</span>
    </div>
  );
}

export function GlassCard({
  eyebrow,
  title,
  value,
}: {
  eyebrow: string;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-[#E1D0B8] bg-white p-5 shadow-[0_18px_55px_rgba(80,55,30,0.045)]">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9B6F3B]">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[#16120E]">
        {title}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#6B6258]">
        {value}
      </p>
    </div>
  );
}

export function FeatureCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-[#E1D0B8] bg-[#FFF9F0] p-5">
      <p className="text-xs font-semibold text-[#9B6F3B]">{number}</p>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#16120E]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#6B6258]">{text}</p>
    </div>
  );
}

export function PremiumCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2.5rem] border border-[#E1D0B8] bg-white shadow-[0_22px_70px_rgba(80,55,30,0.055)] ${className}`}
    >
      {children}
    </div>
  );
}

export function GalleryTile({
  title,
  subtitle,
  image,
  large,
}: {
  title: string;
  subtitle: string;
  image: string | null;
  large?: boolean;
}) {
  return (
    <div
      className={
        large
          ? "relative min-h-[420px] overflow-hidden rounded-[2.5rem] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)] md:col-span-2 lg:col-span-2"
          : "relative min-h-[260px] overflow-hidden rounded-[2.5rem] border border-[#E1D0B8] bg-white p-6 shadow-[0_22px_70px_rgba(80,55,30,0.055)]"
      }
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,165,106,0.24),transparent_55%),linear-gradient(to_bottom,#FFF9F0,#EFE5D6)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/20 to-black/75" />

      <div className="relative flex h-full min-h-[220px] flex-col justify-end">
        {subtitle && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            {subtitle}
          </p>
        )}
        <h3 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
          {title}
        </h3>
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#9B6F3B]">
        {eyebrow}
      </p>

      <h2 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#16120E] md:text-6xl">
        {title}
      </h2>

      {text && (
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6B6258]">
          {text}
        </p>
      )}
    </div>
  );
}
