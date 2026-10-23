const INDIA_TIME_ZONE = 'Asia/Kolkata';
const INDIA_OFFSET_MINUTES = 330;

const indiaDateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: INDIA_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZoneName: 'short',
});

const indiaInputFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: INDIA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatIndiaDateTime(value: string | Date): string {
  return indiaDateTimeFormatter.format(new Date(value));
}

export function toIndiaDateTimeInput(value: string | null): string {
  if (!value) return '';
  const parts = Object.fromEntries(
    indiaInputFormatter.formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function fromIndiaDateTimeInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const [year, month, day, hour, minute] = [yearText, monthText, dayText, hourText, minuteText].map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const parsed = new Date(localAsUtc);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  return new Date(localAsUtc - INDIA_OFFSET_MINUTES * 60_000).toISOString();
}
