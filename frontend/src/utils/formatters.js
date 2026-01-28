export const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  const date = new Date(value);
  return date.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const formatNumber = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString('en-KE');
};
