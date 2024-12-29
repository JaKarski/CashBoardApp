import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { vi } from "vitest";
import UserPlot from "./UserPlot";
import api from "../../api";
import { splitDataAtZero } from "../../utils/splitData";
import LineChart from "./LineChart";
import ColumnChart from "./ColumnChart";

vi.mock("../../api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("../../utils/splitData", () => ({
  splitDataAtZero: vi.fn(),
}));

vi.mock("./LineChart", () => ({
  default: vi.fn(() => <div data-testid="line-chart" />),
}));

vi.mock("./ColumnChart", () => ({
  default: vi.fn(() => <div data-testid="column-chart" />),
}));

describe("UserPlot Component Tests", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockPlotData = {
    labels: ["2024-01-01", "2024-01-02"],
    single_game_results: [100, -50],
    cumulative_results: [100, 50],
  };

  const mockSplitData = {
    labels: [new Date("2024-01-01"), new Date("2024-01-02")],
    positive: [100],
    negative: [50],
    pointRadiusPositive: [5],
    pointRadiusNegative: [0],
  };

  it("fetches and displays plot data on mount", async () => {
    api.get.mockResolvedValueOnce({ data: mockPlotData });
    splitDataAtZero.mockReturnValue(mockSplitData);

    render(<UserPlot />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/user/plot-data/");
      expect(splitDataAtZero).toHaveBeenCalledWith(
        [new Date("2024-01-01"), new Date("2024-01-02")],
        [100, 50]
      );
    });

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("column-chart")).toBeInTheDocument();
  });

  it("renders charts with correct data", async () => {
    api.get.mockResolvedValueOnce({ data: mockPlotData });
    splitDataAtZero.mockReturnValue(mockSplitData);

    render(<UserPlot />);

    await waitFor(() => {
      expect(LineChart).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: mockSplitData.labels,
          positiveData: mockSplitData.positive,
          negativeData: mockSplitData.negative,
          pointRadiusPositive: mockSplitData.pointRadiusPositive,
          pointRadiusNegative: mockSplitData.pointRadiusNegative,
        }),
        {}
      );

      expect(ColumnChart).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: mockPlotData.labels,
          yData: mockPlotData.single_game_results,
        }),
        {}
      );
    });
  });
});
