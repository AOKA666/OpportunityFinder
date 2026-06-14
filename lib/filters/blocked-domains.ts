import blockedDomains from "@/data/blocked_domains.json";

const blockedDomainSet = new Set(blockedDomains.map((domain) => domain.toLowerCase()));

export function findBlockedDomain(domain: string | null): string | null {
  if (!domain) {
    return null;
  }

  const normalized = domain.toLowerCase().replace(/^www\./, "");
  for (const blockedDomain of blockedDomainSet) {
    if (
      normalized === blockedDomain ||
      normalized.endsWith(`.${blockedDomain}`)
    ) {
      return blockedDomain;
    }
  }

  return null;
}

export function isBlockedDomain(domain: string | null): boolean {
  return findBlockedDomain(domain) !== null;
}
