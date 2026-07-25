import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateSession } = vi.hoisted(() => ({ updateSession: vi.fn() }));

vi.mock("@/lib/supabase/proxy", () => ({ updateSession }));

import { proxy } from "./proxy";

const request = (pathname: string) =>
  new NextRequest(new URL(`https://signalboard.test${pathname}`));

describe("route proxy", () => {
  beforeEach(() => {
    updateSession.mockReset();
    updateSession.mockResolvedValue({
      claims: null,
      response: NextResponse.next(),
    });
  });

  it.each(["/demo", "/demo/projects", "/demo/projects/website-redesign"])(
    "bypasses Supabase session validation for %s",
    async (pathname) => {
      const response = await proxy(request(pathname));

      expect(updateSession).not.toHaveBeenCalled();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it("keeps validating private routes and redirects guests to sign-in", async () => {
    const response = await proxy(request("/dashboard"));

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toBe("https://signalboard.test/sign-in");
  });

  it("keeps authenticated users away from public-only auth routes", async () => {
    updateSession.mockResolvedValueOnce({
      claims: { sub: "user-1" },
      response: NextResponse.next(),
    });

    const response = await proxy(request("/sign-in"));

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toBe("https://signalboard.test/dashboard");
  });
});
