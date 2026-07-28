import React, { useCallback, useMemo, useRef, useState } from "react";

const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof process !== "undefined"
    ? process.env?.REACT_APP_API_BASE_URL
    : "") ||
  "http://localhost:5005/api"
).replace(/\/$/, "");

const STATUS_OPTIONS = [
  {
    value: "report pending",
    label: "Report Pending",
  },
  {
    value: "report shared",
    label: "Report Shared",
  },
];

const FORM_COLUMNS = [
  "tuitionName",
  "groupName",
  "tutorName",
  "reportStatus",
  "save",
];

function normalizeList(value, depth = 0) {
  if (
    depth > 8 ||
    value === null ||
    value === undefined
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .flatMap((item) =>
            normalizeList(item, depth + 1)
          )
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean)
      ),
    ];
  }

  if (typeof value === "object") {
    return normalizeList(
      Object.values(value),
      depth + 1
    );
  }

  const text = String(value).trim();

  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);

    if (parsed !== text) {
      return normalizeList(
        parsed,
        depth + 1
      );
    }
  } catch {
    // Plain text is handled below.
  }

  return [
    ...new Set(
      text
        .replace(/\\"/g, '"')
        .replace(
          /^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g,
          ""
        )
        .split(/[,|\n]+/)
        .map((item) =>
          item
            .replace(/\\"/g, '"')
            .replace(
              /^[\s\[\]"'\\]+|[\s\[\]"'\\]+$/g,
              ""
            )
            .trim()
        )
        .filter(Boolean)
    ),
  ];
}

function extractCreatedRecord(result) {
  const record =
    result?.data?.data ||
    result?.data?.report ||
    result?.data?.row ||
    result?.report ||
    result?.row ||
    result?.data ||
    result;

  return record && !Array.isArray(record)
    ? record
    : null;
}

function caretAtStart(element) {
  return (
    typeof element?.selectionStart !== "number" ||
    (element.selectionStart === 0 &&
      element.selectionEnd === 0)
  );
}

function caretAtEnd(element) {
  if (
    typeof element?.selectionStart !== "number"
  ) {
    return true;
  }

  const length = String(
    element.value || ""
  ).length;

  return (
    element.selectionStart === length &&
    element.selectionEnd === length
  );
}

function TagEditor({
  value,
  type,
  placeholder,
  active,
  inputRef,
  onFocus,
  onChange,
  onGridKeyDown,
}) {
  const tags = useMemo(
    () => normalizeList(value),
    [value]
  );

  const [draft, setDraft] = useState("");

  const commit = useCallback(
    (raw = draft) => {
      const incoming = normalizeList(raw);

      if (!incoming.length) {
        return false;
      }

      onChange([
        ...new Set([
          ...tags,
          ...incoming,
        ]),
      ]);

      setDraft("");
      return true;
    },
    [draft, onChange, tags]
  );

  return (
    <div
      className={`report-tag-editor ${
        active ? "active" : ""
      }`}
    >
      {tags.map((tag) => (
        <span
          className={`report-tag ${type}`}
          key={tag}
        >
          {tag}

          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(event) =>
              event.preventDefault()
            }
            onClick={() =>
              onChange(
                tags.filter(
                  (item) => item !== tag
                )
              )
            }
          >
            ×
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        value={draft}
        placeholder={
          tags.length
            ? "+ add"
            : placeholder
        }
        onFocus={onFocus}
        onChange={(event) =>
          setDraft(event.target.value)
        }
        onKeyDown={(event) => {
          if (
            (event.key === "Enter" ||
              event.key === ",") &&
            draft.trim()
          ) {
            event.preventDefault();
            event.stopPropagation();
            commit();
            return;
          }

          if (
            event.key === "Backspace" &&
            !draft &&
            tags.length
          ) {
            event.preventDefault();

            onChange(
              tags.slice(0, -1)
            );

            return;
          }

          onGridKeyDown(event, {
            draftIsEmpty: !draft,
          });
        }}
        onPaste={(event) => {
          const text =
            event.clipboardData?.getData(
              "text/plain"
            ) || "";

          if (/[,|\n]/.test(text)) {
            event.preventDefault();
            commit(text);
          }
        }}
        onBlur={() => {
          if (draft.trim()) {
            commit();
          }
        }}
      />
    </div>
  );
}

export default function ReportEntryForm({
  onUpdateReport,
}) {
  const [draft, setDraft] = useState({
    tuitionName: "",
    groupName: [],
    tutorName: [],
    reportStatus: "report pending",
  });

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState({
      type: "",
      text: "",
    });

  const [activeCell, setActiveCell] =
    useState("tuitionName");

  const refs = useRef(new Map());

  const register = useCallback(
    (key, node) => {
      if (node) {
        refs.current.set(key, node);
      } else {
        refs.current.delete(key);
      }
    },
    []
  );

  const focusCell = useCallback(
    (key) => {
      const node =
        refs.current.get(key);

      node?.focus?.({
        preventScroll: true,
      });

      node?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });
    },
    []
  );

  const move = useCallback(
    (key, delta) => {
      const index =
        FORM_COLUMNS.indexOf(key);

      const next =
        FORM_COLUMNS[
          Math.max(
            0,
            Math.min(
              FORM_COLUMNS.length - 1,
              index + delta
            )
          )
        ];

      if (next) {
        focusCell(next);
      }
    },
    [focusCell]
  );

  const change = useCallback(
    (field, value) => {
      setDraft((previous) => ({
        ...previous,
        [field]: value,
      }));

      setMessage({
        type: "",
        text: "",
      });
    },
    []
  );

  const save = useCallback(async () => {
    if (saving) {
      return;
    }

    if (!draft.tuitionName.trim()) {
      setMessage({
        type: "error",
        text: "Tuition Name is required.",
      });

      focusCell("tuitionName");
      return;
    }

    setSaving(true);

    setMessage({
      type: "",
      text: "",
    });

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/reports`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            tuitionName:
              draft.tuitionName.trim(),

            groupName: JSON.stringify(
              normalizeList(
                draft.groupName
              )
            ),

            tutorName: JSON.stringify(
              normalizeList(
                draft.tutorName
              )
            ),

            reportStatus:
              draft.reportStatus,

            rowColor: "",
          }),
        }
      );

      const result =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        result?.success === false
      ) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Report save nahi hua."
        );
      }

      const record =
        extractCreatedRecord(result);

      onUpdateReport?.(
        record,
        result
      );

      /*
       * OtmReportTable is event ko
       * listen karegi aur new row
       * foran table mein add karegi.
       */
      window.dispatchEvent(
        new CustomEvent(
          "otm-report-created",
          {
            detail: {
              record,
              rawResult: result,
              refresh: !record?.id,
            },
          }
        )
      );

      setDraft({
        tuitionName: "",
        groupName: [],
        tutorName: [],
        reportStatus:
          "report pending",
      });

      setMessage({
        type: "saved",
        text: "Saved",
      });

      window.setTimeout(() => {
        setMessage((current) =>
          current.type === "saved"
            ? {
                type: "",
                text: "",
              }
            : current
        );
      }, 1000);

      requestAnimationFrame(() =>
        focusCell("tuitionName")
      );
    } catch (error) {
      console.error(
        "Report save failed:",
        error
      );

      setMessage({
        type: "error",
        text:
          error?.message ||
          "Server connection failed.",
      });
    } finally {
      setSaving(false);
    }
  }, [
    draft,
    focusCell,
    onUpdateReport,
    saving,
  ]);

  const keyDown = useCallback(
    (event, key, options = {}) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();

        move(
          key,
          event.shiftKey ? -1 : 1
        );

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        if (key === "save") {
          void save();
        } else {
          move(key, 1);
        }

        return;
      }

      if (
        event.key === "ArrowLeft" &&
        (options.draftIsEmpty ||
          caretAtStart(
            event.currentTarget
          ))
      ) {
        event.preventDefault();
        move(key, -1);
        return;
      }

      if (
        event.key === "ArrowRight" &&
        (options.draftIsEmpty ||
          caretAtEnd(
            event.currentTarget
          ))
      ) {
        event.preventDefault();
        move(key, 1);
      }
    },
    [move, save]
  );

  return (
    <div className="report-form-sheet">
      <style>{FORM_CSS}</style>

      <div className="report-form-head">
        <div>
          <b>
            Report Entry Spreadsheet
          </b>

          <small>
            Type directly in cells. Use
            Left, Right, Tab and Enter.
          </small>
        </div>

        <span className={message.type}>
          {saving
            ? "Saving…"
            : message.text}
        </span>
      </div>

      <div className="report-form-scroll">
        <table>
          <thead>
            <tr>
              <th className="num">#</th>
              <th>Tuition Name</th>
              <th>Group Name</th>
              <th>Tutor Name</th>
              <th className="status">
                Report Status
              </th>
              <th className="action">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="row-num">
                1
              </td>

              <td
                className={
                  activeCell ===
                  "tuitionName"
                    ? "cell active"
                    : "cell"
                }
              >
                <input
                  ref={(node) =>
                    register(
                      "tuitionName",
                      node
                    )
                  }
                  value={
                    draft.tuitionName
                  }
                  placeholder="Tuition name"
                  onFocus={() =>
                    setActiveCell(
                      "tuitionName"
                    )
                  }
                  onChange={(event) =>
                    change(
                      "tuitionName",
                      event.target.value
                    )
                  }
                  onKeyDown={(event) =>
                    keyDown(
                      event,
                      "tuitionName"
                    )
                  }
                />
              </td>

              <td
                className={
                  activeCell ===
                  "groupName"
                    ? "cell active"
                    : "cell"
                }
              >
                <TagEditor
                  value={draft.groupName}
                  type="group"
                  placeholder="Group + Enter"
                  active={
                    activeCell ===
                    "groupName"
                  }
                  inputRef={(node) =>
                    register(
                      "groupName",
                      node
                    )
                  }
                  onFocus={() =>
                    setActiveCell(
                      "groupName"
                    )
                  }
                  onChange={(value) =>
                    change(
                      "groupName",
                      value
                    )
                  }
                  onGridKeyDown={(
                    event,
                    options
                  ) =>
                    keyDown(
                      event,
                      "groupName",
                      options
                    )
                  }
                />
              </td>

              <td
                className={
                  activeCell ===
                  "tutorName"
                    ? "cell active"
                    : "cell"
                }
              >
                <TagEditor
                  value={draft.tutorName}
                  type="tutor"
                  placeholder="Tutor + Enter"
                  active={
                    activeCell ===
                    "tutorName"
                  }
                  inputRef={(node) =>
                    register(
                      "tutorName",
                      node
                    )
                  }
                  onFocus={() =>
                    setActiveCell(
                      "tutorName"
                    )
                  }
                  onChange={(value) =>
                    change(
                      "tutorName",
                      value
                    )
                  }
                  onGridKeyDown={(
                    event,
                    options
                  ) =>
                    keyDown(
                      event,
                      "tutorName",
                      options
                    )
                  }
                />
              </td>

              <td
                className={
                  activeCell ===
                  "reportStatus"
                    ? "cell active"
                    : "cell"
                }
              >
                <select
                  ref={(node) =>
                    register(
                      "reportStatus",
                      node
                    )
                  }
                  value={
                    draft.reportStatus
                  }
                  onFocus={() =>
                    setActiveCell(
                      "reportStatus"
                    )
                  }
                  onChange={(event) =>
                    change(
                      "reportStatus",
                      event.target.value
                    )
                  }
                  onKeyDown={(event) =>
                    keyDown(
                      event,
                      "reportStatus",
                      {
                        draftIsEmpty:
                          true,
                      }
                    )
                  }
                >
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </td>

              <td
                className={
                  activeCell === "save"
                    ? "cell active"
                    : "cell"
                }
              >
                <button
                  ref={(node) =>
                    register(
                      "save",
                      node
                    )
                  }
                  type="button"
                  disabled={saving}
                  onFocus={() =>
                    setActiveCell("save")
                  }
                  onKeyDown={(event) =>
                    keyDown(event, "save")
                  }
                  onClick={() =>
                    void save()
                  }
                >
                  {saving
                    ? "Saving…"
                    : "Save"}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {message.type === "error" && (
        <div className="report-form-error">
          {message.text}
        </div>
      )}
    </div>
  );
}

const FORM_CSS = `
.report-form-sheet{width:100%;margin-bottom:16px;border:1px solid #94a3b8;border-radius:8px;overflow:hidden;background:#fff;box-shadow:0 4px 12px rgba(15,23,42,.06);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.report-form-head{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;background:#107c41;color:#fff}
.report-form-head b{display:block;font-size:14px}
.report-form-head small{display:block;margin-top:3px;font-size:11px;opacity:.9}
.report-form-head span{font-size:12px;font-weight:800}
.report-form-head span.error{color:#fee2e2}
.report-form-scroll{overflow-x:auto}
.report-form-sheet table{width:100%;min-width:920px;border-collapse:separate;border-spacing:0;table-layout:fixed}
.report-form-sheet th{padding:8px 7px;background:#0f172a;color:#fff;border-right:1px solid #475569;border-bottom:1px solid #475569;font-size:11px;text-align:center}
.report-form-sheet th.num{width:44px}
.report-form-sheet th.status{width:150px}
.report-form-sheet th.action{width:105px}
.report-form-sheet .row-num{text-align:center;background:#f1f5f9;color:#64748b;font-size:12px;font-weight:800;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1}
.report-form-sheet .cell{height:42px;padding:0;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;position:relative}
.report-form-sheet .cell.active{background:#ecfdf5;box-shadow:inset 0 0 0 2px #16a34a;z-index:2}
.report-form-sheet .cell>input,.report-form-sheet .cell>select{width:100%;height:100%;min-height:40px;padding:7px 9px;border:0;outline:0;background:transparent;box-sizing:border-box;font-size:13px}
.report-form-sheet .cell>select{text-align:center;font-size:12px;font-weight:700}
.report-form-sheet .cell>button{width:100%;height:100%;min-height:40px;border:0;background:#16a34a;color:#fff;font-size:12px;font-weight:800;cursor:pointer}
.report-tag-editor{width:100%;min-height:40px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;padding:4px 5px;box-sizing:border-box}
.report-tag-editor.active{background:#ecfdf5}
.report-tag-editor input{flex:1 1 70px;min-width:60px;min-height:28px;padding:3px 5px;border:0;outline:0;background:transparent;font-size:11px}
.report-tag{display:inline-flex;align-items:center;gap:3px;padding:2px 4px 2px 7px;border-radius:999px;font-size:10px;font-weight:800}
.report-tag.group{border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8}
.report-tag.tutor{border:1px solid #c4b5fd;background:#ede9fe;color:#6d28d9}
.report-tag button{width:16px;height:16px;padding:0;border:0;border-radius:999px;background:rgba(15,23,42,.08);color:inherit;cursor:pointer}
.report-form-error{padding:8px 12px;border-top:1px solid #fecaca;background:#fef2f2;color:#991b1b;font-size:12px;font-weight:700}
`;