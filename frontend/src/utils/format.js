export function formatMoney(value) {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMoneyShort(value) {
  const n = Number(value) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function statusBadge(status) {
  switch (status) {
    case "Completed":
      return "badge badge-success";
    case "Partially Returned":
      return "badge badge-warning";
    case "Returned":
      return "badge badge-danger";
    case "Cancelled":
      return "badge badge-danger";
    default:
      return "badge";
  }
}
