import { expect, test, type Page } from "@playwright/test";

async function bindMockMedia(page: Page) {
  await page.getByRole("button", { name: "更多命令" }).click();
  await page.getByRole("menuitem", { name: "重新定位原片" }).click();
  await expect(page.getByText("已重新定位原片；内容哈希与项目记录一致。")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("siaocut.productTour.v4", "complete"));
});
test("walks a newcomer through the real SiaoCut workflow on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByRole("button", { name: "使用引导" }).click();
  const tour = page.getByRole("dialog", { name: "用 1 分钟走完一条作品" });
  await expect(tour).toContainText("不读取或上传访问者媒体");
  await tour.getByRole("button", { name: "开始体验" }).click();

  await expect(page.getByRole("dialog", { name: "先从一个项目开始" })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "本地组件由使用者决定何时更新" })).toBeVisible();
  await page.getByRole("button", { name: "体验检查更新" }).click();
  await expect(page.getByText("检查完成；示例组件均为兼容版本，未执行下载。")).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "画面、字幕和时间保持同步" })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "像改文档一样完成粗剪" })).toBeVisible();

  for (const highlight of [
    {
      title: "重做字幕，也不会冒险覆盖",
      action: "体验安全重生成",
      complete: "校验通过；示例字幕未替换，安全流程已完整展示。",
    },
    {
      title: "编辑时间，也能一眼看清审校证据",
      action: "切换高级审校",
      complete: "高级审校已打开；可继续点击下方标记定位详情。",
    },
  ]) {
    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByRole("dialog", { name: highlight.title })).toBeVisible();
    await page.getByRole("button", { name: highlight.action }).click();
    await expect(page.getByText(highlight.complete)).toBeVisible();
  }

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "AI 只提建议，修改由人确认" })).toBeVisible();

  for (const highlight of [
    {
      title: "把文稿交给本机 Codex",
      action: "体验本机 Codex",
      complete: "建议已进入待审区，项目内容仍保持原样。",
    },
    {
      title: "没有自动 Agent，也能完整交接",
      action: "体验手工交接",
      complete: "交接说明已生成；任务仍等待明确领取。",
    },
    {
      title: "看清差异，再决定是否应用",
      action: "体验应用建议",
      complete: "已展示应用结果；示例项目没有被修改。",
    },
  ]) {
    await page.getByRole("button", { name: "下一步" }).click();
    await expect(page.getByRole("dialog", { name: highlight.title })).toBeVisible();
    await expect(page.getByRole("button", { name: "点击高亮按钮" })).toBeDisabled();
    await page.getByRole("button", { name: highlight.action }).click();
    await expect(page.getByText(highlight.complete)).toBeVisible();
    await expect(page.getByRole("button", { name: "下一步" })).toBeEnabled();
  }

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "导出前先处理明确问题" })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "字幕框宽度和行数可以分别调整" })).toBeVisible();
  await page.getByRole("button", { name: "查看字幕框设置" }).click();
  await expect(page.getByText("字幕框尺寸已说明；可在导出设置中拖动两个滑块继续体验。")).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "确认字幕、画布，再生成结果" })).toBeVisible();
  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByRole("dialog", { name: "已经掌握 SiaoCut 主流程" })).toBeVisible();

  await expect(page.getByRole("tab", { name: "导出" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "导出设置" })).toBeVisible();
  await page.getByRole("button", { name: "开始自由体验" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "使用引导" }).click();
  await page.getByRole("button", { name: "开始体验" }).click();
  const mobileCard = await page.getByRole("dialog", { name: "先从一个项目开始" }).boundingBox();
  expect(mobileCard).not.toBeNull();
  expect(mobileCard!.x).toBeGreaterThanOrEqual(0);
  expect(mobileCard!.x + mobileCard!.width).toBeLessThanOrEqual(390);
  expect(mobileCard!.y).toBeGreaterThanOrEqual(0);
  expect(mobileCard!.y + mobileCard!.height).toBeLessThanOrEqual(844);
  for (let step = 0; step < 6; step += 1) {
    await page.getByRole("button", { name: "下一步" }).click();
    const action = page.locator(".product-tour-hotspot");
    if (await action.count()) {
      await action.click();
      await expect(page.getByRole("button", { name: "下一步" })).toBeEnabled();
    }
  }
  await page.getByRole("button", { name: "下一步" }).click();
  const mobileAgentCard = await page.getByRole("dialog", { name: "把文稿交给本机 Codex" }).boundingBox();
  const mobileAgentHotspot = await page.getByRole("button", { name: "体验本机 Codex" }).boundingBox();
  expect(mobileAgentCard).not.toBeNull();
  expect(mobileAgentHotspot).not.toBeNull();
  expect(mobileAgentCard!.x).toBeGreaterThanOrEqual(0);
  expect(mobileAgentCard!.x + mobileAgentCard!.width).toBeLessThanOrEqual(390);
  expect(mobileAgentCard!.y).toBeGreaterThanOrEqual(0);
  expect(mobileAgentCard!.y + mobileAgentCard!.height).toBeLessThanOrEqual(844);
  expect(mobileAgentHotspot!.x).toBeGreaterThanOrEqual(0);
  expect(mobileAgentHotspot!.x + mobileAgentHotspot!.width).toBeLessThanOrEqual(390);
  expect(mobileAgentHotspot!.y).toBeGreaterThanOrEqual(0);
  expect(mobileAgentHotspot!.y + mobileAgentHotspot!.height).toBeLessThanOrEqual(844);
  await page.getByRole("button", { name: "体验本机 Codex" }).click();
  await expect(page.getByText("建议已进入待审区，项目内容仍保持原样。")).toBeVisible();
  expect(await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }))).toEqual({ viewport: 390, documentWidth: 390, bodyWidth: 390 });
  await page.getByRole("button", { name: "关闭引导" }).click();
});

