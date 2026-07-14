import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, DemoDisclaimer, EmptyState } from "@/components/common";
import { storage, subscribeStore } from "@/services/storageService";
import { useProfile } from "@/hooks/useStore";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { WalletTransaction } from "@/types/mrt";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const PRESETS = [100, 200, 500, 1000];

function WalletPage() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const [txs, setTxs] = useState<WalletTransaction[]>(() => storage.listWalletTx());
  useEffect(() => subscribeStore(() => setTxs(storage.listWalletTx())), []);
  const [amount, setAmount] = useState<number>(200);
  const [busy, setBusy] = useState(false);

  const balance = profile.walletBalance ?? 0;

  const topUp = async () => {
    if (amount <= 0) {
      toast.error(t("wallet.errors.selectAmount"));
      return;
    }
    if (amount > 50000) {
      toast.error(t("wallet.errors.maximum"));
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    storage.walletTopUp(amount, "เติมเงิน (Demo)");
    setBusy(false);
    toast.success(t("wallet.topUpSuccess", { amount }));
  };

  if (!profile.isAuthenticated) {
    return (
      <div className="p-4 lg:p-8 max-w-md mx-auto">
        <PageHeader title={t("wallet.title")} />
        <EmptyState
          title={t("wallet.loginRequired")}
          description={t("wallet.loginDescription")}
          action={
            <Button asChild>
              <Link to="/auth/login">{t("auth.login.action")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("wallet.title")} subtitle={t("wallet.subtitle")} />

      <Card className="p-6 bg-gradient-to-br from-primary to-mrt-blue text-primary-foreground border-0 shadow-lg">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Wallet className="size-4" /> {t("wallet.balance")}
        </div>
        <p className="mt-2 text-4xl font-bold tracking-tight">฿{balance.toLocaleString()}</p>
        <p className="mt-1 text-xs opacity-80">
          {profile.displayName} · {profile.email}
        </p>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">{t("wallet.topUp")}</h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              variant={amount === p ? "default" : "outline"}
              onClick={() => setAmount(p)}
            >
              ฿{p}
            </Button>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("wallet.otherAmount")}</label>
          <Input
            type="number"
            min={1}
            max={50000}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <Button className="w-full h-11" onClick={topUp} disabled={busy}>
          <Plus className="size-4 mr-1.5" />{" "}
          {busy ? t("wallet.topUpBusy") : t("wallet.topUpAmount", { amount })}
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-2">{t("wallet.history")}</h3>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("wallet.noTransactions")}</p>
        ) : (
          <ul className="divide-y">
            {txs.map((transaction) => {
              const isIn = transaction.type === "topup" || transaction.type === "refund";
              return (
                <li key={transaction.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className={`size-9 rounded-full grid place-items-center ${isIn ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t(`wallet.transaction.${transaction.type}`)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleString(
                        i18n.language.startsWith("en") ? "en-US" : "th-TH",
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${isIn ? "text-success" : "text-foreground"}`}
                    >
                      {isIn ? "+" : "−"}฿{transaction.amount}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t("wallet.balanceAfter", { amount: transaction.balanceAfter })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <DemoDisclaimer>{t("wallet.demoDisclaimer")}</DemoDisclaimer>
    </div>
  );
}
