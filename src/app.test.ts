import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app.js";

describe("Base App Routes", () => {
  it("GET / should return running status", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Cricket backend API is running",
    });
  });

  it("GET /health should return service health info", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Service healthy");
    expect(response.body.data.environment).toBeDefined();
    expect(response.body.data.uptime).toBeTypeOf("number");
  });

  it("GET /invalid-route should return 404", async () => {
    const response = await request(app).get("/invalid-route");
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Route GET /invalid-route not found",
    );
  });
});
