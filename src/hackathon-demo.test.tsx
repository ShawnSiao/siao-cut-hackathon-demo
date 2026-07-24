import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HackathonDemo from "./hackathon-demo";

afterEach(cleanup);

describe("HackathonDemo", () => {
  it("states the online boundary before the guided workflow", () => {
    render(<HackathonDemo />);

    expect(screen.getByRole("heading", { name: "用改文稿的方式，完成一条口播视频" })).toBeInTheDocument();
    expect(screen.getByText("使用内置示例展示审核和恢复流程。")).toBeInTheDocument();
    expect(screen.getByText("在 Windows 本机完成媒体转写、模型运行和 MP4 导出。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看 AI 建议" })).toBeEnabled();
  });

  it("requires every AI suggestion to be decided before export", () => {
    render(<HackathonDemo />);

    fireEvent.click(screen.getByRole("button", { name: "查看 AI 建议" }));
    expect(screen.getByRole("heading", { name: "逐条决定 AI 建议" })).toBeInTheDocument();
    expect(screen.getByText("2", { selector: ".hackathon-count-badge" })).toBeInTheDocument();

    const filler = screen.getByRole("heading", { name: "删除独立停顿「嗯」" }).closest("article");
    const concise = screen.getByRole("heading", { name: "压缩重复限定语" }).closest("article");
    expect(filler).not.toBeNull();
    expect(concise).not.toBeNull();
    fireEvent.click(within(filler!).getByRole("button", { name: "生成可恢复草稿" }));
    fireEvent.click(within(concise!).getByRole("button", { name: "保留原文" }));

    expect(screen.getByRole("button", { name: "检查版本" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "检查版本" }));
    expect(screen.getByRole("heading", { name: "每次内容修改都有版本" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "检查导出" }));
    expect(screen.getByRole("heading", { name: "可以创建导出任务" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "创建模拟导出任务" }));
    expect(screen.getByRole("heading", { name: "体验完成" })).toBeInTheDocument();
    expect(screen.getByText("核心流程已完成")).toBeInTheDocument();
    expect(screen.getByText("4/4")).toBeInTheDocument();
  });

  it("creates a new recovery entry without changing the source-media claim", () => {
    render(<HackathonDemo />);

    fireEvent.click(screen.getByRole("button", { name: "查看 AI 建议" }));
    fireEvent.click(screen.getAllByRole("button", { name: "生成可恢复草稿" })[0]);
    fireEvent.click(screen.getByRole("button", { name: /查看版本/ }));
    fireEvent.click(screen.getByRole("button", { name: "恢复导入文稿" }));

    expect(screen.getByText("恢复到导入版本")).toBeInTheDocument();
    expect(screen.getByText("创建新的恢复版本 · 原片未改动")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("已恢复导入文稿");
  });
});
