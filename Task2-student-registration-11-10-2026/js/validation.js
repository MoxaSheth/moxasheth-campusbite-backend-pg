const StudentValidation = (() => {
  const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const MOBILE_RE = /^\d{10}$/;

  function ageFromDob(dob) {
    if (!dob) return NaN;
    const birth = new Date(`${dob}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return NaN;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthday = today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
    if (beforeBirthday) age--;
    return age;
  }

  function validate(student, records, excludedId = null) {
    const errors = [];
    const name = String(student.studentName || '').trim();
    if (name.length < 2 || name.length > 50) errors.push('Student name must be 2–50 characters.');
    if (!String(student.enrollmentNo || '').trim()) errors.push('Enrollment number is required.');
    if (!student.email || !EMAIL_RE.test(student.email)) errors.push('Enter a valid email address.');
    if (!MOBILE_RE.test(String(student.mobile || ''))) errors.push('Mobile must contain exactly 10 digits.');
    if (!student.dateOfBirth) errors.push('Date of birth is required.');

    const calculatedAge = ageFromDob(student.dateOfBirth);
    const age = Number(student.age);
    if (!Number.isFinite(age) || age < 18 || age > 60) errors.push('Age must be between 18 and 60.');
    if (Number.isFinite(calculatedAge) && calculatedAge !== age) errors.push('Age must match the date of birth.');
    if (!['Male', 'Female', 'Other'].includes(student.gender)) errors.push('Select a valid gender.');
    if (!String(student.course || '').trim()) errors.push('Course is required.');
    if (!String(student.specialization || '').trim()) errors.push('Specialization is required.');
    if (!Number.isInteger(Number(student.semester)) || Number(student.semester) < 1 || Number(student.semester) > 6) errors.push('Semester must be from 1 to 6.');
    if (!String(student.address || '').trim()) errors.push('Address is required.');
    if (!String(student.city || '').trim()) errors.push('City is required.');
    if (!String(student.state || '').trim()) errors.push('State is required.');
    if (!Array.isArray(student.skills) || student.skills.length === 0) errors.push('Select at least one skill.');
    if (!Array.isArray(student.hobbies) || student.hobbies.length === 0) errors.push('Select at least one hobby.');

    const enrollment = String(student.enrollmentNo || '').trim().toLowerCase();
    const email = String(student.email || '').trim().toLowerCase();
    const duplicates = records.filter(r => r.studentId !== excludedId);
    if (enrollment && duplicates.some(r => String(r.enrollmentNo).trim().toLowerCase() === enrollment)) errors.push('Enrollment number already exists.');
    if (email && duplicates.some(r => String(r.email).trim().toLowerCase() === email)) errors.push('Email already exists.');

    if (student._photoFile) {
      const file = student._photoFile;
      if (!['image/jpeg', 'image/png'].includes(file.type)) errors.push('Passport photo must be JPG or PNG.');
      if (file.size > MAX_PHOTO_BYTES) errors.push('Passport photo must be 2 MB or smaller.');
    } else if (!student.passportPhoto) {
      errors.push('Passport photo is required.');
    }
    return errors;
  }

  return { validate, ageFromDob, MAX_PHOTO_BYTES };
})();
