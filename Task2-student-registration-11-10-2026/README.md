# Student Registration System — JavaScript + JSON

Browser-based student registration project implementing the provided task requirements.

## Features
- Add one or more student forms using **Add Another Student Form**.
- **Bulk Insert Students** validates every form and inserts all records together only if the complete batch is valid.
- Required-field, name length, email, unique enrollment/email, 10-digit mobile, DOB/age, semester, skills, hobbies, and JPG/PNG photo (max 2 MB) validation.
- Student list shows every field as the appropriate input/control, disabled by default.
- Individual Edit/Save/Cancel and Delete actions.
- Bulk Edit with highlighted editable controls, Save Changes and Cancel.
- Bulk Delete with confirmation.
- Records persist in Local Storage under `studentRecords` using JSON serialization.
- Responsive layout.

## Run
1. Open this folder in Visual Studio Code.
2. Open `index.html` using the Live Server extension.
3. Add multiple student forms and click **Bulk Insert Students**.

## Notes
- `data/sample-students.json` is sample data only; it is not automatically imported into Local Storage.
- This is a browser-only implementation; it does not use Node.js or a database.
- Photos are stored as data URLs in Local Storage. Browser storage capacity is limited, so avoid many large photos.


## Inline and bulk editing (updated)
- To edit one student's details quickly, click any field or field label in that student's details. The row becomes editable and shows **Save** and **Cancel**.
- To edit several students at once, click **Bulk Edit**. All student fields become editable together.
- After bulk editing, click **Save Changes** once. The app validates the edited records and saves all changed students together.
- Use **Cancel Bulk Edit** to discard unsaved changes.
