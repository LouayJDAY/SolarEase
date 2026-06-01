import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RequestList } from "./RequestList";
import { Demand } from "../../services/demandService";

function buildDemand(overrides: Partial<Demand> = {}): Demand {
  return {
    id: 1,
    clientUserId: "user-1",
    clientEmail: "test@solarease.tn",
    clientFirstName: "Ali",
    clientLastName: "Ben Salah",
    clientPhone: "+216 22 333 444",
    status: "NOUVELLE",
    source: "CLIENT",
    priority: "NORMALE",
    name: "Installation 5 kWc",
    description: "Maison résidentielle",
    location: "Tunis",
    peakPower: 5,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("RequestList", () => {
  it("renders a loading skeleton when there are no demands and loading is true", () => {
    const { container } = render(
      <RequestList
        demands={[]}
        selectedId={null}
        loading={true}
        unseenIds={new Set()}
        onSelect={() => {}}
      />
    );
    // 5 skeleton placeholders are rendered as pulsing rows
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("renders the empty state when no demand matches the filters", () => {
    render(
      <RequestList
        demands={[]}
        selectedId={null}
        loading={false}
        unseenIds={new Set()}
        onSelect={() => {}}
      />
    );
    expect(
      screen.getByRole("heading", { name: /Aucune demande/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aucune demande ne correspond/i)
    ).toBeInTheDocument();
  });

  it("renders one card per demand with status, source and client info", () => {
    const demands: Demand[] = [
      buildDemand({ id: 1, name: "Demande A", source: "PUBLIC" }),
      buildDemand({
        id: 2,
        name: "Demande B",
        status: "VALIDEE",
        priority: "HAUTE",
        clientFirstName: "Wassim",
        clientLastName: "Dhaouadi",
      }),
    ];

    render(
      <RequestList
        demands={demands}
        selectedId={null}
        loading={false}
        unseenIds={new Set()}
        onSelect={() => {}}
      />
    );

    // 2 list items
    const items = screen.getAllByRole("button");
    expect(items).toHaveLength(2);

    // First row carries the Public badge and the Nouvelle status
    expect(within(items[0]).getByText("Public")).toBeInTheDocument();
    expect(within(items[0]).getByText("Nouvelle")).toBeInTheDocument();

    // Second row carries the Validée status and a HAUTE priority badge
    expect(within(items[1]).getByText("Validée")).toBeInTheDocument();
    expect(within(items[1]).getByText(/Haute/)).toBeInTheDocument();
  });

  it("calls onSelect with the clicked demand and shows the unseen pulse for live arrivals", () => {
    const demand = buildDemand({ id: 42 });
    const onSelect = vi.fn();
    render(
      <RequestList
        demands={[demand]}
        selectedId={null}
        loading={false}
        unseenIds={new Set([42])}
        onSelect={onSelect}
      />
    );

    // The unseen-marker dot is present and labelled for screen readers
    expect(
      screen.getByLabelText("Nouvelle demande non consultée")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(demand);
  });
});
