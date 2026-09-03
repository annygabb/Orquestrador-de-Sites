import { sendLifecycleEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  const admin = createAdminClient();
  const now = new Date();
  const reminderDate = new Date(now); reminderDate.setUTCDate(reminderDate.getUTCDate() + 3);
  const reminder = reminderDate.toISOString().slice(0, 10);
  const { data: dueSoon = [] } = await admin.from("subscriptions").select("user_id,next_due_date").eq("status", "active").eq("cancel_at_period_end", false).eq("next_due_date", reminder);
  const { data: expired = [] } = await admin.from("subscriptions").select("user_id,paid_until").in("status", ["active", "pending", "overdue"]).lt("paid_until", now.toISOString());
  let sent = 0;
  for (const item of dueSoon || []) {
    const { data } = await admin.auth.admin.getUserById(item.user_id);
    if (data.user?.email) { await sendLifecycleEmail({ userId: item.user_id, email: data.user.email, name: data.user.user_metadata?.full_name, kind: "renewal_reminder", dedupeKey: `reminder:${item.user_id}:${item.next_due_date}` }).catch(() => undefined); sent += 1; }
  }
  for (const item of expired || []) {
    await admin.from("subscriptions").update({ status: "overdue" }).eq("user_id", item.user_id);
    const { data } = await admin.auth.admin.getUserById(item.user_id);
    if (data.user?.email) { await sendLifecycleEmail({ userId: item.user_id, email: data.user.email, name: data.user.user_metadata?.full_name, kind: "access_suspended", dedupeKey: `expired:${item.user_id}:${String(item.paid_until).slice(0, 10)}` }).catch(() => undefined); sent += 1; }
  }
  return NextResponse.json({ checked: (dueSoon?.length || 0) + (expired?.length || 0), sent });
}
