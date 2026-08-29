import clsx from "clsx";
import Orbit from "./spinner";

export function Pagination({
  page,
  loading = false,
  onPageChange,
}: {
  page: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={loading || page <= 1}
        className="btn btn-default box-border flex items-center justify-center hover:cursor-pointer"
        aria-label="Previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-3 w-3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </button>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={loading}
        className="btn btn-default ml-2 box-border flex items-center justify-center hover:cursor-pointer"
        aria-label="Next page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-3 w-3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
      <div className="mx-2 my-auto">{page}</div>
      <div>
        <button
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          className={clsx("btn btn-link hover:cursor-pointer", {
            "opacity-40": page === 1,
          })}
        >
          reset
        </button>
      </div>
      {loading && <Orbit size={25} />}
    </div>
  );
}
