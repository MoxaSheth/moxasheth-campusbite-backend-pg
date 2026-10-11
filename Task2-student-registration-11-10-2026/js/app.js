const formContainer = document.getElementById('registrationForms');
const formTemplate = document.getElementById('studentFormTemplate');
const formMessage = document.getElementById('formMessage');
const listMessage = document.getElementById('listMessage');
const tbody = document.getElementById('studentTableBody');
const countLabel = document.getElementById('studentCount');
const bulkEditBtn = document.getElementById('bulkEditBtn');
const saveBulkBtn = document.getElementById('saveBulkBtn');
const cancelBulkBtn = document.getElementById('cancelBulkBtn');
const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
const selectAll = document.getElementById('selectAll');

let bulkEditing = false;
let selectedIds = new Set();
let bulkOriginal = new Map();
let individualEditing = new Set();
let nextFormNumber = 0;

function showMessage(element, message, type = 'success') {
  element.textContent = message;
  element.className = `message show ${type}`;
}
function clearMessage(element) {
  element.textContent = '';
  element.className = 'message';
}
function uniqueValues(root, selector) {
  return [...root.querySelectorAll(selector)].filter(input => input.checked).map(input => input.value);
}
function readRegistrationForm(form) {
  const get = name => form.elements.namedItem(name);
  return {
    studentName: get('studentName').value.trim(),
    enrollmentNo: get('enrollmentNo').value.trim(),
    email: get('email').value.trim(),
    mobile: get('mobile').value.trim(),
    dateOfBirth: get('dateOfBirth').value,
    age: Number(get('age').value),
    gender: get('gender').value,
    course: get('course').value,
    specialization: get('specialization').value.trim(),
    semester: Number(get('semester').value),
    address: get('address').value.trim(),
    city: get('city').value.trim(),
    state: get('state').value.trim(),
    skills: uniqueValues(form, 'input[name="skills"]'),
    hobbies: uniqueValues(form, 'input[name="hobbies"]'),
    passportPhoto: '',
    _photoFile: get('passportPhoto').files[0] || null
  };
}
function addRegistrationForm() {
  nextFormNumber++;
  const fragment = formTemplate.content.cloneNode(true);
  const form = fragment.querySelector('.student-entry');
  form.dataset.formNumber = String(nextFormNumber);
  form.querySelector('.entry-title').textContent = `Student Form ${nextFormNumber}`;
  form.querySelector('.remove-form-btn').addEventListener('click', () => {
    if (formContainer.querySelectorAll('.student-entry').length === 1) {
      form.reset();
      showMessage(formMessage, 'At least one student form must remain. The form has been cleared.');
    } else {
      form.remove();
      renumberForms();
    }
  });
  form.querySelector('[name="dateOfBirth"]').addEventListener('change', event => {
    const age = StudentValidation.ageFromDob(event.target.value);
    form.elements.namedItem('age').value = Number.isFinite(age) ? age : '';
  });
  formContainer.append(fragment);
  renumberForms();
}
function renumberForms() {
  [...formContainer.querySelectorAll('.student-entry')].forEach((form, index) => {
    form.querySelector('.entry-title').textContent = `Student Form ${index + 1}`;
  });
}
function getRowField(row, name) { return row.querySelector(`[data-field="${name}"]`); }
function getRowChecks(row, group) {
  return [...row.querySelectorAll(`[data-group="${group}"]:checked`)].map(input => input.value);
}
function collectRow(row) {
  const current = StudentService.all().find(s => s.studentId === row.dataset.id);
  const photoInput = getRowField(row, 'passportPhoto');
  return {
    studentId: row.dataset.id,
    studentName: getRowField(row, 'studentName').value.trim(),
    enrollmentNo: getRowField(row, 'enrollmentNo').value.trim(),
    email: getRowField(row, 'email').value.trim(),
    mobile: getRowField(row, 'mobile').value.trim(),
    dateOfBirth: getRowField(row, 'dateOfBirth').value,
    age: Number(getRowField(row, 'age').value),
    gender: getRowField(row, 'gender').value,
    course: getRowField(row, 'course').value,
    specialization: getRowField(row, 'specialization').value.trim(),
    semester: Number(getRowField(row, 'semester').value),
    address: getRowField(row, 'address').value.trim(),
    city: getRowField(row, 'city').value.trim(),
    state: getRowField(row, 'state').value.trim(),
    skills: getRowChecks(row, 'skills'),
    hobbies: getRowChecks(row, 'hobbies'),
    passportPhoto: current ? current.passportPhoto : '',
    _photoFile: photoInput && photoInput.files[0] ? photoInput.files[0] : null
  };
}
function makeField(labelText, name, value, type = 'text', options = null, disabled = true) {
  const label = document.createElement('label');
  label.textContent = labelText;
  let input;
  if (options) {
    input = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = ''; placeholder.textContent = 'Select';
    input.append(placeholder);
    options.forEach(item => {
      const option = document.createElement('option');
      option.value = item; option.textContent = item; input.append(option);
    });
  } else if (type === 'textarea') {
    input = document.createElement('textarea'); input.rows = 2;
  } else {
    input = document.createElement('input'); input.type = type;
  }
  input.dataset.field = name;
  input.value = value == null ? '' : String(value);
  input.disabled = disabled;
  if (!disabled) input.classList.add('editing');
  label.append(input);
  return label;
}
function makeCheckGroup(titleText, groupName, chosen, options, disabled = true) {
  const wrapper = document.createElement('div'); wrapper.className = 'wide';
  const title = document.createElement('strong'); title.textContent = titleText; title.style.fontSize = '.78rem';
  wrapper.append(title);
  const list = document.createElement('div'); list.className = 'inline-checks';
  options.forEach(value => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox'; input.value = value; input.dataset.group = groupName;
    input.checked = chosen.includes(value); input.disabled = disabled;
    if (!disabled) input.classList.add('editing');
    label.append(input, document.createTextNode(value)); list.append(label);
  });
  wrapper.append(list); return wrapper;
}
const skillOptions = ['HTML', 'CSS', 'JavaScript', 'Java', 'Python', 'SQL'];
const hobbyOptions = ['Reading', 'Cricket', 'Music', 'Travel', 'Gaming', 'Drawing'];

