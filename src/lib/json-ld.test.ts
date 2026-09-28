import { describe, expect, it } from "vitest";
import { personJsonLd, serializeJsonLd } from "./json-ld";

describe("personJsonLd", () => {
  const data = personJsonLd(new URL("https://example.com"));

  it("describes a schema.org Person", () => {
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Rohit Raj Saji");
    expect(data.url).toBe("https://example.com/");
  });

  it("links profiles and the current employer", () => {
    expect(data.sameAs).toContain("https://github.com/rohitrajsaji");
    expect(data.worksFor).toEqual([{ "@type": "Organization", name: "UST" }]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so the payload cannot close its script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
