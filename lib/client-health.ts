const DAY_MS = 86_400_000;

type ClientHealthInput = {
  createdAt: Date;
  lastLoginAt: Date | null;
  lastActiveAt: Date | null;
  restaurantUpdatedAt: Date | null;
  hasRestaurant: boolean;
  reservationCount: number;
  subscriptionStatus: string | null;
  trialEndsAt: Date | null;
};

export type ClientHealth = {
  lastActivityAt: Date | null;
  inactiveDays: number | null;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  factors: string[];
};

export function calculateClientHealth(input: ClientHealthInput, now = new Date()): ClientHealth {
  const candidates = [input.lastActiveAt, input.lastLoginAt, input.restaurantUpdatedAt].filter(
    (value): value is Date => Boolean(value),
  );
  const lastActivityAt = candidates.length
    ? new Date(Math.max(...candidates.map((value) => value.getTime())))
    : null;
  const inactiveDays = lastActivityAt
    ? Math.max(0, Math.floor((now.getTime() - lastActivityAt.getTime()) / DAY_MS))
    : null;
  const accountAgeDays = Math.max(0, Math.floor((now.getTime() - input.createdAt.getTime()) / DAY_MS));
  const factors: string[] = [];
  let score = 0;

  if (input.subscriptionStatus === "CANCELED") {
    score += 60;
    factors.push("Subscrição cancelada");
  } else if (input.subscriptionStatus === "PAST_DUE") {
    score += 45;
    factors.push("Pagamento em atraso");
  }

  if (inactiveDays === null && accountAgeDays >= 3) {
    score += 35;
    factors.push("Nunca utilizou a plataforma");
  } else if (inactiveDays !== null && inactiveDays >= 30) {
    score += 45;
    factors.push(`${inactiveDays} dias sem atividade`);
  } else if (inactiveDays !== null && inactiveDays >= 14) {
    score += 30;
    factors.push(`${inactiveDays} dias sem atividade`);
  } else if (inactiveDays !== null && inactiveDays >= 7) {
    score += 15;
    factors.push(`${inactiveDays} dias sem atividade`);
  }

  if (input.subscriptionStatus === "TRIAL" && input.trialEndsAt) {
    const trialDays = Math.ceil((input.trialEndsAt.getTime() - now.getTime()) / DAY_MS);
    if (trialDays < 0) {
      score += 35;
      factors.push("Trial expirado");
    } else if (trialDays <= 2) {
      score += 20;
      factors.push(`Trial termina em ${Math.max(0, trialDays)} dias`);
    } else if (trialDays <= 5) {
      score += 10;
      factors.push(`Trial termina em ${trialDays} dias`);
    }
  }

  if (!input.hasRestaurant) {
    score += 25;
    factors.push("Onboarding por concluir");
  } else if (input.reservationCount === 0 && accountAgeDays >= 7) {
    score += 10;
    factors.push("Ainda sem reservas registadas");
  }

  const riskScore = Math.min(100, score);
  const riskLevel = riskScore >= 65 ? "HIGH" : riskScore >= 35 ? "MEDIUM" : "LOW";
  return { lastActivityAt, inactiveDays, riskScore, riskLevel, factors };
}

export function healthSuggestion(input: {
  health: ClientHealth;
  hasRestaurant: boolean;
  reservationCount: number;
  websiteEnabled: boolean;
  aiCredits: number;
  status: string | null;
}) {
  if (!input.hasRestaurant) return "Ajudar a concluir o primeiro restaurante e o onboarding.";
  if (input.status === "PAST_DUE") return "Contactar sobre o pagamento e confirmar se precisa de ajuda.";
  if (input.health.riskLevel === "HIGH") return "Fazer contacto pessoal hoje e propor uma sessão curta de recuperação.";
  if (input.reservationCount === 0) return "Marcar uma demonstração para publicar o link de reservas.";
  if (!input.websiteEnabled) return "Mostrar o Website Builder e publicar uma primeira versão.";
  if (input.aiCredits <= 0) return "Sugerir créditos IA para testar visibilidade, conteúdo ou Revenue AI.";
  if (input.health.riskLevel === "MEDIUM") return "Enviar follow-up com uma ação concreta para esta semana.";
  return "Conta saudável: recolher feedback e procurar oportunidade de upgrade.";
}
