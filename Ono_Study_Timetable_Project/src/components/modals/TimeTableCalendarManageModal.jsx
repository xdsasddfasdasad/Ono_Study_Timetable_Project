import React from "react";
import TimeTableAddModal from "./TimeTableAddModal";
import TimeTableEditModal from "./TimeTableEditModal";

/**
 * מודאל "בקר" (Controller Modal).
 * תפקידו היחיד הוא להחליט איזה מודאל להציג - הוספה או עריכה -
 * על בסיס ה-props שהוא מקבל מהדף הראשי.
 */
export default function TimeTableCalendarManageModal({
  open, 
  onClose, 
  onSave, 
  initialData,
  defaultDate,
}) {

  // ✨ --- התיקון המרכזי נמצא כאן --- ✨
  // אנו בודקים אם קיים מזהה כלשהו ב-initialData כדי לקבוע אם זה מצב עריכה.
  // הוספנו בדיקה עבור holidayCode ו-vacationCode.
  const isEditMode = !!(
    initialData && (
      initialData.id || 
      initialData.eventCode || 
      initialData.holidayCode ||  // <-- הוספה
      initialData.vacationCode || // <-- הוספה
      initialData.assignmentCode || 
      initialData.yearCode || 
      initialData.semesterCode
    )
  );

  if (isEditMode) {
    // אם אנחנו במצב עריכה, רנדר את מודאל העריכה
    return (
      <TimeTableEditModal 
        open={open} 
        onClose={onClose} 
        onSave={onSave} 
        initialData={initialData} 
      />
    );
  }

  // אחרת, רנדר את מודאל ההוספה
  return (
    <TimeTableAddModal 
      open={open} 
      onClose={onClose} 
      onSave={onSave} 
      defaultDate={defaultDate || initialData?.defaultDate} 
    />
  );
}