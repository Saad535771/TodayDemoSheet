import React, { useEffect, useRef, useState } from "react";
import { api } from "../api/api.js";

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #eef0f3",
  },
  summaryBtn: {
    cursor: "pointer",
    fontWeight: "700",
    color: "#1e3c72",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    listStyle: "none",
    fontSize: "16px",
  },
  singleLineForm: {
    display: "flex",
    overflowX: "auto",
    gap: "0px",
    marginTop: "16px",
    padding: "10px",
    background: "#f3f2f1",
    border: "1px solid #c8c6c4",
    borderRadius: "4px",
    alignItems: "flex-end",
  },
  createInput: {
    width: "100%",
    padding: "8px",
    border: "1px solid #c8c6c4",
    fontSize: "13px",
    boxSizing: "border-box",
    fontFamily: "'Calibri', sans-serif",
    background: "white",
    outline: "none",
    minHeight: "34px",
  },
  focusedInput: {
    border: "1px solid #2563eb",
    boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.15)",
  },
  primaryBtn: {
    background: "#107c41",
    margin: "0px 5px",
    fontSize: "15px",
    color: "white",
    border: "none",
    padding: "0px 16px",
    borderRadius: "50px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "'Calibri', sans-serif",
    minWidth: "100px",
    height: "34px",
    whiteSpace: "nowrap",
  },
  fieldWrap: {
    position: "relative",
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 2,
    display: "block",
  },
  dropdownTrigger: {
    width: "100%",
    padding: "8px",
    border: "1px solid #c8c6c4",
    fontSize: "13px",
    boxSizing: "border-box",
    fontFamily: "'Calibri', sans-serif",
    background: "white",
    outline: "none",
    minHeight: "34px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  dropdownMenu: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #c8c6c4",
    borderRadius: "8px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    zIndex: 50,
    maxHeight: "220px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "8px 10px",
    fontSize: "13px",
    cursor: "pointer",
    borderBottom: "1px solid #eef0f3",
    background: "#fff",
    color: "#111827",
    fontFamily: "'Calibri', sans-serif",
  },
  dropdownItemActive: {
    background: "#dbeafe",
  },
};

const demoRatings = ["", "Average Demo", "Strong Demo", "Weak Demo"];
const sourcesList = ["", "mahad", "areeba", "sibgha"];
const statusList = [
  "",
  "1st Demo Done",
  "2nd Demo Done",
  "payment Process",
  "Tuition Done",
  "Tuition Cancelled",
  "irrelevant",
  "Not available",
  "Pending",
];

// --- COLOR LOGIC FUNCTIONS ---
const getStatusStyle = (status) => {
  switch (status) {
    case "1st Demo Done":
      return { backgroundColor: "black", color: "white", border: "1px solid black" };
    case "2nd Demo Done":
      return { backgroundColor: "#8B4513", color: "white", border: "1px solid #8B4513" };
    case "payment Process":
      return { backgroundColor: "#fef08a", color: "black", border: "1px solid #fef08a" };
    case "Tuition Done":
      return { backgroundColor: "#1c9147", color: "white", border: "1px solid #22c55e" };
    case "Tuition Cancelled":
      return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" };
    case "irrelevant":
      return { backgroundColor: "white", color: "black", border: "1px solid #9ca3af" };
    case "Not available":
      return { backgroundColor: "#4c1d95", color: "white", border: "1px solid #4c1d95" };
    case "Pending":
      return { backgroundColor: "#3b82f6", color: "white", border: "1px solid #3b82f6" };
    default:
      return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }
};

const getDemoRatingStyle = (rating) => {
  switch (rating) {
    case "Average Demo":
      return { backgroundColor: "#ca8a04", color: "white", border: "1px solid #ca8a04" };
    case "Strong Demo":
      return { backgroundColor: "#22c55e", color: "white", border: "1px solid #22c55e" };
    case "Weak Demo":
      return { backgroundColor: "#ef4444", color: "white", border: "1px solid #ef4444" };
    default:
      return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }
};

const getSourceStyle = (source) => {
  switch (source) {
    case "mahad":
      return { backgroundColor: "#0ea5e9", color: "white", border: "1px solid #0ea5e9" };
    case "areeba":
      return { backgroundColor: "#ec4899", color: "white", border: "1px solid #ec4899" };
    case "sibgha":
      return { backgroundColor: "#14b8a6", color: "white", border: "1px solid #14b8a6" };
    default:
      return { backgroundColor: "white", color: "inherit", border: "1px solid #c8c6c4" };
  }
};

