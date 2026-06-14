import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white/60 backdrop-blur-xl">
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
      <span className="font-bold text-white/35">{label}</span>
      <span className="font-semibold text-white/75">{value}</span>
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
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/35">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-black tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
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
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-black text-white/30">{number}</p>
      <h3 className="mt-5 text-xl font-black tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-white/50">{text}</p>
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
      className={`rounded-[2.5rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl ${className}`}
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
          ? "relative min-h-[420px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl md:col-span-2 lg:col-span-2"
          : "relative min-h-[260px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl"
      }
    >
      {image ? (
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%),linear-gradient(to_bottom,#18181b,#09090b)]" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/85" />

      <div className="relative flex h-full min-h-[220px] flex-col justify-end">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/35">
          {subtitle}
        </p>
        <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">
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
      <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
        {eyebrow}
      </p>

      <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl">
        {title}
      </h2>

      {text && (
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/55">
          {text}
        </p>
      )}
    </div>
  );
}