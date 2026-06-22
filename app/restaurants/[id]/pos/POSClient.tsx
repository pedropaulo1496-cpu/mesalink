"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type POSReport = {
  totalRevenue: number;
  totalPayments: number;
  totalGuests: number;
  averageTicket: number;
  averagePerGuest: number;
  byMethod: {
    CASH: number;
    CARD: number;
    BANK_TRANSFER: number;
  };
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

type FiscalDocument = {
  id: string;
  documentType: string;
  documentNumber?: string | null;
  status?: string;
  totalAmount: number;
  pdfUrl?: string | null;
  issuedAt?: string | null;
  createdAt: string;
};

type TableItem = {
  id: string;
  number: number;
  capacity: number;
};

type POSProduct = {
  id: string;
  name: string;
  price: unknown;
  vatRate: number;
};

type POSCategory = {
  id: string;
  name: string;
  products: POSProduct[];
};

type POSOrderItem = {
  id: string;
  productName: string;
  quantity: number;
  unitPrice?: unknown;
  totalPrice?: unknown;
  paidQuantity?: number | null;
  voidedQuantity?: number | null;
  discountAmount?: unknown;
  discountType?: string | null;
  discountValue?: unknown;
  notes?: string | null;
};

type POSOrder = {
  id: string;
  items: POSOrderItem[];
};

type POSDiscount = {
  id: string;
  type: "AMOUNT" | "PERCENTAGE" | string;
  value: number;
  amount: number;
  orderItemId?: string | null;
};

type POSTableSession = {
  id: string;
  tableId: string | null;
  status: string;
  totalAmount: unknown;
  discountAmount?: unknown;
  paidAmount?: unknown;
  remainingAmount?: unknown;
  guestCount?: number | null;
  discounts?: POSDiscount[];
  orders: POSOrder[];
};

type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discountPercentage?: number;
  discountAmount?: number;
  notes?: string | null;
};

type AccountLine = {
  key: string;
  itemId: string;
  itemIds: string[];
  productName: string;
  quantity: number;
  unitPrice: number;
  grossTotal: number;
  totalPrice: number;
  discountAmount: number;
  discountType?: string | null;
  discountValue?: number | null;
  notes?: string | null;
};

type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER";
type DiscountTarget =
  | {
      scope: "SESSION";
      discountType?: "AMOUNT" | "PERCENTAGE" | null;
      discountValue?: number | null;
    }
  | {
      scope: "ITEM";
      item: {
        itemId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        discountType?: "AMOUNT" | "PERCENTAGE" | null;
        discountValue?: number | null;
      };
    };

type POSTab =
  | "TABLES"
  | "CASH"
  | "SERVICE"
  | "KITCHEN"
  | "HISTORY"
  | "FISCAL"
  | "DOCUMENTS"
  | "STATS";

type POSPayment = {
  id: string;
  amount: unknown;
  method: PaymentMethod | string;
  status: string;
  createdAt: string | Date;
};

type POSCashMovement = {
  id: string;
  type: "IN" | "OUT" | string;
  amount: unknown;
  reason?: string | null;
  createdAt: string | Date;
};

type POSCashRegister = {
  id: string;
  status: string;
  openingAmount: unknown;
  closingAmount?: unknown;
  expectedCash?: unknown;
  difference?: unknown;
  openedAt: string | Date;
  closedAt?: string | Date | null;
  payments: POSPayment[];
  movements: POSCashMovement[];
};

type POSHistoryPayment = {
  id: string;
  amount: unknown;
  method: string;
  status: string;
  createdAt: string | Date;

  fiscalDocument?: {
    id: string;
    documentNumber?: string | null;
    documentType: string;
    status: string;
    pdfUrl?: string | null;
  } | null;

  tableSession?: {
    guestCount?: number | null;
    table?: {
      number: number;
    } | null;
    orders?: {
      id: string;
      items: POSOrderItem[];
    }[];
  } | null;
};

type POSTodayPayment = {
  id: string;
  amount: unknown;
  method: string;
  status: string;
  createdAt: string | Date;
  tableSession?: {
    guestCount?: number | null;
    tableId?: string | null;
  } | null;
};

type QRPendingOrderItem = {
  id: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: unknown;
  lineTotal: unknown;
};

type QRPendingOrder = {
  id: string;
  tableNumber: number;
  tableId?: string | null;
  status: string;
  total: unknown;
  notes?: string | null;
  createdAt: string | Date;
  items: QRPendingOrderItem[];
};

type QRAlert = {
  id: string;
  tableNumber: number;
  requestedWaiterAt?: string | Date | null;
  requestedBillAt?: string | Date | null;
};

type FiscalReport = {
  invoices: number;
  simplifiedInvoices: number;
  creditNotes: number;
  total: number;
};

function formatMoney(value: number) {
  return `${value.toFixed(2)}€`;
}

function getCartItemGross(item: CartItem) {
  return item.quantity * item.unitPrice;
}

function getCartItemDiscount(item: CartItem) {
  const gross = getCartItemGross(item);
  const percentage = Number(item.discountPercentage ?? 0);
  const fixed = Number(item.discountAmount ?? 0);
  const percentageDiscount = percentage > 0 ? (gross * percentage) / 100 : 0;

  return Math.min(gross, percentageDiscount + fixed);
}

function getCartItemTotal(item: CartItem) {
  return Math.max(0, getCartItemGross(item) - getCartItemDiscount(item));
}

function aggregateSessionItems(items: POSOrderItem[]): AccountLine[] {
  return items
    .map((item) => {
      const originalQuantity = Number(item.quantity ?? 1);
      const paidQuantity = Number(item.paidQuantity ?? 0);
      const voidedQuantity = Number(item.voidedQuantity ?? 0);
      const quantity = Math.max(
        0,
        originalQuantity - paidQuantity - voidedQuantity,
      );

      const unitPrice = Number(item.unitPrice ?? 0);
      const grossTotal = quantity * unitPrice;
      const discountAmount = Math.min(
        grossTotal,
        Number(item.discountAmount ?? 0),
      );

      const discountValue =
        item.discountValue === null || item.discountValue === undefined
          ? null
          : Number(item.discountValue);

      return {
        key: item.id,
        itemId: item.id,
        itemIds: [item.id],
        productName: item.productName,
        quantity,
        unitPrice,
        grossTotal,
        totalPrice: Math.max(0, grossTotal - discountAmount),
        discountAmount,
        discountType: item.discountType ?? null,
        discountValue,
        notes: item.notes ?? null,
      };
    })
    .filter((item) => item.quantity > 0);
}

export default function POSClient({
  restaurantId,
  restaurantName,
  tables,
  categories,
  sessions,
  cashRegisters,
  todayPayments,
  pendingOrders,
  qrAlerts,
  fiscalIntegration,
}: {
  restaurantId: string;
  restaurantName: string;
  tables: TableItem[];
  categories: POSCategory[];
  sessions: POSTableSession[];
  cashRegisters: POSCashRegister[];
  todayPayments: POSTodayPayment[];
  pendingOrders: QRPendingOrder[];
  qrAlerts: QRAlert[];
  fiscalIntegration: {
  active: boolean;
  companyId: string | null;
  invoiceSerieId?: string | null;
  simplifiedInvoiceSerieId?: string | null;
  creditNoteSerieId?: string | null;
} | null;
}) {
  const [report, setReport] = useState<POSReport | null>(null);
const [loadingReport, setLoadingReport] = useState(false);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
const [loadingDocuments, setLoadingDocuments] = useState(false);
const [fiscalReport, setFiscalReport] = useState<FiscalReport>({
  invoices: 0,
  simplifiedInvoices: 0,
  creditNotes: 0,
  total: 0,
});

const [loadingFiscalReport, setLoadingFiscalReport] = useState(false);
const [loadedFiscalIntegration, setLoadedFiscalIntegration] = useState<any>(null);
const [loadingFiscal, setLoadingFiscal] = useState(false);
const [documentSets, setDocumentSets] = useState<any[]>([]);
const [savingFiscalSeries, setSavingFiscalSeries] = useState(false);

const [invoiceSerieId, setInvoiceSerieId] = useState("");
const [simplifiedInvoiceSerieId, setSimplifiedInvoiceSerieId] = useState("");
const [creditNoteSerieId, setCreditNoteSerieId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id ?? null,
  );
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [accountDrafts, setAccountDrafts] = useState<Record<string, number>>(
    {},
  );
  const [savingAccount, setSavingAccount] = useState<string | null>(null);
  const [openingTable, setOpeningTable] = useState<TableItem | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [openingSession, setOpeningSession] = useState(false);
  const [cancellingSession, setCancellingSession] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [closingPayment, setClosingPayment] = useState(false);
  const [posTab, setPosTab] = useState<POSTab>("TABLES");
  const [cashModal, setCashModal] = useState<"OPEN" | "CLOSE" | null>(null);
  const [openingAmount, setOpeningAmount] = useState("100");
  const [closingAmount, setClosingAmount] = useState("");
  const [savingCashRegister, setSavingCashRegister] = useState(false);
  const [historyPayments, setHistoryPayments] = useState<POSHistoryPayment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [handlingQrOrderId, setHandlingQrOrderId] = useState<string | null>(null);
  const [handlingQrAlertId, setHandlingQrAlertId] = useState<string | null>(null);
  const [splitCount, setSplitCount] = useState(1);
  const [splitItemsOpen, setSplitItemsOpen] = useState(false);
  const [partialPaymentOpen, setPartialPaymentOpen] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState(0);
  const [partialPaymentMethod, setPartialPaymentMethod] =
    useState<PaymentMethod>("CARD");
  const [selectedSplitItems, setSelectedSplitItems] = useState<SplitPaymentItem[]>([]);
  const [partialPaymentLoading, setPartialPaymentLoading] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferringTable, setTransferringTable] = useState(false);
  const [discountTarget, setDiscountTarget] = useState<DiscountTarget>({
    scope: "SESSION",
    discountType: null,
    discountValue: null,
  });
  const [editingLine, setEditingLine] = useState<AccountLine | null>(null);
  const [savingLine, setSavingLine] = useState(false);
  const [editingCartProductId, setEditingCartProductId] = useState<string | null>(null);
  const [showCashMovementModal, setShowCashMovementModal] =
  useState(false);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

const [invoiceVat, setInvoiceVat] = useState("");
const [invoiceName, setInvoiceName] = useState("");
const [invoiceEmail, setInvoiceEmail] = useState("");
const [invoiceCustomerType, setInvoiceCustomerType] =
  useState<"FINAL_CONSUMER" | "VAT">("FINAL_CONSUMER");

const [invoiceAddress, setInvoiceAddress] = useState("");

const [creatingInvoice, setCreatingInvoice] = useState(false);

const [creditNoteDocument, setCreditNoteDocument] =
  useState<FiscalDocument | null>(null);

const [creditNoteReason, setCreditNoteReason] =
  useState("Anulação de documento");

const [creatingCreditNote, setCreatingCreditNote] =
  useState(false);

const [cashMovementType, setCashMovementType] =
  useState<"IN" | "OUT">("OUT");

const [cashMovementAmount, setCashMovementAmount] =
  useState("");

const [cashMovementReason, setCashMovementReason] =
  useState("");

const [savingCashMovement, setSavingCashMovement] =
  useState(false);

 const activeFiscalIntegration =
  loadedFiscalIntegration ?? fiscalIntegration;

const fiscalReady = Boolean(
  activeFiscalIntegration?.active &&
    activeFiscalIntegration?.companyId &&
    activeFiscalIntegration?.invoiceSerieId &&
    activeFiscalIntegration?.simplifiedInvoiceSerieId &&
    activeFiscalIntegration?.creditNoteSerieId,
);

  const experimentalMode = !fiscalReady;

const canUsePOS = fiscalReady || experimentalMode;

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [tables, selectedTableId],
  );

  const selectedSession = useMemo(
    () =>
      sessions.find((session) => session.tableId === selectedTableId) ?? null,
    [sessions, selectedTableId],
  );

  const availableTables = useMemo(
    () =>
      tables.filter((table) => {
        if (table.id === selectedTableId) return false;

        const hasOpenSession = sessions.some(
          (session) =>
            session.tableId === table.id && session.status === "OPEN",
        );

        return !hasOpenSession;
      }),
    [tables, sessions, selectedTableId],
  );

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ??
    categories[0] ??
    null;

  const openCashRegister =
    cashRegisters.find((register) => register.status === "OPEN") ?? null;

  const cashPayments = openCashRegister?.payments ?? [];
  const cashTotal = cashPayments
    .filter((payment) => payment.method === "CASH")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const cardTotal = cashPayments
    .filter((payment) => payment.method === "CARD")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const transferTotal = cashPayments
    .filter((payment) => payment.method === "BANK_TRANSFER")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const registerTotal = cashTotal + cardTotal + transferTotal;
  const cashMovements = openCashRegister?.movements ?? [];

const cashInTotal = cashMovements
  .filter((movement) => movement.type === "IN")
  .reduce((sum, movement) => sum + Number(movement.amount ?? 0), 0);

const cashOutTotal = cashMovements
  .filter((movement) => movement.type === "OUT")
  .reduce((sum, movement) => sum + Number(movement.amount ?? 0), 0);

