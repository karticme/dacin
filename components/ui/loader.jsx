import { cn } from "@/lib/utils";

export function Loader({ className, direction = "down" }) {
  const delays = Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3),
      c = i % 3;
    if (direction === "left") return (2 - c + Math.abs(r - 1)) * 90;
    else if (direction === "up") return (2 - r + Math.abs(c - 1)) * 90;
    else if (direction === "down") return (r + Math.abs(c - 1)) * 90;
    else if (direction === "right") return (c + Math.abs(r - 1)) * 90;
  });

  return (
    <svg
      viewBox="0 0 15 15"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-4 text-primary", className)}
    >
      {delays.map((d, i) => (
        <rect
          key={i}
          width={4}
          height={4}
          x={(i % 3) * 5.5}
          y={Math.floor(i / 3) * 5.5}
          rx={1}
          fill="currentColor"
          opacity={d === null ? 0.07 : 0.15}
        >
          {d !== null && (
            <animate
              attributeName="opacity"
              values="0.15; 0.15; 1; 1; 0.15; 0.15"
              keyTimes="0; 0.18; 0.18; 0.42; 0.62; 1"
              keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"
              calcMode="spline"
              dur="650ms"
              begin={d + "ms"}
              repeatCount="indefinite"
            />
          )}
        </rect>
      ))}
    </svg>
  );
}
