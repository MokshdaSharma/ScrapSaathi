import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/server.js";

beforeEach(async () => {
  await request(app).post("/__reset");
});

describe("Authentication API", () => {
  it("allows 1-click demo login for all roles", async () => {
    const household = await request(app).post("/api/auth/demo-login").send({ role: "household" });
    expect(household.status).toBe(200);
    expect(household.body.token).toBeDefined();
    expect(household.body.user.role).toBe("household");

    const picker = await request(app).post("/api/auth/demo-login").send({ role: "picker" });
    expect(picker.status).toBe(200);
    expect(picker.body.token).toBeDefined();
    expect(picker.body.user.role).toBe("picker");

    const aggregator = await request(app).post("/api/auth/demo-login").send({ role: "aggregator" });
    expect(aggregator.status).toBe(200);
    expect(aggregator.body.token).toBeDefined();
    expect(aggregator.body.user.role).toBe("aggregator");
  });

  it("registers a new user and returns token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Amit Patel",
      identifier: "9811122233",
      role: "picker",
      password: "secretpassword123",
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe("Amit Patel");
    expect(res.body.user.role).toBe("picker");
  });

  it("authenticates registered user with password", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Rohit Verma",
      identifier: "rohit@example.com",
      role: "household",
      password: "mypassword456",
    });

    const loginRes = await request(app).post("/api/auth/login").send({
      identifier: "rohit@example.com",
      password: "mypassword456",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.name).toBe("Rohit Verma");
  });

  it("handles phone OTP simulation flow", async () => {
    const otpReq = await request(app).post("/api/auth/otp-request").send({
      phone: "+91 9999888877",
    });
    expect(otpReq.status).toBe(200);
    expect(otpReq.body.simulatedOtp).toBe("123456");

    const verifyReq = await request(app).post("/api/auth/otp-verify").send({
      phone: "+91 9999888877",
      otp: "123456",
    });
    expect(verifyReq.status).toBe(200);
    expect(verifyReq.body.token).toBeDefined();
  });

  it("verifies me endpoint with Bearer token", async () => {
    const loginRes = await request(app).post("/api/auth/demo-login").send({ role: "picker" });
    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.role).toBe("picker");
  });
});
