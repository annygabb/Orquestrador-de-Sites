import { createActivationPayment, createAsaasCustomer } from "@/lib/asaas";
import { ACTIVATION_PRICE_CENTS } from "@/lib/billing";
import { currentUser } from "@/lib/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasTrustedOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

const schema = z.object({ name: z.string().trim().min(3).max(120), cpf: z.string().transform((value) => value.replace(/\D/g, "")).pipe(z.string().length(11)) });

export async function POST(request: Request) {
  try {
    if (!hasTrustedOrigin(request)) return NextResponse.json({ message: "Origem não autorizada." }, { status: 403 });
    const user = await currentUser();
    if (!user?.email) return NextResponse.json({ message: "Entre na sua conta antes de criar a cobrança." }, { status: 401 });
    const input = schema.parse(await request.json());
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("asaas_customer_id").eq("id", user.id).single();
    let customerId = profile?.asaas_customer_id as string | null;
    if (!customerId) {
      const customer = await createAsaasCustomer({ userId: user.id, name: input.name, email: user.email, cpfCnpj: input.cpf });
      customerId = customer.id;
      await admin.from("profiles").update({ full_name: input.name, asaas_customer_id: customerId }).eq("id", user.id);
    }
    const { data: pending } = await admin.from("payments").select("provider_payment_id,invoice_url").eq("user_id", user.id).eq("kind", "activation").in("status", ["pending", "created"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (pending?.invoice_url) return NextResponse.json({ invoiceUrl: pending.invoice_url, reused: true });
    const payment = await createActivationPayment({ userId: user.id, customerId });
    await admin.from("payments").insert({ user_id: user.id, kind: "activation", provider_payment_id: payment.id, amount_cents: ACTIVATION_PRICE_CENTS, status: payment.status?.toLowerCase() || "pending", invoice_url: payment.invoiceUrl || null });
    await admin.from("subscriptions").upsert({ user_id: user.id, status: "pending", activation_amount_cents: ACTIVATION_PRICE_CENTS }, { onConflict: "user_id" });
    return NextResponse.json({ invoiceUrl: payment.invoiceUrl });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: "Informe o nome completo e um CPF com 11 dígitos." }, { status: 400 });
    console.error("[billing-start]", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Não foi possível criar a cobrança." }, { status: 500 });
  }
}
