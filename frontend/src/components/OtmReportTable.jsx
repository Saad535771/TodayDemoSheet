import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";

const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ||
  (typeof process !== "undefined"
    ? process.env?.REACT_APP_API_BASE_URL
    : "") ||
  "http://localhost:5005/api"
).replace(/\/$/, "");

export const REPORT_STATUS_OPTIONS = [
  {
    value: "report pending",
    label: "Report Pending",
  },
  {
    value: "report shared",
    label: "Report Shared",
  },
];

const COLUMNS = [
  "tuitionName",
  "groupName",
  "tutorName",
  "reportStatus",
  "rowColor",
];

function authConfig() {
  const token =
    localStorage.getItem("token");

  return {
    withCredentials: true,

    headers: token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : undefined,
  };
}

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
            normalizeList(
              item,
              depth + 1
            )
          )
          .map(String)
          .map((item) =>
            item.trim()
          )
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

function normalizeRow(row = {}) {
  return {
    ...row,

    tuitionName:
      row.tuitionName ??
      row.tuition_name ??
      "",

    groupName: normalizeList(
      row.groupName ??
        row.group_name
    ),

    tutorName: normalizeList(
      row.tutorName ??
        row.tutor_name
    ),

    reportStatus:
      row.reportStatus ||
      row.report_status ||
      "report pending",

    rowColor:
      row.rowColor ||
      row.row_color ||
      "",
  };
}

function payload(row = {}) {
  return {
    ...row,

    tuitionName: String(
      row.tuitionName || ""
    ),

    groupName: JSON.stringify(
      normalizeList(row.groupName)
    ),

    tutorName: JSON.stringify(
      normalizeList(row.tutorName)
    ),

    reportStatus:
      row.reportStatus ||
      "report pending",

    rowColor:
      row.rowColor || "",
  };
}

function extractRecord(value) {
  const record =
    value?.record ||
    value?.data?.data ||
    value?.data?.report ||
    value?.data?.row ||
    value?.report ||
    value?.row ||
    value?.data ||
    value;

  return record &&
    !Array.isArray(record)
    ? normalizeRow(record)
    : null;
}

function caretAtStart(element) {
  return (
    typeof element?.selectionStart !==
      "number" ||
    (element.selectionStart === 0 &&
      element.selectionEnd === 0)
  );
}

function caretAtEnd(element) {
  if (
    typeof element?.selectionStart !==
    "number"
  ) {
    return true;
  }

  const length = String(
    element.value || ""
  ).length;

  return (
    element.selectionStart ===
      length &&
    element.selectionEnd ===
      length
  );
}

function statusStyle(status) {
  return String(status).toLowerCase() ===
    "report shared"
    ? {
        background: "#dcfce7",
        color: "#166534",
        borderColor: "#86efac",
      }
    : {
        background: "#fef3c7",
        color: "#92400e",
        borderColor: "#fde68a",
      };
}

