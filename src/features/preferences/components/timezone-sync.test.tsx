import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TimezoneSync } from "./timezone-sync";

const { refresh } = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function useBrowserTimezone(timezone: string) {
  const current = new Intl.DateTimeFormat().resolvedOptions();
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
    ...current,
    timeZone: timezone,
  });
}

describe("TimezoneSync", () => {
  beforeEach(() => {
    document.cookie = "signalboard-timezone=; Path=/; Max-Age=0";
    refresh.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("persists a newly detected valid timezone and refreshes the server once", async () => {
    useBrowserTimezone("Pacific/Kiritimati");

    const view = render(<TimezoneSync />);

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(document.cookie).toContain("signalboard-timezone=Pacific%2FKiritimati");

    view.rerender(<TimezoneSync />);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh when the cookie already has the detected valid timezone", () => {
    useBrowserTimezone("Etc/GMT+12");
    document.cookie = "signalboard-timezone=Etc%2FGMT%2B12; Path=/";

    render(<TimezoneSync />);

    expect(refresh).not.toHaveBeenCalled();
  });

  it("does not write or refresh an invalid browser timezone", () => {
    useBrowserTimezone("Not/A_Timezone");

    render(<TimezoneSync />);

    expect(document.cookie).not.toContain("signalboard-timezone=");
    expect(refresh).not.toHaveBeenCalled();
  });
});
