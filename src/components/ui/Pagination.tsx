"use client";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const delta = 2;
  const start = Math.max(1, currentPage - delta);
  const end = Math.min(totalPages, currentPage + delta);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="px-3 py-2 border border-subtle text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground hover:text-background hover:border-foreground transition"
      >
        Trước
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 border border-subtle text-sm hover:bg-foreground hover:text-background hover:border-foreground transition"
          >
            1
          </button>
          {start > 2 && <span className="px-2 text-gray-400">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 border text-sm transition ${
            page === currentPage
              ? "bg-foreground text-background border-foreground"
              : "border-subtle hover:bg-foreground hover:text-background hover:border-foreground"
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-2 text-gray-400">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 border border-subtle text-sm hover:bg-foreground hover:text-background hover:border-foreground transition"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="px-3 py-2 border border-subtle text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground hover:text-background hover:border-foreground transition"
      >
        Sau
      </button>
    </div>
  );
}
