import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
jest.mock("../../api", () => ({ logout: jest.fn() }));

test("admin navbar contains only admin destinations and logout", () => {
  render(<MemoryRouter><AdminNavbar username="admin" onUsers={() => {}} onReports={() => {}} onError={() => {}} /></MemoryRouter>);
  expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/admin/users");
  expect(screen.getByRole("link", { name: "Reports" })).toHaveAttribute("href", "/admin/reports");
  expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
});
