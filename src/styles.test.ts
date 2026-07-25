import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("desktop typography", () => {
  it("does not render interface labels below the 12px readability floor", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    const undersized = [...css.matchAll(/font-size:\s*([0-9.]+)px/g)]
      .map((match) => Number(match[1]))
      .filter((size) => size < 12);

    expect(undersized).toEqual([]);
  });

  it("keeps the mobile workbench in page flow with only local horizontal scrolling", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toMatch(/\.app-shell\s*\{[\s\S]*?height:\s*auto;[\s\S]*?overflow:\s*visible;/);
    expect(css).toMatch(/\.stage-grid,[\s\S]*?\.editor-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.timeline-track\s*\{\s*min-width:\s*720px;/);
  });
});
