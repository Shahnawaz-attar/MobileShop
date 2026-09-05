"use client";

import { useState, useTransition } from "react";
import { sendStockBroadcastAction } from "@/server/modules/notify/actions";

export function NotifyBroadcastForm({ remainingToday }: { remainingToday: number }) {
  const [title, setTitle] = useState("New phones in stock");
  const [body, setBody] = useState("Fresh listings just went live. Open the shop to see them.");
  const [note, setNote] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setNote(null);
          const result = await sendStockBroadcastAction({ title, body });
          if (result.success) {
            setNote(`Sent to ${result.data.sentCount} of ${result.data.subscriberCount} phones.`);
          } else {
            setNote(result.error);
          }
        });
      }}
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="push-title">
          Title
        </label>
        <input
          id="push-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="push-body">
          Message
        </label>
        <textarea
          id="push-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={140}
          rows={3}
          className="block w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending || remainingToday <= 0}
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send stock alert"}
      </button>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </form>
  );
}