const expectedCash =
  Number(openCashRegister?.openingAmount ?? 0) +
  cashTotal +
  cashInTotal -
  cashOutTotal;

  const total = cart.reduce((sum, item) => sum + getCartItemTotal(item), 0);

  const sessionItems = selectedSession?.orders.flatMap((order) => order.items) ?? [];
  const accountLines = aggregateSessionItems(sessionItems);
  const editedExistingTotal = accountLines.reduce((sum, item) => {
    const quantity = accountDrafts[item.key] ?? item.quantity;
    return sum + quantity * item.unitPrice;
  }, 0);
  const grandTotal = editedExistingTotal + total;

  const openTables = sessions.filter((session) => session.tableId).length;
  const selectedIsQuickSale = selectedTableId === "quick-sale";
  const qrAttentionCount = pendingOrders.length + qrAlerts.length;

  function selectTable(tableId: string) {
    
  if (!openCashRegister) {
    setPosTab("CASH");
    alert("Tens de abrir a caixa antes de abrir mesas.");
    return;
  }

  const table = tables.find((item) => item.id === tableId) ?? null;
  const openSession = sessions.find((session) => session.tableId === tableId);

  if (table && !openSession) {
    setOpeningTable(table);
    setGuestCount(Math.max(1, Math.min(table.capacity || 2, 2)));
    return;
  }

  setSelectedTableId(tableId);
  setSelectedCategoryId(categories[0]?.id ?? null);
}

  function quickSale() {

  if (!openCashRegister) {
    setPosTab("CASH");
    alert("Tens de abrir a caixa antes de iniciar venda rápida.");
    return;
  }

  setOpeningTable(null);
  setSelectedTableId("quick-sale");
  setSelectedCategoryId(categories[0]?.id ?? null);
}

  function backToTables() {
    setSelectedTableId(null);
    setOpeningTable(null);
    setPaymentOpen(false);
    setCart([]);
  }

  function addProduct(product: POSProduct) {
    const price = Number(product.price);

    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: price,
          vatRate: product.vatRate,
          discountPercentage: 0,
          discountAmount: 0,
          notes: "",
        },
      ];
    });
  }

  function removeOne(productId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeAll(productId: string) {
    setCart((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }

  function updateCartItem(data: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    discountAmount: number;
    notes: string;
  }) {
    setCart((current) => {
      if (data.quantity <= 0) {
        return current.filter((item) => item.productId !== data.productId);
      }

      return current.map((item) =>
        item.productId === data.productId
          ? {
              ...item,
              quantity: data.quantity,
              unitPrice: data.unitPrice,
              discountPercentage: data.discountPercentage,
              discountAmount: data.discountAmount,
              notes: data.notes,
            }
          : item,
      );
    });

    setEditingCartProductId(null);
  }

  async function sendOrder() {
    if ((!selectedTable && !selectedIsQuickSale) || cart.length === 0) {
      return;
    }

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: selectedTable?.id,
          items: cart,
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao enviar pedido.");
      return;
    }

    setCart([]);
    router.refresh();
  }

  function setAccountDraftQuantity(item: AccountLine, quantity: number) {
    const nextQuantity = Math.max(0, quantity);

    setAccountDrafts((current) => ({
      ...current,
      [item.key]: nextQuantity,
    }));
  }

  function clearAccountDraft(item: AccountLine) {
    setAccountDrafts((current) => {
      const next = { ...current };
      delete next[item.key];
      return next;
    });
  }

  async function saveAccountDraft(item: AccountLine) {
    if (!selectedSession) return;

    const nextQuantity = accountDrafts[item.key] ?? item.quantity;

    if (nextQuantity === item.quantity) {
      clearAccountDraft(item);
      return;
    }

    if (nextQuantity === 0) {
      const confirmed = window.confirm(`Remover ${item.productName} da conta?`);
      if (!confirmed) return;
    }

    setSavingAccount(item.key);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/orders`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          itemId: item.itemId,
          action: "setQuantity",
          quantity: nextQuantity,
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao atualizar a conta.");
      setSavingAccount(null);
      return;
    }

    clearAccountDraft(item);
    setSavingAccount(null);
    router.refresh();
  }

  async function openTableSession() {
    if (!openingTable) return;

    setOpeningSession(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tableId: openingTable.id,
          guestCount,
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao abrir mesa.");
      setOpeningSession(false);
      return;
    }

    const data = await response.json();

    setOpeningSession(false);
    setOpeningTable(null);
    setSelectedTableId(openingTable.id);
    setSelectedCategoryId(categories[0]?.id ?? null);
    router.refresh();

    if (!data?.success) {
      alert("Mesa aberta, mas houve uma resposta inesperada.");
    }
  }

  async function cancelTableSession() {
    if (!selectedSession || !selectedTable) return;

    const confirmed = window.confirm(
      `Cancelar a Mesa ${selectedTable.number}? A mesa volta a ficar livre e os pedidos ficam cancelados.`,
    );

    if (!confirmed) return;

    setCancellingSession(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/sessions`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          action: "cancel",
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao cancelar mesa.");
      setCancellingSession(false);
      return;
    }

    setCancellingSession(false);
    setSelectedTableId(null);
    setCart([]);
    setAccountDrafts({});
    router.refresh();
  }

 async function transferTable(data: {
  targetTableId: string;
  transferAll: boolean;
  items: {
    itemId: string;
    quantity: number;
  }[];
}) {
  if (!selectedSession) return;

  setTransferringTable(true);

  const response = await fetch(
    `/api/restaurants/${restaurantId}/pos/transfer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceSessionId: selectedSession.id,
        targetTableId: data.targetTableId,
        transferAll: data.transferAll,
        items: data.items,
      }),
    },
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    alert(result?.error ?? "Erro ao transferir.");
    setTransferringTable(false);
    return;
  }

  setTransferringTable(false);
  setTransferOpen(false);
  setSelectedTableId(null);
  setCart([]);
  setAccountDrafts({});

  router.refresh();

  window.setTimeout(() => {
    setSelectedTableId(data.targetTableId);
  }, 150);
}

  function openPayment() {
    
    const paymentTotal = Number(
      selectedSession?.remainingAmount ?? selectedSession?.totalAmount ?? grandTotal,
    );

    if (!selectedSession || paymentTotal <= 0) return;

    if (cart.length > 0) {
      alert("Envia primeiro os novos produtos antes de cobrar.");
      return;
    }

    const hasUnsavedChanges = accountLines.some(
      (item) =>
        accountDrafts[item.key] !== undefined &&
        accountDrafts[item.key] !== item.quantity,
    );

    if (hasUnsavedChanges) {
      alert("Guarda ou cancela as alterações da conta antes de cobrar.");
      return;
    }

setSplitCount(
  Math.max(1, Number(selectedSession?.guestCount ?? 1))
);

    setPaymentOpen(true);
  }

  async function handlePartialPayment() {
  if (!selectedSession) return;

  setPartialPaymentLoading(true);

  const response = await fetch(
    `/api/restaurants/${restaurantId}/pos/payments/partial`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: selectedSession.id,
        method: partialPaymentMethod,
        amount: partialPaymentAmount,
        items: selectedSplitItems,
      }),
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    alert(data?.error ?? "Erro ao receber pagamento parcial.");
    setPartialPaymentLoading(false);
    return;
  }

  setPartialPaymentLoading(false);
  setPartialPaymentOpen(false);
  setSelectedSplitItems([]);
  setPartialPaymentAmount(0);

  if (data?.closed) {
    setSelectedTableId(null);
    setCart([]);
    setAccountDrafts({});
  }

  router.refresh();
}

async function updateLineItem(data: {
  itemId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  notes: string;
}) {
  setSavingLine(true);

  const response = await fetch(
    `/api/restaurants/${restaurantId}/pos/order-items/${data.itemId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        notes: data.notes,
      }),
    },
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    alert(result?.error ?? "Erro ao atualizar item.");
    setSavingLine(false);
    return;
  }

  setSavingLine(false);
  setEditingLine(null);
  setAccountDrafts({});
  router.refresh();
}

async function applyDiscount(data: {
  type: "AMOUNT" | "PERCENTAGE";
  value: number;
  reason: string;
}) {
  if (!selectedSession) return;

  setDiscountLoading(true);

  const response = await fetch(
    `/api/restaurants/${restaurantId}/pos/discounts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  sessionId: selectedSession.id,
  scope: discountTarget.scope,
  mode: data.value <= 0 ? "REMOVE" : "SET",
  type: data.type,
  value: data.value,
  reason: data.reason,
  item: discountTarget.scope === "ITEM" ? discountTarget.item : undefined,
}),
    },
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    alert(result?.error ?? "Erro ao aplicar desconto.");
    setDiscountLoading(false);
    return;
  }

  setDiscountLoading(false);
  setDiscountOpen(false);
  setDiscountTarget({ scope: "SESSION", discountType: null, discountValue: null });

  if (result?.closed) {
    setSelectedTableId(null);
    setCart([]);
    setAccountDrafts({});
  }

  router.refresh();
}

async function createCreditNote() {
  if (!creditNoteDocument) return;

  try {
    setCreatingCreditNote(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/credit-notes/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId: creditNoteDocument.id,
          reason: creditNoteReason,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error ?? "Erro ao emitir nota de crédito.");
    }

    setCreditNoteDocument(null);
    setCreditNoteReason("Anulação de documento");

    alert("Nota de crédito emitida com sucesso.");

    loadDocuments();
  } catch (error: any) {
    alert(error?.message ?? "Erro.");
  } finally {
    setCreatingCreditNote(false);
  }
}

async function fetchVatData() {
  if (!invoiceVat.trim()) {
    alert("Indica primeiro o NIF.");
    return;
  }

  const response = await fetch(
    `/api/fiscal/nif?nif=${encodeURIComponent(invoiceVat.trim())}`,
  );

  const data = await response.json();

  if (!response.ok) {
    alert(data?.error ?? "Erro ao obter dados.");
    return;
  }

  const record =
    data?.records?.[invoiceVat] ??
    data?.records?.[invoiceVat.trim()] ??
    data?.record ??
    data;

  setInvoiceName(record?.title ?? record?.name ?? "");
  setInvoiceAddress(record?.address ?? "");
}

async function createInvoiceAndCloseTable() {
  if (!selectedSession) return;
  if (invoiceCustomerType === "VAT") {
  const cleanVat = invoiceVat.trim();

  if (!/^\d{9}$/.test(cleanVat)) {
    alert("O NIF deve ter 9 dígitos.");
    return;
  }

  if (!invoiceName.trim()) {
    alert("Indica o nome fiscal do cliente.");
    return;
  }
}

  try {
    setCreatingInvoice(true);

    const fiscalVat =
  invoiceCustomerType === "FINAL_CONSUMER" ? "999999990" : invoiceVat.trim();

const fiscalName =
  invoiceCustomerType === "FINAL_CONSUMER"
    ? "Consumidor Final"
    : invoiceName.trim();

const searchResponse = await fetch(
  `/api/restaurants/${restaurantId}/fiscal/customers/search`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vat: fiscalVat }),
  },
);

const searchData = await searchResponse.json();

let customerId =
  searchData?.customer?.customer_id ??
  searchData?.customer?.id ??
  null;

if (!customerId) {
  const customerResponse = await fetch(
    `/api/restaurants/${restaurantId}/fiscal/customers/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vat: fiscalVat,
        name: fiscalName,
        email: invoiceEmail,
        address: invoiceAddress,
      }),
    },
  );

  const customerData = await customerResponse.json();

  if (!customerResponse.ok) {
    throw new Error(customerData?.error ?? "Erro cliente.");
  }

  customerId = customerData.customerId ?? customerData.customer_id;
}

    const invoiceResponse = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/invoices/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          customerId: String(customerId),
withVatNumber: invoiceCustomerType === "VAT",
        }),
      },
    );

    const invoiceData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
  const detailsText = Array.isArray(invoiceData?.details)
    ? invoiceData.details.join(" ")
    : "";

  if (
    detailsText.includes("document_set_wsat_id") ||
    detailsText.includes("document_set_id")
  ) {
    throw new Error(
      "A série Moloni deste restaurante ainda não está comunicada à AT. Vai ao Moloni > Configurações > Séries de documentos e comunica/ativa a série fiscal.",
    );
  }

  throw new Error(
    invoiceData?.error ?? "Erro ao emitir fatura.",
  );
}

    await closeTableWithPayment();

    setInvoiceModalOpen(false);

    setInvoiceVat("");
    setInvoiceName("");
    setInvoiceEmail("");

    setInvoiceCustomerType("FINAL_CONSUMER");
setInvoiceAddress("");

    alert("Fatura emitida com sucesso.");
  } catch (error: any) {
    alert(error?.message ?? "Erro.");
  } finally {
    setCreatingInvoice(false);
  }
}

  async function closeTableWithPayment() {
    if (!selectedSession) return;

    setClosingPayment(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedSession.id,
          method: paymentMethod,
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao fechar mesa.");
      setClosingPayment(false);
      return;
    }

    setClosingPayment(false);
    setPaymentOpen(false);
    setSelectedTableId(null);
    setCart([]);
    setAccountDrafts({});
    router.refresh();
  }

  async function openCashRegisterAction() {
    
    const amount = Number(openingAmount.replace(",", ".") || 0);

    setSavingCashRegister(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/cash-register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          openingAmount: amount,
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao abrir caixa.");
      setSavingCashRegister(false);
      return;
    }

    setSavingCashRegister(false);
    setCashModal(null);
    router.refresh();
  }

  async function createCashMovement() {
  if (!cashMovementAmount) return;

  try {
    setSavingCashMovement(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/cash-movements`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: cashMovementType,
          amount: Number(cashMovementAmount),
          reason: cashMovementReason,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data?.error ?? "Erro ao guardar movimento.");
      return;
    }

    setShowCashMovementModal(false);
    setCashMovementAmount("");
    setCashMovementReason("");

    window.location.reload();
  } catch {
    alert("Erro ao guardar movimento.");
  } finally {
    setSavingCashMovement(false);
  }
}

  async function closeCashRegisterAction() {
    if (!openCashRegister) return;

    const amount = Number(closingAmount.replace(",", ".") || 0);

    setSavingCashRegister(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/cash-register`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cashRegisterId: openCashRegister.id,
          closingAmount: amount,
        }),
      },
    );

    if (!response.ok) {
      alert("Erro ao fechar caixa.");
      setSavingCashRegister(false);
      return;
    }

    setSavingCashRegister(false);
    setCashModal(null);
    setClosingAmount("");
    router.refresh();
  }

async function acceptQrOrder(orderId: string) {
  if (!openCashRegister) {
    setPosTab("CASH");
    setCashModal("OPEN");
    return;
  }

  setHandlingQrOrderId(orderId);

  const response = await fetch(`/api/ordering/qr-orders/${orderId}/accept`, {
    method: "POST",
  });

  const text = await response.text();

  if (!response.ok) {
    alert(text);
    setHandlingQrOrderId(null);
    return;
  }

  setHandlingQrOrderId(null);
  router.refresh();
}

async function rejectQrOrder(orderId: string) {
  const confirmed = window.confirm("Rejeitar este pedido QR?");
  if (!confirmed) return;

  setHandlingQrOrderId(orderId);

  const response = await fetch(`/api/ordering/qr-orders/${orderId}/reject`, {
    method: "POST",
  });

  const text = await response.text();

  if (!response.ok) {
    alert(text);
    setHandlingQrOrderId(null);
    return;
  }

  setHandlingQrOrderId(null);
  router.refresh();
}

  async function resolveQrAlert(alertId: string, type: "waiter" | "bill") {
    setHandlingQrAlertId(`${alertId}-${type}`);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/qr-alerts/resolve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: alertId,
          type,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.error ?? "Erro ao resolver alerta QR.");
      setHandlingQrAlertId(null);
      return;
    }

    setHandlingQrAlertId(null);
    router.refresh();
  }

  useEffect(() => {
    if (selectedTableId) return;

    const interval = window.setInterval(() => {
      router.refresh();
    }, 8000);

    return () => window.clearInterval(interval);
  }, [router, selectedTableId]);

  async function loadHistory() {
    setLoadingHistory(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/pos/history`);

      if (!response.ok) {
        setHistoryPayments([]);
        return;
      }

      const data = await response.json();
      setHistoryPayments(data.payments ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadFiscalSettings() {
  setLoadingFiscal(true);

  try {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/settings`,
    );

    if (!response.ok) {
      setLoadedFiscalIntegration(null);
      return;
    }

    const data = await response.json();

    setLoadedFiscalIntegration(data.integration);
    setInvoiceSerieId(data.integration?.invoiceSerieId ?? "");
setSimplifiedInvoiceSerieId(data.integration?.simplifiedInvoiceSerieId ?? "");
setCreditNoteSerieId(data.integration?.creditNoteSerieId ?? "");
  } catch {
    setLoadedFiscalIntegration(null);
  } finally {
    setLoadingFiscal(false);
  }
}

async function loadDocumentSets() {
  try {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/document-sets`,
    );

    if (!response.ok) {
      setDocumentSets([]);
      return;
    }

    const data = await response.json();

    setDocumentSets(data.documentSets ?? data ?? []);
  } catch {
    setDocumentSets([]);
  }
}

async function saveFiscalSeries() {
  try {
    setSavingFiscalSeries(true);

    const response = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/settings`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceSerieId,
          simplifiedInvoiceSerieId,
          creditNoteSerieId,
          active: true,
        }),
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      alert(data?.error ?? "Erro ao guardar séries.");
      return;
    }

    alert("Séries guardadas.");
    await loadFiscalSettings();
  } finally {
    setSavingFiscalSeries(false);
  }
}

  async function loadDocuments() {
  setLoadingDocuments(true);

  try {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/documents`,
    );

    if (!response.ok) {
      setDocuments([]);
      return;
    }

    const data = await response.json();

    setDocuments(data.documents ?? []);
  } catch {
    setDocuments([]);
  } finally {
    setLoadingDocuments(false);
  }
}

async function loadFiscalReport() {
  setLoadingFiscalReport(true);

  try {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/fiscal/report`,
    );

    if (!response.ok) {
      setFiscalReport({
        invoices: 0,
        simplifiedInvoices: 0,
        creditNotes: 0,
        total: 0,
      });
      return;
    }

    const data = await response.json();

    setFiscalReport({
      invoices: Number(data.invoices ?? 0),
      simplifiedInvoices: Number(data.simplifiedInvoices ?? 0),
      creditNotes: Number(data.creditNotes ?? 0),
      total: Number(data.total ?? 0),
    });
  } finally {
    setLoadingFiscalReport(false);
  }
}

async function loadReport() {
  setLoadingReport(true);

  try {
    const response = await fetch(
      `/api/restaurants/${restaurantId}/pos/reports`,
    );

    if (!response.ok) {
      setReport(null);
      return;
    }

    const data = await response.json();

    setReport(data);
  } catch {
    setReport(null);
  } finally {
    setLoadingReport(false);
  }
}

useEffect(() => {
  if (posTab !== "HISTORY") return;

  loadHistory();
}, [posTab]);

  useEffect(() => {
    if (posTab !== "HISTORY") return;

    loadHistory();
  }, [posTab]);

 useEffect(() => {
  if (posTab !== "DOCUMENTS") return;

  loadDocuments();
  loadFiscalReport();
}, [posTab]);

 useEffect(() => {
  if (posTab !== "FISCAL") return;

  loadFiscalSettings();
  loadDocumentSets();
}, [posTab]);

