import Link from "next/link";
import { CheckCircle2, Handshake, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findPartnerRestaurantInvitation } from "@/lib/partner-restaurant-invitations";
import { prisma } from "@/lib/prisma";

export default async function RestaurantInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findPartnerRestaurantInvitation(token);
  if (!invitation || invitation.expiresAt <= new Date()) return <InvitationState title="Convite indisponível" text="Esta ligação é inválida ou já expirou. Peça ao parceiro para enviar um novo convite." />;
  const partnerName = invitation.partner.businessName || invitation.partner.contactName || "Um parceiro MesaLink";
  if (invitation.acceptedAt) return <InvitationState success title="Convite aceite" text={`O restaurante já faz parte dos favoritos de ${partnerName}.`} />;

  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.trim().toLowerCase() || "";
  const correctAccount = sessionEmail === invitation.email;
  const restaurant = correctAccount && session?.user?.id ? await prisma.restaurant.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } }) : null;
  const callbackUrl = `/restaurant-invite/${token}`;
  const registerUrl = `/register?email=${encodeURIComponent(invitation.email)}&partnerRestaurantInvite=${encodeURIComponent(token)}`;
  const loginUrl = `/login?email=${encodeURIComponent(invitation.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return <main className="grid min-h-screen place-items-center bg-[#F3EEE6] p-4 text-[#17120D]"><div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-[#DCC9AA] bg-white shadow-[0_25px_70px_rgba(65,43,22,0.12)]"><header className="bg-[#17120D] px-6 py-7 text-white sm:px-9"><p className="font-serif text-2xl font-bold"><span className="text-[#D7B267]">Mesa</span>Link</p><p className="mt-5 text-[10px] font-black uppercase tracking-[.22em] text-[#D7B267]">Convite de restaurante</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em]">{partnerName} quer enviar-lhe clientes.</h1></header><div className="p-6 sm:p-9"><div className="flex gap-3 rounded-[20px] border border-[#E4D5BD] bg-[#FFF9EF] p-4"><Handshake className="mt-0.5 shrink-0 text-[#9B6F3B]" size={20} /><div><p className="text-sm font-bold">Mais reservas através do MesaLink</p><p className="mt-1 text-xs leading-5 text-[#6B6258]">Ao aceitar, o restaurante fica automaticamente guardado nos favoritos de {partnerName}. A comissão por pessoa é negociada entre ambos e o restaurante mantém o controlo da disponibilidade.</p></div></div>{correctAccount && restaurant ? <form action={`/api/restaurant-invitations/${token}/accept`} method="POST"><button className="mt-5 h-12 w-full rounded-full bg-[#315B36] px-5 text-sm font-black text-white">Aceitar convite para {restaurant.name}</button></form> : correctAccount ? <Link href={`/onboarding?partnerRestaurantInvite=${encodeURIComponent(token)}`} className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-[#17120D] px-5 text-sm font-black text-white">Criar o restaurante e aceitar</Link> : <div className="mt-5 grid gap-2 sm:grid-cols-2"><Link href={registerUrl} className="flex h-12 items-center justify-center rounded-full bg-[#17120D] px-5 text-xs font-black text-white">Criar conta de restaurante</Link><Link href={loginUrl} className="flex h-12 items-center justify-center rounded-full border border-[#D8C6A9] bg-white px-5 text-xs font-black text-[#6E5232]">Já tenho conta</Link></div>}{sessionEmail && !correctAccount && <p className="mt-3 rounded-[15px] border border-[#E7B7A8] bg-[#FFF0EA] p-3 text-[10px] leading-5 text-[#934A35]">Este convite pertence a {invitation.email}. Entre com esse email para o aceitar.</p>}<p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[9px] text-[#918577]"><ShieldCheck size={11} /> Ligação pessoal válida durante 14 dias.</p></div></div></main>;
}

function InvitationState({ title, text, success = false }: { title: string; text: string; success?: boolean }) {
  return <main className="grid min-h-screen place-items-center bg-[#F3EEE6] p-5 text-[#17120D]"><div className="w-full max-w-lg rounded-[28px] border border-[#DCC9AA] bg-white p-8 text-center shadow-[0_24px_65px_rgba(65,43,22,.12)]">{success && <CheckCircle2 size={34} className="mx-auto text-[#315B36]" />}<p className="mt-4 font-serif text-2xl font-bold"><span className="text-[#B9853E]">Mesa</span>Link</p><h1 className="mt-4 text-3xl font-semibold tracking-[-.05em]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#6B6258]">{text}</p></div></main>;
}
