

import { smallButton } from "../adminStyles";

export default function Pager({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ marginTop: 20, display: "flex", gap: 14, alignItems: "center" }}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} style={smallButton("#aaa")}>
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} style={smallButton("#aaa")}>
        Next
      </button>
    </div>
  );
}