function render() {
  const students = StudentService.all();
  countLabel.textContent = `${students.length} student(s)`;
  tbody.replaceChildren();
  selectAll.checked = students.length > 0 && students.every(s => selectedIds.has(s.studentId));
  if (!students.length) {
    const tr = document.createElement('tr'); const td = document.createElement('td');
    td.colSpan = 5; td.className = 'empty'; td.textContent = 'No students registered yet. Use the form above to add student records.';
    tr.append(td); tbody.append(tr); return;
  }

  students.forEach(student => {
    const row = document.createElement('tr');
    row.dataset.id = student.studentId;
    const rowIsEditing = bulkEditing || individualEditing.has(student.studentId);
    if (rowIsEditing) row.classList.add('student-row-editing');

    const selectCell = document.createElement('td');
    const selectBox = document.createElement('input'); selectBox.type = 'checkbox';
    selectBox.checked = selectedIds.has(student.studentId);
    selectBox.setAttribute('aria-label', `Select ${student.studentName}`);
    selectBox.addEventListener('change', () => {
      selectBox.checked ? selectedIds.add(student.studentId) : selectedIds.delete(student.studentId);
      selectAll.checked = students.every(s => selectedIds.has(s.studentId));
    });
    selectCell.append(selectBox); row.append(selectCell);

    const photoCell = document.createElement('td');
    const photo = document.createElement('img'); photo.className = 'student-photo'; photo.alt = 'Student passport photo';
    photo.src = student.passportPhoto || 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#edf1f7"/><circle cx="40" cy="29" r="14" fill="#b7c3d5"/><path d="M12 78c2-20 13-29 28-29s26 9 28 29" fill="#b7c3d5"/></svg>');
    photoCell.append(photo); row.append(photoCell);

    const detailsCell = document.createElement('td');
    const details = document.createElement('div'); details.className = 'student-details';
    const fieldDisabled = !rowIsEditing;
    details.append(
      makeField('Student Name', 'studentName', student.studentName, 'text', null, fieldDisabled),
      makeField('Enrollment No.', 'enrollmentNo', student.enrollmentNo, 'text', null, fieldDisabled),
      makeField('Email', 'email', student.email, 'email', null, fieldDisabled),
      makeField('Mobile', 'mobile', student.mobile, 'tel', null, fieldDisabled),
      makeField('Date of Birth', 'dateOfBirth', student.dateOfBirth, 'date', null, fieldDisabled),
      makeField('Age', 'age', student.age, 'number', null, fieldDisabled),
      makeField('Gender', 'gender', student.gender, 'text', ['Male','Female','Other'], fieldDisabled),
      makeField('Course', 'course', student.course, 'text', ['MCA','BCA','BSc IT','BTech','Other'], fieldDisabled),
      makeField('Specialization', 'specialization', student.specialization, 'text', null, fieldDisabled),
      makeField('Semester', 'semester', student.semester, 'text', ['1','2','3','4','5','6'], fieldDisabled),
      makeField('City', 'city', student.city, 'text', null, fieldDisabled),
      makeField('State', 'state', student.state, 'text', null, fieldDisabled),
      makeField('Address', 'address', student.address, 'textarea', null, fieldDisabled)
    );
    const photoLabel = document.createElement('label'); photoLabel.className = 'wide'; photoLabel.textContent = 'Passport Photo (JPG/PNG, max 2 MB)';
    const photoInput = document.createElement('input'); photoInput.type = 'file'; photoInput.accept = 'image/jpeg,image/png';
    photoInput.dataset.field = 'passportPhoto'; photoInput.disabled = fieldDisabled;
    if (!fieldDisabled) photoInput.classList.add('editing');
    photoLabel.append(photoInput); details.append(photoLabel);
    details.append(
      makeCheckGroup('Skills', 'skills', student.skills || [], skillOptions, fieldDisabled),
      makeCheckGroup('Hobbies', 'hobbies', student.hobbies || [], hobbyOptions, fieldDisabled)
    );
    const dobInput = details.querySelector('[data-field="dateOfBirth"]');
    dobInput.addEventListener('change', () => {
      if (rowIsEditing) {
        const calculated = StudentValidation.ageFromDob(dobInput.value);
        getRowField(row, 'age').value = Number.isFinite(calculated) ? calculated : '';
      }
    });
    // One-click inline editing: clicking a field or its label activates editing for this student.
    // In Bulk Edit mode all rows are already editable, so this handler does nothing there.
    if (!bulkEditing && !individualEditing.has(student.studentId)) {
      details.addEventListener('click', event => {
        const target = event.target;
        if (target.closest('label') || target.matches('input, select, textarea')) {
          individualEditing.add(student.studentId);
          render();
          const refreshedRow = [...tbody.querySelectorAll('tr[data-id]')]
            .find(item => item.dataset.id === student.studentId);
          if (refreshedRow) {
            const fieldName = target.dataset.field || target.closest('label')?.querySelector('[data-field]')?.dataset.field;
            const refreshedField = fieldName ? getRowField(refreshedRow, fieldName) : null;
            if (refreshedField) refreshedField.focus();
          }
        }
      });
      // Labels make it clear that a field can be edited with one click.
      details.querySelectorAll('label').forEach(label => {
        label.title = 'Click to edit this student';
        label.style.cursor = 'pointer';
      });
    }
    detailsCell.append(details); row.append(detailsCell);

    const infoCell = document.createElement('td'); infoCell.className = 'tags';
    infoCell.textContent = `Skills: ${(student.skills || []).join(', ')}\nHobbies: ${(student.hobbies || []).join(', ')}`;
    infoCell.style.whiteSpace = 'pre-line'; row.append(infoCell);

    const actionCell = document.createElement('td'); const actionBox = document.createElement('div'); actionBox.className = 'row-actions';
    if (bulkEditing) {
      const info = document.createElement('span'); info.textContent = 'Bulk edit active'; info.style.fontSize = '.75rem'; actionBox.append(info);
    } else if (individualEditing.has(student.studentId)) {
      const save = document.createElement('button'); save.className = 'primary'; save.textContent = 'Save';
      save.addEventListener('click', async () => {
        const result = await StudentService.update(student.studentId, collectRow(row));
        if (!result.ok) { showMessage(listMessage, result.errors.join('\n'), 'error'); return; }
        individualEditing.delete(student.studentId);
        showMessage(listMessage, 'Student updated successfully.');
        render();
      });
      const cancel = document.createElement('button'); cancel.className = 'secondary'; cancel.textContent = 'Cancel';
      cancel.addEventListener('click', () => { individualEditing.delete(student.studentId); clearMessage(listMessage); render(); });
      actionBox.append(save, cancel);
    } else {
      const edit = document.createElement('button'); edit.className = 'secondary'; edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        if (bulkEditing) return;
        individualEditing.add(student.studentId); render();
      });
      const del = document.createElement('button'); del.className = 'danger'; del.textContent = 'Delete';
      del.addEventListener('click', () => {
        if (confirm(`Delete ${student.studentName}? This cannot be undone.`)) {
          const result = StudentService.remove(student.studentId);
          selectedIds.delete(student.studentId);
          showMessage(listMessage, `${result.count} student(s) deleted.`);
          render();
        }
      });
      actionBox.append(edit, del);
    }
    actionCell.append(actionBox); row.append(actionCell);
    tbody.append(row);
  });
}

