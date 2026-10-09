import { beforeEach, describe, expect, it, vi } from "vitest";

const cloud = vi.hoisted(() => ({ configured: true }));
const cloudSessions = vi.hoisted(() => ({
  getCloudDays: vi.fn(),
  addCloudSession: vi.fn(),
  updateCloudSession: vi.fn(),
  deleteCloudSession: vi.fn(),
}));
const local = vi.hoisted(() => ({
  getAllDays: vi.fn(),
  getDay: vi.fn(),
  addSession: vi.fn(),
  addTimerSessionWithRecovery: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock("@/lib/cloud/client", () => ({
  get cloudConfigured() {
    return cloud.configured;
  },
}));
vi.mock("@/lib/cloud/sessions", () => cloudSessions);
vi.mock("./sessions", () => local);

import { addSession, addTimerSessionWithRecovery, getAllDays } from "./repository";

// Lo que responde la nube cuando la sesión existe pero no se puede cargar en ese instante
// (p. ej. el refresco del token murió al reabrir la app).
const sessionUnavailable = new Error("Inicia sesión para sincronizar tus meditaciones.");

describe("repository store selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cloud.configured = true;
    local.getAllDays.mockResolvedValue([]);
  });

  it("fails instead of reading the empty local store when the cloud session is momentarily unavailable", async () => {
    cloudSessions.getCloudDays.mockRejectedValue(sessionUnavailable);

    await expect(getAllDays()).rejects.toThrow(sessionUnavailable);
    expect(local.getAllDays).not.toHaveBeenCalled();
  });

  it("fails instead of saving a meditation only on the device when the cloud session is momentarily unavailable", async () => {
    cloudSessions.addCloudSession.mockRejectedValue(sessionUnavailable);

    await expect(addTimerSessionWithRecovery("2026-10-09", 10, 0, "timer-1")).rejects.toThrow(sessionUnavailable);
    await expect(addSession("2026-10-09", 10, 0, "manual-1")).rejects.toThrow(sessionUnavailable);
    expect(local.addTimerSessionWithRecovery).not.toHaveBeenCalled();
    expect(local.addSession).not.toHaveBeenCalled();
  });

  it("uses the local store only when the cloud is not configured", async () => {
    cloud.configured = false;

    await expect(getAllDays()).resolves.toEqual([]);
    expect(local.getAllDays).toHaveBeenCalledOnce();
    expect(cloudSessions.getCloudDays).not.toHaveBeenCalled();
  });
});
