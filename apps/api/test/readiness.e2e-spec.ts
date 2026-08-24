import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { createApplication } from "../src/main.js";

describe("readiness API", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/v1/health/ready returns 200 or 503 depending on postgres connection", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health/ready",
    });

    expect([200, 503]).toContain(response.statusCode);
    const body = response.json();
    expect(["ready", "degraded", "not-ready"]).toContain(body.status);
    expect(body.dependencies).toBeDefined();
    expect(body.dependencies.postgres).toBeDefined();
  });
});
