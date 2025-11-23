export const normalizeValue = (val, min, max) => {
  const num = parseFloat(val);
  if (isNaN(num)) return 0; // Default to normal if empty
  return num >= min && num <= max ? 0 : 1;
};

export const getStatusColor = (val, min, max) => {
  const status = normalizeValue(val, min, max);
  return status === 0
    ? "bg-emerald-100 text-emerald-700"
    : "bg-rose-100 text-rose-700";
};
