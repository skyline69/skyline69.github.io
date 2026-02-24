/**
 * Calculate age from an ISO date string.
 */
export function getAge(birthDate: string): number {
  const birth: Date = new Date(birthDate);
  const today: Date = new Date();
  let age: number = today.getFullYear() - birth.getFullYear();
  const monthDiff: number = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
