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

export const Route = createFileRoute("/wallet")({ component: WalletPage });

const PRESETS = [100, 200, 500, 1000];

function WalletPage() {
  const profile = useProfile();
  const [txs, setTxs] = useState<WalletTransaction[]>(() => storage.listWalletTx());
  useEffect(() => subscribeStore(() => setTxs(storage.listWalletTx())), []);
  const [amount, setAmount] = useState<number>(200);
  const [busy, setBusy] = useState(false);

  const balance = profile.walletBalance ?? 0;

  const topUp = async () => {
    if (amount <= 0) { toast.error("กรุณาเลือกจำนวนเงิน"); return; }
    if (amount > 50000) { toast.error("เติมเงินได้สูงสุด 50,000 บาทต่อครั้ง"); return; }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    storage.walletTopUp(amount, "เติมเงิน (Demo)");
    setBusy(false);
    toast.success(`เติมเงิน ฿${amount} สำเร็จ`);
  };

  if (!profile.isAuthenticated) {
    return (
      <div className="p-4 lg:p-8 max-w-md mx-auto">
        <PageHeader title="กระเป๋าเงิน" />
        <EmptyState
          title="กรุณาเข้าสู่ระบบ"
          description="ต้องเข้าสู่ระบบก่อนจึงจะเติมเงินและใช้กระเป๋าได้"
          action={<Button asChild><Link to="/auth/login">เข้าสู่ระบบ</Link></Button>}
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <PageHeader title="กระเป๋าเงิน" subtitle="เติมเงินไว้ล่วงหน้าเพื่อจ่ายค่าโดยสารได้รวดเร็ว" />

      <Card className="p-6 bg-gradient-to-br from-primary to-mrt-blue text-primary-foreground border-0 shadow-lg">
        <div className="flex items-center gap-2 text-sm opacity-90">
          <Wallet className="size-4" /> ยอดคงเหลือ
        </div>
        <p className="mt-2 text-4xl font-bold tracking-tight">฿{balance.toLocaleString()}</p>
        <p className="mt-1 text-xs opacity-80">{profile.displayName} · {profile.email}</p>
      </Card>

      <Card className="p-5 space-y-3">
        <h3 className="font-semibold">เติมเงิน</h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <Button key={p} variant={amount === p ? "default" : "outline"} onClick={() => setAmount(p)}>
              ฿{p}
            </Button>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">จำนวนเงินอื่น (บาท)</label>
          <Input
            type="number" min={1} max={50000} value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <Button className="w-full h-11" onClick={topUp} disabled={busy}>
          <Plus className="size-4 mr-1.5" /> {busy ? "กำลังเติมเงิน…" : `เติมเงิน ฿${amount}`}
        </Button>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-2">ประวัติกระเป๋า</h3>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
        ) : (
          <ul className="divide-y">
            {txs.map((t) => {
              const isIn = t.type === "topup" || t.type === "refund";
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <div className={`size-9 rounded-full grid place-items-center ${isIn ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {isIn ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.note ?? (isIn ? "เติมเงิน" : "ชำระค่าโดยสาร")}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleString("th-TH")}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isIn ? "text-success" : "text-foreground"}`}>{isIn ? "+" : "−"}฿{t.amount}</p>
                    <p className="text-[11px] text-muted-foreground">คงเหลือ ฿{t.balanceAfter}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <DemoDisclaimer>การเติมเงินในโหมดสาธิตไม่มีการเรียกเก็บจริง</DemoDisclaimer>
    </div>
  );
}
