import React, { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// One shared canvas context for the whole app — measureText never
// touches DOM layout, so this costs nothing regardless of item count.
let ctx;
const getCtx = () => (ctx ??= document.createElement("canvas").getContext("2d"));

function fitMiddle(value, head, tail, container, lines) {
  const c = getCtx();
  c.font = getComputedStyle(container).font;

  const budget = container.clientWidth * lines;
  if (c.measureText(value).width <= budget) return head;

  const room = budget - c.measureText("…" + tail).width;
  let lo = 0, hi = head.length, best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (c.measureText(head.slice(0, mid)).width <= room) { best = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return head.slice(0, best) + "…";
}

export default function Truncated({ value, className = "", lines = 1 }) {
  const isMultiline = lines > 1;
  const ref = useRef(null);
  const fullHead = value.slice(0, -8);
  const tail = value.slice(-8);
  const [head, setHead] = useState(fullHead);

  useLayoutEffect(() => {
    if (!isMultiline || !ref.current) return;
    const measure = () => setHead(fitMiddle(value, fullHead, tail, ref.current, lines));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [value, lines, isMultiline]);

  if (isMultiline) {
    return (
      <p ref={ref} className={cn("text-muted-foreground text-[13px] text-center break-all leading-snug overflow-hidden group-data-selected/item:text-info", className)}>
        <span>{head}</span>
        <span>{tail}</span>
      </p>
    );
  }

  return (
    <p className={cn("text-muted-foreground text-[13px] text-center leading-snug group-data-selected/item:text-info flex justify-center max-w-full overflow-hidden whitespace-nowrap", className)}>
      <span className="min-w-0 shrink overflow-hidden text-ellipsis flex-[0_1_auto]">{fullHead}</span>
      <span className="shrink-0 min-w-fit">{tail}</span>
    </p>
  );
}