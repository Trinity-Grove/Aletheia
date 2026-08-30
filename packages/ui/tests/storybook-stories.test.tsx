import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import React from "react";

import * as ActivityListStories from "../src/stories/ActivityList.stories.js";
import * as AlertStories from "../src/stories/Alert.stories.js";
import * as BadgeStories from "../src/stories/Badge.stories.js";
import * as ButtonStories from "../src/stories/Button.stories.js";
import * as CardStories from "../src/stories/Card.stories.js";
import * as DailyJourneyStories from "../src/stories/DailyJourney.stories.js";
import * as DataListStories from "../src/stories/DataList.stories.js";
import * as DrawerStories from "../src/stories/Drawer.stories.js";
import * as DropdownStories from "../src/stories/Dropdown.stories.js";
import * as EmptyStateStories from "../src/stories/EmptyState.stories.js";
import * as IconStories from "../src/stories/Icon.stories.js";
import * as InputStories from "../src/stories/Input.stories.js";
import * as ModalStories from "../src/stories/Modal.stories.js";
import * as NavigationStories from "../src/stories/Navigation.stories.js";
import * as PageHeaderStories from "../src/stories/PageHeader.stories.js";
import * as ProgressStories from "../src/stories/Progress.stories.js";
import * as TooltipStories from "../src/stories/Tooltip.stories.js";

const storyModules = [
  { name: "ActivityList", module: ActivityListStories },
  { name: "Alert", module: AlertStories },
  { name: "Badge", module: BadgeStories },
  { name: "Button", module: ButtonStories },
  { name: "Card", module: CardStories },
  { name: "DailyJourney", module: DailyJourneyStories },
  { name: "DataList", module: DataListStories },
  { name: "Drawer", module: DrawerStories },
  { name: "Dropdown", module: DropdownStories },
  { name: "EmptyState", module: EmptyStateStories },
  { name: "Icon", module: IconStories },
  { name: "Input", module: InputStories },
  { name: "Modal", module: ModalStories },
  { name: "Navigation", module: NavigationStories },
  { name: "PageHeader", module: PageHeaderStories },
  { name: "Progress", module: ProgressStories },
  { name: "Tooltip", module: TooltipStories },
];

describe("Storybook Stories Suite & A11y Verification", () => {
  afterEach(cleanup);

  it("exports valid CSF3 metadata for all story files", () => {
    expect(storyModules.length).toBe(17);

    for (const { name, module } of storyModules) {
      expect(module.default, `${name} should have a default export`).toBeDefined();
      expect(module.default.title, `${name} should define title`).toBeTruthy();
      expect(typeof module.default.title).toBe("string");
    }
  });

  describe.each(storyModules)("$name Stories Rendering", ({ name, module }) => {
    const storyExports = Object.entries(module).filter(
      ([key, value]) => key !== "default" && (typeof value === "function" || (typeof value === "object" && value !== null))
    );

    it(`has at least one exported story in ${name}`, () => {
      expect(storyExports.length).toBeGreaterThan(0);
    });

    for (const [storyName, StoryComponent] of storyExports) {
      it(`renders ${name} -> ${storyName} story without errors`, () => {
        const Element = typeof StoryComponent === "function" ? (
          <StoryComponent />
        ) : (StoryComponent as any).render ? (
          (StoryComponent as any).render((StoryComponent as any).args ?? {})
        ) : typeof (StoryComponent as any).component === "function" ? (
          React.createElement((StoryComponent as any).component, (StoryComponent as any).args ?? {})
        ) : (
          React.createElement((module.default as any).component, (StoryComponent as any).args ?? {})
        );

        const { container } = render(Element);
        expect(container).toBeDefined();
      });
    }
  });

  describe("Specific Component Story A11y Attributes", () => {
    it("verifies Button stories render with accessible text and proper attributes", () => {
      render(<ButtonStories.Variants />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(5);
      for (const btn of buttons) {
        expect(btn.textContent).toBeTruthy();
      }
    });

    it("verifies IconButtons in Button stories have aria-labels", () => {
      render(<ButtonStories.IconButtons />);
      const buttons = screen.getAllByRole("button");
      for (const btn of buttons) {
        expect(btn).toHaveAttribute("aria-label");
        expect(btn.getAttribute("aria-label")).toBeTruthy();
      }
    });

    it("verifies Form stories render with inputs, labels, and accessible error semantics", () => {
      render(<InputStories.TextInputs />);
      const errorInput = screen.getByDisplayValue("Valor inválido");
      expect(errorInput).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("O preenchimento deste campo é obrigatório.");
    });

    it("verifies Progress stories render with role=progressbar and aria values", () => {
      render(<ProgressStories.Default />);
      const progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "65");
      expect(progress).toHaveAttribute("aria-label", "Progresso do currículo de História");
    });

    it("verifies Alert stories render with role=alert", () => {
      render(<AlertStories.AllVariants />);
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBe(4);
    });

    it("verifies DataList stories render with definition list semantics", () => {
      const { container } = render(<DataListStories.Default />);
      expect(container.querySelector("dl")).toBeInTheDocument();
      expect(container.querySelectorAll("dt").length).toBe(4);
      expect(container.querySelectorAll("dd").length).toBe(4);
    });
  });
});
