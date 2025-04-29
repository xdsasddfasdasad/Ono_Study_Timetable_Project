import React, { useState, useEffect } from "react";
import { TextField, Stack } from "@mui/material";
import { validateSiteForm } from "../../../utils/validateForm";
import { getRecords, saveRecords } from "../../../utils/storage";
import CustomButton from "../../UI/CustomButton";

export default function SiteForm({ formData, onChange, onClose, onSave }) {
  const [localForm, setLocalForm] = useState({
    siteCode: "",
    siteName: "",
  });

  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (formData) {
      setLocalForm(formData);
    }
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalForm((prev) => ({ ...prev, [name]: value }));
    setLocalErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
  };

  const handleSubmit = () => {
    const validationErrors = validateSiteForm(localForm);
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    const existingSites = getRecords("sites") || [];
    const isEdit = existingSites.some((s) => s.siteCode === localForm.siteCode);

    const updatedSites = isEdit
      ? existingSites.map((s) =>
          s.siteCode === localForm.siteCode ? localForm : s
        )
      : [...existingSites, localForm];

    saveRecords("sites", updatedSites);

    if (onSave) onSave(localForm);

    setLocalForm({ siteCode: "", siteName: "" });
    setLocalErrors({});
    onClose?.();
  };

  return (
    <Stack spacing={2}>
      <TextField
        label="Site Code"
        name="siteCode"
        value={localForm.siteCode}
        onChange={handleChange}
        error={!!localErrors.siteCode}
        helperText={localErrors.siteCode}
        fullWidth
        disabled={!!formData?.siteCode} // prevent editing siteCode in edit mode
      />
      <TextField
        label="Site Name"
        name="siteName"
        value={localForm.siteName}
        onChange={handleChange}
        error={!!localErrors.siteName}
        helperText={localErrors.siteName}
        fullWidth
      />
      <CustomButton onClick={handleSubmit}>
        {formData?.siteCode ? "Update Site" : "Save Site"}
      </CustomButton>
    </Stack>
  );
}
