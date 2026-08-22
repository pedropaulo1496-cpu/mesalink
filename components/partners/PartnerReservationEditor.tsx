"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, PencilLine, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { dateTimeInputInTimeZone } from "@/lib/reservation-time-zone";

type Props = {
  groupId: string;
  status: string;
  desiredDate: string;
  timeZone: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  adults: number;
  childGuests: number;
  syncedWithRestaurant: boolean;
};

const inputClass = "h-10 min-w-0 w-full rounded-xl border border-[#DED1BD] bg-white px-3 text-xs outline-none transition focus:border-[#B98A45]";

export default function PartnerReservationEditor(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [customerName, setCustomerName] = useState(props.customerName);
  const [customerPhone, setCustomerPhone] = useState(props.customerPhone);
  const [customerEmail, setCustomerEmail] = useState(props.customerEmail);
  const [desiredDate, setDesiredDate] = useState(dateTimeInputInTimeZone(props.desiredDate, props.timeZone));
  const [adults, setAdults] = useState(props.adults);
  const [children, setChildren] = useState(props.childGuests);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!desiredDate) return;
    setSaving(true);
    setMessage("");
    setError(false);
    const response = await fetch(`/api/partner-groups/${props.groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerPhone, customerEmail, desiredDate, timeZone: props.timeZone, adults, children }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSaving(false);
    if (!response?.ok) {
      setError(true);
      return setMessage(data?.error || "Não foi possível atualizar a reserva.");
    }
    setMessage(data?.restaurantNotified === false
      ? "Reserva atualizada. O restaurante será novamente avisado assim que o envio estiver disponível."
      : data?.synced ? "Reserva atualizada também na agenda do restaurante." : "Pedido atualizado e restaurante avisado.");
    router.refresh();
  }

  return <div className="mt-3">
    <button type="button" onClick={() => { setOpen((value) => !value); setMessage(""); setError(false); }} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#D8C6A9] bg-white px-3 text-[9px] font-bold text-[#6E5232]"><PencilLine size={11} /> Alterar reserva</button>
    {open && <form onSubmit={submit} className="mt-3 rounded-[18px] border border-[#DCCBB1] bg-[#FBF6EE] p-3">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.13em] text-[#7B572B]">Dados da reserva</p><p className="mt-1 text-[9px] leading-4 text-[#75695D]">{props.syncedWithRestaurant ? "As alterações ficam visíveis automaticamente na agenda do restaurante." : "O pedido pendente é atualizado e o restaurante recebe os novos dados."}</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar edição" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[#75695D]"><X size={12} /></button></div>
      <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-3">
        <Field label="Nome"><input required maxLength={100} value={customerName} onChange={(event) => setCustomerName(event.target.value)} className={inputClass} /></Field>
        <Field label="Telemóvel"><input required maxLength={30} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className={inputClass} /></Field>
        <Field label="Email"><input required type="email" maxLength={160} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} className={inputClass} /></Field>
        <Field label="Data e hora"><input required type="datetime-local" value={desiredDate} onChange={(event) => setDesiredDate(event.target.value)} className={inputClass} /></Field>
        <Field label="Adultos"><input required type="number" min={1} max={200} value={adults} onChange={(event) => setAdults(Math.max(1, Number(event.target.value)))} className={inputClass} /></Field>
        <Field label="Crianças"><input required type="number" min={0} max={199} value={children} onChange={(event) => setChildren(Math.max(0, Number(event.target.value)))} className={inputClass} /></Field>
      </div>
      {props.status === "BOOKED" && <p className="mt-2 text-[9px] leading-4 text-[#80613D]">Depois da confirmação podes corrigir os dados e reduzir o grupo. Um aumento acima do número inicialmente garantido requer apoio do MesaLink.</p>}
      {message && <p className={`mt-2 text-[9px] font-semibold ${error ? "text-[#934A35]" : "text-[#3F6A4D]"}`}>{message}</p>}
      <div className="mt-3 flex justify-end"><button disabled={saving} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#17120D] px-4 text-[9px] font-bold text-white disabled:opacity-50">{saving ? <LoaderCircle size={12} className="animate-spin" /> : <Save size={12} />}{saving ? "A guardar…" : "Guardar alterações"}</button></div>
    </form>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0 text-[9px] font-bold text-[#655A4E]">{label}<span className="mt-1 block">{children}</span></label>;
}
