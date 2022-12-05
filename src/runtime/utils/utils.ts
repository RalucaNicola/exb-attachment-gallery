export const formatDate = ms => {
  const date = new Date(ms);
  return new Intl.DateTimeFormat("ca-iso8601", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
};
