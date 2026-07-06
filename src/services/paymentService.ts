import { storage } from "./storageService";
import type { PaymentTransaction, Ticket } from "@/types/mrt";
import { generateQrToken } from "@/lib/qr";

export interface CreatePaymentIntentInput {
  originStationId: string;
  destinationStationId: string;
  passengers: { name: string }[];
  amountPerPassenger: number;
  method: "promptpay" | "card" | "banking" | "wallet";
  groupId?: string;
}

export interface PaymentIntent {
  transactionId: string;
  amount: number;
  providerReference: string;
  method: string;
}

function id(prefix: string) {
  return prefix + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
  const total = input.amountPerPassenger * input.passengers.length;
  const profile = storage.getProfile();
  if (input.method === "wallet") {
    const bal = storage.getWalletBalance();
    if (bal < total) throw new Error(`ยอดเงินในกระเป๋าไม่พอ (คงเหลือ ฿${bal})`);
  }
  const tx: PaymentTransaction = {
    id: id("TX"),
    userId: profile.id,
    ticketIds: [],
    provider: input.method === "wallet" ? "wallet" : "mock",
    providerReference: id("REF"),
    method: input.method,
    amount: total,
    currency: "THB",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  storage.createTransaction(tx);
  await new Promise((r) => setTimeout(r, 400));
  return {
    transactionId: tx.id,
    amount: tx.amount,
    providerReference: tx.providerReference,
    method: input.method,
  };
}

export async function confirmPayment(
  transactionId: string,
  input: CreatePaymentIntentInput,
  outcome: "success" | "fail" = "success",
): Promise<{ status: "paid" | "failed"; ticketIds: string[] }> {
  await new Promise((r) => setTimeout(r, 700));
  const tx = storage.getTransaction(transactionId);
  if (!tx) throw new Error("Transaction not found");

  if (outcome === "fail") {
    storage.updateTransaction(transactionId, { status: "failed" });
    return { status: "failed", ticketIds: [] };
  }

  const profile = storage.getProfile();
  const validUntil = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
  const groupId = input.passengers.length > 1 ? id("GRP") : undefined;
  const tickets: Ticket[] = input.passengers.map((p) => {
    const tid = id("TKT");
    const t: Ticket = {
      id: tid,
      userId: profile.id,
      originStationId: input.originStationId,
      destinationStationId: input.destinationStationId,
      passengerCount: input.passengers.length,
      passengerName: p.name,
      amount: input.amountPerPassenger,
      currency: "THB",
      status: "ready_to_enter",
      qrToken: generateQrToken(tid),
      validUntil,
      groupId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.createTicket(t);
    return t;
  });
  const ticketIds = tickets.map((t) => t.id);
  storage.updateTransaction(transactionId, { status: "paid", ticketIds });
  return { status: "paid", ticketIds };
}
