import type { ReactNode } from "react";
import Orbit from "./spinner";

export function LoadingScreen({ message }: { message?: ReactNode }) {
  return <div
    className="bg-zinc-950/50 fixed inset-0 z-50 grid place-items-center"
    role="status"
    aria-label="Loading page"
  >
    <div className="flex flex-col items-center gap-4">
      <Orbit size={100} />
      {message}
    </div>
  </div>;
}