useEffect(() => {
  if (posTab !== "STATS") return;

  loadReport();
}, [posTab]);

  return (
    <section className="flex h-screen flex-1 overflow-hidden bg-[#FBFAF7]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-10 py-8">
        <header className="mb-7 flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.42em] text-[#B58A45]">
              MESALINK POS
            </p>

            <h1 className="mt-2 text-[34px] font-black tracking-[-0.04em] text-[#0E0D0C]">
              {!selectedTableId
                ? "Mesas"
                : selectedIsQuickSale
                  ? "Venda rápida"
                  : `Mesa ${selectedTable?.number}`}
            </h1>

            {selectedTableId ? (
              <button
                onClick={backToTables}
                className="mt-3 text-sm font-bold text-[#8B7C68] hover:text-[#0E0D0C]"
              >
                ← Voltar às mesas
              </button>
            ) : (
              <POSTabs activeTab={posTab} onChange={setPosTab} />
            )}
          </div>

          <div className="flex items-center gap-4">
            {!selectedTableId && (
              <button className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white text-[#0E0D0C] shadow-[0_12px_30px_rgba(30,20,10,0.04)]">
                <SearchIcon />
              </button>
            )}

            {!selectedTableId ? (
              <button
                onClick={quickSale}
                className="h-14 rounded-2xl bg-[#11100F] px-7 text-sm font-black text-white shadow-[0_18px_35px_rgba(0,0,0,0.18)] transition hover:translate-y-[-1px]"
              >
                ⚡ Venda rápida
              </button>
            ) : (
              <div className="rounded-2xl border border-[#E8E0D4] bg-white px-5 py-3 text-sm font-black text-[#0E0D0C] shadow-[0_12px_30px_rgba(30,20,10,0.04)]">
                {selectedIsQuickSale
                  ? "Sem mesa"
                  : `${selectedTable?.capacity} lugares`}
              </div>
            )}
          </div>
        </header>

{!loadingFiscal && !fiscalReady && posTab !== "FISCAL" && (
  <div className="mb-4 rounded-2xl border border-[#F0D4A8] bg-[#FFF8EC] p-4">
    <p className="text-sm font-black text-[#8B5E22]">
      Modo experimental ativo
    </p>
    <p className="mt-1 text-xs font-bold text-[#7D746A]">
      Podes testar mesas, pedidos e pagamentos. Este modo não emite documentos fiscais válidos.
      Para faturar legalmente, liga o Moloni e configura as séries fiscais.
    </p>

    <button
      onClick={() => setPosTab("FISCAL")}
      className="mt-3 rounded-xl bg-[#11100F] px-4 py-3 text-xs font-black text-white"
    >
      Configurar Moloni
    </button>
  </div>
)}

{(canUsePOS || posTab === "FISCAL") && (
  <>

        {!selectedTableId && qrAttentionCount > 0 && posTab !== "KITCHEN" && (
          <button
            onClick={() => setPosTab("KITCHEN")}
            className="mb-4 flex h-12 w-fit animate-pulse items-center gap-3 rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] px-4 text-sm font-black text-[#9B6F3B] shadow-[0_12px_30px_rgba(201,155,79,0.12)]"
          >
            <span>🔔</span>
            <span>
              QR Orders: {qrAttentionCount} alerta
              {qrAttentionCount === 1 ? "" : "s"} pendente
              {qrAttentionCount === 1 ? "" : "s"}
            </span>
          </button>
        )}

        {!selectedTableId && posTab === "TABLES" && (
          <TablesView
            tables={tables}
            sessions={sessions}
            openTables={openTables}
            onSelect={selectTable}
          />
        )}

        {!selectedTableId && posTab === "CASH" && (
          <CashRegisterView
            openCashRegister={openCashRegister}
            openingAmount={Number(openCashRegister?.openingAmount ?? 0)}
            cashTotal={cashTotal}
            cardTotal={cardTotal}
            transferTotal={transferTotal}
            registerTotal={registerTotal}
            expectedCash={expectedCash}
            onCashIn={() => {
  setCashMovementType("IN");
  setShowCashMovementModal(true);
}}
onCashOut={() => {
  setCashMovementType("OUT");
  setShowCashMovementModal(true);
}}
            onOpenCash={() => setCashModal("OPEN")}
            onCloseCash={() => {
              setClosingAmount(String(expectedCash.toFixed(2)));
              setCashModal("CLOSE");
            }}
          />
        )}

        {!selectedTableId && posTab === "SERVICE" && (
          <ServiceView sessions={sessions} todayPayments={todayPayments} />
        )}

        {!selectedTableId && posTab === "KITCHEN" && (
          <QrOrdersView
            orders={pendingOrders}
            alerts={qrAlerts}
            loadingOrderId={handlingQrOrderId}
            loadingAlertId={handlingQrAlertId}
            onAccept={acceptQrOrder}
            onReject={rejectQrOrder}
            onResolveAlert={resolveQrAlert}
          />
        )}

        {!selectedTableId && posTab === "HISTORY" && (
          <HistoryView payments={historyPayments} loading={loadingHistory} />
        )}

        {!selectedTableId && posTab === "FISCAL" && (
  <FiscalSettingsView
  integration={loadedFiscalIntegration ?? fiscalIntegration}
  loading={loadingFiscal}
  documentSets={documentSets}
  invoiceSerieId={invoiceSerieId}
  simplifiedInvoiceSerieId={simplifiedInvoiceSerieId}
  creditNoteSerieId={creditNoteSerieId}
  savingSeries={savingFiscalSeries}
  onChangeInvoiceSerieId={setInvoiceSerieId}
  onChangeSimplifiedInvoiceSerieId={setSimplifiedInvoiceSerieId}
  onChangeCreditNoteSerieId={setCreditNoteSerieId}
  onSaveSeries={saveFiscalSeries}
/>
)}

{!selectedTableId && posTab === "DOCUMENTS" && (
  <FiscalDocumentsView
  documents={documents}
  loading={loadingDocuments}
  report={fiscalReport}
  loadingReport={loadingFiscalReport}
  onCreateCreditNote={(document) => {
    setCreditNoteDocument(document);
  }}
/>
)}

{!selectedTableId && posTab === "STATS" && (
  <StatsView report={report} loading={loadingReport} />
)}

        {selectedTableId && (
          <ProductsView
            categories={categories}
            selectedCategoryId={selectedCategory?.id ?? null}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategoryId}
            onAddProduct={addProduct}
          />
        )}
          </>
)}
      </div>

      {canUsePOS && (
  <CartPanel
  restaurantName={restaurantName}
  selectedTable={selectedTable}
  selectedSession={selectedSession}
  isQuickSale={selectedIsQuickSale}
  cart={cart}
  total={total}
  accountDrafts={accountDrafts}
  savingAccount={savingAccount}
  cancellingSession={cancellingSession}
  onAddProduct={addProduct}
  onRemoveOne={removeOne}
  onRemoveAll={removeAll}
  onSetAccountDraftQuantity={setAccountDraftQuantity}
  onClearAccountDraft={clearAccountDraft}
  onSaveAccountDraft={saveAccountDraft}
  onSendOrder={sendOrder}
  onCancelTableSession={cancelTableSession}
  onTransferTable={() => setTransferOpen(true)}
  onOpenSplitItems={() => setSplitItemsOpen(true)}
  onOpenPayment={openPayment}
  onOpenDiscount={() => {
    const globalDiscount = selectedSession?.discounts?.find(
      (discount) => !discount.orderItemId,
    );

    setDiscountTarget({
      scope: "SESSION",
      discountType:
        globalDiscount?.type === "AMOUNT" || globalDiscount?.type === "PERCENTAGE"
          ? globalDiscount.type
          : null,
      discountValue:
        globalDiscount?.value === undefined ? null : Number(globalDiscount.value),
    });

    setDiscountOpen(true);
  }}
 onOpenItemDiscount={(item) => {
  setEditingLine(item);
}}
  onOpenCartItemEditor={(item) => {
    setEditingCartProductId(item.productId);
  }}
/>
)}

      {openingTable && (
        <OpenTableModal
          table={openingTable}
          guestCount={guestCount}
          loading={openingSession}
          onClose={() => setOpeningTable(null)}
          onChangeGuestCount={setGuestCount}
          onConfirm={openTableSession}
        />
      )}

      {splitItemsOpen && (
  <SplitItemsModal
    session={selectedSession}
    onClose={() => setSplitItemsOpen(false)}
    onReceive={({ amount, items }) => {
  setPartialPaymentAmount(amount);
  setPartialPaymentMethod("CARD");
  setSelectedSplitItems(items);
  setSplitItemsOpen(false);
  setPartialPaymentOpen(true);
}}
  />
)}

{discountOpen && (
  <DiscountModal
    loading={discountLoading}
    target={discountTarget}
    onClose={() => {
      setDiscountOpen(false);
      setDiscountTarget({
        scope: "SESSION",
        discountType: null,
        discountValue: null,
      });
    }}
    onConfirm={applyDiscount}
  />
)}

{editingLine && (
  <LineEditorModal
    line={editingLine}
    loading={savingLine}
    onClose={() => setEditingLine(null)}
    onConfirm={updateLineItem}
  />
)}

{editingCartProductId && (
  <CartLineEditorModal
    item={cart.find((cartItem) => cartItem.productId === editingCartProductId) ?? null}
    onClose={() => setEditingCartProductId(null)}
    onConfirm={updateCartItem}
  />
)}

{partialPaymentOpen && (
  <PartialPaymentModal
    amount={partialPaymentAmount}
    method={partialPaymentMethod}
    loading={partialPaymentLoading}
    onChangeMethod={setPartialPaymentMethod}
    onClose={() => setPartialPaymentOpen(false)}
    onConfirm={handlePartialPayment}
  />
)}

      {paymentOpen && selectedSession && selectedTable && (
        <PaymentModal
        fiscalReady={fiscalReady}
onCreateInvoice={() => {
  setInvoiceModalOpen(true);
}}
  tableNumber={selectedTable.number}
  total={Number(selectedSession.remainingAmount ?? selectedSession.totalAmount ?? 0)}
  guestCount={selectedSession.guestCount ?? 1}
  splitCount={splitCount}
  onChangeSplitCount={setSplitCount}
          method={paymentMethod}
          loading={closingPayment}
          onChangeMethod={setPaymentMethod}
          onClose={() => setPaymentOpen(false)}
          onConfirm={closeTableWithPayment}
        />
      )}

      {cashModal === "OPEN" && (
        <CashRegisterModal
          mode="OPEN"
          amount={openingAmount}
          loading={savingCashRegister}
          expectedCash={0}
          difference={0}
          onChangeAmount={setOpeningAmount}
          onClose={() => setCashModal(null)}
          onConfirm={openCashRegisterAction}
        />
      )}

      {cashModal === "CLOSE" && (
        <CashRegisterModal
          mode="CLOSE"
          amount={closingAmount}
          loading={savingCashRegister}
          expectedCash={expectedCash}
          difference={Number(closingAmount.replace(",", ".") || 0) - expectedCash}
          onChangeAmount={setClosingAmount}
          onClose={() => setCashModal(null)}
          onConfirm={closeCashRegisterAction}
        />
      )}

      {showCashMovementModal && (
  <CashMovementModal
    type={cashMovementType}
    amount={cashMovementAmount}
    reason={cashMovementReason}
    loading={savingCashMovement}
    onChangeAmount={setCashMovementAmount}
    onChangeReason={setCashMovementReason}
    onClose={() => setShowCashMovementModal(false)}
    onConfirm={createCashMovement}
  />
)}

{invoiceModalOpen && (
  <InvoiceModal
    vat={invoiceVat}
    name={invoiceName}
    address={invoiceAddress}
    email={invoiceEmail}
    customerType={invoiceCustomerType}
    loading={creatingInvoice}
    onChangeVat={setInvoiceVat}
    onChangeName={setInvoiceName}
    onChangeAddress={setInvoiceAddress}
    onChangeEmail={setInvoiceEmail}
    onChangeCustomerType={setInvoiceCustomerType}
    onFetchVatData={fetchVatData}
    onClose={() => setInvoiceModalOpen(false)}
    onConfirm={createInvoiceAndCloseTable}
  />
)}

{creditNoteDocument && (
  <CreditNoteModal
    document={creditNoteDocument}
    reason={creditNoteReason}
    loading={creatingCreditNote}
    onChangeReason={setCreditNoteReason}
    onClose={() => setCreditNoteDocument(null)}
    onConfirm={createCreditNote}
  />
)}

      {transferOpen && (
       <TransferTableModal
  tables={tables}
  sourceSession={selectedSession}
  loading={transferringTable}
  onClose={() => setTransferOpen(false)}
  onTransfer={transferTable}
/>
      )}
    </section>
  );
}




