import { NextResponse } from "next/server";
import { deleteCalendarItem, updateCalendarItem } from "@/lib/calendar/store";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const patch = await req.json();

  const updated = await updateCalendarItem(id, patch);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Calendar item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await deleteCalendarItem(id);
  return NextResponse.json({ ok: true });
}
