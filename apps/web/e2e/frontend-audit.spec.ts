/* eslint-disable no-console */
import { test, expect } from "@playwright/test";

const routes = [
  { path: "/login", name: "Login" },
  { path: "/register", name: "Register" },
  { path: "/onboarding", name: "Onboarding" },
  { path: "/", name: "Dashboard" },
  { path: "/learners", name: "Learners" },
  { path: "/devotional", name: "Devotional" },
  { path: "/curriculum", name: "Curriculum" },
  { path: "/schedule", name: "Schedule" },
  { path: "/records", name: "Records" },
  { path: "/portfolio", name: "Portfolio" },
  { path: "/attendance", name: "Attendance" },
  { path: "/reports", name: "Reports" },
  { path: "/settings", name: "Settings" },
];

test.describe("Comprehensive Frontend Audit & Error Detection", () => {
  for (const route of routes) {
    test(`Auditing route ${route.path} (${route.name}) for errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (
            !text.includes("Failed to load resource") &&
            !text.includes("WebSocket connection") &&
            !text.includes("favicon.ico")
          ) {
            consoleErrors.push(text);
          }
        }
      });

      page.on("pageerror", (err) => {
        pageErrors.push(err.message + "\n" + err.stack);
      });

      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      
      expect(response, `Response for ${route.path} should exist`).not.toBeNull();
      expect(response!.status(), `HTTP Status for ${route.path} should be 200`).toBe(200);

      // Verify no uncaught exceptions
      if (pageErrors.length > 0) {
        console.error(`[PAGE ERRORS on ${route.path}]:`, pageErrors);
      }
      expect(pageErrors, `No uncaught exceptions on ${route.path}`).toEqual([]);

      // Verify no console.error calls
      if (consoleErrors.length > 0) {
        console.error(`[CONSOLE ERRORS on ${route.path}]:`, consoleErrors);
      }
      expect(consoleErrors, `No console.error outputs on ${route.path}`).toEqual([]);
    });
  }
});
