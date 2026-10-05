// Shown while fetchAi() is waiting for a free AI model (seconds = countdown
// to the next try, 0 = trying now, null = not waiting → renders nothing).
export default function AiWaitNotice({
  seconds,
  className = "mt-3",
}: {
  seconds: number | null;
  className?: string;
}) {
  if (seconds === null) return null;
  return (
    <p
      role="status"
      className={`${className} rounded-lg bg-amber-50 p-3 text-sm text-amber-900`}
    >
      Lots of students are using the AI right now, so you&rsquo;re in line.{" "}
      {seconds > 0 ? `Trying again automatically in ${seconds}s.` : "Trying again now…"}{" "}
      Keep this tab open.
    </p>
  );
}
