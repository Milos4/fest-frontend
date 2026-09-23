import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireSession from "./RequireSession";
import Settings from "./component/settings/Settings";
import { api, ApiError, logout } from "./api";
jest.mock("axios", () => ({}));
jest.mock("./api", () => ({ ...jest.requireActual("./api"), api: jest.fn(), logout: jest.fn() }));
const mockedApi = api as jest.Mock;
const mockedLogout = logout as jest.Mock;

beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); mockedApi.mockReset(); });

function guestPage() {
  return render(<MemoryRouter initialEntries={["/login"]}><Routes>
    <Route path="/login" element={<RequireSession guest><p>Login form</p></RequireSession>} />
    <Route path="/home" element={<p>User home</p>} />
    <Route path="/admin/users" element={<p>Admin panel</p>} />
  </Routes></MemoryRouter>);
}

test.each([["USER", "User home"], ["ADMIN", "Admin panel"]])(
  "active %s session skips the login form", async (role, destination) => {
    mockedApi.mockResolvedValue({ id: 1, role: { name: role } });
    guestPage();
    expect(screen.queryByText("Login form")).not.toBeInTheDocument();
    expect(await screen.findByText(destination)).toBeInTheDocument();
    expect(mockedApi).toHaveBeenCalledWith("/me");
  }
);

test("missing server session shows login and removes stale local identity", async () => {
  localStorage.setItem("userData", JSON.stringify({ id: 1 }));
  mockedApi.mockRejectedValue(new ApiError("Please log in", 401));
  guestPage();
  expect(await screen.findByText("Login form")).toBeInTheDocument();
  expect(localStorage.getItem("userData")).toBeNull();
});

test("home without a session redirects to login", async () => {
  mockedApi.mockRejectedValue(new ApiError("Please log in", 401));
  render(<MemoryRouter initialEntries={["/home"]}><Routes>
    <Route path="/home" element={<RequireSession><p>Private home</p></RequireSession>} />
    <Route path="/" element={<RequireSession guest><p>Login form</p></RequireSession>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("Login form")).toBeInTheDocument();
  expect(screen.queryByText("Private home")).not.toBeInTheDocument();
});

test("logout in another tab rechecks the session and closes home", async () => {
  mockedApi.mockResolvedValueOnce({ id: 1, role: { name: "USER" } });
  render(<MemoryRouter initialEntries={["/home"]}><Routes>
    <Route path="/home" element={<RequireSession><p>Private home</p></RequireSession>} />
    <Route path="/" element={<p>Login form</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText("Private home")).toBeInTheDocument();
  mockedApi.mockRejectedValue(new ApiError("Please log in", 401));
  fireEvent(window, new StorageEvent("storage", { key: "userData", newValue: null }));
  expect(await screen.findByText("Login form")).toBeInTheDocument();
  expect(screen.queryByText("Private home")).not.toBeInTheDocument();
});

test("a server error on login does not pretend there is no session", async () => {
  mockedApi.mockRejectedValue(new ApiError("Server error", 500));
  guestPage();
  expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  expect(screen.queryByText("Login form")).not.toBeInTheDocument();
});

test("Settings logout invokes server logout instead of only clearing local data", async () => {
  mockedLogout.mockResolvedValue(undefined);
  render(<Settings onSelectView={jest.fn()} />);
  fireEvent.click(screen.getByText("Logout"));
  await waitFor(() => expect(mockedLogout).toHaveBeenCalledTimes(1));
});
