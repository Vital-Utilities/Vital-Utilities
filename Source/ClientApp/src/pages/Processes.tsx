import * as React from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import "./home.scss";
import { ProcessViewState, VitalState } from "../Redux/States";
import { fetchRunningProcessesAction, recieveDeleteProcessViewAction } from "../Redux/actions/processViewActions";
import { useInterval } from "ahooks";
import { getProcessCPUPercentColor } from "../components/PerfBadge";
import { getReadableBytesPerSecondString, getReadableBytesString } from "../components/FormatUtils";
import { GetMachineDynamicDataResponse, ProcessViewDto } from "@vital/vitalservice";
import { processApi } from "../Redux/actions/tauriApi";
import { openUrl } from "../Utilities/TauriCommands";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, ColumnResizeMode } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import "../components/Table.scss";

// Flattened row type for the table
interface ProcessRow {
    id: number;
    parentId: number | null;
    name: string;
    processName: string;
    description: string | null;
    isChild: boolean;
    isExpanded: boolean;
    hasChildren: boolean;
    childCount: number;
    depth: number;
    process: ProcessViewDto;
}

const COLUMN_SIZING_KEY = "processes-column-sizing-v2";
const SORTING_KEY = "processes-sorting";

export const Processes: React.FunctionComponent = () => {
    const processViewState = useSelector<VitalState, ProcessViewState>(state => state.processViewState);
    const dynamicData = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);

    const processCpuPercentage = dynamicData?.processCpuUsage;
    const processRamBytes = dynamicData?.processRamUsageBytes;
    const processBytesPerSecActivity = dynamicData?.processDiskBytesPerSecActivity;
    const processGpuPercentage = dynamicData?.processGpuUsage;

    const [showAllProcess, setShowAllProcess] = useState(false);
    const [filter, setFilter] = useState("");
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; process: ProcessViewDto } | null>(null);

    const dispatch = useDispatch();
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Load persisted column sizing
    const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => {
        try {
            const stored = localStorage.getItem(COLUMN_SIZING_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    // Load persisted sorting
    const [sorting, setSorting] = useState<SortingState>(() => {
        try {
            const stored = localStorage.getItem(SORTING_KEY);
            return stored ? JSON.parse(stored) : [{ id: "name", desc: false }];
        } catch {
            return [{ id: "name", desc: false }];
        }
    });

    // Persist column sizing
    useEffect(() => {
        if (Object.keys(columnSizing).length > 0) {
            localStorage.setItem(COLUMN_SIZING_KEY, JSON.stringify(columnSizing));
        }
    }, [columnSizing]);

    // Persist sorting
    useEffect(() => {
        localStorage.setItem(SORTING_KEY, JSON.stringify(sorting));
    }, [sorting]);

    // Fetch processes periodically
    useInterval(
        () => {
            dispatch(fetchRunningProcessesAction());
        },
        2000,
        { immediate: true }
    );

    const valueOrZero = useCallback((value: number | undefined): number => value ?? 0, []);

    // Build parent rows (without children yet - children added after sorting)
    const parentRows = useMemo((): ProcessRow[] => {
        const rows: ProcessRow[] = [];
        const filterLower = filter.toLowerCase();

        const processEntries = Object.values(processViewState.processView);

        for (const entry of processEntries) {
            const parent = entry.parent;
            const children = Object.values(entry.children);
            const hasChildren = children.length > 0;

            // Filter check
            const matchesFilter = filterLower.length === 0 || parent.processName?.toLowerCase().includes(filterLower) || parent.description?.toLowerCase().includes(filterLower) || parent.processTitle?.toLowerCase().includes(filterLower) || parent.id.toString().startsWith(filterLower);

            if (!matchesFilter) continue;

            // Show all check
            if (!showAllProcess && !parent.processTitle) continue;

            const isExpanded = expandedIds.has(parent.id);

            // Add parent row only
            rows.push({
                id: parent.id,
                parentId: null,
                name: parent.description ?? parent.processName,
                processName: parent.processName,
                description: parent.description ?? null,
                isChild: false,
                isExpanded,
                hasChildren,
                childCount: children.length,
                depth: 0,
                process: parent
            });
        }

        return rows;
    }, [processViewState.processView, filter, showAllProcess, expandedIds]);

    // Column definitions
    const columns = useMemo<ColumnDef<ProcessRow>[]>(
        () => [
            {
                id: "name",
                accessorFn: row => row.name,
                header: "Name",
                size: 250,
                minSize: 100,
                cell: ({ row }) => {
                    const data = row.original;
                    const paddingLeft = data.isChild ? 40 : data.hasChildren ? 0 : 24;

                    return (
                        <div
                            style={{ paddingLeft, display: "flex", alignItems: "center", cursor: data.hasChildren ? "pointer" : "default" }}
                            onClick={() => {
                                if (data.hasChildren) {
                                    setExpandedIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(data.id)) {
                                            next.delete(data.id);
                                        } else {
                                            next.add(data.id);
                                        }
                                        return next;
                                    });
                                }
                            }}
                        >
                            {data.hasChildren && <span className="expand-icon">{data.isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</span>}
                            <span title={data.name}>
                                {data.name}
                                {data.hasChildren && ` (+${data.childCount})`}
                            </span>
                        </div>
                    );
                },
                sortingFn: "alphanumeric"
            },
            {
                id: "process",
                accessorKey: "processName",
                header: "Process",
                size: 120,
                minSize: 80,
                cell: ({ getValue }) => <span title={getValue() as string}>{getValue() as string}</span>
            },
            {
                id: "pid",
                accessorKey: "id",
                header: "PID",
                size: 80,
                minSize: 50
            },
            {
                id: "cpu",
                accessorFn: row => {
                    if (row.hasChildren && !row.isChild) {
                        const entry = processViewState.processView[row.id];
                        if (entry) {
                            const children = Object.values(entry.children);
                            return valueOrZero(processCpuPercentage?.[row.id]) + children.reduce((sum, c) => sum + valueOrZero(processCpuPercentage?.[c.id]), 0);
                        }
                    }
                    return valueOrZero(processCpuPercentage?.[row.id]);
                },
                header: "CPU",
                size: 80,
                minSize: 60,
                cell: ({ getValue }) => {
                    const value = getValue() as number;
                    return <span style={{ color: getProcessCPUPercentColor(value), textAlign: "right", display: "block" }}>{value.toFixed(1)}%</span>;
                }
            },
            {
                id: "mem",
                accessorFn: row => {
                    if (row.hasChildren && !row.isChild) {
                        const entry = processViewState.processView[row.id];
                        if (entry) {
                            const children = Object.values(entry.children);
                            return valueOrZero(processRamBytes?.[row.id]) + children.reduce((sum, c) => sum + valueOrZero(processRamBytes?.[c.id]), 0);
                        }
                    }
                    return valueOrZero(processRamBytes?.[row.id]);
                },
                header: "Mem",
                size: 100,
                minSize: 60,
                cell: ({ getValue }) => <span style={{ textAlign: "right", display: "block" }}>{getReadableBytesString(getValue() as number)}</span>
            },
            {
                id: "disk",
                accessorFn: row => {
                    if (row.hasChildren && !row.isChild) {
                        const entry = processViewState.processView[row.id];
                        if (entry) {
                            const children = Object.values(entry.children);
                            return valueOrZero(processBytesPerSecActivity?.[row.id]) + children.reduce((sum, c) => sum + valueOrZero(processBytesPerSecActivity?.[c.id]), 0);
                        }
                    }
                    return valueOrZero(processBytesPerSecActivity?.[row.id]);
                },
                header: "Disk",
                size: 100,
                minSize: 60,
                cell: ({ getValue }) => <span style={{ textAlign: "right", display: "block" }}>{getReadableBytesPerSecondString(getValue() as number, 1)}</span>
            },
            {
                id: "gpu",
                accessorFn: row => {
                    if (row.hasChildren && !row.isChild) {
                        const entry = processViewState.processView[row.id];
                        if (entry) {
                            const children = Object.values(entry.children);
                            return valueOrZero(processGpuPercentage?.[row.id]) + children.reduce((sum, c) => sum + valueOrZero(processGpuPercentage?.[c.id]), 0);
                        }
                    }
                    return valueOrZero(processGpuPercentage?.[row.id]);
                },
                header: "GPU",
                size: 80,
                minSize: 60,
                cell: ({ getValue }) => <span style={{ textAlign: "right", display: "block" }}>{(getValue() as number).toFixed(1)}%</span>
            }
        ],
        [processViewState.processView, processCpuPercentage, processRamBytes, processBytesPerSecActivity, processGpuPercentage, valueOrZero]
    );

    const table = useReactTable({
        data: parentRows,
        columns,
        state: {
            sorting,
            columnSizing
        },
        onSortingChange: setSorting,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: "onChange" as ColumnResizeMode,
        enableColumnResizing: true
    });

    // Get sorted parent rows, then insert children after each expanded parent
    const sortedParentRows = table.getRowModel().rows;
    const isResizing = !!table.getState().columnSizingInfo.isResizingColumn;

    // Build final rows with children inserted after their parents
    const rowsWithChildren = useMemo((): ProcessRow[] => {
        const result: ProcessRow[] = [];
        for (const row of sortedParentRows) {
            const parentData = row.original;
            result.push(parentData);

            // If parent is expanded, add its children
            if (parentData.isExpanded && parentData.hasChildren) {
                const entry = processViewState.processView[parentData.id];
                if (entry) {
                    const children = Object.values(entry.children);
                    for (const child of children) {
                        result.push({
                            id: child.id,
                            parentId: parentData.id,
                            name: child.description ?? child.processName,
                            processName: child.processName,
                            description: child.description ?? null,
                            isChild: true,
                            isExpanded: false,
                            hasChildren: false,
                            childCount: 0,
                            depth: 1,
                            process: child
                        });
                    }
                }
            }
        }
        return result;
    }, [sortedParentRows, processViewState.processView]);

    // Prevent text selection globally while resizing columns
    useEffect(() => {
        if (isResizing) {
            document.body.style.userSelect = "none";
            document.body.style.cursor = "col-resize";
        } else {
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        }
        return () => {
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizing]);

    const rowVirtualizer = useVirtualizer({
        count: rowsWithChildren.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 44,
        overscan: 15
    });

    const virtualRows = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
    const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

    // Context menu handlers
    const handleContextMenu = useCallback((e: React.MouseEvent, process: ProcessViewDto) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, process });
    }, []);

    const killProcess = useCallback(
        (id: number) => {
            processApi
                .kill(id)
                .then(() => dispatch(recieveDeleteProcessViewAction(id)))
                .catch(result => {
                    console.error(result);
                    toast.error(String(result));
                });
        },
        [dispatch]
    );

    const whatIs = useCallback((str: string) => {
        openUrl(`https://www.google.com/search?q=${str.replace(" ", "+")}`);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <div id="view-header" className="view-header" style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", padding: "1rem 1.25rem", height: "4rem", flexShrink: 0 }}>
                <Input placeholder="Search" style={{ width: 200, marginRight: "1.25rem" }} value={filter} onChange={e => setFilter(e.target.value)} />
                <div className="flex items-center gap-2">
                    <Checkbox id="show-all-processes" checked={showAllProcess} onCheckedChange={() => setShowAllProcess(!showAllProcess)} />
                    <Label htmlFor="show-all-processes">Show all Processes</Label>
                </div>
            </div>

            <div ref={tableContainerRef} className="custom-table virtualized-table">
                <table style={{ width: table.getCenterTotalSize(), tableLayout: "fixed" }}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} style={{ width: header.getSize(), position: "relative" }} className={`sort ${header.column.getIsSorted() ? "active" : ""}`} onClick={header.column.getToggleSortingHandler()}>
                                        <div className="th-content">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? null}
                                        </div>
                                        <div onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`resize-handle ${header.column.getIsResizing() ? "resizing" : ""}`} onClick={e => e.stopPropagation()} />
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {paddingTop > 0 && (
                            <tr>
                                <td style={{ height: paddingTop, padding: 0, border: "none" }} colSpan={columns.length} />
                            </tr>
                        )}
                        {virtualRows.map(virtualRow => {
                            const data = rowsWithChildren[virtualRow.index];
                            const headers = table.getHeaderGroups()[0].headers;
                            return (
                                <tr key={data.id} className={`process ${data.isChild ? "child" : ""}`} onContextMenu={e => handleContextMenu(e, data.process)}>
                                    {headers.map(header => {
                                        const column = header.column;
                                        const columnDef = column.columnDef as unknown as Record<string, unknown>;
                                        const accessorFn = columnDef.accessorFn as ((row: ProcessRow, index: number) => unknown) | undefined;
                                        const accessorKey = columnDef.accessorKey as string | undefined;
                                        const cellValue = accessorFn ? accessorFn(data, virtualRow.index) : accessorKey ? (data as unknown as Record<string, unknown>)[accessorKey] : null;
                                        return (
                                            <td key={header.id} style={{ width: header.getSize(), maxWidth: header.getSize() }}>
                                                {columnDef.cell
                                                    ? flexRender(
                                                          columnDef.cell as never,
                                                          {
                                                              getValue: () => cellValue,
                                                              row: { original: data, index: virtualRow.index },
                                                              column,
                                                              table,
                                                              cell: { id: `${data.id}_${header.id}`, getValue: () => cellValue, row: { original: data }, column },
                                                              renderValue: () => cellValue
                                                          } as never
                                                      )
                                                    : String(cellValue ?? "")}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {paddingBottom > 0 && (
                            <tr>
                                <td style={{ height: paddingBottom, padding: 0, border: "none" }} colSpan={columns.length} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Context Menu */}
            {contextMenu &&
                createPortal(
                    <DropdownMenu open={true} onOpenChange={open => !open && setContextMenu(null)} modal={false}>
                        <DropdownMenuTrigger asChild>
                            <div style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y, width: 0, height: 0, pointerEvents: "none" }} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onClick={() => {
                                    killProcess(contextMenu.process.id);
                                    setContextMenu(null);
                                }}
                            >
                                End Task
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    openProcessPath(contextMenu.process.id);
                                    setContextMenu(null);
                                }}
                            >
                                Open Process Location
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    openProcessProperties(contextMenu.process.id);
                                    setContextMenu(null);
                                }}
                            >
                                Open Properties
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    whatIs(contextMenu.process.processName);
                                    setContextMenu(null);
                                }}
                            >
                                What is {contextMenu.process.processName}?
                            </DropdownMenuItem>
                            {contextMenu.process.description && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        whatIs(contextMenu.process.description ?? "");
                                        setContextMenu(null);
                                    }}
                                >
                                    What is {contextMenu.process.description}?
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>,
                    document.body
                )}
        </div>
    );
};

function openProcessPath(id: number) {
    processApi.openPath(id).catch(result => {
        console.error(result);
        toast.error(String(result));
    });
}

function openProcessProperties(_id: number) {
    toast("Process properties not available");
}
