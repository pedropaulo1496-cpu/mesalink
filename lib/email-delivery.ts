type EmailDeliveryResult = {
  data?: { id?: string } | null;
  error?: { message?: string } | null;
};

export function requireAcceptedEmail(result: EmailDeliveryResult) {
  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message || "O fornecedor de email recusou o envio.");
  }

  return result.data.id;
}