document.getElementById('addStudentFormBtn').addEventListener('click', () => {
  addRegistrationForm();
  clearMessage(formMessage);
});
document.getElementById('clearFormsBtn').addEventListener('click', () => {
  if (!confirm('Clear all unsaved student forms?')) return;
  formContainer.replaceChildren();
  addRegistrationForm();
  clearMessage(formMessage);
});
document.getElementById('bulkInsertBtn').addEventListener('click', async () => {
  clearMessage(formMessage);
  const forms = [...formContainer.querySelectorAll('.student-entry')];
  const batch = forms.map(readRegistrationForm);
  const result = await StudentService.bulkCreate(batch);
  if (!result.ok) {
    showMessage(formMessage, result.errors.join('\n'), 'error');
    return;
  }
  showMessage(formMessage, `${result.count} student(s) inserted successfully.`);
  formContainer.replaceChildren();
  addRegistrationForm();
  render();
});
bulkEditBtn.addEventListener('click', () => {
  if (individualEditing.size) {
    showMessage(listMessage, 'Save or cancel individual edits before activating Bulk Edit.', 'error');
    return;
  }
  bulkEditing = true;
  bulkOriginal = new Map(StudentService.all().map(s => [s.studentId, JSON.stringify(s)]));
  bulkEditBtn.hidden = true; saveBulkBtn.hidden = false; cancelBulkBtn.hidden = false;
  showMessage(listMessage, 'BULK EDIT ACTIVE: all fields for every student are editable. Change any fields, then click Save Changes once to save all updated students.');
  render();
});
cancelBulkBtn.addEventListener('click', () => {
  if (!confirm('Discard all unsaved bulk edits?')) return;
  bulkEditing = false; bulkOriginal.clear();
  bulkEditBtn.hidden = false; saveBulkBtn.hidden = true; cancelBulkBtn.hidden = true;
  clearMessage(listMessage); render();
});
saveBulkBtn.addEventListener('click', async () => {
  const rows = [...tbody.querySelectorAll('tr[data-id]')];
  const changed = rows.map(collectRow).filter(record => {
    const old = bulkOriginal.get(record.studentId);
    if (!old) return true;
    const before = JSON.parse(old);
    const comparable = item => JSON.stringify({
      studentName: item.studentName, enrollmentNo: item.enrollmentNo, email: item.email,
      mobile: item.mobile, dateOfBirth: item.dateOfBirth, age: Number(item.age),
      gender: item.gender, course: item.course, specialization: item.specialization,
      semester: Number(item.semester), address: item.address, city: item.city, state: item.state,
      skills: item.skills, hobbies: item.hobbies
    });
    return comparable(before) !== comparable(record) || Boolean(record._photoFile);
  });
  if (!changed.length) {
    showMessage(listMessage, 'No changes to save.');
    bulkEditing = false; bulkOriginal.clear();
    bulkEditBtn.hidden = false; saveBulkBtn.hidden = true; cancelBulkBtn.hidden = true; render(); return;
  }
  const result = await StudentService.bulkUpdate(changed);
  if (!result.ok) { showMessage(listMessage, result.errors.join('\n'), 'error'); return; }
  showMessage(listMessage, `${result.count} student record(s) updated successfully.`);
  bulkEditing = false; bulkOriginal.clear();
  bulkEditBtn.hidden = false; saveBulkBtn.hidden = true; cancelBulkBtn.hidden = true;
  render();
});
bulkDeleteBtn.addEventListener('click', () => {
  const ids = [...selectedIds];
  if (!ids.length) { showMessage(listMessage, 'Select at least one student to delete.', 'error'); return; }
  if (!confirm(`Delete ${ids.length} selected student(s)? This cannot be undone.`)) return;
  const result = StudentService.bulkRemove(ids);
  ids.forEach(id => selectedIds.delete(id));
  showMessage(listMessage, `${result.count} student(s) deleted.`);
  render();
});
selectAll.addEventListener('change', () => {
  const students = StudentService.all();
  selectedIds = selectAll.checked ? new Set(students.map(s => s.studentId)) : new Set();
  render();
});

addRegistrationForm();
render();
