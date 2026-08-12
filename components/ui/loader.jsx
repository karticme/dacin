import { cn } from "@/lib/utils";

export function Loader({ className, direction = "down" }) {
  const delays = Array.from({ length: 9 }, (_, i) => {
    const r = Math.floor(i / 3),
      c = i % 3;
    let index;
    const rowDist = Math.abs(r - 1);
    const colDist = Math.abs(c - 1);

    switch (direction) {
      case "left":
        index = 2 - c + rowDist;
        break;
      case "up":
        index = 2 - r + colDist;
        break;
      case "down":
        index = r + colDist;
        break;
      case "right":
      default:
        index = c + rowDist;
        break;
    }

    return index * 90;
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
