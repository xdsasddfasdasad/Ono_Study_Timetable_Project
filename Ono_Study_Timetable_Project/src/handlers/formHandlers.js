import { saveRecord, updateRecord, deleteRecord } from "../utils/storage";
import { hashPassword } from "../utils/hash"; // only used for Students
import { validateStudentForm, validateCourseForm, validateYearForm, validateTaskForm, validateEventForm } from "../utils/validateForm"; // adjust imports as needed

const validationMap = {
  students: validateStudentForm,
  courses: validateCourseForm,
  years: validateYearForm,
  tasks: validateTaskForm,
  events: validateEventForm,
  // Add more mappings if needed
};

const matchKeyMap = {
  students: "id",
  courses: "courseCode",
  years: "yearCode",
  lecturers: "id",
  sites: "siteCode",
  rooms: "roomCode",
  holidays: "holidayCode",
  vacations: "vacationCode",
  events: "eventCode",
  tasks: "assignmentCode",
};

export const handleEntityFormSubmit = async (entityKey, formData, onSuccess, onError) => {
  try {
    const validate = validationMap[entityKey];
    if (validate) {
      const errors = validate(formData);
      if (Object.keys(errors).length > 0) {
        onError("Validation failed", errors);
        return;
      }
    }

    let preparedData = { ...formData };

    if (entityKey === "students") {
      preparedData.password = await hashPassword(formData.password);
    }

    const success = saveRecord(entityKey, preparedData);

    if (success) {
      onSuccess(`${entityKey} record saved successfully!`);
    } else {
      onError(`Failed to save ${entityKey} record.`);
    }
  } catch (error) {
    console.error(`Error in handleEntityFormSubmit for ${entityKey}:`, error);
    onError("Unexpected error occurred.");
  }
};

export const handleUpdateEntityFormSubmit = async (entityKey, formData, onSuccess, onError) => {
  try {
    const validate = validationMap[entityKey];
    if (validate) {
      const errors = validate(formData, [], { skipPassword: true });
      if (Object.keys(errors).length > 0) {
        onError("Validation failed", errors);
        return;
      }
    }

    let preparedData = { ...formData };

    if (entityKey === "students" && preparedData.password) {
      preparedData.password = await hashPassword(formData.password);
    }

    const matchKey = matchKeyMap[entityKey];
    const success = updateRecord(entityKey, matchKey, preparedData);

    if (success) {
      onSuccess(`${entityKey} record updated successfully!`);
    } else {
      onError(`Failed to update ${entityKey} record.`);
    }
  } catch (error) {
    console.error(`Error in handleUpdateEntityFormSubmit for ${entityKey}:`, error);
    onError("Unexpected error occurred.");
  }
};

export const handleDeleteEntityFormSubmit = (entityKey, matchValue, onSuccess, onError) => {
  try {
    const matchKey = matchKeyMap[entityKey];
    const success = deleteRecord(entityKey, matchKey, matchValue);

    if (success) {
      onSuccess(`${entityKey} record deleted successfully!`);
    } else {
      onError(`Failed to delete ${entityKey} record.`);
    }
  } catch (error) {
    console.error(`Error in handleDeleteEntityFormSubmit for ${entityKey}:`, error);
    onError("Unexpected error occurred.");
  }
};