test("keeps every interactive tour highlight reachable and clear of its card on compact browsers", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: "使用引导" }).click();
    await page.getByRole("button", { name: "开始体验" }).click();

    const highlights = [
      { advance: 1, action: "体验检查更新", complete: "检查完成；示例组件均为兼容版本，未执行下载。" },
      { advance: 3, action: "体验安全重生成", complete: "校验通过；示例字幕未替换，安全流程已完整展示。" },
      { advance: 1, action: "切换高级审校", complete: "高级审校已打开；可继续点击下方标记定位详情。" },
      { advance: 2, action: "体验本机 Codex", complete: "建议已进入待审区，项目内容仍保持原样。" },
      { advance: 1, action: "体验手工交接", complete: "交接说明已生成；任务仍等待明确领取。" },
      { advance: 1, action: "体验应用建议", complete: "已展示应用结果；示例项目没有被修改。" },
      { advance: 2, action: "查看字幕框设置", complete: "字幕框尺寸已说明；可在导出设置中拖动两个滑块继续体验。" },
    ];

    for (const highlight of highlights) {
      for (let step = 0; step < highlight.advance; step += 1) {
        await page.getByRole("button", { name: "下一步" }).click();
      }
      const card = page.locator(".product-tour-card");
      const hotspot = page.getByRole("button", { name: highlight.action });
      await expect(hotspot).toBeVisible();
      const geometry = await Promise.all([card.boundingBox(), hotspot.boundingBox()]);
      expect(geometry[0]).not.toBeNull();
      expect(geometry[1]).not.toBeNull();
      const [cardBox, hotspotBox] = geometry as [
        { x: number; y: number; width: number; height: number },
        { x: number; y: number; width: number; height: number },
      ];
      const overlaps = !(
        hotspotBox.x + hotspotBox.width <= cardBox.x
        || hotspotBox.x >= cardBox.x + cardBox.width
        || hotspotBox.y + hotspotBox.height <= cardBox.y
        || hotspotBox.y >= cardBox.y + cardBox.height
      );
      expect(overlaps, JSON.stringify({ viewport, action: highlight.action, cardBox, hotspotBox })).toBe(false);
      expect(hotspotBox.x).toBeGreaterThanOrEqual(0);
      expect(hotspotBox.y).toBeGreaterThanOrEqual(0);
      expect(hotspotBox.x + hotspotBox.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(hotspotBox.y + hotspotBox.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(await hotspot.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return hit === element || Boolean(hit?.closest(".product-tour-hotspot"));
      })).toBe(true);
      await hotspot.click();
      await expect(page.getByText(highlight.complete)).toBeVisible();
    }
    await page.getByRole("button", { name: "关闭引导" }).click();
  }
});


test("reflows the full workbench into a mobile page without document overflow", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 812 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "发布口播 · 草稿" })).toBeVisible();
    expect(await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }))).toEqual({
      viewport: viewport.width,
      documentWidth: viewport.width,
      bodyWidth: viewport.width,
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.locator(".rail")).toHaveCSS("position", "relative");
  await expect(page.locator(".stage-grid")).toHaveCSS("grid-template-columns", "366px");
  await expect(page.locator(".editor-grid")).toHaveCSS("grid-template-columns", "366px");
  await expect(page.locator(".video-frame")).toBeVisible();
  await expect(page.locator(".transcript-panel")).toBeVisible();
  await expect(page.locator(".creator-drawer")).toBeVisible();
  await expect(page.locator(".timeline-panel")).toBeVisible();

  const timeline = page.locator(".subtitle-timeline-scroll");
  expect(await timeline.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);

  await page.getByRole("tab", { name: "质量" }).click();
  await expect(page.locator('.creator-drawer [role="tab"][aria-selected="true"]')).toHaveText(/质量/);
});
