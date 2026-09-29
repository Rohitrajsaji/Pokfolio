import { profile, site } from "@content";

const TOKENS: Record<string, string> = {
  name: profile.shortName,
  town: site.townName,
  partner: site.partner.name,
  wild: site.wild.nickname ?? site.wild.name,
};

/** Replaces {name}, {town}, {partner} and {wild} in content text; unknown tokens are left as-is. */
export function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (token, key: string) => TOKENS[key] ?? token);
}

/** `fill`, plus tokens that only make sense in one place, e.g. {from} and {to} when evolving. */
export function fillWith(text: string, tokens: Readonly<Record<string, string>>): string {
  return fill(text.replace(/\{(\w+)\}/g, (token, key: string) => tokens[key] ?? token));
}
