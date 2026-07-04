"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteResumeButton({
  id,
  onDeleted,
}: {
  id: string;
  // Client pages that hold the resume list in state pass this to remove the
  // row immediately — router.refresh() alone doesn't re-run client fetches.
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      if (onDeleted) onDeleted();
      else router.refresh();
    } else {
      alert("Could not delete. Please try again.");
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      className="rounded-full px-3 py-1.5 text-xs font-bold text-red-800/60 transition hover:bg-red-100 hover:text-red-700 disabled:opacity-50"
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
