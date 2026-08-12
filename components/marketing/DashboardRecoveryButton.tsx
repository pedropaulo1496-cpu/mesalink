"use client";

import RecoveryOfferButton from "@/components/marketing/RecoveryOfferButton";

export default function DashboardRecoveryButton({ restaurantId }: { restaurantId: string }) {
  return <RecoveryOfferButton restaurantId={restaurantId} label="Recuperar clientes" />;
}
