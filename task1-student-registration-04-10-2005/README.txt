STUDENT MANAGEMENT SYSTEM

FILES
index.html       -> Student form and table
style.css        -> Design
script.js        -> CRUD and validation
students.json    -> Sample JSON data file
studentForm.json -> Complete field configuration

CRUD
Create -> Add Student
Read   -> Student List
Update -> Edit button
Delete -> Delete button

VALIDATION
Student Name: 2-50 characters
Enrollment No: required and unique
Email: valid and unique
Mobile: exactly 10 digits
Date of Birth: required
Age: 18-60 and checked against DOB
Gender: Male/Female/Other
Course: required
Specialization: required
Semester: 1-6
Address: required
City: required
State: required
Skills: minimum one
Hobbies: minimum one
Passport Photo: JPG/PNG, maximum 2 MB

HOW TO RUN
Simply open index.html in your browser.

No installation is required.

IMPORTANT
A normal browser cannot directly modify students.json because of browser security.
Therefore CRUD data is saved in browser LocalStorage.

students.json is included as the JSON data structure/reference required for the task.
