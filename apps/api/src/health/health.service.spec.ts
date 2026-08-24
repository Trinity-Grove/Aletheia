import { HealthService } from "./health.service.js";

describe("HealthService", () => {
  it("matches the shared liveness contract", () => {
    const service = new HealthService(() => new Date("2026-08-21T12:00:00.000Z"), "0.1.0");

    expect(service.live()).toEqual({
      status: "ok",
      service: "aletheia-api",
      version: "0.1.0",
      timestamp: "2026-08-21T12:00:00.000Z",
    });
  });

  it("is ready when required and optional dependencies are up", async () => {
    const service = new HealthService(
      () => new Date(),
      "0.1.0",
      { check: async () => "up" },
      { check: async () => "up" },
      { check: async () => "up" },
    );

    await expect(service.ready()).resolves.toEqual({
      status: "ready",
      dependencies: {
        postgres: "up",
        redis: "up",
        objectStorage: "up",
      },
    });
  });

  it("is degraded when postgres is up and optional dependencies are down", async () => {
    const service = new HealthService(
      () => new Date(),
      "0.1.0",
      { check: async () => "up" },
      { check: async () => "down" },
      { check: async () => "down" },
    );

    await expect(service.ready()).resolves.toMatchObject({
      status: "degraded",
    });
  });

  it("is not-ready when postgres is down", async () => {
    const service = new HealthService(
      () => new Date(),
      "0.1.0",
      { check: async () => "down" },
      { check: async () => "up" },
      { check: async () => "up" },
    );

    await expect(service.ready()).resolves.toMatchObject({
      status: "not-ready",
    });
  });
});
