import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from "@mui/material";
import EmptyState from "./EmptyState";
import LoadingSkeleton from "./LoadingSkeleton";
import Surface from "./Surface";

export default function DataTable({
  columns,
  rows,
  emptyText = "No rows found.",
  emptyTitle,
  loading = false,
  skeletonRows = 6,
  minWidth = 720,
  getRowKey,
  stickyHeader = false,
  maxHeight,
  rowSx,
  cellSx,
}) {
  const theme = useTheme();
  const borderColor = theme.palette.border.soft;
  const getAlign = (column) => column.align || (column.key === "description" || column.key === "event" ? "left" : "center");

  if (loading) {
    return (
      <LoadingSkeleton
        variant="table"
        rows={skeletonRows}
        columns={Math.max(1, columns.length)}
        sx={{ overflowX: "auto" }}
      />
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        compact
        title={emptyTitle || emptyText}
        description={emptyTitle ? emptyText : undefined}
      />
    );
  }

  return (
    <Surface
      sx={{
        overflowX: "auto",
        overflowY: maxHeight ? "auto" : "visible",
        maxHeight,
        scrollbarWidth: "thin",
      }}
    >
      <Table size="small" stickyHeader={stickyHeader} sx={{ minWidth, width: "100%" }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={getAlign(column)}
                sx={{
                  fontWeight: 800,
                  color: "text.secondary",
                  borderBottom: `1px solid ${borderColor}`,
                  bgcolor: theme.palette.surface[2],
                  whiteSpace: "nowrap",
                  minWidth: column.minWidth,
                  width: column.width,
                  py: 1,
                  px: 1.25,
                  fontSize: "0.78rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  ...column.headerSx,
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={getRowKey ? getRowKey(row, index) : row.id || row.uid || row.key || index}
              sx={{
                bgcolor: index % 2 === 1 ? theme.palette.surface[1] : "transparent",
                "&:hover": { bgcolor: theme.palette.surface[2] },
                ...(typeof rowSx === "function" ? rowSx(row, index) : rowSx),
              }}
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={getAlign(column)}
                  sx={{
                    borderTop: row.__groupStart && index > 0 ? `1px solid ${borderColor}` : 0,
                    borderBottom: 0,
                    whiteSpace: column.wrap ? "normal" : "nowrap",
                    overflowWrap: column.wrap ? "anywhere" : "normal",
                    py: 0.95,
                    px: 1.25,
                    fontWeight: 650,
                    fontVariantNumeric: column.numeric ? "tabular-nums" : undefined,
                    ...cellSx,
                    ...column.cellSx,
                  }}
                >
                  {column.render ? column.render(row, index) : row[column.key] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Surface>
  );
}
