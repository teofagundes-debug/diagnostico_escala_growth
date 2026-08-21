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
  const subscriber = national.slice(2);
  if (areaCode < 11 || areaCode > 99) return null;
  if (subscriber.length === 9 && !subscriber.startsWith('9')) return null;
  if (subscriber.length === 8 && !/^[2-5]/.test(subscriber)) return null;

  return `55${national}`;
}

export function isValidBrazilianWhatsApp(value: unknown): boolean {
  return normalizeBrazilianWhatsApp(value) !== null;
}