function QrOrdersView({
  orders,
  alerts,
  loadingOrderId,
  loadingAlertId,
  onAccept,
  onReject,
  onResolveAlert,
}: {
  orders: QRPendingOrder[];
  alerts: QRAlert[];
  loadingOrderId: string | null;
  loadingAlertId: string | null;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onResolveAlert: (alertId: string, type: "waiter" | "bill") => void;
}) {
  const totalPending = orders.length + alerts.length;

  if (totalPending === 0) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white p-8 text-center">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
            QR Orders
          </p>
          <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-[#0E0D0C]">
            Tudo resolvido
          </h2>
          <p className="mt-3 text-sm font-medium text-[#7D746A]">
            Pedidos QR, chamadas de empregado e pedidos de conta aparecem aqui.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#D8AE62] bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B58A45]">
            QR Orders
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#0E0D0C]">
            Centro de pedidos QR
          </h2>
          <p className="mt-1 text-sm font-bold text-[#7D746A]">
            Pedidos, chamadas de empregado e pedidos de conta.
          </p>
        </div>

        <span className="animate-pulse rounded-full bg-[#11100F] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#D8AE62]">
          {totalPending} pendente{totalPending === 1 ? "" : "s"}
        </span>
      </div>

      {alerts.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#B58A45]">
            Alertas da mesa
          </p>

          <div className="grid gap-3 xl:grid-cols-2">
            {alerts.flatMap((alertItem) => {
              const cards = [];

              if (alertItem.requestedWaiterAt) {
                const key = `${alertItem.id}-waiter`;

                cards.push(
                  <div
                    key={key}
                    className="rounded-[20px] border border-[#D8AE62] bg-[#FFF8EC] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-[#0E0D0C]">
                          Mesa {alertItem.tableNumber}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                          Chamou empregado ·{" "}
                          {new Date(alertItem.requestedWaiterAt).toLocaleTimeString(
                            "pt-PT",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                      <span className="text-xl">🙋</span>
                    </div>

                    <button
                      onClick={() => onResolveAlert(alertItem.id, "waiter")}
                      disabled={loadingAlertId === key}
                      className="mt-4 h-10 w-full rounded-xl bg-[#11100F] text-xs font-black text-white transition hover:bg-[#2A2723] disabled:opacity-50"
                    >
                      {loadingAlertId === key ? "A resolver..." : "Marcar resolvido"}
                    </button>
                  </div>,
                );
              }

              if (alertItem.requestedBillAt) {
                const key = `${alertItem.id}-bill`;

                cards.push(
                  <div
                    key={key}
                    className="rounded-[20px] border border-[#D8AE62] bg-[#FFF8EC] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-[#0E0D0C]">
                          Mesa {alertItem.tableNumber}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                          Pediu a conta ·{" "}
                          {new Date(alertItem.requestedBillAt).toLocaleTimeString(
                            "pt-PT",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                      <span className="text-xl">🧾</span>
                    </div>

                    <button
                      onClick={() => onResolveAlert(alertItem.id, "bill")}
                      disabled={loadingAlertId === key}
                      className="mt-4 h-10 w-full rounded-xl bg-[#11100F] text-xs font-black text-white transition hover:bg-[#2A2723] disabled:opacity-50"
                    >
                      {loadingAlertId === key ? "A resolver..." : "Marcar resolvido"}
                    </button>
                  </div>,
                );
              }

              return cards;
            })}
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#B58A45]">
            Pedidos para aprovação
          </p>

          <div className="grid gap-3 xl:grid-cols-2">
            {orders.map((order) => {
              const loading = loadingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-[20px] border border-[#E8E0D4] bg-[#FCFBF9] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-[#0E0D0C]">
                        Mesa {order.tableNumber}
                      </p>

                      <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                        {new Date(order.createdAt).toLocaleTimeString("pt-PT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {order.items.length} produto
                        {order.items.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <p className="text-lg font-black text-[#0E0D0C]">
                      {formatMoney(Number(order.total ?? 0))}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-[#E8E0D4] pt-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between gap-3 text-xs font-bold text-[#6F665B]"
                      >
                        <span>
                          {item.quantity} × {item.productName}
                        </span>
                        <span>{formatMoney(Number(item.lineTotal ?? 0))}</span>
                      </div>
                    ))}

                    {order.notes && (
                      <p className="mt-2 rounded-xl bg-[#FFF8EC] px-3 py-2 text-xs font-bold text-[#8B6D3E]">
                        Nota: {order.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onReject(order.id)}
                      disabled={loading}
                      className="h-10 rounded-xl border border-[#F0D4C8] bg-[#FFF7F3] text-xs font-black text-[#B4583C] transition hover:bg-[#FFECE3] disabled:opacity-50"
                    >
                      Rejeitar
                    </button>

                    <button
                      onClick={() => onAccept(order.id)}
                      disabled={loading}
                      className="h-10 rounded-xl bg-[#11100F] text-xs font-black text-white transition hover:bg-[#2A2723] disabled:opacity-50"
                    >
                      {loading ? "A guardar..." : "Aceitar pedido"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}


function POSTabs({
  activeTab,
  onChange,
}: {
  activeTab: POSTab;
  onChange: (tab: POSTab) => void;
}) {
  const tabs: { key: POSTab; label: string }[] = [
    { key: "TABLES", label: "Mesas" },
    { key: "CASH", label: "Caixa" },
    { key: "SERVICE", label: "Serviço" },
    { key: "KITCHEN", label: "QR Orders" },
    { key: "HISTORY", label: "Histórico" },
    { key: "FISCAL", label: "Faturação" },
{ key: "DOCUMENTS", label: "Documentos" },
{ key: "STATS", label: "Estatísticas" },
  ];

  return (
    <div className="mt-5 flex w-fit rounded-2xl border border-[#E8E0D4] bg-white p-1 shadow-[0_12px_30px_rgba(30,20,10,0.04)]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={
            activeTab === tab.key
              ? "rounded-xl bg-[#11100F] px-4 py-2 text-xs font-black text-white"
              : "rounded-xl px-4 py-2 text-xs font-black text-[#7D746A] transition hover:text-[#11100F]"
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CashRegisterView({
  openCashRegister,
  openingAmount,
  cashTotal,
  cardTotal,
  transferTotal,
  registerTotal,
  expectedCash,
  onOpenCash,
  onCloseCash,
  onCashIn,
  onCashOut,
}: {
  openCashRegister: POSCashRegister | null;
  openingAmount: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  registerTotal: number;
  expectedCash: number;
  onOpenCash: () => void;
  onCloseCash: () => void;
  onCashIn: () => void;
  onCashOut: () => void;
}) {
  if (!openCashRegister) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white p-8">
        <div className="max-w-[420px] text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#FBF4E8] text-[#B58A45] shadow-[0_20px_60px_rgba(181,138,69,0.12)]">
            <CashIcon />
          </div>

          <p className="mt-7 text-2xl font-black tracking-[-0.04em] text-[#0E0D0C]">
            Caixa fechada
          </p>
          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-6 text-[#7D746A]">
            Abre a caixa antes de começar o serviço para associar os pagamentos do POS ao fecho do dia.
          </p>

          <button
            onClick={onOpenCash}
            className="mt-7 rounded-2xl bg-[#11100F] px-7 py-4 text-sm font-black text-white shadow-[0_18px_35px_rgba(0,0,0,0.16)] transition hover:translate-y-[-1px]"
          >
            Abrir caixa
          </button>
        </div>
      </section>
    );
  }

  const cards = [
    { label: "Valor inicial", value: openingAmount },
    { label: "Dinheiro", value: cashTotal },
    { label: "Multibanco", value: cardTotal },
    { label: "Transferência", value: transferTotal },
    { label: "Total recebido", value: registerTotal },
    { label: "Dinheiro esperado", value: expectedCash },
  ];

  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-6">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
            Caixa
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] text-[#0E0D0C]">
            Caixa aberta
          </h2>
          <p className="mt-2 text-sm font-medium text-[#7D746A]">
            Aberta desde {new Date(openCashRegister.openedAt).toLocaleTimeString("pt-PT", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex gap-2">
  <button
    onClick={() => {
      onCashIn();
    }}
    className="rounded-2xl border border-[#D7EAD9] bg-[#F4FFF5] px-4 py-3 text-sm font-black text-[#166534]"
  >
    + Entrada
  </button>

  <button
    onClick={onCashOut}
    className="rounded-2xl border border-[#F1D5D5] bg-[#FFF5F5] px-4 py-3 text-sm font-black text-[#991B1B]"
  >
    - Saída
  </button>

  <button
    onClick={onCloseCash}
    className="rounded-2xl border border-[#D8AE62] bg-white px-5 py-3 text-sm font-black text-[#0E0D0C] transition hover:bg-[#FBF4E8]"
  >
    Fechar caixa
  </button>
</div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-[24px] border border-[#EEE7DD] bg-[#FCFBF9] p-5 shadow-[0_12px_30px_rgba(30,20,10,0.025)]"
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8B7C68]">
              {card.label}
            </p>
            <p className="mt-3 text-[30px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              {formatMoney(card.value)}
            </p>
          </div>
        ))}
      </div>

      {openCashRegister.movements.length > 0 && (
  <div className="mt-5 rounded-[24px] border border-[#E8E0D4] bg-white p-5">
    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B58A45]">
      Movimentos de caixa
    </p>

    <div className="mt-4 space-y-3">
      {openCashRegister.movements.map((movement) => {
        const isIn = movement.type === "IN";

        return (
          <div
            key={movement.id}
            className="flex items-center justify-between rounded-2xl border border-[#EEE7DD] bg-[#FCFBF9] px-4 py-3"
          >
            <div>
              <p className="text-sm font-black text-[#0E0D0C]">
                {isIn ? "Entrada" : "Saída"}
              </p>

              <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                {movement.reason || "Sem motivo"}
              </p>
            </div>

            <p
              className={
                isIn
                  ? "text-sm font-black text-[#166534]"
                  : "text-sm font-black text-[#991B1B]"
              }
            >
              {isIn ? "+" : "-"}
              {formatMoney(Number(movement.amount ?? 0))}
            </p>
          </div>
        );
      })}
    </div>
  </div>
)}

      <div className="mt-5 rounded-[24px] border border-[#E8E0D4] bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#B58A45]">
          Pagamentos
        </p>
        <p className="mt-2 text-sm font-medium text-[#7D746A]">
          {openCashRegister.payments.length} pagamento
          {openCashRegister.payments.length === 1 ? "" : "s"} associado
          {openCashRegister.payments.length === 1 ? "" : "s"} a esta caixa.
        </p>
      </div>
    </section>
  );
}

function ServiceView({
  sessions,
  todayPayments,
}: {
  sessions: POSTableSession[];
  todayPayments: POSTodayPayment[];
}) {
  const openTables = sessions.filter((session) => session.tableId).length;
  const seatedGuests = sessions.reduce(
    (sum, session) => sum + Number(session.guestCount ?? 1),
    0,
  );

  const openRevenue = sessions.reduce(
    (sum, session) => sum + Number(session.totalAmount ?? 0),
    0,
  );

  const closedRevenue = todayPayments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

  const closedGuests = todayPayments.reduce(
    (sum, payment) => sum + Number(payment.tableSession?.guestCount ?? 1),
    0,
  );

  const totalProjectedRevenue = closedRevenue + openRevenue;
  const totalGuests = closedGuests + seatedGuests;
  const averagePerGuest =
    totalGuests > 0 ? totalProjectedRevenue / totalGuests : 0;

  const cashTotal = todayPayments
    .filter((payment) => payment.method === "CASH")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const cardTotal = todayPayments
    .filter((payment) => payment.method === "CARD")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const transferTotal = todayPayments
    .filter((payment) => payment.method === "BANK_TRANSFER")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B58A45]">
            Serviço
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#0E0D0C]">
            Hoje
          </h2>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold text-[#8B7C68]">
            Total previsto
          </p>
          <p className="text-3xl font-black tracking-[-0.06em] text-[#0E0D0C]">
            {formatMoney(totalProjectedRevenue)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <SmallMetric label="Faturado" value={formatMoney(closedRevenue)} />
        <SmallMetric label="Em aberto" value={formatMoney(openRevenue)} />
        <SmallMetric label="Mesas abertas" value={String(openTables)} />
        <SmallMetric label="Pessoas" value={String(totalGuests)} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        <SmallMetric label="Ticket/pessoa" value={formatMoney(averagePerGuest)} />
        <SmallMetric label="Dinheiro" value={formatMoney(cashTotal)} />
        <SmallMetric label="Multibanco" value={formatMoney(cardTotal)} />
        <SmallMetric label="Transferência" value={formatMoney(transferTotal)} />
      </div>
    </section>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#EEE7DD] bg-[#FCFBF9] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8B7C68]">
        {label}
      </p>
      <p className="mt-2 text-xl font-black tracking-[-0.04em] text-[#0E0D0C]">
        {value}
      </p>
    </div>
  );
}

function HistoryView({
  payments,
  loading,
}: {
  payments: POSHistoryPayment[];
  loading: boolean;
}) {
  const total = payments.reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0,
  );

  const cashTotal = payments
    .filter((payment) => payment.method === "CASH")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const cardTotal = payments
    .filter((payment) => payment.method === "CARD")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const transferTotal = payments
    .filter((payment) => payment.method === "BANK_TRANSFER")
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);

  const methodLabel = (method: string) => {
    if (method === "CASH") return "Dinheiro";
    if (method === "CARD") return "Multibanco";
    if (method === "BANK_TRANSFER") return "Transferência";
    return method;
  };

  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-6">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
            Histórico
          </p>
          <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] text-[#0E0D0C]">
            Pagamentos
          </h2>
          <p className="mt-2 text-sm font-medium text-[#7D746A]">
            Últimos {payments.length} pagamentos fechados no POS.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] px-5 py-4 text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#B58A45]">
            Total
          </p>
          <p className="mt-1 text-[28px] font-black tracking-[-0.06em] text-[#0E0D0C]">
            {formatMoney(total)}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-[22px] border border-[#EEE7DD] bg-[#FCFBF9] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
            Dinheiro
          </p>
          <p className="mt-2 text-xl font-black text-[#0E0D0C]">
            {formatMoney(cashTotal)}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#EEE7DD] bg-[#FCFBF9] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
            Multibanco
          </p>
          <p className="mt-2 text-xl font-black text-[#0E0D0C]">
            {formatMoney(cardTotal)}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#EEE7DD] bg-[#FCFBF9] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
            Transferência
          </p>
          <p className="mt-2 text-xl font-black text-[#0E0D0C]">
            {formatMoney(transferTotal)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-[#E8E0D4] bg-[#FCFBF9] text-sm font-black text-[#8B7C68]">
          A carregar histórico...
        </div>
      ) : payments.length === 0 ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-[#E8E0D4] bg-[#FCFBF9] text-center">
          <div>
            <p className="text-xl font-black text-[#0E0D0C]">
              Ainda sem pagamentos
            </p>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              Quando fechares mesas, os pagamentos aparecem aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const items =
              payment.tableSession?.orders?.flatMap((order) => order.items) ?? [];
            const aggregatedItems = aggregateSessionItems(items);
            const tableNumber = payment.tableSession?.table?.number;
            const guestCount = payment.tableSession?.guestCount ?? 1;

            return (
              <div
                key={payment.id}
                className="rounded-[24px] border border-[#E8E0D4] bg-[#FCFBF9] p-5 shadow-[0_12px_30px_rgba(30,20,10,0.025)]"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-sm font-black text-[#0E0D0C]">
                      {tableNumber ? `Mesa ${tableNumber}` : "Venda rápida"}
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                      {methodLabel(payment.method)} · {guestCount} pax ·{" "}
                      {new Date(payment.createdAt).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {payment.fiscalDocument && (
  <div className="mt-3 rounded-xl border border-[#E8E0D4] bg-white px-3 py-2">
    <p className="text-xs font-black text-[#0E0D0C]">
      Documento fiscal:{" "}
      {payment.fiscalDocument.documentNumber ?? "Sem número"}
    </p>

    {payment.fiscalDocument.pdfUrl && (
      <a
        href={payment.fiscalDocument.pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-xs font-black text-[#B58A45] hover:underline"
      >
        Abrir PDF
      </a>
    )}
  </div>
)}
                  </div>

                  <p className="text-xl font-black tracking-[-0.04em] text-[#0E0D0C]">
                    {formatMoney(Number(payment.amount ?? 0))}
                  </p>
                </div>

                {aggregatedItems.length > 0 && (
                  <div className="mt-4 border-t border-[#E8E0D4] pt-3">
                    <div className="grid gap-1.5">
                      {aggregatedItems.slice(0, 5).map((item) => (
                        <div
                          key={item.key}
                          className="flex justify-between text-xs font-bold text-[#7D746A]"
                        >
                          <span>
                            {item.quantity} × {item.productName}
                          </span>
                          <span>{formatMoney(item.totalPrice)}</span>
                        </div>
                      ))}

                      {aggregatedItems.length > 5 && (
                        <p className="text-xs font-bold text-[#B58A45]">
                          + {aggregatedItems.length - 5} produtos
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FiscalRequiredView({
  onConfigure,
}: {
  onConfigure: () => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] p-8 text-center">
      <div className="max-w-xl">
        <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#9B6F3B]">
          Configuração obrigatória
        </p>

        <h2 className="mt-3 text-[34px] font-black tracking-[-0.06em] text-[#0E0D0C]">
          Configure a faturação antes de usar o POS
        </h2>

        <p className="mt-3 text-sm font-medium leading-6 text-[#7D746A]">
          Para abrir mesas, cobrar ou fechar vendas, o restaurante tem de ligar
          a conta Moloni e escolher as séries fiscais de Fatura, Fatura
          Simplificada e Nota de Crédito.
        </p>

        <button
          onClick={onConfigure}
          className="mt-7 rounded-2xl bg-[#11100F] px-7 py-4 text-sm font-black text-white"
        >
          Configurar Moloni
        </button>
      </div>
    </section>
  );
}

function FiscalSerieSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: any[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-[#E8E0D4] bg-white px-4 text-sm font-black outline-none focus:border-[#B58A45]"
      >
        <option value="">Selecionar série</option>

        {options.map((option) => (
          <option
            key={option.document_set_id}
            value={String(option.document_set_id)}
          >
            {option.name ?? option.document_set_id}
            {Array.isArray(option.document_set_at_codes) &&
            option.document_set_at_codes.length === 0
              ? " — não comunicada à AT"
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function FiscalSettingsView({
  integration,
  loading,
  documentSets,
  invoiceSerieId,
  simplifiedInvoiceSerieId,
  creditNoteSerieId,
  savingSeries,
  onChangeInvoiceSerieId,
  onChangeSimplifiedInvoiceSerieId,
  onChangeCreditNoteSerieId,
  onSaveSeries,
}: {
  integration: any;
  loading: boolean;
  documentSets: any[];
  invoiceSerieId: string;
  simplifiedInvoiceSerieId: string;
  creditNoteSerieId: string;
  savingSeries: boolean;
  onChangeInvoiceSerieId: (value: string) => void;
  onChangeSimplifiedInvoiceSerieId: (value: string) => void;
  onChangeCreditNoteSerieId: (value: string) => void;
  onSaveSeries: () => void;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-6">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
          Faturação
        </p>

        <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] text-[#0E0D0C]">
          Integração Moloni
        </h2>
      </div>

      {integration &&
  (!integration.invoiceSerieId ||
    !integration.simplifiedInvoiceSerieId ||
    !integration.creditNoteSerieId) && (
    <div className="mb-6 rounded-2xl border border-[#F0D4A8] bg-[#FFF8EC] p-5">
      <p className="font-black text-[#8B5E22]">
        Configuração incompleta
      </p>
      <p className="mt-1 text-sm font-medium text-[#7D746A]">
        Para ativar o POS, tens de configurar a série de fatura, fatura
        simplificada e nota de crédito.
      </p>
    </div>
  )}

      {loading ? (
        <p>A carregar...</p>
      ) : !integration ? (
        <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-6">
          <p className="font-black">
            Integração não configurada.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard
            label="Provider"
            value={integration.provider ?? "-"}
          />

          <InfoCard
            label="Empresa"
            value={integration.companyId ?? "-"}
          />

          <InfoCard
            label="Ativa"
            value={integration.active ? "Sim" : "Não"}
          />

          <InfoCard
            label="Série Fatura"
            value={integration.invoiceSerieId ?? "-"}
          />

          <InfoCard
  label="Série fatura simplificada"
  value={integration.simplifiedInvoiceSerieId ?? "Não configurada"}
/>

<InfoCard
  label="Série nota de crédito"
  value={integration.creditNoteSerieId ?? "Não configurada"}
/>

<div className="mt-8 w-full rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-6">
  <h3 className="text-xl font-black text-[#0E0D0C]">
    Séries fiscais
  </h3>

  <p className="mt-1 text-sm font-medium text-[#7D746A]">
    Escolhe as séries Moloni obrigatórias para ativar o POS.
  </p>

  <div className="mt-5 rounded-2xl border border-[#E8E0D4] bg-white p-5">
  <p className="font-black text-[#0E0D0C]">
    Ainda não tem séries fiscais?
  </p>

  <p className="mt-1 text-sm font-medium leading-6 text-[#7D746A]">
    Abra o Moloni, crie as séries fiscais e comunique-as à AT. Depois volte ao
    MesaLink e selecione as séries abaixo.
  </p>

  <ol className="mt-3 space-y-1 text-sm font-bold text-[#7D746A]">
    <li>1. Abrir Moloni</li>
    <li>2. Ir a Configurações → Séries de documentos</li>
    <li>3. Criar/comunicar série à AT</li>
    <li>4. Voltar ao MesaLink e guardar as séries</li>
  </ol>

<div className="mt-5 rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] p-5">
  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B6F3B]">
    Recomendação MesaLink
  </p>

  <h4 className="mt-2 text-lg font-black text-[#0E0D0C]">
    Moloni ON é suficiente para começar
  </h4>

  <p className="mt-2 text-sm font-medium leading-6 text-[#7D746A]">
    Para utilizar a faturação integrada do MesaLink, recomendamos o plano Moloni ON.
    Inclui ligações SAF-T, comunicação de séries à AT, clientes, artigos e documentos fiscais.
  </p>

  <p className="mt-2 text-sm font-black text-[#8B5E22]">
    Se precisar de mais funcionalidades, pode fazer upgrade diretamente no Moloni.
  </p>

  <a
    href="https://www.molonion.pt/molonion-vs-moloni/"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-4 inline-flex h-12 items-center rounded-xl bg-[#11100F] px-5 text-sm font-black text-white transition hover:opacity-90"
  >
    Ver planos Moloni
  </a>
</div>  

  <a
    href="https://moloni.pt/"
    target="_blank"
    rel="noopener noreferrer"
    className="mt-5 inline-flex h-12 items-center rounded-xl bg-[#11100F] px-5 text-sm font-black text-white transition hover:opacity-90"
  >
    Abrir Moloni
  </a>
</div>

  <div className="mt-5 grid w-full gap-4 lg:grid-cols-3">
    <FiscalSerieSelect
      label="Fatura"
      value={invoiceSerieId}
      options={documentSets}
      onChange={onChangeInvoiceSerieId}
    />

    <FiscalSerieSelect
      label="Fatura Simplificada"
      value={simplifiedInvoiceSerieId}
      options={documentSets}
      onChange={onChangeSimplifiedInvoiceSerieId}
    />

    <FiscalSerieSelect
      label="Nota de Crédito"
      value={creditNoteSerieId}
      options={documentSets}
      onChange={onChangeCreditNoteSerieId}
    />
  </div>

  <button
    onClick={onSaveSeries}
    disabled={
      savingSeries ||
      !invoiceSerieId ||
      !simplifiedInvoiceSerieId ||
      !creditNoteSerieId
    }
    className="mt-6 h-12 rounded-xl bg-[#11100F] px-6 text-sm font-black text-white disabled:opacity-40"
  >
    {savingSeries ? "A guardar..." : "Guardar séries"}
  </button>
</div>
        </div>
      )}
    </section>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
        {label}
      </p>

      <p className="mt-2 font-black text-[#0E0D0C]">
        {value}
      </p>
    </div>
  );
}

function StatsView({
  report,
  loading,
}: {
  report: POSReport | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white p-8">
        <p className="text-sm font-black text-[#8B7C68]">A carregar estatísticas...</p>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white p-8 text-center">
        <p className="text-sm font-black text-[#8B7C68]">Sem dados para mostrar.</p>
      </section>
    );
  }

  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-6">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
          Estatísticas
        </p>
        <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] text-[#0E0D0C]">
          Relatório de hoje
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <SmallMetric label="Faturado" value={formatMoney(report.totalRevenue)} />
        <SmallMetric label="Pagamentos" value={String(report.totalPayments)} />
        <SmallMetric label="Pessoas" value={String(report.totalGuests)} />
        <SmallMetric label="Ticket médio" value={formatMoney(report.averageTicket)} />
        <SmallMetric label="Por pessoa" value={formatMoney(report.averagePerGuest)} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-[#E8E0D4] bg-[#FCFBF9] p-5">
          <h3 className="text-sm font-black text-[#0E0D0C]">Métodos de pagamento</h3>

          <div className="mt-4 space-y-3">
            <ReportRow label="Dinheiro" value={formatMoney(report.byMethod.CASH)} />
            <ReportRow label="Multibanco" value={formatMoney(report.byMethod.CARD)} />
            <ReportRow label="Transferência" value={formatMoney(report.byMethod.BANK_TRANSFER)} />
          </div>
        </div>

        <div className="rounded-[24px] border border-[#E8E0D4] bg-[#FCFBF9] p-5">
          <h3 className="text-sm font-black text-[#0E0D0C]">Produtos mais vendidos</h3>

          <div className="mt-4 space-y-3">
            {report.topProducts.length === 0 ? (
              <p className="text-sm font-bold text-[#8B7C68]">Ainda sem produtos vendidos.</p>
            ) : (
              report.topProducts.map((product) => (
                <ReportRow
                  key={product.name}
                  label={`${product.quantity} × ${product.name}`}
                  value={formatMoney(product.revenue)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E8E0D4] pb-2 last:border-b-0">
      <span className="text-sm font-bold text-[#7D746A]">{label}</span>
      <span className="text-sm font-black text-[#0E0D0C]">{value}</span>
    </div>
  );
}

function FiscalMetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#0E0D0C]">
        {value}
      </p>
    </div>
  );
}

function FiscalDocumentsView({
  documents,
  loading,
  report,
  loadingReport,
  onCreateCreditNote,
}: {
  documents: FiscalDocument[];
  loading: boolean;
  report: FiscalReport;
  loadingReport: boolean;
  onCreateCreditNote: (document: FiscalDocument) => void;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-6">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
          Documentos
        </p>

        <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] text-[#0E0D0C]">
          Documentos fiscais
        </h2>
</div>

<div className="mb-6 grid gap-3 md:grid-cols-4">
  <FiscalMetricCard
    label="Faturas"
    value={loadingReport ? "..." : String(report.invoices)}
  />

  <FiscalMetricCard
    label="Simplificadas"
    value={loadingReport ? "..." : String(report.simplifiedInvoices)}
  />

  <FiscalMetricCard
    label="Notas crédito"
    value={loadingReport ? "..." : String(report.creditNotes)}
  />

  <FiscalMetricCard
    label="Total faturado"
    value={loadingReport ? "..." : formatMoney(report.total)}
  />
</div>

<div className="mb-6 rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] p-5">
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#9B6F3B]">
        SAF-T mensal
      </p>

      <h3 className="mt-2 text-xl font-black text-[#0E0D0C]">
        Exportação SAF-T feita no Moloni
      </h3>

      <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#7D746A]">
        Como os documentos fiscais são emitidos através da conta Moloni do
        restaurante, o ficheiro SAF-T deve ser exportado diretamente no Moloni.
      </p>

      <p className="mt-3 text-sm font-black text-[#8B5E22]">
        Menu no Moloni: A. Tributária → Ficheiro SAF-T(PT)
      </p>

      <p className="mt-1 text-xs font-bold text-[#8B7C68]">
        Prazo habitual: até dia 5 do mês seguinte.
      </p>
    </div>

    <a
      href="https://www.moloni.pt/"
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 rounded-xl bg-[#11100F] px-4 py-3 text-xs font-black text-white transition hover:opacity-90"
    >
      Abrir Moloni
    </a>
  </div>
</div>

      {loading ? (
        <p className="text-sm text-[#7D746A]">A carregar documentos...</p>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-6">
          <p className="font-black text-[#0E0D0C]">
            Ainda não existem documentos.
          </p>
          <p className="mt-1 text-sm text-[#7D746A]">
            As futuras faturas e notas de crédito aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-[#0E0D0C]">
                    {doc.documentNumber ?? "Sem número"}
                  </p>

                  <p className="text-xs text-[#7D746A]">
                    {doc.documentType}
                  </p>

                  {doc.pdfUrl && (
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-black text-[#B58A45] hover:underline"
                    >
                      Abrir PDF
                    </a>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-black text-[#0E0D0C]">
                    €{doc.totalAmount.toFixed(2)}
                  </p>

                  {doc.documentType !== "CREDIT_NOTE" && (
                    <button
                     onClick={() => onCreateCreditNote(doc)}
                      className="mt-3 rounded-xl border border-[#F0D4C8] bg-[#FFF7F3] px-3 py-2 text-xs font-black text-[#B4583C] hover:bg-[#FFECE3]"
                    >
                      Nota de crédito
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ComingSoonView({ label }: { label: string }) {
  return (
    <section className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white p-8 text-center">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.36em] text-[#B58A45]">
          Em breve
        </p>
        <h2 className="mt-2 text-[32px] font-black tracking-[-0.05em] text-[#0E0D0C]">
          {label}
        </h2>
        <p className="mt-3 text-sm font-medium text-[#7D746A]">
          Esta área já fica preparada para a próxima fase do POS.
        </p>
      </div>
    </section>
  );
}

function CashRegisterModal({
  mode,
  amount,
  loading,
  expectedCash,
  difference,
  onChangeAmount,
  onClose,
  onConfirm,
}: {
  mode: "OPEN" | "CLOSE";
  amount: string;
  loading: boolean;
  expectedCash: number;
  difference: number;
  onChangeAmount: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isClosing = mode === "CLOSE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">
              {isClosing ? "Fechar caixa" : "Abrir caixa"}
            </p>
            <h3 className="mt-3 text-[34px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              {isClosing ? "Valor contado" : "Valor inicial"}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              {isClosing
                ? "Indica o dinheiro contado fisicamente na caixa."
                : "Indica o fundo de caixa com que vais iniciar o serviço."}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68] transition hover:bg-[#F7F1E8] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-7 rounded-[26px] border border-[#E8E0D4] bg-[#FCFBF9] p-5">
          <label className="text-xs font-black uppercase tracking-[0.22em] text-[#8B7C68]">
            {isClosing ? "Valor contado" : "Valor inicial"}
          </label>

          <div className="mt-3 flex items-center gap-3">
            <input
              value={amount}
              onChange={(event) => onChangeAmount(event.target.value)}
              inputMode="decimal"
              className="h-16 min-w-0 flex-1 rounded-2xl border border-[#E8E0D4] bg-white px-4 text-[30px] font-black tracking-[-0.06em] text-[#0E0D0C] outline-none focus:border-[#C99B4F]"
              placeholder="0.00"
            />
            <span className="text-2xl font-black text-[#8B7C68]">€</span>
          </div>

          {isClosing && (
            <div className="mt-5 space-y-2 rounded-2xl bg-white p-4">
              <div className="flex justify-between text-sm font-bold text-[#7D746A]">
                <span>Dinheiro esperado</span>
                <span>{formatMoney(expectedCash)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#0E0D0C]">
                <span>Diferença</span>
                <span>{formatMoney(difference)}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#C99B4F] text-sm font-black text-white shadow-[0_16px_34px_rgba(201,155,79,0.28)] transition hover:bg-[#B98A3E] disabled:opacity-50"
        >
          {loading
            ? "A guardar..."
            : isClosing
              ? "Fechar caixa"
              : "Abrir caixa"}
        </button>
      </div>
    </div>
  );
}

function CashMovementModal({
  type,
  amount,
  reason,
  loading,
  onChangeAmount,
  onChangeReason,
  onClose,
  onConfirm,
}: {
  type: "IN" | "OUT";
  amount: string;
  reason: string;
  loading: boolean;
  onChangeAmount: (value: string) => void;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isIn = type === "IN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">
              Movimento de caixa
            </p>
            <h3 className="mt-3 text-[34px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              {isIn ? "Entrada" : "Saída"}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              {isIn
                ? "Regista dinheiro que entrou na caixa."
                : "Regista dinheiro retirado da caixa, como compras ou trocos."}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68] transition hover:bg-[#F7F1E8] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-7 rounded-[26px] border border-[#E8E0D4] bg-[#FCFBF9] p-5">
          <label className="text-xs font-black uppercase tracking-[0.22em] text-[#8B7C68]">
            Valor
          </label>

          <div className="mt-3 flex items-center gap-3">
            <input
              value={amount}
              onChange={(event) => onChangeAmount(event.target.value)}
              inputMode="decimal"
              className="h-16 min-w-0 flex-1 rounded-2xl border border-[#E8E0D4] bg-white px-4 text-[30px] font-black tracking-[-0.06em] text-[#0E0D0C] outline-none focus:border-[#C99B4F]"
              placeholder="0.00"
            />
            <span className="text-2xl font-black text-[#8B7C68]">€</span>
          </div>

          <label className="mt-5 block text-xs font-black uppercase tracking-[0.22em] text-[#8B7C68]">
            Motivo
          </label>

          <input
            value={reason}
            onChange={(event) => onChangeReason(event.target.value)}
            className="mt-3 h-12 w-full rounded-2xl border border-[#E8E0D4] bg-white px-4 text-sm font-bold text-[#0E0D0C] outline-none focus:border-[#C99B4F]"
            placeholder={isIn ? "Ex: Reforço de caixa" : "Ex: Compras supermercado"}
          />
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          className={
            isIn
              ? "mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#166534] text-sm font-black text-white shadow-[0_16px_34px_rgba(22,101,52,0.22)] transition hover:opacity-90 disabled:opacity-50"
              : "mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#991B1B] text-sm font-black text-white shadow-[0_16px_34px_rgba(153,27,27,0.22)] transition hover:opacity-90 disabled:opacity-50"
          }
        >
          {loading ? "A guardar..." : isIn ? "Guardar entrada" : "Guardar saída"}
        </button>
      </div>
    </div>
  );
}

function CashIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M7 10h10M8 14h3M15 14h1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


function TablesView({
  tables,
  sessions,
  openTables,
  onSelect,
}: {
  tables: TableItem[];
  sessions: POSTableSession[];
  openTables: number;
  onSelect: (tableId: string) => void;
}) {
  const freeTables = tables.length - openTables;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-[#E8E0D4] bg-white p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FilterPill active label="Todas" value={tables.length} />
          <FilterPill label="Abertas" value={openTables} dot />
          <FilterPill label="Livres" value={freeTables} />
        </div>

        <p className="text-sm font-black text-[#7D746A]">
          {tables.length} mesas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {tables.map((table) => {
          const session = sessions.find((item) => item.tableId === table.id);
          const occupied = Boolean(session);
          const totalAmount = Number(
  session?.remainingAmount ?? session?.totalAmount ?? 0,
);

          return (
            <button
              key={table.id}
              onClick={() => onSelect(table.id)}
              className={
                occupied
                  ? "flex h-[112px] flex-col justify-between rounded-xl border-2 border-[#11100F] bg-[#11100F] p-3 text-left text-white"
                  : "flex h-[112px] flex-col justify-between rounded-xl border border-[#E8E0D4] bg-[#FCFBF9] p-3 text-left transition hover:border-[#C99B4F] hover:bg-[#FFF8EC]"
              }
            >
              <div className="flex items-center justify-between">
                <span
                  className={
                    occupied
                      ? "text-[10px] font-black uppercase tracking-[0.16em] text-white/60"
                      : "text-[10px] font-black uppercase tracking-[0.16em] text-[#9A9187]"
                  }
                >
                  Mesa
                </span>

                <span
                  className={
                    occupied
                      ? "h-2.5 w-2.5 rounded-full bg-[#C99B4F]"
                      : "h-2.5 w-2.5 rounded-full bg-[#31A24C]"
                  }
                />
              </div>

              <div className="flex items-end justify-between">
                <span className="text-4xl font-black leading-none tracking-[-0.08em]">
                  {table.number}
                </span>

                <span
                  className={
                    occupied
                      ? "text-xs font-black text-[#C99B4F]"
                      : "text-xs font-bold text-[#7D746A]"
                  }
                >
                  {occupied ? `${formatMoney(totalAmount)}` : "Livre"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProductsView({
  categories,
  selectedCategoryId,
  selectedCategory,
  onSelectCategory,
  onAddProduct,
}: {
  categories: POSCategory[];
  selectedCategoryId: string | null;
  selectedCategory: POSCategory | null;
  onSelectCategory: (id: string) => void;
  onAddProduct: (product: POSProduct) => void;
}) {
  if (categories.length === 0) {
    return (
      <section className="flex flex-1 items-center justify-center rounded-3xl border border-[#E8E0D4] bg-white">
        <p className="text-lg font-black">Ainda não tens produtos</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={
                active
                  ? "rounded-xl bg-[#11100F] px-4 py-2 text-sm font-black text-white"
                  : "rounded-xl border border-[#E8E0D4] bg-white px-4 py-2 text-sm font-black text-[#11100F]"
              }
            >
              {category.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{selectedCategory?.name}</h2>

          <span className="text-sm font-bold text-[#7D746A]">
            {selectedCategory?.products.length ?? 0} produtos
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 xl:grid-cols-5">
          {selectedCategory?.products.map((product) => (
            <button
              key={product.id}
              onClick={() => onAddProduct(product)}
              className="flex h-[90px] flex-col justify-between rounded-xl border border-[#E8E0D4] bg-white p-3 text-left transition hover:border-[#C99B4F] hover:bg-[#FFF9F0]"
            >
              <p className="line-clamp-2 text-sm font-bold">{product.name}</p>

              <span className="text-lg font-black">
                {formatMoney(Number(product.price))}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function CartPanel({
  restaurantName,
  selectedTable,
  selectedSession,
  isQuickSale,
  cart,
  total,
  accountDrafts,
  savingAccount,
  cancellingSession,
  onOpenSplitItems,
  onOpenDiscount,
  onOpenItemDiscount,
  onOpenCartItemEditor,
  onAddProduct,
  onRemoveOne,
  onRemoveAll,
  onSetAccountDraftQuantity,
  onClearAccountDraft,
  onSaveAccountDraft,
  onSendOrder,
  onCancelTableSession,
  onTransferTable,
  onOpenPayment,
}: {
  restaurantName: string;
  selectedTable: TableItem | null;
  selectedSession: POSTableSession | null;
  isQuickSale: boolean;
  cart: CartItem[];
  total: number;
  accountDrafts: Record<string, number>;
  savingAccount: string | null;
  cancellingSession: boolean;
  onOpenSplitItems: () => void;
  onOpenDiscount: () => void;
  onOpenItemDiscount: (item: AccountLine) => void;
  onOpenCartItemEditor: (item: CartItem) => void;
  onAddProduct: (product: POSProduct) => void;
  onRemoveOne: (productId: string) => void;
  onRemoveAll: (productId: string) => void;
  onSetAccountDraftQuantity: (item: AccountLine, quantity: number) => void;
  onClearAccountDraft: (item: AccountLine) => void;
  onSaveAccountDraft: (item: AccountLine) => void;
  onSendOrder: () => void;
  onCancelTableSession: () => void;
  onTransferTable: () => void;
  onOpenPayment: () => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  const sessionItems =
    selectedSession?.orders.flatMap((order) => order.items) ?? [];
  const accountLines = aggregateSessionItems(sessionItems);

  const originalExistingTotal = Number(selectedSession?.totalAmount ?? 0);
  const discountAmount = Number(selectedSession?.discountAmount ?? 0);
  const globalDiscounts =
    selectedSession?.discounts?.filter((discount) => !discount.orderItemId) ?? [];
  const globalDiscountLabel = globalDiscounts
    .map((discount) =>
      discount.type === "PERCENTAGE"
        ? `${discount.value}%`
        : `${formatMoney(Number(discount.value))}`,
    )
    .join(" + ");
  const paidAmount = Number(selectedSession?.paidAmount ?? 0);
  const remainingAmount = Number(
    selectedSession?.remainingAmount ?? selectedSession?.totalAmount ?? 0,
  );

  const editedExistingTotal = accountLines.reduce((sum, item) => {
    const draftQuantity = accountDrafts[item.key];

    if (draftQuantity === undefined) {
      return sum + item.totalPrice;
    }

    const discountPerUnit =
      item.quantity > 0 ? item.discountAmount / item.quantity : 0;

    return (
      sum + Math.max(0, draftQuantity * item.unitPrice - draftQuantity * discountPerUnit)
    );
  }, 0);

  const hasAccountChanges = accountLines.some(
    (item) =>
      accountDrafts[item.key] !== undefined &&
      accountDrafts[item.key] !== item.quantity,
  );

  const finalTotal = Math.max(0, remainingAmount + total);
  const currentAccountTotal = accountLines.reduce(
    (sum, item) => sum + item.totalPrice,
    0,
  );
  const canSend = (Boolean(selectedTable) || isQuickSale) && cart.length > 0;
  const canCharge =
    Boolean(selectedSession) &&
    (Boolean(selectedTable) || isQuickSale) &&
    finalTotal > 0;

  const orderCount = accountLines.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <aside className="flex w-[420px] shrink-0 flex-col border-l border-[#E8E0D4] bg-white">
      <div className="shrink-0 border-b border-[#E8E0D4] px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#B58A45]">
              Conta
            </p>

            <h2 className="mt-1 text-[26px] font-black tracking-[-0.05em] text-[#0E0D0C]">
              {isQuickSale
                ? "Venda rápida"
                : selectedTable
                  ? `Mesa ${selectedTable.number}`
                  : "Sem mesa"}
            </h2>
          </div>

          {selectedSession && (
            <span className="rounded-full bg-[#11100F] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#D8AE62]">
              Aberta
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-[#7D746A]">
            <UserIcon />
            <span>
              {selectedSession?.guestCount ?? 1} pax · {orderCount} pedido
              {orderCount === 1 ? "" : "s"}
            </span>
          </div>

          {selectedSession && selectedTable && (
            <button
              onClick={onCancelTableSession}
              disabled={cancellingSession}
              className="rounded-full border border-[#F0CFC2] bg-[#FFF7F3] px-4 py-2 text-xs font-black text-[#B4583C] transition hover:bg-[#FFECE3] disabled:opacity-50"
            >
              {cancellingSession ? "A cancelar..." : "Cancelar mesa"}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selectedSession ? (
          <div>
            <div className="flex h-10 items-center justify-between border-b border-[#E8E0D4] px-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B58A45]">
                Conta atual
              </p>
              <p className="text-xs font-black text-[#0E0D0C]">
                {formatMoney(currentAccountTotal)}
              </p>
            </div>

            {accountLines.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center px-8 text-center">
                <div>
                  <ReceiptIcon />
                  <p className="mt-4 text-xl font-black text-[#0E0D0C]">
                    Conta sem itens pendentes
                  </p>
                  <p className="mt-2 text-sm font-medium text-[#7D746A]">
                    Os produtos pagos deixam de aparecer aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#E8E0D4]">
                {accountLines.map((item) => {
                  const draftQuantity = accountDrafts[item.key] ?? item.quantity;
                  const draftTotal =
                    draftQuantity === item.quantity
                      ? item.totalPrice
                      : Math.max(
                          0,
                          draftQuantity * item.unitPrice -
                            draftQuantity *
                              (item.quantity > 0
                                ? item.discountAmount / item.quantity
                                : 0),
                        );
                  const hasDraft = draftQuantity !== item.quantity;
                  const saving = savingAccount === item.key;
                  const originalLineTotal = draftQuantity * item.unitPrice;
                  const discountLabel =
                    item.discountType === "PERCENTAGE" && item.discountValue
                      ? `(${item.discountValue}%)`
                      : "";

                  return (
                    <div
                      key={item.key}
                      className="grid min-h-[66px] grid-cols-[1.25fr_82px_72px_76px_58px] items-center gap-2 px-5 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#0E0D0C]">
                          {item.productName}
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-[#8B7C68]">
                          {draftQuantity} × {formatMoney(item.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            onSetAccountDraftQuantity(item, draftQuantity - 1)
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D4] bg-white text-sm font-black text-[#0E0D0C] transition hover:bg-[#FBF4E8] disabled:opacity-40"
                        >
                          −
                        </button>

                        <span className="min-w-5 text-center text-sm font-black text-[#0E0D0C]">
                          {draftQuantity}
                        </span>

                        <button
                          onClick={() =>
                            onSetAccountDraftQuantity(item, draftQuantity + 1)
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#11100F] text-sm font-black text-white transition hover:bg-[#2A2723] disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right text-xs font-bold text-[#7D746A]">
                        {formatMoney(item.unitPrice)}
                      </div>

                      <div className="text-right">
                        {item.discountAmount > 0 ? (
                          <>
                            <p className="text-[11px] font-black text-[#2F9E55]">
                              -{formatMoney(item.discountAmount)}
                            </p>
                            {discountLabel && (
                              <p className="text-[10px] font-bold text-[#8B7C68]">
                                {discountLabel}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] font-bold text-[#B1A89D]">
                            —
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        {item.discountAmount > 0 && (
                          <p className="text-[10px] font-bold text-[#8B7C68] line-through">
                            {formatMoney(originalLineTotal)}
                          </p>
                        )}
                        <p className="text-sm font-black text-[#0E0D0C]">
                          {formatMoney(draftTotal)}
                        </p>
                      </div>

                      <div className="col-span-5 flex items-center justify-between">
                        {hasDraft ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onSaveAccountDraft(item)}
                              disabled={saving}
                              className="h-7 rounded-full bg-[#11100F] px-3 text-[10px] font-black text-white disabled:opacity-40"
                            >
                              {saving ? "..." : "Guardar"}
                            </button>

                            <button
                              onClick={() => onClearAccountDraft(item)}
                              disabled={saving}
                              className="h-7 rounded-full border border-[#E8E0D4] px-3 text-[10px] font-black text-[#8B7C68] disabled:opacity-40"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <span />
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => onOpenItemDiscount(item)}
                            disabled={saving}
                            className="flex h-7 items-center justify-center rounded-full border border-[#E8E0D4] bg-white px-3 text-[11px] font-black text-[#B58A45] hover:border-[#C99B4F] disabled:opacity-40"
                            title="Editar item"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => onSetAccountDraftQuantity(item, 0)}
                            disabled={saving}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#F0CFC2] bg-white text-[12px] font-black text-[#B4583C] hover:bg-[#FFF7F3] disabled:opacity-40"
                            title="Remover item"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : cart.length === 0 ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <div>
              <ReceiptIcon />
              <p className="mt-5 text-xl font-black text-[#0E0D0C]">
                Conta vazia
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[#7D746A]">
                Seleciona produtos para criar uma conta no POS.
              </p>
            </div>
          </div>
        ) : null}

        {cart.length > 0 && (
          <div className="border-t border-[#E8E0D4] bg-[#FFFDF9]">
            <div className="flex h-10 items-center justify-between px-5">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B58A45]">
                Novos produtos
              </p>
              <p className="text-xs font-black text-[#0E0D0C]">
                {formatMoney(total)}
              </p>
            </div>

            <div className="divide-y divide-[#E8E0D4]">
              {cart.map((item) => {
                const itemDiscount = getCartItemDiscount(item);
                const itemTotal = getCartItemTotal(item);
                const discountLabel =
                  Number(item.discountPercentage ?? 0) > 0
                    ? `${item.discountPercentage}%`
                    : Number(item.discountAmount ?? 0) > 0
                      ? formatMoney(Number(item.discountAmount ?? 0))
                      : "";

                return (
                  <div
                    key={item.productId}
                    className="grid min-h-[58px] grid-cols-[1fr_82px_78px] items-center gap-2 px-5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#0E0D0C]">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-[#8B7C68]">
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                      {item.notes && (
                        <p className="mt-0.5 truncate text-[10px] font-bold text-[#B58A45]">
                          Nota: {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onRemoveOne(item.productId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D4] bg-white text-sm font-black"
                      >
                        −
                      </button>
                      <span className="min-w-5 text-center text-sm font-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          onAddProduct({
                            id: item.productId,
                            name: item.name,
                            price: item.unitPrice,
                            vatRate: item.vatRate,
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#11100F] text-sm font-black text-white"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      {itemDiscount > 0 && (
                        <p className="text-[10px] font-black text-[#2F9E55]">
                          -{formatMoney(itemDiscount)} {discountLabel && `(${discountLabel})`}
                        </p>
                      )}
                      <p className="text-sm font-black text-[#0E0D0C]">
                        {formatMoney(itemTotal)}
                      </p>
                      <button
                        onClick={() => onOpenCartItemEditor(item)}
                        className="mt-1 text-[10px] font-black text-[#B58A45]"
                      >
                        editar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onSendOrder}
              disabled={!canSend}
              className="mx-5 mb-3 mt-2 flex h-10 w-[calc(100%-40px)] items-center justify-center rounded-xl bg-[#11100F] text-xs font-black text-white disabled:bg-[#E7DED2] disabled:text-[#9A9187]"
            >
              Lançar pedido
            </button>
          </div>
        )}      </div>

      <div className="shrink-0 border-t border-[#E8E0D4] bg-white px-5 py-3">
        {selectedSession && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            <SummaryBox label="Conta" value={formatMoney(originalExistingTotal)} />
            <SummaryBox
              label="Desc."
              value={`-${formatMoney(discountAmount)}`}
              highlight={discountAmount > 0}
            />
            <SummaryBox label="Pago" value={formatMoney(paidAmount)} />
            <SummaryBox
              label="Falta"
              value={formatMoney(finalTotal)}
              warning={finalTotal > 0}
            />
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B58A45]">
              Total a pagar
            </p>
            <p className="mt-0.5 text-[30px] font-black leading-none tracking-[-0.08em] text-[#0E0D0C]">
              {formatMoney(finalTotal)}
            </p>
          </div>

          <button
            onClick={onOpenPayment}
            disabled={!canCharge}
            className="flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-[#C99B4F] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(201,155,79,0.24)] transition hover:bg-[#B98A3E] disabled:bg-[#E7DED2] disabled:text-[#9A9187] disabled:shadow-none"
          >
            <CardIcon />
            Cobrar
          </button>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
  <button
    onClick={onOpenSplitItems}
    disabled={accountLines.length === 0}
    className="h-10 rounded-xl border border-[#E8E0D4] bg-[#FCFBF9] text-[11px] font-black text-[#0E0D0C] disabled:text-[#B1A89D]"
  >
    Separar
  </button>

  <button
    onClick={onOpenDiscount}
    disabled={!selectedSession}
    className="h-10 rounded-xl border border-[#E8E0D4] bg-[#FCFBF9] text-[11px] font-black text-[#0E0D0C] disabled:text-[#B1A89D]"
  >
    Desconto
  </button>

  <button
    onClick={onTransferTable}
    disabled={!selectedSession || isQuickSale}
    className="h-10 rounded-xl border border-[#D8AE62] bg-[#FFF8EC] text-[11px] font-black text-[#9B6F3B] disabled:border-[#E8E0D4] disabled:bg-[#FCFBF9] disabled:text-[#B1A89D]"
  >
    Transferir
  </button>
</div>
      </div>
    </aside>
  );
}

function TransferTableModal({
  tables,
  sourceSession,
  loading,
  onClose,
  onTransfer,
}: {
  tables: TableItem[];
  sourceSession: POSTableSession | null;
  loading: boolean;
  onClose: () => void;
  onTransfer: (data: {
    targetTableId: string;
    transferAll: boolean;
    items: {
      itemId: string;
      quantity: number;
    }[];
  }) => void;
}) {
  const [targetTableId, setTargetTableId] = useState<string | null>(null);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const sourceItems = sourceSession?.orders.flatMap((order) => order.items) ?? [];
  const lines = aggregateSessionItems(sourceItems);

  const availableTables = tables.filter((table) => table.id !== sourceSession?.tableId);

  const selectedItems = lines
    .map((item) => ({
      itemId: item.itemId,
      quantity: selectedQuantities[item.itemId] ?? 0,
    }))
    .filter((item) => item.quantity > 0);

  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCount = lines.reduce((sum, item) => sum + item.quantity, 0);
  const selectedTable = tables.find((table) => table.id === targetTableId) ?? null;

  function changeQuantity(item: AccountLine, nextQuantity: number) {
    const safeQuantity = Math.max(0, Math.min(item.quantity, nextQuantity));

    setSelectedQuantities((current) => ({
      ...current,
      [item.itemId]: safeQuantity,
    }));
  }

function transferEverything() {
  if (!targetTableId) {
    alert("Escolhe a mesa destino.");
    return;
  }

  const tableNumber = selectedTable?.number ?? "";

  const confirmed = window.confirm(
    `Transferir a conta inteira para a Mesa ${tableNumber}?`,
  );

  if (!confirmed) return;

  onTransfer({
    targetTableId,
    transferAll: true,
    items: [],
  });
}

  function transferSelected() {
    if (!targetTableId) {
      alert("Escolhe a mesa destino.");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Seleciona pelo menos um item.");
      return;
    }

    onTransfer({
      targetTableId,
      transferAll: false,
      items: selectedItems,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">
              Transferir
            </p>
            <h3 className="mt-3 text-[32px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              Mesa destino e itens
            </h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              Escolhe uma mesa destino e transfere tudo ou apenas alguns itens.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68] transition hover:bg-[#F7F1E8] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#B58A45]">
            Mesa destino
          </p>

          <div className="grid max-h-[180px] grid-cols-4 gap-2 overflow-y-auto pr-1">
            {availableTables.map((table) => {
              const active = targetTableId === table.id;

              return (
                <button
                  key={table.id}
                  disabled={loading}
                  onClick={() => setTargetTableId(table.id)}
                  className={
                    active
                      ? "flex h-16 flex-col items-center justify-center rounded-2xl border border-[#C99B4F] bg-[#FFF8EC] text-[#9B6F3B]"
                      : "flex h-16 flex-col items-center justify-center rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] text-[#0E0D0C] hover:border-[#C99B4F] hover:bg-[#FFF8EC]"
                  }
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.16em]">
                    Mesa
                  </span>
                  <span className="mt-1 text-xl font-black tracking-[-0.06em]">
                    {table.number}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B58A45]">
                Transferência rápida
              </p>
              <p className="mt-1 text-sm font-bold text-[#7D746A]">
                Move a conta inteira para {selectedTable ? `Mesa ${selectedTable.number}` : "a mesa escolhida"}.
              </p>
            </div>

            <button
              onClick={transferEverything}
              disabled={loading || !targetTableId || lines.length === 0}
              className="h-11 rounded-xl bg-[#11100F] px-5 text-xs font-black text-white disabled:bg-[#E7DED2] disabled:text-[#9A9187]"
            >
              Transferir tudo
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B58A45]">
              Itens
            </p>

            <p className="text-xs font-black text-[#7D746A]">
              {selectedCount}/{totalCount} selecionados
            </p>
          </div>

          {lines.length === 0 ? (
            <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-5 text-center">
              <p className="text-sm font-black text-[#0E0D0C]">
                Não existem itens para transferir.
              </p>
            </div>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
              {lines.map((item) => {
                const selectedQuantity = selectedQuantities[item.itemId] ?? 0;

                return (
                  <div
                    key={item.itemId}
                    className={
                      selectedQuantity > 0
                        ? "flex items-center justify-between rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] p-4"
                        : "flex items-center justify-between rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4"
                    }
                  >
                    <div>
                      <p className="text-sm font-black text-[#0E0D0C]">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                        Disponível: {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                    </div>

                    <div className="flex items-center rounded-full border border-[#E8E0D4] bg-white p-1">
                      <button
                        onClick={() => changeQuantity(item, selectedQuantity - 1)}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="min-w-8 text-center text-sm font-black">
                        {selectedQuantity}
                      </span>

                      <button
                        onClick={() => changeQuantity(item, selectedQuantity + 1)}
                        disabled={loading}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#11100F] text-sm font-black text-white disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-[1fr_1fr] gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-xl border border-[#E8E0D4] bg-white text-sm font-black text-[#0E0D0C] transition hover:bg-[#FCFBF9] disabled:opacity-50"
          >
            Fechar
          </button>

          <button
            onClick={transferSelected}
            disabled={loading || !targetTableId || selectedItems.length === 0}
            className="h-12 rounded-xl bg-[#C99B4F] text-sm font-black text-white shadow-[0_14px_28px_rgba(201,155,79,0.24)] transition hover:bg-[#B98A3E] disabled:bg-[#E7DED2] disabled:text-[#9A9187] disabled:shadow-none"
          >
            {loading ? "A transferir..." : "Transferir selecionados"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryBox({
  label,
  value,
  highlight = false,
  warning = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E8E0D4] bg-[#FCFBF9] px-2 py-2">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-[#9A9187]">
        {label}
      </p>
      <p
        className={
          highlight
            ? "mt-1 truncate text-sm font-black text-[#2F9E55]"
            : warning
              ? "mt-1 truncate text-sm font-black text-[#B58A45]"
              : "mt-1 truncate text-sm font-black text-[#0E0D0C]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function OpenTableModal({
  table,
  guestCount,
  loading,
  onClose,
  onChangeGuestCount,
  onConfirm,
}: {
  table: TableItem;
  guestCount: number;
  loading: boolean;
  onClose: () => void;
  onChangeGuestCount: (value: number) => void;
  onConfirm: () => void;
}) {
  const decrease = () => onChangeGuestCount(Math.max(1, guestCount - 1));
  const increase = () => onChangeGuestCount(Math.min(99, guestCount + 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[420px] rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">
              Abrir mesa
            </p>
            <h3 className="mt-3 text-[34px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              Mesa {table.number}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              Indica o número de pessoas sentadas para calcular ticket médio por pessoa.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68] transition hover:bg-[#F7F1E8] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-8 rounded-[26px] border border-[#E8E0D4] bg-[#FCFBF9] p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8B7C68]">
            Pessoas
          </p>

          <div className="mt-4 flex items-center justify-between gap-5">
            <button
              onClick={decrease}
              disabled={loading || guestCount <= 1}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8E0D4] bg-white text-2xl font-black text-[#0E0D0C] transition hover:bg-[#F7F1E8] disabled:opacity-40"
            >
              −
            </button>

            <div className="text-center">
              <p className="text-[52px] font-black leading-none tracking-[-0.08em] text-[#0E0D0C]">
                {guestCount}
              </p>
              <p className="mt-1 text-xs font-bold text-[#8B7C68]">pax</p>
            </div>

            <button
              onClick={increase}
              disabled={loading}
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#11100F] text-2xl font-black text-white transition hover:bg-[#2A2723] disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#C99B4F] text-sm font-black text-white shadow-[0_16px_34px_rgba(201,155,79,0.28)] transition hover:bg-[#B98A3E] disabled:opacity-50"
        >
          {loading ? "A abrir..." : "Abrir mesa"}
        </button>
      </div>
    </div>
  );
}

type SplitPaymentItem = {
  itemKey: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  itemDiscountAmount?: number;
  globalDiscountAmount?: number;
  totalPrice?: number;
};

function SplitItemsModal({
  session,
  onClose,
  onReceive,
}: {
  session: POSTableSession | null;
  onClose: () => void;
  onReceive: (data: { amount: number; items: SplitPaymentItem[] }) => void;
}) {
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});

  const items = session?.orders.flatMap((order) => order.items) ?? [];
  const lines = aggregateSessionItems(items);
  const sessionItemNetTotal = lines.reduce(
  (sum, item) => sum + item.totalPrice,
  0,
);

const globalDiscountAmount =
  Number(session?.discountAmount ?? 0) -
  lines.reduce((sum, item) => sum + item.discountAmount, 0);

  const selectedItems = lines
    .map((item) => ({
      itemKey: item.key,
      productName: item.productName,
      unitPrice: item.unitPrice,
      quantity: selectedQuantities[item.key] ?? 0,
    }))
    .filter((item) => item.quantity > 0);

  const selectedTotal = lines.reduce((sum, item) => {
  const quantity = selectedQuantities[item.key] ?? 0;

  const itemDiscountPerUnit =
    item.quantity > 0 ? item.discountAmount / item.quantity : 0;

  const itemNetUnitPrice = Math.max(0, item.unitPrice - itemDiscountPerUnit);

  const selectedItemNet = quantity * itemNetUnitPrice;

  const globalDiscountShare =
    sessionItemNetTotal > 0
      ? globalDiscountAmount * (selectedItemNet / sessionItemNetTotal)
      : 0;

  return sum + Math.max(0, selectedItemNet - globalDiscountShare);
}, 0);

  function changeQuantity(item: AccountLine, nextQuantity: number) {
    const safeQuantity = Math.max(0, Math.min(item.quantity, nextQuantity));

    setSelectedQuantities((current) => ({
      ...current,
      [item.key]: safeQuantity,
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">
              Separar conta
            </p>
            <h3 className="mt-3 text-[32px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              Escolher itens
            </h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              Seleciona os produtos que este cliente vai pagar.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {lines.map((item) => {
            const selectedQuantity = selectedQuantities[item.key] ?? 0;

            return (
              <div
                key={item.key}
                className={
                  selectedQuantity > 0
                    ? "flex items-center justify-between rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] p-4"
                    : "flex items-center justify-between rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4"
                }
              >
                <div>
                  <p className="text-sm font-black text-[#0E0D0C]">
                    {item.productName}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#8B7C68]">
                    Disponível: {item.quantity} × {formatMoney(item.unitPrice)}
                  </p>
                </div>

                <div className="flex items-center rounded-full border border-[#E8E0D4] bg-white p-1">
                  <button
                    onClick={() => changeQuantity(item, selectedQuantity - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black"
                  >
                    −
                  </button>

                  <span className="min-w-8 text-center text-sm font-black">
                    {selectedQuantity}
                  </span>

                  <button
                    onClick={() => changeQuantity(item, selectedQuantity + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#11100F] text-sm font-black text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#B58A45]">
                Selecionado
              </p>
              <p className="mt-1 text-[30px] font-black tracking-[-0.06em] text-[#0E0D0C]">
                {formatMoney(selectedTotal)}
              </p>
            </div>

            <button
  onClick={() => {
    const itemsToReceive = lines
      .filter((item) => (selectedQuantities[item.key] ?? 0) > 0)
      .map((item) => {
        const quantity = selectedQuantities[item.key] ?? 0;

        const itemDiscountPerUnit =
          item.quantity > 0 ? item.discountAmount / item.quantity : 0;

        const itemNetUnitPrice = Math.max(
          0,
          item.unitPrice - itemDiscountPerUnit,
        );

        const selectedItemNet = quantity * itemNetUnitPrice;

        const globalDiscountShare =
          sessionItemNetTotal > 0
            ? globalDiscountAmount * (selectedItemNet / sessionItemNetTotal)
            : 0;

        const finalLineTotal = Math.max(
          0,
          selectedItemNet - globalDiscountShare,
        );

        return {
          itemKey: item.key,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity,
          itemDiscountAmount: itemDiscountPerUnit * quantity,
          globalDiscountAmount: globalDiscountShare,
          totalPrice: finalLineTotal,
        };
      });

    onReceive({
      amount: selectedTotal,
      items: itemsToReceive,
    });
  }}
  disabled={selectedTotal <= 0}
  className="h-12 rounded-2xl bg-[#11100F] px-5 text-xs font-black text-white disabled:bg-[#E7DED2] disabled:text-[#9A9187]"
>
  Receber selecionados
</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartLineEditorModal({
  item,
  onClose,
  onConfirm,
}: {
  item: CartItem | null;
  onClose: () => void;
  onConfirm: (data: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    discountAmount: number;
    notes: string;
  }) => void;
}) {
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState(String(item?.unitPrice ?? 0));
  const [discountPercentage, setDiscountPercentage] = useState(
    item?.discountPercentage ? String(item.discountPercentage) : "",
  );
  const [discountAmount, setDiscountAmount] = useState(
    item?.discountAmount ? String(item.discountAmount) : "",
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [creditNoteDocument, setCreditNoteDocument] =
  useState<FiscalDocument | null>(null);

const [creditNoteReason, setCreditNoteReason] =
  useState("Anulação de documento");

const [creatingCreditNote, setCreatingCreditNote] =
  useState(false);

  useEffect(() => {
    if (!item) return;

    setQuantity(String(item.quantity));
    setUnitPrice(String(item.unitPrice));
    setDiscountPercentage(
      item.discountPercentage ? String(item.discountPercentage) : "",
    );
    setDiscountAmount(item.discountAmount ? String(item.discountAmount) : "");
    setNotes(item.notes ?? "");
  }, [item]);

  if (!item) return null;

  const safeQuantity = Math.max(0, Number(quantity.replace(",", ".") || 0));
  const safeUnitPrice = Math.max(0, Number(unitPrice.replace(",", ".") || 0));
  const safePercentage = Math.max(
    0,
    Number(discountPercentage.replace(",", ".") || 0),
  );
  const safeAmount = Math.max(0, Number(discountAmount.replace(",", ".") || 0));
  const grossTotal = safeQuantity * safeUnitPrice;
  const percentageDiscount = safePercentage > 0 ? (grossTotal * safePercentage) / 100 : 0;
  const finalDiscount = Math.min(grossTotal, percentageDiscount + safeAmount);
  const finalTotal = Math.max(0, grossTotal - finalDiscount);

  return (
    <CompactLineEditorShell
      title={item.name}
      eyebrow="Editar novo produto"
      description="Antes de lançar para cozinha/impressora."
      quantity={quantity}
      unitPrice={unitPrice}
      discountPercentage={discountPercentage}
      discountAmount={discountAmount}
      notes={notes}
      grossTotal={grossTotal}
      finalDiscount={finalDiscount}
      finalTotal={finalTotal}
      loading={false}
      onClose={onClose}
      onChangeQuantity={setQuantity}
      onChangeUnitPrice={setUnitPrice}
      onChangeDiscountPercentage={(next) => {
        setDiscountPercentage(next);
        if (next.trim() !== "") setDiscountAmount("");
      }}
      onChangeDiscountAmount={(next) => {
        setDiscountAmount(next);
        if (next.trim() !== "") setDiscountPercentage("");
      }}
      onChangeNotes={setNotes}
      onConfirm={() =>
        onConfirm({
          productId: item.productId,
          quantity: safeQuantity,
          unitPrice: safeUnitPrice,
          discountPercentage: safePercentage,
          discountAmount: safeAmount,
          notes,
        })
      }
      onRemove={() =>
        onConfirm({
          productId: item.productId,
          quantity: 0,
          unitPrice: safeUnitPrice,
          discountPercentage: 0,
          discountAmount: 0,
          notes,
        })
      }
    />
  );
}

function LineEditorModal({
  line,
  loading,
  onClose,
  onConfirm,
}: {
  line: AccountLine;
  loading: boolean;
  onClose: () => void;
  onConfirm: (data: {
    itemId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage: number;
    discountAmount: number;
    notes: string;
  }) => void;
}) {
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [unitPrice, setUnitPrice] = useState(String(line.unitPrice));
  const [discountPercentage, setDiscountPercentage] = useState(
    line.discountType === "PERCENTAGE" &&
      line.discountValue !== null &&
      line.discountValue !== undefined
      ? String(line.discountValue)
      : "",
  );
  const [discountAmount, setDiscountAmount] = useState(
    line.discountType === "AMOUNT" &&
      line.discountValue !== null &&
      line.discountValue !== undefined
      ? String(line.discountValue)
      : "",
  );
  const [notes, setNotes] = useState(line.notes ?? "");

  useEffect(() => {
    setQuantity(String(line.quantity));
    setUnitPrice(String(line.unitPrice));
    setDiscountPercentage(
      line.discountType === "PERCENTAGE" &&
        line.discountValue !== null &&
        line.discountValue !== undefined
        ? String(line.discountValue)
        : "",
    );
    setDiscountAmount(
      line.discountType === "AMOUNT" &&
        line.discountValue !== null &&
        line.discountValue !== undefined
        ? String(line.discountValue)
        : "",
    );
    setNotes(line.notes ?? "");
  }, [line]);

  const safeQuantity = Math.max(0, Number(quantity.replace(",", ".") || 0));
  const safeUnitPrice = Math.max(0, Number(unitPrice.replace(",", ".") || 0));
  const safePercentage = Math.max(
    0,
    Number(discountPercentage.replace(",", ".") || 0),
  );
  const safeAmount = Math.max(0, Number(discountAmount.replace(",", ".") || 0));
  const grossTotal = safeQuantity * safeUnitPrice;
  const percentageDiscount = safePercentage > 0 ? (grossTotal * safePercentage) / 100 : 0;
  const finalDiscount = Math.min(grossTotal, percentageDiscount + safeAmount);
  const finalTotal = Math.max(0, grossTotal - finalDiscount);

  return (
    <CompactLineEditorShell
      title={line.productName}
      eyebrow="Editar linha"
      description="Quantidade, preço, desconto e nota."
      quantity={quantity}
      unitPrice={unitPrice}
      discountPercentage={discountPercentage}
      discountAmount={discountAmount}
      notes={notes}
      grossTotal={grossTotal}
      finalDiscount={finalDiscount}
      finalTotal={finalTotal}
      loading={loading}
      onClose={onClose}
      onChangeQuantity={setQuantity}
      onChangeUnitPrice={setUnitPrice}
      onChangeDiscountPercentage={(next) => {
        setDiscountPercentage(next);
        if (next.trim() !== "") setDiscountAmount("");
      }}
      onChangeDiscountAmount={(next) => {
        setDiscountAmount(next);
        if (next.trim() !== "") setDiscountPercentage("");
      }}
      onChangeNotes={setNotes}
      onConfirm={() =>
        onConfirm({
          itemId: line.itemId,
          quantity: safeQuantity,
          unitPrice: safeUnitPrice,
          discountPercentage: safePercentage,
          discountAmount: safeAmount,
          notes,
        })
      }
      onRemove={() =>
        onConfirm({
          itemId: line.itemId,
          quantity: 0,
          unitPrice: safeUnitPrice,
          discountPercentage: 0,
          discountAmount: 0,
          notes,
        })
      }
    />
  );
}

function CompactLineEditorShell({
  title,
  eyebrow,
  description,
  quantity,
  unitPrice,
  discountPercentage,
  discountAmount,
  notes,
  grossTotal,
  finalDiscount,
  finalTotal,
  loading,
  onClose,
  onChangeQuantity,
  onChangeUnitPrice,
  onChangeDiscountPercentage,
  onChangeDiscountAmount,
  onChangeNotes,
  onConfirm,
  onRemove,
}: {
  title: string;
  eyebrow: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountPercentage: string;
  discountAmount: string;
  notes: string;
  grossTotal: number;
  finalDiscount: number;
  finalTotal: number;
  loading: boolean;
  onClose: () => void;
  onChangeQuantity: (value: string) => void;
  onChangeUnitPrice: (value: string) => void;
  onChangeDiscountPercentage: (value: string) => void;
  onChangeDiscountAmount: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onConfirm: () => void;
  onRemove: () => void;
}) {
  const safeQuantity = Math.max(0, Number(quantity.replace(",", ".") || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-[24px] border border-[#E8E0D4] bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#B58A45]">
              {eyebrow}
            </p>
            <h3 className="mt-1 max-w-[360px] truncate text-[26px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              {title}
            </h3>
            <p className="mt-1 text-xs font-medium text-[#7D746A]">
              {description}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D4] text-base font-black text-[#8B7C68] transition hover:bg-[#F7F1E8] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-3">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
              Quantidade
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={quantity}
                onChange={(event) => onChangeQuantity(event.target.value)}
                inputMode="numeric"
                className="h-10 min-w-0 flex-1 border-b border-[#E8E0D4] bg-transparent text-xl font-black outline-none focus:border-[#C99B4F]"
              />
              <button
                onClick={() => onChangeQuantity(String(Math.max(0, safeQuantity - 1)))}
                disabled={loading}
                className="h-9 w-10 rounded-xl bg-[#2D9CEF] text-lg font-black text-white disabled:opacity-50"
              >
                -
              </button>
              <button
                onClick={() => onChangeQuantity(String(safeQuantity + 1))}
                disabled={loading}
                className="h-9 w-10 rounded-xl bg-[#2D9CEF] text-lg font-black text-white disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          <EditInput label="Preço" value={unitPrice} suffix="€" onChange={onChangeUnitPrice} compact />
          <EditInput label="Desconto (%)" value={discountPercentage} suffix="%" onChange={onChangeDiscountPercentage} compact />
          <EditInput label="Desconto (€)" value={discountAmount} suffix="€" onChange={onChangeDiscountAmount} compact />
        </div>

        <div className="mt-3 rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-3">
          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
            Texto opcional
          </label>
          <input
            value={notes}
            onChange={(event) => onChangeNotes(event.target.value)}
            placeholder="Sem salada, sem cebola..."
            className="mt-2 h-9 w-full border-b border-[#E8E0D4] bg-transparent text-sm font-bold outline-none focus:border-[#C99B4F]"
          />
        </div>

        <div className="mt-3 rounded-2xl border border-[#E8E0D4] bg-white p-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#7D746A]">
            <span>Subtotal</span>
            <span>{formatMoney(grossTotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs font-bold text-[#2F9E55]">
            <span>Desconto</span>
            <span>-{formatMoney(finalDiscount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[#E8E0D4] pt-2 text-base font-black text-[#0E0D0C]">
            <span>Total</span>
            <span>{formatMoney(finalTotal)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_1fr] gap-2">
          <button
            onClick={onRemove}
            disabled={loading}
            className="h-11 rounded-2xl border border-[#F0CFC2] bg-[#FFF7F3] text-xs font-black uppercase tracking-[0.12em] text-[#B4583C] disabled:opacity-50"
          >
            Remover
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-2xl bg-[#C99B4F] text-sm font-black text-white shadow-[0_12px_24px_rgba(201,155,79,0.22)] transition hover:bg-[#B98A3E] disabled:bg-[#E7DED2] disabled:text-[#9A9187] disabled:shadow-none"
          >
            {loading ? "A gravar..." : "✓ Gravar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditInput({
  label,
  value,
  suffix,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  suffix: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E0D4] bg-[#FCFBF9] p-3">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8B7C68]">
        {label}
      </label>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          className={
            compact
              ? "h-10 min-w-0 flex-1 border-b border-[#E8E0D4] bg-transparent text-xl font-black outline-none focus:border-[#C99B4F]"
              : "h-11 min-w-0 flex-1 border-b border-[#E8E0D4] bg-transparent text-2xl font-black outline-none focus:border-[#C99B4F]"
          }
        />
        <span className="text-sm font-black text-[#8B7C68]">{suffix}</span>
      </div>
    </div>
  );
}

function PartialPaymentModal({
  amount,
  method,
  loading,
  onChangeMethod,
  onClose,
  onConfirm,
}: {
  amount: number;
  method: PaymentMethod;
  loading: boolean;
  onChangeMethod: (method: PaymentMethod) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const methods: { value: PaymentMethod; label: string; description: string }[] =
    [
      { value: "CARD", label: "Multibanco", description: "Cartão ou terminal" },
      { value: "CASH", label: "Dinheiro", description: "Pagamento em numerário" },
      { value: "BANK_TRANSFER", label: "Transferência", description: "Transferência bancária" },
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[460px] rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">
              Pagamento parcial
            </p>
            <h3 className="mt-3 text-[34px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              {formatMoney(amount)}
            </h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">
              Receber apenas os itens selecionados.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-2">
          {methods.map((item) => {
            const active = method === item.value;

            return (
              <button
                key={item.value}
                onClick={() => onChangeMethod(item.value)}
                disabled={loading}
                className={
                  active
                    ? "flex w-full items-center justify-between rounded-2xl border border-[#C99B4F] bg-[#FFF8EC] px-4 py-3 text-left"
                    : "flex w-full items-center justify-between rounded-2xl border border-[#E8E0D4] bg-white px-4 py-3 text-left"
                }
              >
                <div>
                  <p className="text-sm font-black text-[#0E0D0C]">{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-[#8B7C68]">{item.description}</p>
                </div>

                <span className={active ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#11100F] text-[11px] font-black text-white" : "h-6 w-6 rounded-full border border-[#D8D0C5]"}>
                  {active ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-[#11100F] text-sm font-black text-white disabled:bg-[#E7DED2] disabled:text-[#9A9187]"
        >
          {loading ? "A receber..." : "Confirmar pagamento"}
        </button>
      </div>
    </div>
  );
}

function CreditNoteModal({
  document,
  reason,
  loading,
  onChangeReason,
  onClose,
  onConfirm,
}: {
  document: FiscalDocument;
  reason: string;
  loading: boolean;
  onChangeReason: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#B58A45]">
          Nota de crédito
        </p>

        <h3 className="mt-3 text-3xl font-black text-[#0E0D0C]">
          Anular documento
        </h3>

        <p className="mt-2 text-sm text-[#7D746A]">
          Documento: {document.documentNumber ?? "Sem número"} ·{" "}
          {formatMoney(document.totalAmount)}
        </p>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-[#7D746A]">
            Motivo
          </label>

          <textarea
            value={reason}
            onChange={(event) => onChangeReason(event.target.value)}
            className="min-h-28 w-full rounded-2xl border border-[#E8E0D4] p-4 text-sm outline-none focus:border-[#B58A45]"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-xl border border-[#E8E0D4] font-black"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-12 rounded-xl bg-[#B4583C] font-black text-white disabled:opacity-50"
          >
            {loading ? "A emitir..." : "Emitir NC"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceModal({
  vat,
  name,
  address,
  email,
  customerType,
  loading,
  onChangeVat,
  onChangeName,
  onChangeAddress,
  onChangeEmail,
  onChangeCustomerType,
  onFetchVatData,
  onClose,
  onConfirm,
}: {
  vat: string;
  name: string;
  address: string;
  email: string;
  customerType: "FINAL_CONSUMER" | "VAT";
  loading: boolean;
  onChangeVat: (value: string) => void;
  onChangeName: (value: string) => void;
  onChangeAddress: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangeCustomerType: (
    value: "FINAL_CONSUMER" | "VAT",
  ) => void;
  onFetchVatData: () => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
        <h3 className="text-3xl font-black">
          Emitir documento
        </h3>

        <p className="mt-2 text-sm text-[#6B6B6B]">
          Escolhe o tipo de cliente e os dados fiscais.
        </p>

        <div className="mt-6 grid gap-2">
          <button
            onClick={() =>
              onChangeCustomerType("FINAL_CONSUMER")
            }
            className={
              customerType === "FINAL_CONSUMER"
                ? "rounded-xl border border-[#C99B4F] bg-[#FFF8EC] px-4 py-3 text-left font-black"
                : "rounded-xl border px-4 py-3 text-left"
            }
          >
            Consumidor Final
          </button>

          <button
            onClick={() => onChangeCustomerType("VAT")}
            className={
              customerType === "VAT"
                ? "rounded-xl border border-[#C99B4F] bg-[#FFF8EC] px-4 py-3 text-left font-black"
                : "rounded-xl border px-4 py-3 text-left"
            }
          >
            Cliente com NIF
          </button>
        </div>

        {customerType === "VAT" && (
          <div className="mt-6 space-y-4">
            <div className="flex gap-2">
              <input
                placeholder="NIF"
                value={vat}
                onChange={(e) =>
                  onChangeVat(e.target.value)
                }
                className="h-12 flex-1 rounded-xl border px-4"
              />

              <button
                onClick={onFetchVatData}
                type="button"
                className="rounded-xl border px-4 font-black"
              >
                Obter dados
              </button>
            </div>

            <input
              placeholder="Nome"
              value={name}
              onChange={(e) =>
                onChangeName(e.target.value)
              }
              className="h-12 w-full rounded-xl border px-4"
            />

            <input
              placeholder="Morada Fiscal"
              value={address}
              onChange={(e) =>
                onChangeAddress(e.target.value)
              }
              className="h-12 w-full rounded-xl border px-4"
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) =>
                onChangeEmail(e.target.value)
              }
              className="h-12 w-full rounded-xl border px-4"
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onClose}
            className="h-12 rounded-xl border"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-12 rounded-xl bg-[#11100F] font-black text-white"
          >
            {loading
              ? "A emitir..."
              : customerType === "FINAL_CONSUMER"
                ? "Emitir Fatura Simplificada"
                : "Emitir Fatura"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  tableNumber,
  total,
  guestCount,
  splitCount,
  method,
  loading,
  onChangeSplitCount,
  onChangeMethod,
  onClose,
  onConfirm,
  fiscalReady,
  onCreateInvoice,
}: {
  tableNumber: number;
  total: number;
  guestCount: number;
  splitCount: number;
  method: PaymentMethod;
  loading: boolean;
  fiscalReady: boolean;
  onChangeSplitCount: (value: number) => void;
  onChangeMethod: (method: PaymentMethod) => void;
  onClose: () => void;
  onConfirm: () => void;
  onCreateInvoice: () => void;
}) {
  const safeSplit = Math.max(1, splitCount);
  const splitAmount = total / safeSplit;
  const ticketPerPerson = total / Math.max(guestCount, 1);

  const methods: { value: PaymentMethod; label: string; description: string }[] =
    [
      { value: "CARD", label: "Multibanco", description: "Cartão ou terminal" },
      { value: "CASH", label: "Dinheiro", description: "Pagamento em numerário" },
      { value: "BANK_TRANSFER", label: "Transferência", description: "Transferência bancária" },
    ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[460px] rounded-[32px] border border-[#E8E0D4] bg-white p-7 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.38em] text-[#B58A45]">Cobrar</p>
            <h3 className="mt-3 text-[34px] font-black tracking-[-0.06em] text-[#0E0D0C]">Mesa {tableNumber}</h3>
            <p className="mt-2 text-sm font-medium text-[#7D746A]">Escolhe o método de pagamento para fechar a mesa.</p>
          </div>

          <button onClick={onClose} disabled={loading} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E0D4] text-lg font-black text-[#8B7C68] transition hover:bg-[#F7F1E8] disabled:opacity-50">×</button>
        </div>

        <div className="mt-7 rounded-[26px] border border-[#E8E0D4] bg-[#FCFBF9] p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8B7C68]">Total</p>
              <p className="mt-2 text-[46px] font-black leading-none tracking-[-0.08em] text-[#0E0D0C]">{formatMoney(total)}</p>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-[#8B7C68]">{guestCount} pax</p>
              <p className="mt-1 text-sm font-black text-[#0E0D0C]">{formatMoney(ticketPerPerson)} / pessoa</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#E8E0D4] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8B7C68]">Dividir conta</p>
                <p className="mt-1 text-sm font-black text-[#0E0D0C]">{formatMoney(splitAmount)} por pagamento</p>
              </div>

              <div className="flex items-center rounded-full border border-[#E8E0D4] bg-[#FCFBF9] p-1">
                <button
                  onClick={() => onChangeSplitCount(Math.max(1, safeSplit - 1))}
                  disabled={loading}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-black text-[#0E0D0C] hover:bg-white disabled:opacity-40"
                >
                  −
                </button>

                <span className="min-w-10 text-center text-sm font-black text-[#0E0D0C]">{safeSplit}</span>

                <button
                  onClick={() => onChangeSplitCount(safeSplit + 1)}
                  disabled={loading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#11100F] text-lg font-black text-white disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {methods.map((item) => {
            const active = method === item.value;

            return (
              <button
                key={item.value}
                onClick={() => onChangeMethod(item.value)}
                disabled={loading}
                className={
                  active
                    ? "flex w-full items-center justify-between rounded-2xl border border-[#C99B4F] bg-[#FFF8EC] px-4 py-3 text-left shadow-[0_12px_28px_rgba(201,155,79,0.12)]"
                    : "flex w-full items-center justify-between rounded-2xl border border-[#E8E0D4] bg-white px-4 py-3 text-left transition hover:bg-[#FCFBF9]"
                }
              >
                <div>
                  <p className="text-sm font-black text-[#0E0D0C]">{item.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-[#8B7C68]">{item.description}</p>
                </div>

                <span className={active ? "flex h-6 w-6 items-center justify-center rounded-full bg-[#11100F] text-[11px] font-black text-white" : "h-6 w-6 rounded-full border border-[#D8D0C5]"}>
                  {active ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-2">
  {fiscalReady && (
    <button
      onClick={onCreateInvoice}
      disabled={loading}
      className="flex h-14 w-full items-center justify-center rounded-2xl border border-[#D8AE62] bg-[#FFF8EC] text-sm font-black text-[#8B5E22] transition hover:bg-[#FBF4E8] disabled:opacity-50"
    >
      Cobrar e emitir fatura
    </button>
  )}

  <button
    onClick={onConfirm}
    disabled={loading}
    className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#C99B4F] text-sm font-black text-white shadow-[0_16px_34px_rgba(201,155,79,0.28)] transition hover:bg-[#B98A3E] disabled:opacity-50"
  >
    {loading ? "A fechar..." : fiscalReady ? "Cobrar sem fatura" : "Fechar mesa"}
  </button>
</div>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  value,
  active = false,
  dot = false,
}: {
  label: string;
  value: number;
  active?: boolean;
  dot?: boolean;
}) {
  return (
    <button
      className={
        active
          ? "flex items-center gap-2 rounded-2xl bg-[#C99B4F] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(201,155,79,0.22)]"
          : "flex items-center gap-2 rounded-2xl border border-[#E8E0D4] bg-white px-5 py-3 text-sm font-black text-[#0E0D0C]"
      }
    >
      {dot && <span className="h-2 w-2 rounded-full bg-[#31A24C]" />}
      <span>{label}</span>
      <span
        className={
          active
            ? "rounded-full bg-white/20 px-2 py-0.5 text-xs"
            : "rounded-full bg-[#F0ECE5] px-2 py-0.5 text-xs text-[#7D746A]"
        }
      >
        {value}
      </span>
    </button>
  );
}

function DiscountModal({
  loading,
  target,
  onClose,
    onConfirm,
}: {
  loading: boolean;
  target: DiscountTarget;
  onClose: () => void;
  onConfirm: (data: {
    type: "AMOUNT" | "PERCENTAGE";
    value: number;
    reason: string;
  }) => void;
}) {
  const currentType =
    target.scope === "SESSION" ? target.discountType : target.item.discountType;

  const currentValue =
    target.scope === "SESSION" ? target.discountValue : target.item.discountValue;

  const [type, setType] = useState<"AMOUNT" | "PERCENTAGE">(
    currentType ?? "PERCENTAGE",
  );
  const [value, setValue] = useState(
    currentValue !== null && currentValue !== undefined ? String(currentValue) : "",
  );
  const [reason, setReason] = useState("");

  useEffect(() => {
    setType(currentType ?? "PERCENTAGE");
    setValue(
      currentValue !== null && currentValue !== undefined
        ? String(currentValue)
        : "",
    );
  }, [currentType, currentValue]);

  const numericValue = Number(value.replace(",", ".") || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#11100F]/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[390px] rounded-[24px] border border-[#E8E0D4] bg-white p-5 shadow-[0_30px_90px_rgba(0,0,0,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#B58A45]">
              Desconto
            </p>
            <h3 className="mt-2 text-[26px] font-black tracking-[-0.06em] text-[#0E0D0C]">
              Desconto da mesa
            </h3>
          </div>

          <button onClick={onClose} className="h-9 w-9 rounded-full border border-[#E8E0D4]">
            ×
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => setType("PERCENTAGE")}
            className={type === "PERCENTAGE" ? "h-10 rounded-xl bg-[#11100F] text-xs font-black text-white" : "h-10 rounded-xl border border-[#E8E0D4] text-xs font-black"}
          >
            %
          </button>

          <button
            onClick={() => setType("AMOUNT")}
            className={type === "AMOUNT" ? "h-10 rounded-xl bg-[#11100F] text-xs font-black text-white" : "h-10 rounded-xl border border-[#E8E0D4] text-xs font-black"}
          >
            €
          </button>
        </div>

        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          className="mt-4 h-14 w-full rounded-2xl border border-[#E8E0D4] px-4 text-2xl font-black outline-none focus:border-[#C99B4F]"
        />

        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Motivo"
          className="mt-3 h-11 w-full rounded-2xl border border-[#E8E0D4] px-4 text-sm font-bold outline-none"
        />

        <button
          onClick={() => onConfirm({ type, value: numericValue, reason })}
          disabled={loading || value.trim() === ""}
          className="mt-5 h-12 w-full rounded-2xl bg-[#C99B4F] text-sm font-black text-white disabled:bg-[#E7DED2] disabled:text-[#9A9187]"
        >
          {numericValue <= 0 ? "Remover desconto" : "Guardar desconto"}
        </button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="m21 21-4.2-4.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserTinyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 21c0-4-3.2-7-8-7s-8 3-8 7M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 2 11 13"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="m22 2-7 20-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M3 10h18M7 15h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20c.7-3.8 3.3-6 7-6s6.3 2.2 7 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
