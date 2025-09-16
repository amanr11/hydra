export const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // "YYYY-MM-DD"
  };
  
  export const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  