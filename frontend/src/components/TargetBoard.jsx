import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api.js";
import SlotTable from "./SlotTable.jsx";

const FILTERS = ["", "Followup", "Today Demo", "Future Demo"];
const AUTO_REFRESH_MS = 7000;
const CHILD_REFRESH_THROTTLE_MS = 1200;
const MOVE_HINT_MS = 1400;

function areSlotsEqual(left = [], right = []) {
  return JSON.stringify(left || []) === JSON.stringify(right || []);
}

function openNativePicker(node) {
  if (!node) return;

  requestAnimationFrame(() => {
    try {
      if (typeof node.showPicker === "function") {
        node.showPicker();
        return;
      }
    } catch (_) {}

    try {
      node.focus();
    } catch (_) {}

    try {
      node.click();
    } catch (_) {}

    const tagName = String(node.tagName || "").toLowerCase();
    if (tagName === "select") {
      try {
        node.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            code: "ArrowDown",
            bubbles: true,
          })
        );
      } catch (_) {}
    }
  });
}

function isPickerTarget(node) {
  if (!node || !(node instanceof HTMLElement)) return false;

  const tagName = String(node.tagName || "").toLowerCase();
  const type = String(node.getAttribute("type") || node.type || "").toLowerCase();

  if (tagName === "select") return true;
  if (tagName === "input" && ["date", "time", "datetime-local", "month", "week"].includes(type)) {
    return true;
  }

  return false;
}

function findHorizontalScrollHost(root) {
  if (!root) return null;

  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!(node instanceof HTMLElement)) continue;

    if (node.scrollWidth > node.clientWidth + 4) {
      const style = window.getComputedStyle(node);
      if (["auto", "scroll", "overlay"].includes(style.overflowX)) {
        return node;
      }
    }

    queue.push(...Array.from(node.children || []));
  }

  return root instanceof HTMLElement ? root : null;
}

function findVerticalScrollHost(root) {
  if (!root) return null;

  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (!(node instanceof HTMLElement)) continue;

    if (node.scrollHeight > node.clientHeight + 4) {
      const style = window.getComputedStyle(node);
      if (["auto", "scroll", "overlay"].includes(style.overflowY)) {
        return node;
      }
    }

    queue.push(...Array.from(node.children || []));
  }

  return root instanceof HTMLElement ? root : null;
}

function keepCheckedRowsVisible(root) {
  if (!root) return;

  const scrollHost = findVerticalScrollHost(root);
  if (!scrollHost) return;

  requestAnimationFrame(() => {
    const checkedInputs = Array.from(
      root.querySelectorAll('tbody input[type="checkbox"]:checked')
    );

    let rows = checkedInputs
      .map((input) => input.closest("tr"))
      .filter(Boolean);

    if (!rows.length) {
      const activeRow = document.activeElement?.closest?.("tr");
      if (activeRow && root.contains(activeRow)) {
        rows = [activeRow];
      }
    }

    if (!rows.length) return;

    const hostRect = scrollHost.getBoundingClientRect();
    const rowRects = rows.map((row) => row.getBoundingClientRect());
    const firstTop = Math.min(...rowRects.map((rect) => rect.top - hostRect.top + scrollHost.scrollTop));
    const lastBottom = Math.max(...rowRects.map((rect) => rect.bottom - hostRect.top + scrollHost.scrollTop));

    const viewportTop = scrollHost.scrollTop;
    const viewportBottom = viewportTop + scrollHost.clientHeight;

    if (firstTop < viewportTop) {
      scrollHost.scrollTop = Math.max(firstTop - 40, 0);
    } else if (lastBottom > viewportBottom) {
      scrollHost.scrollTop = lastBottom - scrollHost.clientHeight + 40;
    }
  });
}

