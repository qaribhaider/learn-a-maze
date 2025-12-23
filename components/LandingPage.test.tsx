import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "./LandingPage";
import userEvent from "@testing-library/user-event";

// Mock the MazeScene component to avoid Three.js rendering in tests
vi.mock("./MazeScene", () => ({
  MazeScene: () => <div data-testid="maze-scene">MazeScene Mock</div>,
}));

describe("LandingPage", () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  describe("rendering", () => {
    it("should render the landing page", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      const elements = screen.getAllByText(/Learn a Maze/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should render the main heading", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/Where/i)).toBeInTheDocument();
      expect(
        screen.getByText((content, element) => {
          return (
            element?.tagName.toLowerCase() === "span" && content.includes("AI")
          );
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/learns to/i)).toBeInTheDocument();
    });

    it("should render navigation buttons in navbar", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      const launchButtons = screen.getAllByText(/Launch App/i);
      expect(launchButtons.length).toBeGreaterThan(0);
    });

    it("should render CTA buttons", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/Start Learning/i)).toBeInTheDocument();
      expect(screen.getByText(/Build Maze/i)).toBeInTheDocument();
    });

    it("should render the Bellman equation section", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/The Science of/i)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /The Science of/i })
      ).toBeInTheDocument();
    });

    it('should render the "Choose Your Mode" section', () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();
    });

    it("should render AI Simulator card", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/AI Simulator/i)).toBeInTheDocument();
    });

    it("should render Maze Architect card", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/Maze Architect/i)).toBeInTheDocument();
    });

    it("should render footer", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      const currentYear = new Date().getFullYear();
      expect(
        screen.getByText(new RegExp(currentYear.toString()))
      ).toBeInTheDocument();
    });

    it("should render educational description", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(
        screen.getByText(
          /Watch an agent evolve from random exploration to perfect efficiency/i
        )
      ).toBeInTheDocument();
    });

    it("should render Q-Learning explanation", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      const qTableElements = screen.getAllByText(/Q-Table/i);
      expect(qTableElements.length).toBeGreaterThan(0);
      expect(
        screen.getByText(/Temporal Difference Learning/i)
      ).toBeInTheDocument();
    });

    it("should render the code snippet with Bellman equation", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(
        screen.getByText(/Q\[s\]\[a\] = Q\[s\]\[a\] \+ α \*/i)
      ).toBeInTheDocument();
    });

    it("should render key variables explanation", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/Learning Rate/i)).toBeInTheDocument();
      expect(screen.getByText(/Discount Factor/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Exploration vs Exploitation/i)
      ).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it('should call onNavigate with "simulator" when Launch App is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage onNavigate={mockOnNavigate} />);

      const launchButtons = screen.getAllByText(/Launch App/i);
      await user.click(launchButtons[0]);

      expect(mockOnNavigate).toHaveBeenCalledWith("simulator");
    });

    it('should call onNavigate with "simulator" when Start Learning is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage onNavigate={mockOnNavigate} />);

      const startButton = screen.getByText(/Start Learning/i);
      await user.click(startButton);

      expect(mockOnNavigate).toHaveBeenCalledWith("simulator");
    });

    it('should call onNavigate with "designer" when Build Maze is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage onNavigate={mockOnNavigate} />);

      const buildButton = screen.getByText(/Build Maze/i);
      await user.click(buildButton);

      expect(mockOnNavigate).toHaveBeenCalledWith("designer");
    });

    it('should call onNavigate with "simulator" when AI Simulator card is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage onNavigate={mockOnNavigate} />);

      const simulatorCard = screen
        .getByText(/Enter Simulation/i)
        .closest("div");
      if (simulatorCard) {
        await user.click(simulatorCard);
        expect(mockOnNavigate).toHaveBeenCalledWith("simulator");
      }
    });

    it('should call onNavigate with "designer" when Maze Architect card is clicked', async () => {
      const user = userEvent.setup();
      render(<LandingPage onNavigate={mockOnNavigate} />);

      const designerCard = screen.getByText(/Design Maze/i).closest("div");
      if (designerCard) {
        await user.click(designerCard);
        expect(mockOnNavigate).toHaveBeenCalledWith("designer");
      }
    });
  });

  describe("hero animation", () => {
    it("should render MazeScene component", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByTestId("maze-scene")).toBeInTheDocument();
    });
  });

  describe("information cards", () => {
    it("should render Policy Optimization card", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(screen.getByText(/Policy Optimization/i)).toBeInTheDocument();
      expect(screen.getByText(/ε-greedy strategy/i)).toBeInTheDocument();
    });

    it("should render Bellman Equation card", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      expect(
        screen.getByRole("heading", { name: /Bellman Equation/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/expected future discounted reward/i)
      ).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have clickable buttons", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should have proper text hierarchy", () => {
      render(<LandingPage onNavigate={mockOnNavigate} />);
      // Main headings should be present
      expect(screen.getByText(/The Science of/i)).toBeInTheDocument();
      expect(screen.getByText(/Choose Your Mode/i)).toBeInTheDocument();
    });
  });
});
