// Function to generate unique names with a formatted timestamp
const generateUniqueName = (prefix) => {
  const timestamp = new Date();

  const formattedTimestamp = timestamp.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/\//g, '').replace(/:/g, '').replace(/, /g, '');
  const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');

  return `${prefix}${formattedTimestamp}${milliseconds}`;
};

export default generateUniqueName;
