/**
 * Calculate age in whole years from an ISO date string, as of `today`.
 */
export function getAge(birthDate: string, today: Date = new Date()): number {
  const birth: Date = new Date(birthDate);
  let age: number = today.getFullYear() - birth.getFullYear();
  const monthDiff: number = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Replace every "{age}" placeholder in a text.
 */
export function fillAge(text: string, age: number): string {
  return text.replaceAll('{age}', String(age));
}
