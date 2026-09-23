import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";

jest.mock("axios", () => ({ get: jest.fn() }));
jest.mock("../../firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  onSnapshot: jest.fn(() => () => undefined),
}));
jest.mock("@ionic/react", () => ({ IonIcon: () => null }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("userData", JSON.stringify({ id: 1 }));
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ count: 0 }),
  } as Response);
});

test("navbar selection does not follow the hash link", () => {
  const setActiveIndex = jest.fn();
  render(
    <MemoryRouter>
      <Navbar activeIndex={0} setActiveIndex={setActiveIndex} />
    </MemoryRouter>
  );

  const profileLink = screen.getByText("Profile").closest("a");
  expect(profileLink).not.toBeNull();
  if (!profileLink) return;

  expect(fireEvent.click(profileLink)).toBe(false);
  expect(setActiveIndex).toHaveBeenCalledWith(1);
});
