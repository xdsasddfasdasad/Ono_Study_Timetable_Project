// src/handlers/formHandlers.js

import { saveRecord, updateRecord, deleteRecord, getRecords } from "../utils/storage";
import { hashPassword } from "../utils/hash"; // Only for students
import { validateFormByType } from "../utils/validateForm";

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

export const handleSaveOrUpdateRecord = async (entityKey, formData, actionType) => {
  try {
    const matchKey = matchKeyMap[entityKey];
    if (!matchKey) {
      return { success: false, message: `Unknown entityKey: ${entityKey}` };
    }

    const existingRecords = getRecords(entityKey) || [];

    const validationErrors = validateFormByType(
      entityKey.replace(/s$/, ""),
      formData,
      {
        [`existing${entityKey.charAt(0).toUpperCase() + entityKey.slice(1)}`]: existingRecords,
      }
    );

    if (Object.keys(validationErrors).length > 0) {
      return { success: false, errors: validationErrors };
    }

    let preparedData = { ...formData };

    if (entityKey === "students" && preparedData.password) {
      preparedData.password = await hashPassword(formData.password);
    }

    let operationSuccess = false;

    if (actionType === "add") {
      operationSuccess = saveRecord(entityKey, preparedData);
    } else if (actionType === "edit") {
      operationSuccess = updateRecord(entityKey, matchKey, preparedData);
    } else {
      return { success: false, message: "Invalid action type" };
    }

    // Handle room-site relationship update
    if (operationSuccess && entityKey === "rooms") {
      const sites = getRecords("sites") || [];
      const siteIndex = sites.findIndex((s) => s.siteCode === formData.siteCode);

      if (siteIndex !== -1) {
        const site = sites[siteIndex];
        const existingRooms = site.rooms || [];

        const cleanedRoom = {
          roomCode: formData.roomCode,
          roomName: formData.roomName,
          notes: formData.notes || "",
        };

        const roomIndex = existingRooms.findIndex((r) => r.roomCode === formData.roomCode);

        if (roomIndex !== -1) {
          // Edit: update room in site
          existingRooms[roomIndex] = cleanedRoom;
        } else {
          // Add: push room to site
          existingRooms.push(cleanedRoom);
        }

        sites[siteIndex].rooms = existingRooms;
        localStorage.setItem("sites", JSON.stringify(sites));
      }
    }

    return { success: operationSuccess };
  } catch (error) {
    console.error(`Error in handleSaveOrUpdateRecord for ${entityKey}:`, error);
    return { success: false, message: "Unexpected error occurred." };
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
