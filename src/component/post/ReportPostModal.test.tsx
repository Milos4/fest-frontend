import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReportPostModal from "./ReportPostModal";

test("shows confirmation only after the report is saved", async () => {
  let finish!: () => void;
  const submit = jest.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  render(<ReportPostModal onClose={() => {}} onSubmit={submit} />);
  fireEvent.click(screen.getByRole("button", { name: "Report" }));
  expect(screen.queryByText("Reported")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  await act(async () => { finish(); });
  expect(screen.getByText("Reported")).toBeInTheDocument();
  expect(submit).toHaveBeenCalledWith("Spam or misleading");
});

test("failed report stays open and can be retried", async () => {
  const submit = jest.fn().mockRejectedValueOnce(new Error("Database unavailable")).mockResolvedValueOnce(undefined);
  render(<ReportPostModal onClose={() => {}} onSubmit={submit} />);
  fireEvent.click(screen.getByRole("button", { name: "Report" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Database unavailable");
  expect(screen.queryByText("Reported")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Report" }));
  expect(await screen.findByText("Reported")).toBeInTheDocument();
});
