// Function to generate unique names with a formatted timestamp
const generateUniqueName = (prefix) => {
  const timestamp = new Date();
  const formattedTimestamp = `${timestamp.getDate().toString().padStart(2, '0')}${(timestamp.getMonth() + 1).toString().padStart(2, '0')}${timestamp.getFullYear()}${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}${timestamp.getSeconds().toString().padStart(2, '0')}${timestamp.getMilliseconds().toString().padStart(3, '0')}`;
  return `${prefix}${formattedTimestamp}`;
}

export default generateUniqueName;