function generateTuitionId() {
  return `T-${Math.floor(1000 + Math.random() * 9000)}`;
}

function emptyForm() {
  return {
    tuitionId: generateTuitionId(),
    date: new Date().toISOString().split("T")[0],
    time: "",
    demoTime: "",
    tuitionName: "",
    source: "",
    otmName: "",
    country: "",
    parentsContact: "",
    className: "",
    subjects: "",
    daysPerWeek: "",
    estimatedFee: "",
    tutorName: "",
    tutorFees: "",
    rejectedTutor: "",
    status: "",
    feedback: "",
    demoDate: "",
    demoRating: "",
    sync: "",
  };
}

function formatTo12Hour(value) {
  if (!value) return "";

  const raw = String(value)
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  let match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return value;

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }

  match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2] || "00");
    const ampm = match[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return value;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
  }

  return value;
}

function to24Hour(value) {
  if (!value) return "";

  const raw = String(value)
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  let match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "";
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return "";

  let hours = Number(match[1]);
  const minutes = Number(match[2] || "00");
  const ampm = match[3];

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return "";

  if (ampm === "AM") {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function openNativePicker(el) {
  if (!el || typeof el.showPicker !== "function") return;
  try {
    el.showPicker();
  } catch {
    // silently ignore unsupported browsers
  }
}

export default function MonthlyTuition({ onLoad }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [focusedField, setFocusedField] = useState("tuitionId");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef(null);
  const fieldRefs = useRef({});

  const fieldOrder = [
    "tuitionId",
    "date",
    "demoTime",
    "tuitionName",
    "source",
    "otmName",
    "country",
    "parentsContact",
    "className",
    "subjects",
    "daysPerWeek",
    "estimatedFee",
    "tutorName",
    "tutorFees",
    "rejectedTutor",
    "feedback",
    "status",
    "demoDate",
    "demoRating",
    "sync",
    "submit",
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    requestAnimationFrame(() => {
      focusField("tuitionId");
    });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function setCreateField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function getOptionsByField(fieldName) {
    if (fieldName === "source") return sourcesList;
    if (fieldName === "status") return statusList;
    if (fieldName === "demoRating") return demoRatings;
    return [];
  }

  function focusField(fieldName) {
    const el = fieldRefs.current[fieldName];
    if (!el) return;

    setFocusedField(fieldName);
    setOpenDropdown(null);

    requestAnimationFrame(() => {
      el.focus();

      if (fieldName === "date" || fieldName === "demoDate") {
        openNativePicker(el);
      }

      if (fieldName === "source" || fieldName === "status" || fieldName === "demoRating") {
        const options = getOptionsByField(fieldName);
        const currentIndex = Math.max(options.indexOf(form[fieldName]), 0);
        setHighlightedIndex(currentIndex);
        setOpenDropdown(fieldName);
      }
    });
  }

  function moveFocus(currentField, direction) {
    const currentIndex = fieldOrder.indexOf(currentField);
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= fieldOrder.length) return;

    const nextField = fieldOrder[nextIndex];
    focusField(nextField);
  }

  function handleTextLikeKeyDown(fieldName, e) {
    const isTextInput = e.target.tagName === "INPUT" && e.target.type !== "date";
    const valueLength = e.target.value?.length ?? 0;
    const start = e.target.selectionStart ?? valueLength;
    const end = e.target.selectionEnd ?? valueLength;

    if (e.key === "Enter") {
      e.preventDefault();
      moveFocus(fieldName, 1);
      return;
    }

    if (e.key === "ArrowRight") {
      if (isTextInput && end !== valueLength) return;
      e.preventDefault();
      moveFocus(fieldName, 1);
      return;
    }

    if (e.key === "ArrowLeft") {
      if (isTextInput && start !== 0) return;
      e.preventDefault();
      moveFocus(fieldName, -1);
    }
  }

  function handleDateKeyDown(fieldName, e) {
    if (e.key === "Enter") {
      e.preventDefault();
      moveFocus(fieldName, 1);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveFocus(fieldName, 1);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(fieldName, -1);
    }
  }

  function handleDropdownFocus(fieldName) {
    setFocusedField(fieldName);
    const options = getOptionsByField(fieldName);
    const currentIndex = Math.max(options.indexOf(form[fieldName]), 0);
    setHighlightedIndex(currentIndex);
    setOpenDropdown(fieldName);
  }

  function selectDropdownValue(fieldName, value) {
    setCreateField(fieldName, value);
    setOpenDropdown(null);
    requestAnimationFrame(() => moveFocus(fieldName, 1));
  }

  function handleDropdownKeyDown(fieldName, e) {
    const options = getOptionsByField(fieldName);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (openDropdown !== fieldName) {
        handleDropdownFocus(fieldName);
        return;
      }
      setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (openDropdown !== fieldName) {
        handleDropdownFocus(fieldName);
        return;
      }
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (openDropdown !== fieldName) {
        handleDropdownFocus(fieldName);
        return;
      }
      selectDropdownValue(fieldName, options[highlightedIndex] ?? "");
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setOpenDropdown(null);
      moveFocus(fieldName, 1);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setOpenDropdown(null);
      moveFocus(fieldName, -1);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpenDropdown(null);
    }
  }

  async function create(e) {
    e.preventDefault();
    setCreating(true);

    try {
      const demoTime24 = to24Hour(form.demoTime);
      const payloadToSubmit = {
        ...form,
        demoTime: demoTime24,
        time: demoTime24 || "12:00",
      };

      await api.post("/tuitions", payloadToSubmit);
      setForm(emptyForm());
      setOpenDropdown(null);
      await onLoad?.();
      requestAnimationFrame(() => focusField("tuitionId"));
    } catch (err) {
      alert("Create failed. Please check backend validation.");
    } finally {
      setCreating(false);
    }
  }

  const getInputStyle = (fieldName, extra = {}) => ({
    ...styles.createInput,
    ...(focusedField === fieldName ? styles.focusedInput : {}),
    ...extra,
  });

  const getDropdownTriggerStyle = (fieldName, extra = {}) => ({
    ...styles.dropdownTrigger,
    ...(focusedField === fieldName ? styles.focusedInput : {}),
    ...extra,
  });

  return (
    <div style={styles.card} ref={rootRef}>
      <div style={styles.summaryBtn}>
        <span style={{ fontSize: 20, color: "#107c41", marginRight: 5 }}>+</span>
        Add New Tuition (Quick Entry)
      </div>

      <form onSubmit={create} style={styles.singleLineForm}>
        <CreateField
          label="Tuition ID"
          val={form.tuitionId}
          onChange={(v) => setCreateField("tuitionId", v)}
          width="100px"
          inputRef={(el) => (fieldRefs.current.tuitionId = el)}
          onFocus={() => {
            setFocusedField("tuitionId");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("tuitionId", e)}
          inputStyle={getInputStyle("tuitionId")}
        />

        <CreateField
          label="Date"
          type="date"
          val={form.date}
          onChange={(v) => setCreateField("date", v)}
          width="130px"
          inputRef={(el) => (fieldRefs.current.date = el)}
          onFocus={() => {
            setFocusedField("date");
            setOpenDropdown(null);
            requestAnimationFrame(() => openNativePicker(fieldRefs.current.date));
          }}
          onKeyDown={(e) => handleDateKeyDown("date", e)}
          inputStyle={getInputStyle("date")}
        />

        <CreateField
          label="Demo Time"
          type="text"
          val={form.demoTime}
          onChange={(v) => setCreateField("demoTime", v)}
          onBlur={() => setCreateField("demoTime", formatTo12Hour(form.demoTime))}
          width="120px"
          placeholder="hh:mm AM/PM"
          inputRef={(el) => (fieldRefs.current.demoTime = el)}
          onFocus={() => {
            setFocusedField("demoTime");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("demoTime", e)}
          inputStyle={getInputStyle("demoTime")}
        />

        <CreateField
          label="Tuition Name"
          val={form.tuitionName}
          onChange={(v) => setCreateField("tuitionName", v)}
          width="150px"
          inputRef={(el) => (fieldRefs.current.tuitionName = el)}
          onFocus={() => {
            setFocusedField("tuitionName");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("tuitionName", e)}
          inputStyle={getInputStyle("tuitionName")}
        />

        <DropdownField
          label="Source"
          fieldName="source"
          value={form.source}
          width="120px"
          options={sourcesList}
          openDropdown={openDropdown}
          highlightedIndex={highlightedIndex}
          triggerStyle={getDropdownTriggerStyle("source", {
            ...getSourceStyle(form.source),
            fontWeight: "bold",
          })}
          setFieldRef={(el) => (fieldRefs.current.source = el)}
          onFocus={() => handleDropdownFocus("source")}
          onKeyDown={(e) => handleDropdownKeyDown("source", e)}
          onSelect={(value) => selectDropdownValue("source", value)}
        />

        <CreateField
          label="OTM Name"
          val={form.otmName}
          onChange={(v) => setCreateField("otmName", v)}
          width="120px"
          inputRef={(el) => (fieldRefs.current.otmName = el)}
          onFocus={() => {
            setFocusedField("otmName");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("otmName", e)}
          inputStyle={getInputStyle("otmName")}
        />

        <CreateField
          label="Country"
          val={form.country}
          onChange={(v) => setCreateField("country", v)}
          width="100px"
          inputRef={(el) => (fieldRefs.current.country = el)}
          onFocus={() => {
            setFocusedField("country");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("country", e)}
          inputStyle={getInputStyle("country")}
        />

        <CreateField
          label="Parent Contact"
          val={form.parentsContact}
          onChange={(v) => setCreateField("parentsContact", v)}
          width="120px"
          inputRef={(el) => (fieldRefs.current.parentsContact = el)}
          onFocus={() => {
            setFocusedField("parentsContact");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("parentsContact", e)}
          inputStyle={getInputStyle("parentsContact")}
        />

        <CreateField
          label="Class"
          val={form.className}
          onChange={(v) => setCreateField("className", v)}
          width="100px"
          inputRef={(el) => (fieldRefs.current.className = el)}
          onFocus={() => {
            setFocusedField("className");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("className", e)}
          inputStyle={getInputStyle("className")}
        />

        <CreateField
          label="Subject"
          val={form.subjects}
          onChange={(v) => setCreateField("subjects", v)}
          width="120px"
          inputRef={(el) => (fieldRefs.current.subjects = el)}
          onFocus={() => {
            setFocusedField("subjects");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("subjects", e)}
          inputStyle={getInputStyle("subjects")}
        />

        <CreateField
          label="Days/Week"
          val={form.daysPerWeek}
          onChange={(v) => setCreateField("daysPerWeek", v)}
          width="90px"
          inputRef={(el) => (fieldRefs.current.daysPerWeek = el)}
          onFocus={() => {
            setFocusedField("daysPerWeek");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("daysPerWeek", e)}
          inputStyle={getInputStyle("daysPerWeek")}
        />

        <CreateField
          label="Estimated Fee"
          val={form.estimatedFee}
          onChange={(v) => setCreateField("estimatedFee", v)}
          width="110px"
          inputRef={(el) => (fieldRefs.current.estimatedFee = el)}
          onFocus={() => {
            setFocusedField("estimatedFee");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("estimatedFee", e)}
          inputStyle={getInputStyle("estimatedFee")}
        />

        <CreateField
          label="Tutor Name"
          val={form.tutorName}
          onChange={(v) => setCreateField("tutorName", v)}
          width="130px"
          inputRef={(el) => (fieldRefs.current.tutorName = el)}
          onFocus={() => {
            setFocusedField("tutorName");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("tutorName", e)}
          inputStyle={getInputStyle("tutorName")}
        />

        <CreateField
          label="Tutor Fees"
          val={form.tutorFees}
          onChange={(v) => setCreateField("tutorFees", v)}
          width="100px"
          inputRef={(el) => (fieldRefs.current.tutorFees = el)}
          onFocus={() => {
            setFocusedField("tutorFees");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("tutorFees", e)}
          inputStyle={getInputStyle("tutorFees")}
        />

        <CreateField
          label="Rejected Tutor"
          val={form.rejectedTutor}
          onChange={(v) => setCreateField("rejectedTutor", v)}
          width="130px"
          inputRef={(el) => (fieldRefs.current.rejectedTutor = el)}
          onFocus={() => {
            setFocusedField("rejectedTutor");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("rejectedTutor", e)}
          inputStyle={getInputStyle("rejectedTutor")}
        />

        <CreateField
          label="Feedback"
          val={form.feedback}
          onChange={(v) => setCreateField("feedback", v)}
          width="150px"
          inputRef={(el) => (fieldRefs.current.feedback = el)}
          onFocus={() => {
            setFocusedField("feedback");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("feedback", e)}
          inputStyle={getInputStyle("feedback")}
        />

        <DropdownField
          label="Status"
          fieldName="status"
          value={form.status}
          width="135px"
          options={statusList}
          openDropdown={openDropdown}
          highlightedIndex={highlightedIndex}
          triggerStyle={getDropdownTriggerStyle("status", {
            ...getStatusStyle(form.status),
            fontWeight: "bold",
          })}
          setFieldRef={(el) => (fieldRefs.current.status = el)}
          onFocus={() => handleDropdownFocus("status")}
          onKeyDown={(e) => handleDropdownKeyDown("status", e)}
          onSelect={(value) => selectDropdownValue("status", value)}
        />

        <CreateField
          label="Demo Date"
          type="date"
          val={form.demoDate}
          onChange={(v) => setCreateField("demoDate", v)}
          width="130px"
          inputRef={(el) => (fieldRefs.current.demoDate = el)}
          onFocus={() => {
            setFocusedField("demoDate");
            setOpenDropdown(null);
            requestAnimationFrame(() => openNativePicker(fieldRefs.current.demoDate));
          }}
          onKeyDown={(e) => handleDateKeyDown("demoDate", e)}
          inputStyle={getInputStyle("demoDate")}
        />

        <DropdownField
          label="Demo Rating"
          fieldName="demoRating"
          value={form.demoRating}
          width="130px"
          options={demoRatings}
          openDropdown={openDropdown}
          highlightedIndex={highlightedIndex}
          triggerStyle={getDropdownTriggerStyle("demoRating", {
            ...getDemoRatingStyle(form.demoRating),
            fontWeight: "bold",
          })}
          setFieldRef={(el) => (fieldRefs.current.demoRating = el)}
          onFocus={() => handleDropdownFocus("demoRating")}
          onKeyDown={(e) => handleDropdownKeyDown("demoRating", e)}
          onSelect={(value) => selectDropdownValue("demoRating", value)}
        />

        <CreateField
          label="Sync"
          val={form.sync}
          onChange={(v) => setCreateField("sync", v)}
          width="100px"
          inputRef={(el) => (fieldRefs.current.sync = el)}
          onFocus={() => {
            setFocusedField("sync");
            setOpenDropdown(null);
          }}
          onKeyDown={(e) => handleTextLikeKeyDown("sync", e)}
          inputStyle={getInputStyle("sync")}
        />

        <div style={{ paddingBottom: "2px" }}>
          <button
            ref={(el) => (fieldRefs.current.submit = el)}
            type="submit"
            style={{
              ...styles.primaryBtn,
              ...(focusedField === "submit" ? styles.focusedInput : {}),
            }}
            disabled={creating}
            onFocus={() => {
              setFocusedField("submit");
              setOpenDropdown(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                moveFocus("submit", -1);
              }
            }}
          >
            {creating ? "Adding..." : "Add Row +"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateField({
  label,
  val,
  onChange,
  type = "text",
  width = "120px",
  inputRef,
  onFocus,
  onKeyDown,
  onBlur,
  inputStyle,
  placeholder = "",
}) {
  return (
    <div style={{ ...styles.fieldWrap, minWidth: width }}>
      <label style={styles.label}>{label}</label>
      <input
        ref={inputRef}
        type={type}
        style={inputStyle}
        value={val || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    </div>
  );
}

function DropdownField({
  label,
  fieldName,
  value,
  width,
  options,
  openDropdown,
  highlightedIndex,
  triggerStyle,
  setFieldRef,
  onFocus,
  onKeyDown,
  onSelect,
}) {
  return (
    <div style={{ ...styles.fieldWrap, minWidth: width }}>
      <label style={styles.label}>{label}</label>

      <div
        ref={setFieldRef}
        tabIndex={0}
        style={triggerStyle}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      >
        {value || "-- Select --"}
      </div>

      {openDropdown === fieldName && (
        <div style={styles.dropdownMenu}>
          {options.map((option, index) => (
            <div
              key={`${fieldName}-${option || "empty"}-${index}`}
              style={{
                ...styles.dropdownItem,
                ...(highlightedIndex === index ? styles.dropdownItemActive : {}),
              }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(option)}
            >
              {option || "-- Select --"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}