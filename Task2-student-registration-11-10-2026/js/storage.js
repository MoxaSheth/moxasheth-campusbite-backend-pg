const StudentStorage = (() => {
  const KEY = 'studentRecords';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Could not parse student records from Local Storage:', error);
      return [];
    }
  }

  function save(students) {
    try {
      localStorage.setItem(KEY, JSON.stringify(students));
      return true;
    } catch (error) {
      console.error('Could not save student records:', error);
      throw new Error('Unable to save data. Browser storage may be full, especially if many photos are stored.');
    }
  }

  return { load, save };
})();