function BadgeEditor({
  value,
  type,
  placeholder,
  active,
  inputRef,
  onFocus,
  onChange,
  onBlur,
  onGridKeyDown,
  onGridPaste,
}) {
  const tags = useMemo(
    () => normalizeList(value),
    [value]
  );

  const [draft, setDraft] =
    useState("");

  const commit = useCallback(
    (raw = draft) => {
      const incoming =
        normalizeList(raw);

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
      className={`report-badge-editor ${
        active ? "active" : ""
      }`}
    >
      {tags.map((tag) => (
        <span
          className={`report-badge ${type}`}
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
                  (item) =>
                    item !== tag
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
          setDraft(
            event.target.value
          )
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
            event.key ===
              "Backspace" &&
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
            event.clipboardData
              ?.getData(
                "text/plain"
              ) || "";

          if (/\t|\r|\n/.test(text)) {
            onGridPaste(event);
            return;
          }

          if (/[,|\n]/.test(text)) {
            event.preventDefault();
            commit(text);
          }
        }}
        onBlur={() => {
          if (draft.trim()) {
            commit();
          }

          onBlur();
        }}
      />
    </div>
  );
}

export default function OtmReportTable() {
  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activeCell, setActiveCell] =
    useState("");

  const [
    selectedRowId,
    setSelectedRowId,
  ] = useState(null);

  const [savingIds, setSavingIds] =
    useState([]);

  const [draggedId, setDraggedId] =
    useState(null);

  const rowsRef = useRef([]);
  const refs = useRef(new Map());
  const timers = useRef(new Map());

  const setRowsNow = useCallback(
    (updater) => {
      setRows((previous) => {
        const next =
          typeof updater ===
          "function"
            ? updater(previous)
            : updater;

        rowsRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(
    () => () => {
      timers.current.forEach(
        clearTimeout
      );

      timers.current.clear();
    },
    []
  );

  const fetchReports =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await axios.get(
            `${API_BASE_URL}/reports`,
            authConfig()
          );

        const list =
          response.data?.data ||
          response.data ||
          [];

        setRowsNow(
          (
            Array.isArray(list)
              ? list
              : []
          ).map(normalizeRow)
        );
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError?.response?.data
            ?.error ||
            requestError?.response?.data
              ?.message ||
            "Reports load nahi huay."
        );
      } finally {
        setLoading(false);
      }
    }, [setRowsNow]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const register = useCallback(
    (rowId, column, node) => {
      const key =
        `${rowId}::${column}`;

      if (node) {
        refs.current.set(key, node);
      } else {
        refs.current.delete(key);
      }
    },
    []
  );

  const focusCell = useCallback(
    (rowId, column) => {
      const node =
        refs.current.get(
          `${rowId}::${column}`
        );

      node?.focus?.({
        preventScroll: true,
      });

      node?.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });

      setActiveCell(
        `${rowId}::${column}`
      );

      setSelectedRowId(rowId);
    },
    []
  );

  /*
   * ReportEntryForm se created
   * record receive hota hai.
   */
  useEffect(() => {
    const created = (event) => {
      const detail =
        event.detail || {};

      const record =
        extractRecord(
          detail.record ||
            detail.rawResult ||
            detail
        );

      if (
        detail.refresh ||
        !record?.id
      ) {
        void fetchReports();
        return;
      }

      setRowsNow((previous) => {
        const exists =
          previous.some(
            (row) =>
              String(row.id) ===
              String(record.id)
          );

        if (exists) {
          return previous.map(
            (row) =>
              String(row.id) ===
              String(record.id)
                ? {
                    ...row,
                    ...record,
                  }
                : row
          );
        }

        return [
          record,
          ...previous,
        ];
      });

      requestAnimationFrame(() =>
        focusCell(
          record.id,
          "tuitionName"
        )
      );
    };

    window.addEventListener(
      "otm-report-created",
      created
    );

    return () =>
      window.removeEventListener(
        "otm-report-created",
        created
      );
  }, [
    fetchReports,
    focusCell,
    setRowsNow,
  ]);

  const flush = useCallback(
    async (rowId, override) => {
      if (
        timers.current.has(rowId)
      ) {
        clearTimeout(
          timers.current.get(rowId)
        );
      }

      timers.current.delete(rowId);

      const row =
        override ||
        rowsRef.current.find(
          (item) =>
            item.id === rowId
        );

      if (!row?.id) {
        return;
      }

      setSavingIds((previous) =>
        previous.includes(rowId)
          ? previous
          : [...previous, rowId]
      );

      try {
        const response =
          await axios.put(
            `${API_BASE_URL}/reports/${rowId}`,
            payload(row),
            authConfig()
          );

        const saved =
          extractRecord(
            response.data
          );

        if (saved?.id) {
          setRowsNow((previous) =>
            previous.map((item) =>
              String(item.id) ===
              String(saved.id)
                ? {
                    ...item,
                    ...saved,
                  }
                : item
            )
          );
        }

        setError("");
      } catch (requestError) {
        console.error(requestError);

        setError(
          requestError?.response?.data
            ?.error ||
            requestError?.response?.data
              ?.message ||
            "Changes save nahi huay."
        );

        await fetchReports();
      } finally {
        setSavingIds((previous) =>
          previous.filter(
            (id) => id !== rowId
          )
        );
      }
    },
    [fetchReports, setRowsNow]
  );

  const schedule = useCallback(
    (
      rowId,
      row,
      delay = 350
    ) => {
      if (
        timers.current.has(rowId)
      ) {
        clearTimeout(
          timers.current.get(rowId)
        );
      }

      timers.current.set(
        rowId,
        setTimeout(
          () =>
            void flush(rowId, row),
          delay
        )
      );
    },
    [flush]
  );

  const update = useCallback(
    (
      rowId,
      column,
      value,
      save = true
    ) => {
      const current =
        rowsRef.current.find(
          (row) =>
            row.id === rowId
        );

      if (!current) {
        return;
      }

      const next = {
        ...current,

        [column]:
          [
            "groupName",
            "tutorName",
          ].includes(column)
            ? normalizeList(value)
            : value,
      };

      setRowsNow((previous) =>
        previous.map((row) =>
          row.id === rowId
            ? next
            : row
        )
      );

      if (save) {
        schedule(rowId, next);
      }
    },
    [schedule, setRowsNow]
  );

  const moveHorizontal =
    useCallback(
      (
        rowId,
        column,
        delta
      ) => {
        const rowIndex =
          rowsRef.current.findIndex(
            (row) =>
              row.id === rowId
          );

        const columnIndex =
          COLUMNS.indexOf(column);

        let nextRow = rowIndex;
        let nextColumn =
          columnIndex + delta;

        if (
          nextColumn >=
          COLUMNS.length
        ) {
          nextColumn = 0;
          nextRow += 1;
        }

        if (nextColumn < 0) {
          nextColumn =
            COLUMNS.length - 1;

          nextRow -= 1;
        }

        const row =
          rowsRef.current[nextRow];

        if (row) {
          focusCell(
            row.id,
            COLUMNS[nextColumn]
          );
        }
      },
      [focusCell]
    );

  const moveVertical =
    useCallback(
      (
        rowId,
        column,
        delta
      ) => {
        const index =
          rowsRef.current.findIndex(
            (row) =>
              row.id === rowId
          );

        const row =
          rowsRef.current[
            index + delta
          ];

        if (row) {
          focusCell(
            row.id,
            column
          );
        }
      },
      [focusCell]
    );

  const gridKeyDown =
    useCallback(
      (
        event,
        rowId,
        column,
        options = {}
      ) => {
        if (
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        ) {
          return;
        }

        if (event.key === "Tab") {
          event.preventDefault();

          void flush(rowId);

          moveHorizontal(
            rowId,
            column,
            event.shiftKey
              ? -1
              : 1
          );

          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();

          void flush(rowId);

          moveVertical(
            rowId,
            column,
            event.shiftKey
              ? -1
              : 1
          );

          return;
        }

        if (
          event.key === "ArrowUp"
        ) {
          event.preventDefault();

          moveVertical(
            rowId,
            column,
            -1
          );

          return;
        }

        if (
          event.key ===
          "ArrowDown"
        ) {
          event.preventDefault();

          moveVertical(
            rowId,
            column,
            1
          );

          return;
        }

        if (
          event.key ===
            "ArrowLeft" &&
          (options.draftIsEmpty ||
            caretAtStart(
              event.currentTarget
            ))
        ) {
          event.preventDefault();

          moveHorizontal(
            rowId,
            column,
            -1
          );

          return;
        }

        if (
          event.key ===
            "ArrowRight" &&
          (options.draftIsEmpty ||
            caretAtEnd(
              event.currentTarget
            ))
        ) {
          event.preventDefault();

          moveHorizontal(
            rowId,
            column,
            1
          );
        }
      },
      [
        flush,
        moveHorizontal,
        moveVertical,
      ]
    );

  /*
   * Excel/Google Sheets se
   * multiple cells paste support.
   */
  const pasteGrid =
    useCallback(
      async (
        event,
        startRowId,
        startColumn
      ) => {
        const text =
          event.clipboardData
            ?.getData(
              "text/plain"
            ) || "";

        if (
          !/\t|\r|\n/.test(text)
        ) {
          return;
        }

        event.preventDefault();

        const matrix = text
          .replace(/\r/g, "")
          .split("\n")
          .filter(
            (
              line,
              index,
              all
            ) =>
              line.length ||
              index <
                all.length - 1
          )
          .map((line) =>
            line.split("\t")
          );

        const next =
          rowsRef.current.map(
            (row) => ({
              ...row,
            })
          );

        const startRow =
          next.findIndex(
            (row) =>
              row.id === startRowId
          );

        const startCol =
          COLUMNS.indexOf(
            startColumn
          );

        const changed =
          new Map();

        matrix.forEach(
          (cells, rowOffset) => {
            const row =
              next[
                startRow +
                  rowOffset
              ];

            if (!row) {
              return;
            }

            cells.forEach(
              (
                cell,
                columnOffset
              ) => {
                const column =
                  COLUMNS[
                    startCol +
                      columnOffset
                  ];

                if (!column) {
                  return;
                }

                if (
                  [
                    "groupName",
                    "tutorName",
                  ].includes(column)
                ) {
                  row[column] =
                    normalizeList(cell);
                } else if (
                  column ===
                  "reportStatus"
                ) {
                  row[column] =
                    cell
                      .toLowerCase()
                      .trim() ===
                    "report shared"
                      ? "report shared"
                      : "report pending";
                } else if (
                  column ===
                  "rowColor"
                ) {
                  if (
                    /^#[0-9a-f]{6}$/i.test(
                      cell.trim()
                    )
                  ) {
                    row[column] =
                      cell.trim();
                  }
                } else {
                  row[column] = cell;
                }
              }
            );

            changed.set(
              row.id,
              row
            );
          }
        );

        setRowsNow(next);

        setSavingIds(
          (previous) => [
            ...new Set([
              ...previous,
              ...changed.keys(),
            ]),
          ]
        );

        try {
          await Promise.all(
            [
              ...changed.values(),
            ].map((row) =>
              axios.put(
                `${API_BASE_URL}/reports/${row.id}`,
                payload(row),
                authConfig()
              )
            )
          );

          setError("");
        } catch (requestError) {
          console.error(
            requestError
          );

          setError(
            requestError?.response
              ?.data?.error ||
              requestError?.response
                ?.data?.message ||
              "Pasted cells save nahi huay."
          );

          await fetchReports();
        } finally {
          setSavingIds(
            (previous) =>
              previous.filter(
                (id) =>
                  !changed.has(id)
              )
          );
        }
      },
      [fetchReports, setRowsNow]
    );

  const addRow =
    useCallback(async () => {
      try {
        const response =
          await axios.post(
            `${API_BASE_URL}/reports`,
            payload({
              tuitionName:
                "New Tuition",

              groupName: [],
              tutorName: [],

              reportStatus:
                "report pending",

              displayOrder:
                rowsRef.current
                  .length,
            }),
            authConfig()
          );

        const row =
          extractRecord(
            response.data
          );

        if (!row?.id) {
          void fetchReports();
          return;
        }

        setRowsNow((previous) => [
          row,
          ...previous,
        ]);

        requestAnimationFrame(() =>
          focusCell(
            row.id,
            "tuitionName"
          )
        );
      } catch (requestError) {
        console.error(
          requestError
        );

        setError(
          requestError?.response
            ?.data?.error ||
            requestError?.response
              ?.data?.message ||
            "Row add nahi hui."
        );
      }
    }, [
      fetchReports,
      focusCell,
      setRowsNow,
    ]);

  const duplicate =
    useCallback(
      async (row) => {
        try {
          const response =
            await axios.post(
              `${API_BASE_URL}/reports`,
              payload({
                ...row,

                id: undefined,

                tuitionName:
                  `${row.tuitionName || ""} (Copy)`,
              }),
              authConfig()
            );

          const copy =
            extractRecord(
              response.data
            );

          if (!copy?.id) {
            void fetchReports();
            return;
          }

          const index =
            rowsRef.current.findIndex(
              (item) =>
                item.id === row.id
            );

          setRowsNow((previous) => {
            const next = [
              ...previous,
            ];

            next.splice(
              index + 1,
              0,
              copy
            );

            return next;
          });
        } catch (requestError) {
          console.error(
            requestError
          );

          setError(
            "Row duplicate nahi hui."
          );
        }
      },
      [fetchReports, setRowsNow]
    );

  const remove =
    useCallback(
      async (id) => {
        if (
          !window.confirm(
            "Delete this report row?"
          )
        ) {
          return;
        }

        const previous =
          rowsRef.current;

        setRowsNow((current) =>
          current.filter(
            (row) =>
              row.id !== id
          )
        );

        try {
          await axios.delete(
            `${API_BASE_URL}/reports/${id}`,
            authConfig()
          );
        } catch (requestError) {
          console.error(
            requestError
          );

          setRowsNow(previous);

          setError(
            "Row delete nahi hui."
          );
        }
      },
      [setRowsNow]
    );

  const drop =
    useCallback(
      async (targetId) => {
        if (
          !draggedId ||
          draggedId === targetId
        ) {
          return;
        }

        const next = [
          ...rowsRef.current,
        ];

        const from =
          next.findIndex(
            (row) =>
              row.id === draggedId
          );

        const to =
          next.findIndex(
            (row) =>
              row.id === targetId
          );

        if (
          from < 0 ||
          to < 0
        ) {
          return;
        }

        const [item] =
          next.splice(from, 1);

        next.splice(to, 0, item);

        setRowsNow(next);
        setDraggedId(null);

        try {
          await axios.post(
            `${API_BASE_URL}/reports/reorder`,
            {
              orderedIds:
                next.map(
                  (row) =>
                    row.id
                ),
            },
            authConfig()
          );
        } catch (requestError) {
          console.error(
            requestError
          );

          setError(
            "Row order save nahi hua."
          );

          await fetchReports();
        }
      },
      [
        draggedId,
        fetchReports,
        setRowsNow,
      ]
    );

  const props = useCallback(
    (
      row,
      column,
      options = {}
    ) => ({
      ref: (node) =>
        register(
          row.id,
          column,
          node
        ),

      onFocus: () => {
        setActiveCell(
          `${row.id}::${column}`
        );

        setSelectedRowId(row.id);
      },

      onBlur: () =>
        void flush(row.id),

      onKeyDown: (event) =>
        gridKeyDown(
          event,
          row.id,
          column,
          options
        ),

      onPaste: (event) =>
        void pasteGrid(
          event,
          row.id,
          column
        ),
    }),
    [
      flush,
      gridKeyDown,
      pasteGrid,
      register,
    ]
  );

  return (
    <div className="report-table-module">
      <style>{TABLE_CSS}</style>

      {error && (
        <div className="report-table-error">
          {error}
        </div>
      )}

      <div className="report-table-card">
        <div className="report-table-head">
          <div>
            <b>
              OTM Reports Spreadsheet
            </b>

            <small>
              Arrow keys move. Enter
              moves down. Tab moves
              right. Excel multi-cell
              paste supported.
            </small>
          </div>

          <div>
            <span>
              {rows.length} rows
            </span>

            <button
              type="button"
              onClick={() =>
                void addRow()
              }
            >
              + Add Row
            </button>
          </div>
        </div>

        <div className="report-table-scroll">
          <table>
            <thead>
              <tr>
                <th className="drag">
                  ↕
                </th>

                <th className="num">
                  #
                </th>

                <th className="tuition">
                  Tuition Name
                </th>

                <th>
                  Group Name
                </th>

                <th>
                  Tutor Name
                </th>

                <th className="status">
                  Report Status
                </th>

                <th className="color">
                  Color
                </th>

                <th className="action">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading &&
              !rows.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="empty"
                  >
                    Loading…
                  </td>
                </tr>
              ) : !rows.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="empty"
                  >
                    No reports found.
                  </td>
                </tr>
              ) : (
                rows.map(
                  (row, index) => (
                    <tr
                      key={row.id}
                      draggable
                      onDragStart={() =>
                        setDraggedId(
                          row.id
                        )
                      }
                      onDragOver={(
                        event
                      ) =>
                        event.preventDefault()
                      }
                      onDrop={() =>
                        void drop(row.id)
                      }
                      style={{
                        background:
                          row.rowColor ||
                          (selectedRowId ===
                          row.id
                            ? "#ecfdf5"
                            : index % 2
                              ? "#f8fafc"
                              : "#fff"),

                        opacity:
                          draggedId ===
                          row.id
                            ? 0.45
                            : 1,
                      }}
                    >
                      <td className="drag-cell">
                        ⋮⋮
                      </td>

                      <td className="num-cell">
                        {index + 1}

                        {savingIds.includes(
                          row.id
                        )
                          ? " •"
                          : ""}
                      </td>

                      <td
                        className={
                          activeCell ===
                          `${row.id}::tuitionName`
                            ? "sheet-cell active"
                            : "sheet-cell"
                        }
                      >
                        <input
                          {...props(
                            row,
                            "tuitionName"
                          )}
                          value={
                            row.tuitionName ||
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            update(
                              row.id,
                              "tuitionName",
                              event.target
                                .value
                            )
                          }
                        />
                      </td>

                      <td
                        className={
                          activeCell ===
                          `${row.id}::groupName`
                            ? "sheet-cell active"
                            : "sheet-cell"
                        }
                      >
                        <BadgeEditor
                          value={
                            row.groupName
                          }
                          type="group"
                          placeholder="Add group"
                          active={
                            activeCell ===
                            `${row.id}::groupName`
                          }
                          inputRef={(
                            node
                          ) =>
                            register(
                              row.id,
                              "groupName",
                              node
                            )
                          }
                          onFocus={() => {
                            setActiveCell(
                              `${row.id}::groupName`
                            );

                            setSelectedRowId(
                              row.id
                            );
                          }}
                          onChange={(
                            value
                          ) =>
                            update(
                              row.id,
                              "groupName",
                              value
                            )
                          }
                          onBlur={() =>
                            void flush(
                              row.id
                            )
                          }
                          onGridKeyDown={(
                            event,
                            options
                          ) =>
                            gridKeyDown(
                              event,
                              row.id,
                              "groupName",
                              options
                            )
                          }
                          onGridPaste={(
                            event
                          ) =>
                            void pasteGrid(
                              event,
                              row.id,
                              "groupName"
                            )
                          }
                        />
                      </td>

                      <td
                        className={
                          activeCell ===
                          `${row.id}::tutorName`
                            ? "sheet-cell active"
                            : "sheet-cell"
                        }
                      >
                        <BadgeEditor
                          value={
                            row.tutorName
                          }
                          type="tutor"
                          placeholder="Add tutor"
                          active={
                            activeCell ===
                            `${row.id}::tutorName`
                          }
                          inputRef={(
                            node
                          ) =>
                            register(
                              row.id,
                              "tutorName",
                              node
                            )
                          }
                          onFocus={() => {
                            setActiveCell(
                              `${row.id}::tutorName`
                            );

                            setSelectedRowId(
                              row.id
                            );
                          }}
                          onChange={(
                            value
                          ) =>
                            update(
                              row.id,
                              "tutorName",
                              value
                            )
                          }
                          onBlur={() =>
                            void flush(
                              row.id
                            )
                          }
                          onGridKeyDown={(
                            event,
                            options
                          ) =>
                            gridKeyDown(
                              event,
                              row.id,
                              "tutorName",
                              options
                            )
                          }
                          onGridPaste={(
                            event
                          ) =>
                            void pasteGrid(
                              event,
                              row.id,
                              "tutorName"
                            )
                          }
                        />
                      </td>

                      <td
                        className={
                          activeCell ===
                          `${row.id}::reportStatus`
                            ? "sheet-cell active"
                            : "sheet-cell"
                        }
                      >
                        <select
                          {...props(
                            row,
                            "reportStatus",
                            {
                              draftIsEmpty:
                                true,
                            }
                          )}
                          value={
                            row.reportStatus ||
                            "report pending"
                          }
                          style={statusStyle(
                            row.reportStatus
                          )}
                          onChange={(
                            event
                          ) =>
                            update(
                              row.id,
                              "reportStatus",
                              event.target
                                .value
                            )
                          }
                        >
                          {REPORT_STATUS_OPTIONS.map(
                            (option) => (
                              <option
                                key={
                                  option.value
                                }
                                value={
                                  option.value
                                }
                              >
                                {
                                  option.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td
                        className={
                          activeCell ===
                          `${row.id}::rowColor`
                            ? "sheet-cell active"
                            : "sheet-cell"
                        }
                      >
                        <input
                          {...props(
                            row,
                            "rowColor",
                            {
                              draftIsEmpty:
                                true,
                            }
                          )}
                          className="color-input"
                          type="color"
                          value={
                            row.rowColor ||
                            "#ffffff"
                          }
                          onChange={(
                            event
                          ) =>
                            update(
                              row.id,
                              "rowColor",
                              event.target
                                .value
                            )
                          }
                        />
                      </td>

                      <td className="action-cell">
                        <button
                          type="button"
                          onClick={() =>
                            void duplicate(
                              row
                            )
                          }
                        >
                          Copy
                        </button>

                        <button
                          className="delete"
                          type="button"
                          onClick={() =>
                            void remove(
                              row.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const TABLE_CSS = `
.report-table-module{width:100%;padding:8px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.report-table-error{margin-bottom:10px;padding:9px 12px;border:1px solid #fecaca;border-radius:6px;background:#fef2f2;color:#991b1b;font-size:12px;font-weight:700}
.report-table-card{border:1px solid #94a3b8;border-radius:8px;background:#fff;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,.06)}
.report-table-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:11px 14px;background:#f8fafc;border-bottom:1px solid #94a3b8}
.report-table-head b{display:block;font-size:15px;color:#0f172a}
.report-table-head small{display:block;margin-top:3px;font-size:11px;color:#64748b}
.report-table-head>div:last-child{display:flex;align-items:center;gap:8px}
.report-table-head span{padding:4px 8px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:800}
.report-table-head button{padding:7px 12px;border:1px solid #15803d;border-radius:6px;background:#16a34a;color:#fff;font-size:12px;font-weight:800;cursor:pointer}
.report-table-scroll{width:100%;max-height:70vh;overflow:auto}
.report-table-module table{width:100%;min-width:1080px;border-collapse:separate;border-spacing:0;table-layout:fixed}
.report-table-module th{position:sticky;top:0;z-index:5;padding:8px 7px;background:#0f172a;color:#fff;border-right:1px solid #475569;border-bottom:1px solid #475569;font-size:10px;font-weight:900;text-align:center}
.report-table-module th.drag{width:38px}
.report-table-module th.num{width:48px}
.report-table-module th.tuition{width:220px}
.report-table-module th.status{width:150px}
.report-table-module th.color{width:90px}
.report-table-module th.action{width:110px}
.drag-cell,.num-cell{height:42px;padding:0;text-align:center;vertical-align:middle;color:#64748b;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1}
.drag-cell{cursor:grab;user-select:none}
.num-cell{font-size:12px;font-weight:800}
.sheet-cell{height:42px;padding:0;vertical-align:middle;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;position:relative}
.sheet-cell.active{background:#ecfdf5;box-shadow:inset 0 0 0 2px #16a34a;z-index:3}
.sheet-cell>input:not(.color-input){width:100%;min-height:40px;padding:7px 8px;border:0;outline:0;background:transparent;box-sizing:border-box;font-size:13px}
.sheet-cell>select{width:calc(100% - 10px);min-height:30px;margin:5px;padding:4px 7px;border:1px solid;border-radius:999px;outline:0;font-size:11px;font-weight:800;text-align:center}
.color-input{width:100%;min-height:40px;padding:8px;border:0;outline:0;background:transparent;cursor:pointer;box-sizing:border-box}
.report-badge-editor{width:100%;min-height:40px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;padding:4px 5px;box-sizing:border-box}
.report-badge-editor.active{background:#ecfdf5}
.report-badge-editor input{flex:1 1 65px;min-width:55px;min-height:27px;padding:3px 4px;border:0;outline:0;background:transparent;font-size:11px}
.report-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 4px 2px 7px;border-radius:999px;font-size:10px;font-weight:800}
.report-badge.group{border:1px solid #93c5fd;background:#dbeafe;color:#1d4ed8}
.report-badge.tutor{border:1px solid #c4b5fd;background:#ede9fe;color:#6d28d9}
.report-badge button{width:16px;height:16px;padding:0;border:0;border-radius:999px;background:rgba(15,23,42,.08);color:inherit;cursor:pointer}
.action-cell{height:42px;padding:4px;text-align:center;vertical-align:middle;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1;white-space:nowrap}
.action-cell button{margin:0 2px;padding:4px 6px;border:1px solid #cbd5e1;border-radius:5px;background:#fff;color:#334155;font-size:10px;font-weight:800;cursor:pointer}
.action-cell button.delete{color:#dc2626}
.empty{padding:30px;text-align:center;color:#64748b;font-size:13px}
`;