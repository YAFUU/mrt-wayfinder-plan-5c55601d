import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { PageHeader } from "@/components/common";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { storage } from "@/services/storageService";
import { useSupportRequests } from "@/hooks/useStore";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({ component: Help });

function Help() {
  const { t } = useTranslation();
  const reqs = useSupportRequests();
  const [issue, setIssue] = useState("");
  const [msg, setMsg] = useState("");

  const submit = () => {
    if (!issue.trim() || !msg.trim()) {
      toast.error(t("help.completeFields"));
      return;
    }
    const ref = "QP-HELP-" + Math.floor(10000 + Math.random() * 90000);
    storage.addSupport({
      id: "SUP-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      userId: storage.getProfile().id,
      issueType: issue,
      message: msg,
      referenceCode: ref,
      createdAt: new Date().toISOString(),
    });
    setIssue("");
    setMsg("");
    toast.success(`${t("help.submitted")}: ${ref}`);
  };

  const faqs = ["q1", "q2", "q3", "q4"] as const;

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-4">
      <PageHeader title={t("help.title")} />

      <Card className="p-4">
        <h3 className="font-semibold mb-2">{t("help.faq")}</h3>
        <Accordion type="single" collapsible>
          {faqs.map((q) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger>{t(`help.faqs.${q}`)}</AccordionTrigger>
              <AccordionContent>{t(`help.faqs.${q.replace("q", "a")}`)}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">{t("help.contact")}</h3>
        <div>
          <label className="text-xs text-muted-foreground">{t("help.issueType")}</label>
          <select
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full mt-1 border rounded-md bg-background px-2 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="qr_scan">{t("help.issueOptions.qrScan")}</option>
            <option value="expired">{t("help.issueOptions.expired")}</option>
            <option value="wrong_dest">{t("help.issueOptions.wrongDestination")}</option>
            <option value="payment">{t("help.issueOptions.payment")}</option>
            <option value="other">{t("help.issueOptions.other")}</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("help.message")}</label>
          <Textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            className="mt-1"
          />
        </div>
        <Button onClick={submit}>{t("help.submit")}</Button>
      </Card>

      {reqs.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">{t("help.myRequests")}</h3>
          <div className="space-y-1 text-sm">
            {reqs.map((r) => (
              <div key={r.id} className="flex justify-between border-b py-1">
                <span>
                  {r.referenceCode} · {r.issueType}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
