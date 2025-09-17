export const sortDate = (dateList, fieldName) => {
  return dateList?.sort((dateA, dateB) => new Date(dateB[fieldName]) - new Date(dateA[fieldName]))
}
