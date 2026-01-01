import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    ColumnResizeMode,
    Header,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import "./Table.scss";

interface VirtualizedTableProps<T> {
    data: T[];
    columns: ColumnDef<T, unknown>[];
    tableId: string;
    onRowContextMenu?: (e: React.MouseEvent, row: T) => void;
    getRowClassName?: (row: T) => string;
}

const STORAGE_KEY_PREFIX = "table-column-widths-v2-";
const SORT_STORAGE_KEY_PREFIX = "table-sort-";

export function VirtualizedProcessTable<T>({
    data,
    columns,
    tableId,
    onRowContextMenu,
    getRowClassName,
}: VirtualizedTableProps<T>) {
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Load persisted column sizes
    const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + tableId);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return {};
            }
        }
        return {};
    });

    // Load persisted sorting
    const [sorting, setSorting] = useState<SortingState>(() => {
        const stored = localStorage.getItem(SORT_STORAGE_KEY_PREFIX + tableId);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                return [];
            }
        }
        return [];
    });

    // Persist column sizes
    useEffect(() => {
        if (Object.keys(columnSizing).length > 0) {
            localStorage.setItem(STORAGE_KEY_PREFIX + tableId, JSON.stringify(columnSizing));
        }
    }, [columnSizing, tableId]);

    // Persist sorting
    useEffect(() => {
        localStorage.setItem(SORT_STORAGE_KEY_PREFIX + tableId, JSON.stringify(sorting));
    }, [sorting, tableId]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnSizing,
        },
        onSortingChange: setSorting,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange" as ColumnResizeMode,
        enableColumnResizing: true,
    });

    const { rows } = table.getRowModel();

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 44, // Estimated row height
        overscan: 10,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
    const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

    return (
        <div ref={tableContainerRef} className="custom-table virtualized-table">
            <table style={{ width: table.getCenterTotalSize(), tableLayout: "fixed" }}>
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th
                                    key={header.id}
                                    style={{
                                        width: header.getSize(),
                                        position: "relative",
                                    }}
                                    className={`${header.column.getCanSort() ? "sort" : ""} ${header.column.getIsSorted() ? "active" : ""}`}
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    <div className="th-content">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {{
                                            asc: " ▲",
                                            desc: " ▼",
                                        }[header.column.getIsSorted() as string] ?? null}
                                    </div>
                                    <div
                                        onMouseDown={header.getResizeHandler()}
                                        onTouchStart={header.getResizeHandler()}
                                        className={`resize-handle ${header.column.getIsResizing() ? "resizing" : ""}`}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {paddingTop > 0 && (
                        <tr>
                            <td style={{ height: `${paddingTop}px`, padding: 0, border: "none" }} colSpan={columns.length} />
                        </tr>
                    )}
                    {virtualRows.map(virtualRow => {
                        const row = rows[virtualRow.index];
                        return (
                            <tr
                                key={row.id}
                                className={getRowClassName?.(row.original) ?? ""}
                                onContextMenu={e => onRowContextMenu?.(e, row.original)}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <td
                                        key={cell.id}
                                        style={{
                                            width: cell.column.getSize(),
                                            maxWidth: cell.column.getSize(),
                                        }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                    {paddingBottom > 0 && (
                        <tr>
                            <td style={{ height: `${paddingBottom}px`, padding: 0, border: "none" }} colSpan={columns.length} />
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
