let students = JSON.parse(localStorage.getItem("students")) || [];

const form = document.getElementById("studentForm");
const tableBody = document.getElementById("studentTableBody");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");

function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const month = today.getMonth() - dob.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

function getValue(id) {
  return document.getElementById(id).value.trim();
}

function getRadioValue(name) {
  const selected = document.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "";
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)]
    .map(input => input.value);
}

function showError(field, message) {
  document.getElementById(field + "Error").textContent = message;
}

function clearErrors() {
  document.querySelectorAll("small").forEach(element => {
    element.textContent = "";
  });
}

function validateStudent(student) {
  clearErrors();

  let valid = true;

  if (
    !student.studentName ||
    student.studentName.length < 2 ||
    student.studentName.length > 50
  ) {
    showError("studentName", "Name must be 2–50 characters");
    valid = false;
  }

  const duplicateEnrollment = students.some(
    item =>
      item.enrollmentNo.toLowerCase() === student.enrollmentNo.toLowerCase() &&
      item.id !== student.id
  );

  if (!student.enrollmentNo) {
    showError("enrollmentNo", "Enrollment No is required");
    valid = false;
  } else if (duplicateEnrollment) {
    showError("enrollmentNo", "Enrollment No already exists");
    valid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const duplicateEmail = students.some(
    item =>
      item.email.toLowerCase() === student.email.toLowerCase() &&
      item.id !== student.id
  );

  if (!student.email || !emailPattern.test(student.email)) {
    showError("email", "Enter a valid email");
    valid = false;
  } else if (duplicateEmail) {
    showError("email", "Email already exists");
    valid = false;
  }

  if (!/^[0-9]{10}$/.test(student.mobile)) {
    showError("mobile", "Mobile must be exactly 10 digits");
    valid = false;
  }

  if (!student.dateOfBirth) {
    showError("dateOfBirth", "Date of Birth is required");
    valid = false;
  }

  const calculatedAge = calculateAge(student.dateOfBirth);

  if (student.age < 18 || student.age > 60 || calculatedAge !== student.age) {
    showError("age", "Age must be 18–60 and match DOB");
    valid = false;
  }

  if (!student.gender) {
    showError("gender", "Select gender");
    valid = false;
  }

  if (!student.course) {
    showError("course", "Select course");
    valid = false;
  }

  if (!student.specialization) {
    showError("specialization", "Specialization is required");
    valid = false;
  }

  if (student.semester < 1 || student.semester > 6) {
    showError("semester", "Semester must be 1–6");
    valid = false;
  }

  if (!student.address) {
    showError("address", "Address is required");
    valid = false;
  }

  if (!student.city) {
    showError("city", "City is required");
    valid = false;
  }

  if (!student.state) {
    showError("state", "State is required");
    valid = false;
  }

  if (student.skills.length < 1) {
    showError("skills", "Select at least one skill");
    valid = false;
  }

  if (student.hobbies.length < 1) {
    showError("hobbies", "Select at least one hobby");
    valid = false;
  }



  return valid;
}

function getFormStudent() {
  const photoInput = document.getElementById("passportPhoto");

  let photo = "";

  if (photoInput.files.length > 0) {
    const file = photoInput.files[0];

    if (file.size > 2 * 1024 * 1024) {
      showError("passportPhoto", "Photo must be maximum 2 MB");
      return null;
    }

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      showError("passportPhoto", "Only JPG/PNG files are allowed");
      return null;
    }

    photo = file.name;
  }

  return {
    id: document.getElementById("studentId").value,
    studentName: getValue("studentName"),
    enrollmentNo: getValue("enrollmentNo"),
    email: getValue("email"),
    mobile: getValue("mobile"),
    dateOfBirth: getValue("dateOfBirth"),
    age: Number(getValue("age")),
    gender: getRadioValue("gender"),
    course: getValue("course"),
    specialization: getValue("specialization"),
    semester: Number(getValue("semester")),
    address: getValue("address"),
    city: getValue("city"),
    state: getValue("state"),
    skills: getCheckedValues("skills"),
    hobbies: getCheckedValues("hobbies"),
    passportPhoto: photo,
    updatedAt: new Date().toISOString()
  };
}

function saveData() {
  localStorage.setItem("students", JSON.stringify(students));
}

function renderStudents() {
  tableBody.innerHTML = "";

  students.forEach(student => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${student.studentName}</td>
      <td>${student.enrollmentNo}</td>
      <td>${student.email}</td>
      <td>${student.mobile}</td>
      <td>${student.course}</td>
      <td>${student.semester}</td>
      <td>${student.gender}</td>
      <td>${student.city}</td>
      <td>${student.state}</td>
      <td>${student.skills}</td>
      <td>${student.hobbies}</td>
      <td>${student.photo}</td>
      <td>
        <button class="edit" onclick="editStudent('${student.id}')">Edit</button>
        <button class="delete" onclick="deleteStudent('${student.id}')">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
}

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const existingId = document.getElementById("studentId").value;
  const oldStudent = students.find(student => student.id === existingId);

  const student = getFormStudent();

  if (!student) {
    return;
  }

  if (!student.passportPhoto && oldStudent) {
    student.passportPhoto = oldStudent.passportPhoto;
  }

  const isNewStudent = !existingId;

  if (!validateStudent(student, isNewStudent)) {
    return;
  }

  if (isNewStudent) {
    student.id = Date.now().toString();
    student.createdAt = new Date().toISOString();
    students.push(student);
    alert("Student added successfully");
  } else {
    const index = students.findIndex(item => item.id === existingId);
    students[index] = student;
    students[index].createdAt = oldStudent.createdAt;
    alert("Student updated successfully");
  }

  saveData();
  renderStudents();
  resetForm();
});

function editStudent(id) {
  const student = students.find(item => item.id === id);

  if (!student) {
    return;
  }

  document.getElementById("studentId").value = student.id;
  document.getElementById("studentName").value = student.studentName;
  document.getElementById("enrollmentNo").value = student.enrollmentNo;
  document.getElementById("email").value = student.email;
  document.getElementById("mobile").value = student.mobile;
  document.getElementById("dateOfBirth").value = student.dateOfBirth;
  document.getElementById("age").value = student.age;
  document.getElementById("course").value = student.course;
  document.getElementById("specialization").value = student.specialization;
  document.getElementById("semester").value = student.semester;
  document.getElementById("address").value = student.address;
  document.getElementById("city").value = student.city;
  document.getElementById("state").value = student.state;

  document.querySelectorAll('input[name="gender"]').forEach(input => {
    input.checked = input.value === student.gender;
  });

  document.querySelectorAll('input[name="skills"]').forEach(input => {
    input.checked = student.skills.includes(input.value);
  });

  document.querySelectorAll('input[name="hobbies"]').forEach(input => {
    input.checked = student.hobbies.includes(input.value);
  });

  saveButton.textContent = "Update Student";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteStudent(id) {
  const student = students.find(item => item.id === id);

  if (!student) {
    return;
  }

  const confirmDelete = confirm(
    `Delete ${student.studentName}?`
  );

  if (!confirmDelete) {
    return;
  }

  students = students.filter(item => item.id !== id);

  saveData();
  renderStudents();
  alert("Student deleted successfully");
}

function resetForm() {
  form.reset();
  document.getElementById("studentId").value = "";
  saveButton.textContent = "Add Student";
  clearErrors();
}

cancelButton.addEventListener("click", resetForm);

renderStudents();