function EnhancedSlotShell({ children }) {
  const shellRef = useRef(null);
  const moveHintTimerRef = useRef(null);
  const lastInputWasKeyboardRef = useRef(false);
  const [moveHint, setMoveHint] = useState(null);

  useEffect(() => {
    const handleKeyDown = () => {
      lastInputWasKeyboardRef.current = true;
    };

    const handlePointerDown = () => {
      lastInputWasKeyboardRef.current = false;
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousedown", handlePointerDown, true);
    window.addEventListener("touchstart", handlePointerDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousedown", handlePointerDown, true);
      window.removeEventListener("touchstart", handlePointerDown, true);
    };
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const handleWheel = (e) => {
      const scrollHost = findHorizontalScrollHost(root);
      if (!scrollHost) return;

      const mostlyHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 8;
      if (!mostlyHorizontal) return;

      const canScrollHorizontally = scrollHost.scrollWidth > scrollHost.clientWidth + 1;
      const atLeftEdge = scrollHost.scrollLeft <= 0;
      const atRightEdge = Math.ceil(scrollHost.scrollLeft + scrollHost.clientWidth) >= scrollHost.scrollWidth;
      const goingLeft = e.deltaX < 0;
      const goingRight = e.deltaX > 0;

      if (!canScrollHorizontally || (goingLeft && atLeftEdge) || (goingRight && atRightEdge)) {
        e.preventDefault();
      }
    };

    root.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => {
      root.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const handleFocusIn = (e) => {
      if (!lastInputWasKeyboardRef.current) return;
      const target = e.target;
      if (!isPickerTarget(target)) return;
      openNativePicker(target);
    };

    const handleKeyDown = (e) => {
      const target = e.target;
      if (!isPickerTarget(target)) return;
      if (["Enter", " ", "ArrowDown"].includes(e.key)) {
        openNativePicker(target);
      }
    };

    root.addEventListener("focusin", handleFocusIn, true);
    root.addEventListener("keydown", handleKeyDown, true);

    return () => {
      root.removeEventListener("focusin", handleFocusIn, true);
      root.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    const handleClick = (e) => {
      const button = e.target?.closest?.("button");
      if (!button || !root.contains(button)) return;

      const text = String(button.textContent || "").trim();
      if (text !== "▲" && text !== "▼") return;

      const checkedCount = root.querySelectorAll('tbody input[type="checkbox"]:checked').length;
      const directionLabel = text === "▲" ? "up" : "down";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          keepCheckedRowsVisible(root);

          const fallbackCount = checkedCount || 1;
          setMoveHint({ count: fallbackCount, directionLabel });
          window.clearTimeout(moveHintTimerRef.current);
          moveHintTimerRef.current = window.setTimeout(() => {
            setMoveHint(null);
          }, MOVE_HINT_MS);
        });
      });
    };

    root.addEventListener("click", handleClick, true);
    return () => {
      root.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (moveHintTimerRef.current) {
        window.clearTimeout(moveHintTimerRef.current);
      }
    };
  }, []);

  return (
    <div ref={shellRef} style={{ position: "relative", overscrollBehaviorX: "contain" }}>
      {children}
      {moveHint ? (
        <div
          style={{
            position: "sticky",
            bottom: 10,
            zIndex: 30,
            marginTop: 8,
            marginLeft: "auto",
            width: "fit-content",
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(17, 24, 39, 0.9)",
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 700,
            marginRight: 12,
          }}
        >
          {moveHint.count} row{moveHint.count > 1 ? "s" : ""} moved {moveHint.directionLabel}
        </div>
      ) : null}
    </div>
  );
}

export default function TargetBoard() {
  const [slots, setSlots] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const latestRequestRef = useRef(0);
  const lastChildRefreshAtRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (inFlightRef.current) return;

      const requestId = Date.now();
      latestRequestRef.current = requestId;
      inFlightRef.current = true;

      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const { data } = await api.get("/target", {
          params: filter ? { filter } : {},
        });

        if (!mountedRef.current || latestRequestRef.current !== requestId) return;

        const nextSlots = Array.isArray(data?.slots) ? data.slots : [];
        setSlots((prev) => (areSlotsEqual(prev, nextSlots) ? prev : nextSlots));
      } catch (e) {
        if (!mountedRef.current || latestRequestRef.current !== requestId) return;
        setError(e?.response?.data?.message || "Failed to load");
      } finally {
        if (mountedRef.current && latestRequestRef.current === requestId && !silent) {
          setLoading(false);
        }
        inFlightRef.current = false;
      }
    },
    [filter]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      load({ silent: true });
    };

    const intervalId = window.setInterval(tick, AUTO_REFRESH_MS);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  const requestChildRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastChildRefreshAtRef.current < CHILD_REFRESH_THROTTLE_MS) return;
    lastChildRefreshAtRef.current = now;
    await load({ silent: true });
  }, [load]);

  const slotCountLabel = useMemo(
    () => `${slots.length} slot${slots.length === 1 ? "" : "s"}`,
    [slots.length]
  );

  return (
    <div className="card" style={{ overscrollBehaviorX: "contain", position: "relative" }}>
      <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
        <div className="mx-1">
          <h5 style={{ margin: 0 }}>Today Demo + Feedback (Target)</h5>
          <div className="muted">
            Auto grouped by time slots (8AM–11PM) • live refresh • {slotCountLabel}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="select"
            style={{ width: 180 }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onFocus={(e) => {
              openNativePicker(e.currentTarget);
            }}
            onKeyDown={(e) => {
              if (["Enter", " ", "ArrowDown"].includes(e.key)) {
                openNativePicker(e.currentTarget);
              }
            }}
          >
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f ? f : "All Filters"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space" />

      {loading && !slots.length ? <div className="muted">Loading...</div> : null}
      {error ? <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {slots.map((slot) => (
          <EnhancedSlotShell key={slot.slotHeader}>
            <SlotTable slot={slot} onChanged={requestChildRefresh} />
          </EnhancedSlotShell>
        ))}
      </div>
    </div>
  );
}
