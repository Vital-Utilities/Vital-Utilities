import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";
import "./Table.scss";

export interface ColumnConfig {
    id: string;
    minWidth?: number;
    defaultWidth?: number;
}

interface ResizableTableProps extends PropsWithChildren {
    /** Unique ID for persisting column widths in localStorage */
    tableId: string;
    /** Column configuration with IDs matching data-column-id on th elements */
    columns: ColumnConfig[];
}

interface ColumnWidths {
    [columnId: string]: number;
}

const STORAGE_KEY_PREFIX = "table-column-widths-";

export const ResizableTable: React.FC<ResizableTableProps> = ({ tableId, columns, children }) => {
    const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
        // Load from localStorage on init
        const stored = localStorage.getItem(STORAGE_KEY_PREFIX + tableId);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // Invalid JSON, use defaults
            }
        }
        // Use default widths from column config
        const defaults: ColumnWidths = {};
        columns.forEach(col => {
            defaults[col.id] = col.defaultWidth ?? 100;
        });
        return defaults;
    });

    const tableRef = useRef<HTMLTableElement>(null);
    const resizingRef = useRef<{
        columnId: string;
        startX: number;
        startWidth: number;
    } | null>(null);

    // Save to localStorage when widths change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PREFIX + tableId, JSON.stringify(columnWidths));
    }, [columnWidths, tableId]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent, columnId: string) => {
            e.preventDefault();
            e.stopPropagation();

            const currentWidth = columnWidths[columnId] ?? 100;
            resizingRef.current = {
                columnId,
                startX: e.clientX,
                startWidth: currentWidth
            };

            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [columnWidths]
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return;

            const { columnId, startX, startWidth } = resizingRef.current;
            const diff = e.clientX - startX;
            const col = columns.find(c => c.id === columnId);
            const minWidth = col?.minWidth ?? 50;
            const newWidth = Math.max(minWidth, startWidth + diff);

            setColumnWidths(prev => ({
                ...prev,
                [columnId]: newWidth
            }));
        };

        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [columns]);

    // Clone children to inject column widths and resize handles
    const enhancedChildren = React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;

        // Handle thead
        if (child.type === "thead") {
            return React.cloneElement(child as React.ReactElement<{ children: React.ReactNode }>, {
                children: React.Children.map((child as React.ReactElement<{ children: React.ReactNode }>).props.children, trChild => {
                    if (!React.isValidElement(trChild) || trChild.type !== "tr") return trChild;

                    return React.cloneElement(trChild as React.ReactElement<{ children: React.ReactNode }>, {
                        children: React.Children.map((trChild as React.ReactElement<{ children: React.ReactNode }>).props.children, (thChild, index) => {
                            if (!React.isValidElement(thChild) || thChild.type !== "th") return thChild;

                            const columnId = columns[index]?.id;
                            if (!columnId) return thChild;

                            const width = columnWidths[columnId];
                            const thProps = thChild.props as { style?: React.CSSProperties; className?: string; onClick?: () => void; children?: React.ReactNode };

                            return (
                                <th
                                    key={columnId}
                                    className={`resizable-th ${thProps.className ?? ""}`}
                                    style={{
                                        ...thProps.style,
                                        width: width,
                                        minWidth: columns[index]?.minWidth ?? 50,
                                        maxWidth: width,
                                        position: "relative"
                                    }}
                                    onClick={thProps.onClick}
                                >
                                    <div className="th-content">{thProps.children}</div>
                                    <div className="resize-handle" onMouseDown={e => handleMouseDown(e, columnId)} onClick={e => e.stopPropagation()} />
                                </th>
                            );
                        })
                    });
                })
            });
        }

        // Handle tbody - apply widths to td cells
        if (child.type === "tbody") {
            return React.cloneElement(child as React.ReactElement<{ children: React.ReactNode }>, {
                children: React.Children.map((child as React.ReactElement<{ children: React.ReactNode }>).props.children, trChild => {
                    if (!React.isValidElement(trChild)) return trChild;

                    // Handle arrays (from .map())
                    if (Array.isArray(trChild)) {
                        return trChild.map(item => processRow(item, columnWidths, columns));
                    }

                    return processRow(trChild, columnWidths, columns);
                })
            });
        }

        return child;
    });

    return (
        <div className="custom-table resizable-table">
            <table ref={tableRef} id="table" style={{ tableLayout: "fixed" }}>
                {enhancedChildren}
            </table>
        </div>
    );
};

function processRow(trChild: React.ReactNode, columnWidths: ColumnWidths, columns: ColumnConfig[]): React.ReactNode {
    if (!React.isValidElement(trChild)) return trChild;

    // Handle arrays recursively
    if (Array.isArray(trChild)) {
        return trChild.map(item => processRow(item, columnWidths, columns));
    }

    if (trChild.type !== "tr") return trChild;

    const trProps = trChild.props as { children?: React.ReactNode };
    return React.cloneElement(trChild as React.ReactElement<{ children: React.ReactNode }>, {
        children: React.Children.map(trProps.children, (tdChild, index) => {
            if (!React.isValidElement(tdChild) || tdChild.type !== "td") return tdChild;

            const columnId = columns[index]?.id;
            if (!columnId) return tdChild;

            const width = columnWidths[columnId];
            const tdProps = tdChild.props as { style?: React.CSSProperties };

            return React.cloneElement(tdChild as React.ReactElement, {
                style: {
                    ...tdProps.style,
                    width: width,
                    maxWidth: width,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                }
            });
        })
    });
}
