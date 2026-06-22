import { prisma } from "@/lib/prisma";

export async function getValidMoloniToken(restaurantId: string) {
  const integration = await prisma.fiscalIntegration.findUnique({
    where: { restaurantId },
  });

  if (!integration) {
    throw new Error("Integração Moloni não encontrada.");
  }

  const expired =
    !integration.tokenExpiresAt ||
    integration.tokenExpiresAt.getTime() <= Date.now();

  if (!expired) {
    return integration.accessToken;
  }

  const response = await fetch(
    "https://api.moloni.pt/v1/grant/?" +
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: integration.clientId!,
        client_secret: integration.clientSecret!,
        refresh_token: integration.refreshToken!,
      }),
  );

  const data = await response.json();

  if (!data?.access_token) {
    throw new Error("Não foi possível renovar token Moloni.");
  }

  const tokenExpiresAt = new Date(
    Date.now() + Number(data.expires_in ?? 3600) * 1000,
  );

  await prisma.fiscalIntegration.update({
    where: { id: integration.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? integration.refreshToken,
      tokenExpiresAt,
    },
  });

  return data.access_token;
}