import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireSession from "./RequireSession";
import { api, ApiError } from "./api";
jest.mock("axios", () => ({}));
jest.mock("./api", () => ({ ...jest.requireActual("./api"), api: jest.fn() }));
const mockedApi = api as jest.Mock;

beforeEach(() => { localStorage.clear(); mockedApi.mockReset(); });

test("forged local admin role cannot open the admin panel", async () => {
  localStorage.setItem("userData", JSON.stringify({ role: { name: "ADMIN" } }));
  mockedApi.mockResolvedValue({ id: 2, role: { name: "USER" } });
  render(<MemoryRouter initialEntries={["/admin/users"]}><Routes>
    <Route path="/admin/users" element={<RequireSession admin><p>Private panel</p></RequireSession>} />
    <Route path="/home" element={<p>User home</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("User home")).toBeInTheDocument();
  expect(screen.queryByText("Private panel")).not.toBeInTheDocument();
});

test("server-confirmed admin is redirected from home to admin navigation", async () => {
  mockedApi.mockResolvedValue({ id: 1, role: { name: "ADMIN" } });
  render(<MemoryRouter initialEntries={["/home"]}><Routes>
    <Route path="/home" element={<RequireSession><p>User home</p></RequireSession>} />
    <Route path="/admin/users" element={<p>Admin users</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("Admin users")).toBeInTheDocument();
});

test("expired session cannot render a protected page", async () => {
  mockedApi.mockRejectedValue(new ApiError("Please log in", 401));
  render(<MemoryRouter initialEntries={["/admin/users"]}><Routes>
    <Route path="/admin/users" element={<RequireSession admin><p>Private panel</p></RequireSession>} />
    <Route path="/" element={<p>Sign in</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("Sign in")).toBeInTheDocument();
});

test("server errors display a retry instead of silently logging the user out", async () => {
  localStorage.setItem("userData", JSON.stringify({ id: 1 }));
  mockedApi.mockRejectedValue(new ApiError("Server error", 500));
  render(<MemoryRouter><RequireSession admin><p>Admin panel</p></RequireSession></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  expect(localStorage.getItem("userData")).not.toBeNull();
});
