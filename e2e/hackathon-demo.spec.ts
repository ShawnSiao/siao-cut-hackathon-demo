import { expect, test } from "@playwright/test";

test("completes the four-step public experience without uploading media", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "用改文稿的方式，完成一条口播视频" })).toBeVisible();
  await expect(page.getByText("0", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("个上传文件")).toBeVisible();

  await page.getByRole("button", { name: "查看 AI 建议" }).click();
  const filler = page.getByRole("heading", { name: "删除独立停顿「嗯」" }).locator("..");
  const concise = page.getByRole("heading", { name: "压缩重复限定语" }).locator("..");
  await filler.getByRole("button", { name: "生成可恢复草稿" }).click();
  await concise.getByRole("button", { name: "保留原文" }).click();

  await page.getByRole("button", { name: "检查版本" }).click();
  await expect(page.getByText("AI 建议已生成可恢复草稿")).toBeVisible();
  await page.getByRole("button", { name: "检查导出", exact: true }).click();
  await page.getByRole("button", { name: "创建模拟导出任务" }).click();

  await expect(page.getByRole("heading", { name: "体验完成" })).toBeVisible();
  await expect(page.getByText("核心流程已完成")).toBeVisible();
  await expect(page.getByText("4/4")).toBeVisible();
});

test("remains usable without horizontal overflow on desktop and mobile", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "用改文稿的方式，完成一条口播视频" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("button", { name: "了解体验边界" }).click();
    await expect(page.getByRole("dialog", { name: "在线演示与桌面能力的边界" })).toBeVisible();
    await page.getByRole("button", { name: "关闭体验说明" }).click();
  }
});
