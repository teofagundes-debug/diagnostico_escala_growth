const NINE_DIGIT_AREA_CODES = new Set([11,12,13,14,15,16,17,18,19,22,24,27,28]);

export function normalizeBrazilianWhatsApp(value: unknown): string | null {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);

  let national = digits;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    national = digits.slice(2);
  }

  if (national.length !== 10 && national.length !== 11) return null;
  if (/^(\d)\1+$/.test(national)) return null;

  const areaCode = Number(national.slice(0, 2));
  let subscriber = national.slice(2);
  if (areaCode < 11 || areaCode > 99) return null;

  if (NINE_DIGIT_AREA_CODES.has(areaCode)) {
    if (subscriber.length === 8) subscriber = `9${subscriber}`;
    else if (subscriber.length !== 9 || !subscriber.startsWith('9')) return null;
  } else {
    if (subscriber.length === 9 && subscriber.startsWith('9')) subscriber = subscriber.slice(1);
    else if (subscriber.length !== 8) return null;
  }

  if (!/^[2-9]/.test(subscriber)) return null;

  return `55${areaCode}${subscriber}`;
}

export function isValidBrazilianWhatsApp(value: unknown): boolean {
  return normalizeBrazilianWhatsApp(value) !== null;
}
