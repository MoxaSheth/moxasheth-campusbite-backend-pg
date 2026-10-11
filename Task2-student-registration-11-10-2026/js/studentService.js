const StudentService = (() => {
  let students = StudentStorage.load();

  function all() {
    return students.map(s => ({ ...s, skills: [...(s.skills || [])], hobbies: [...(s.hobbies || [])] }));
  }

  function persist(next) {
    StudentStorage.save(next);
    students = next;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Unable to read passport photo.'));
      reader.readAsDataURL(file);
    });
  }

  function clean(student) {
    const result = { ...student };
    delete result._photoFile;
    return result;
  }

  async function create(student) {
    const errors = StudentValidation.validate(student, students);
    if (errors.length) return { ok: false, errors };
    const photo = student._photoFile ? await fileToDataUrl(student._photoFile) : student.passportPhoto;
    const record = clean({
      ...student,
      studentId: crypto.randomUUID ? crypto.randomUUID() : `stu_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      studentName: student.studentName.trim(),
      enrollmentNo: student.enrollmentNo.trim(),
      email: student.email.trim(),
      age: Number(student.age),
      semester: Number(student.semester),
      passportPhoto: photo
    });
    const next = [...students, record];
    persist(next);
    return { ok: true, count: 1 };
  }

  async function bulkCreate(batch) {
    if (!batch.length) return { ok: false, errors: ['No student records were submitted.'] };
    const errors = [];
    const seenEnrollment = new Set(students.map(s => String(s.enrollmentNo).toLowerCase()));
    const seenEmail = new Set(students.map(s => String(s.email).toLowerCase()));
    for (let i = 0; i < batch.length; i++) {
      const student = batch[i];
      const rowErrors = StudentValidation.validate(student, students);
      const enrollment = String(student.enrollmentNo || '').trim().toLowerCase();
      const email = String(student.email || '').trim().toLowerCase();
      if (enrollment && seenEnrollment.has(enrollment)) rowErrors.push('Duplicate enrollment number within the submitted batch.');
      if (email && seenEmail.has(email)) rowErrors.push('Duplicate email within the submitted batch.');
      if (enrollment) seenEnrollment.add(enrollment);
      if (email) seenEmail.add(email);
      if (rowErrors.length) errors.push(`Record ${i + 1}: ${[...new Set(rowErrors)].join(' ')}`);
    }
    if (errors.length) return { ok: false, errors };

    const records = [];
    for (const student of batch) {
      const photo = student._photoFile ? await fileToDataUrl(student._photoFile) : student.passportPhoto;
      records.push(clean({
        ...student,
        studentId: crypto.randomUUID ? crypto.randomUUID() : `stu_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        studentName: student.studentName.trim(),
        enrollmentNo: student.enrollmentNo.trim(),
        email: student.email.trim(),
        age: Number(student.age),
        semester: Number(student.semester),
        passportPhoto: photo
      }));
    }
    persist([...students, ...records]);
    return { ok: true, count: records.length };
  }

  async function update(id, changes) {
    const current = students.find(s => s.studentId === id);
    if (!current) return { ok: false, errors: ['Student record was not found.'] };
    const merged = { ...current, ...changes, studentId: id };
    const errors = StudentValidation.validate(merged, students, id);
    if (errors.length) return { ok: false, errors };
    if (merged._photoFile) merged.passportPhoto = await fileToDataUrl(merged._photoFile);
    const next = students.map(s => s.studentId === id ? clean({
      ...merged,
      studentName: merged.studentName.trim(),
      enrollmentNo: merged.enrollmentNo.trim(),
      email: merged.email.trim(),
      age: Number(merged.age),
      semester: Number(merged.semester)
    }) : s);
    persist(next);
    return { ok: true, count: 1 };
  }

  async function bulkUpdate(changesById) {
    if (!changesById.length) return { ok: false, errors: ['No student records selected for update.'] };
    const changedIds = new Set(changesById.map(item => item.studentId));
    let finalList = students.map(s => {
      const changes = changesById.find(item => item.studentId === s.studentId);
      return changes ? { ...s, ...changes, studentId: s.studentId } : { ...s };
    });
    const errors = [];
    const enrollmentSet = new Set();
    const emailSet = new Set();

    for (const item of changesById) {
      if (!students.some(s => s.studentId === item.studentId)) errors.push(`Student ${item.studentId}: record not found.`);
    }
    for (let i = 0; i < finalList.length; i++) {
      const record = finalList[i];
      const old = students.find(s => s.studentId === record.studentId);
      const changes = changesById.find(item => item.studentId === record.studentId);
      if (changes) {
        const merged = { ...record, _photoFile: changes._photoFile };
        const validationRecords = finalList.filter(s => s.studentId !== record.studentId);
        const rowErrors = StudentValidation.validate(merged, validationRecords, record.studentId);
        if (rowErrors.length) errors.push(`${record.studentName || record.studentId}: ${[...new Set(rowErrors)].join(' ')}`);
      }
      const en = String(record.enrollmentNo || '').trim().toLowerCase();
      const em = String(record.email || '').trim().toLowerCase();
      if (enrollmentSet.has(en)) errors.push(`${record.studentName}: duplicate enrollment number in final list.`);
      if (emailSet.has(em)) errors.push(`${record.studentName}: duplicate email in final list.`);
      enrollmentSet.add(en); emailSet.add(em);
    }
    if (errors.length) return { ok: false, errors: [...new Set(errors)] };

    for (let i = 0; i < finalList.length; i++) {
      const changes = changesById.find(item => item.studentId === finalList[i].studentId);
      if (changes && changes._photoFile) finalList[i].passportPhoto = await fileToDataUrl(changes._photoFile);
      finalList[i] = clean({
        ...finalList[i],
        studentName: finalList[i].studentName.trim(),
        enrollmentNo: finalList[i].enrollmentNo.trim(),
        email: finalList[i].email.trim(),
        age: Number(finalList[i].age),
        semester: Number(finalList[i].semester)
      });
    }
    persist(finalList);
    return { ok: true, count: changesById.length };
  }

  function remove(id) {
    const next = students.filter(s => s.studentId !== id);
    const deleted = students.length - next.length;
    if (deleted) persist(next);
    return { ok: true, count: deleted };
  }

  function bulkRemove(ids) {
    if (!ids.length) return { ok: false, errors: ['Select at least one student to delete.'] };
    const idSet = new Set(ids);
    const next = students.filter(s => !idSet.has(s.studentId));
    const deleted = students.length - next.length;
    if (deleted) persist(next);
    return { ok: true, count: deleted };
  }

  return { all, create, bulkCreate, update, bulkUpdate, remove, bulkRemove };
})();
