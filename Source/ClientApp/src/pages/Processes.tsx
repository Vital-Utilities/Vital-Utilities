import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Checkbox, Dropdown, Input, Menu, notification } from "antd";
import { useEffect } from "react";
import "./home.scss";
import _ from "lodash";
import { CaretRightOutlined, CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons";
import { ProcessViewState, ProfileState, VitalState } from "../Redux/States";
import { fetchRunningProcessesAction, recieveDeleteProcessViewAction } from "../Redux/actions/processViewActions";
import { useInterval } from "ahooks";
import { getProcessCPUPercentColor } from "../components/PerfBadge";
import { getReadableBytesPerSecondString, getReadableBytesString } from "../components/FormatUtils";
import { Table } from "../components/Table";
import { ParentChildModelDto, GetMachineDynamicDataResponse, ProcessViewDto } from "@vital/vitalservice";
import { processApi } from "../Redux/actions/tauriApi";
import { openUrl } from "../Utilities/TauriCommands";

enum SortByEnum {
    "Description" = "Description",
    "ProcessName" = "ProcessName",
    "Pid" = "Pid",
    "Cpu" = "Cpu",
    "Ram" = "Ram",
    "DiskIO" = "DiskIO",
    "NetworkIO" = "NetworkIO",
    "Gpu" = "Gpu",
    "Title" = "Title"
}

export const Processes: React.FunctionComponent = () => {
    const [view, setView] = React.useState<ParentChildModelDto[]>([]);
    const processViewState = useSelector<VitalState, ProcessViewState>(state => state.processViewState);

    const profileState = useSelector<VitalState, ProfileState>(state => state.profileState);
    const [showAllProcess, setShowAllProcess] = React.useState<boolean>(false);
    const [filter_LowerCased, setFilter_LowerCased] = React.useState<string>("");
    const dynamicData = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const processCpuThreadPercentage = dynamicData?.processCpuThreadsUsage;
    const processCpuPercentage = dynamicData?.processCpuUsage;
    const processRamBytes = dynamicData?.processRamUsageBytes;
    const processBytesPerSecActivity = dynamicData?.processDiskBytesPerSecActivity;
    const processGpuPercentage = dynamicData?.processGpuUsage;
    const [expandedIds, setExpandedIds] = React.useState<number[]>([]);
    const [sortBy, setSortBy] = React.useState<{ sortBy: SortByEnum; descending: boolean }>({ sortBy: SortByEnum.Description, descending: false });
    const dispatch = useDispatch();

    const totalRam = (dto: ParentChildModelDto) =>
        valueOrZero(processRamBytes?.[dto.parent.id]) +
        Object.values(dto.children)
            .flatMap(e => valueOrZero(processRamBytes?.[e.id]))
            .reduce((a, b) => a + b, 1);
    const totalCpu = (dto: ParentChildModelDto) =>
        valueOrZero(processCpuPercentage?.[dto.parent.id]) +
        Object.values(dto.children)
            .flatMap(e => valueOrZero(processCpuPercentage?.[e.id]))
            .reduce((a, b) => a + b, 1);
    const totalDiskActivity = (dto: ParentChildModelDto) =>
        valueOrZero(processBytesPerSecActivity?.[dto.parent.id]) +
        Object.values(dto.children)
            .flatMap(e => valueOrZero(processBytesPerSecActivity?.[e.id]))
            .reduce((a, b) => a + b, 1);
    const totalGpuActivity = (dto: ParentChildModelDto) =>
        valueOrZero(processGpuPercentage?.[dto.parent.id]) +
        Object.values(dto.children)
            .flatMap(e => valueOrZero(processGpuPercentage?.[e.id]))
            .reduce((a, b) => a + b, 1);
    useEffect(() => {
        render();
        function render() {
            let returnList: ParentChildModelDto[] = [];
            const dictionary = processViewState.processView;

            for (const key in dictionary) {
                // eslint-disable-next-line security/detect-object-injection
                const value = dictionary[key];
                const parent = value.parent;
                const shouldAdd = filter_LowerCased.length === 0 || (filter_LowerCased.length > 0 && (parent.processName?.toLowerCase().includes(filter_LowerCased) || parent.description?.toLowerCase().includes(filter_LowerCased) || parent.processTitle?.toLowerCase().includes(filter_LowerCased) || parent.id.toString().startsWith(filter_LowerCased)));
                if (shouldAdd) {
                    if ((showAllProcess === false && value.parent.processTitle) || showAllProcess === true) {
                        returnList.push(value);
                    }
                }
            }
            switch (sortBy.sortBy) {
                case SortByEnum.Description: {
                    const toReturn = returnList.sort((a, b) => {
                        const aa = a.parent.description || a.parent.processName;
                        const bb = b.parent.description || b.parent.processName;
                        return aa.localeCompare(bb);
                    });
                    returnList = sortBy.descending ? returnList.reverse() : toReturn;
                    break;
                }
                case SortByEnum.Title: {
                    const [empty, nonEmpty] = _.partition(returnList, x => x.parent.processTitle === undefined || x.parent.processTitle === null || x.parent.processTitle.trim().length === 0);
                    let toReturn = nonEmpty.sort((a, b) => {
                        const aa = a.parent.processTitle ?? "";
                        const bb = b.parent.processTitle ?? "";
                        return aa.localeCompare(bb);
                    });
                    if (sortBy.descending) toReturn = toReturn.reverse();
                    toReturn.push(...empty);
                    returnList = toReturn;
                    break;
                }
                case SortByEnum.ProcessName: {
                    const toReturn = returnList.sort((a, b) => a.parent.processName.localeCompare(b.parent.processName));
                    returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                    break;
                }
                case SortByEnum.Pid: {
                    const toReturn = returnList.sort((a, b) => a.parent.id - b.parent.id);
                    returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                    break;
                }
                case SortByEnum.Cpu: {
                    const toReturn = returnList.sort((a, b) => totalCpu(a) - totalCpu(b));
                    returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                    break;
                }
                case SortByEnum.Ram: {
                    const toReturn = returnList.sort((a, b) => totalRam(a) - totalRam(b));
                    returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                    break;
                }
                case SortByEnum.DiskIO: {
                    const toReturn = returnList.sort((a, b) => totalDiskActivity(a) - totalDiskActivity(b));
                    returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                    break;
                }
                case SortByEnum.Gpu: {
                    const toReturn = returnList.sort((a, b) => totalGpuActivity(a) - totalGpuActivity(b));
                    returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                    break;
                }
                default:
                    break;
            }
            setView(returnList);
        }
    }, [profileState, showAllProcess, processViewState, filter_LowerCased, processCpuThreadPercentage, processCpuPercentage, processRamBytes, sortBy]);

    useInterval(
        () => {
            dispatch(fetchRunningProcessesAction());
        },
        2000,
        { immediate: true }
    );

    function killProcess(id: number) {
        processApi
            .kill(id)
            .then(() => dispatch(recieveDeleteProcessViewAction(id)))
            .catch(result => {
                console.error(result);
                notification.error({ message: String(result), duration: 2000 });
            });
    }
    function valueOrZero(value: undefined | never | number): number {
        return value || 0;
    }

    const contextMenu = (process: ProcessViewDto) => {
        return (
            <Menu>
                <Menu.Item key="1" onClick={() => killProcess(process.id)}>
                    End Task
                </Menu.Item>
                <Menu.Item key="2" onClick={() => openProcessPath(process.id)}>
                    Open Process Location
                </Menu.Item>
                <Menu.Item key="3" onClick={() => openProcessProperties(process.id)}>
                    Open Properties
                </Menu.Item>
                <Menu.Item key="4" title="opens a web browser with search result" onClick={() => whatIs(process.processName)}>
                    What is {process.processName}?
                </Menu.Item>
                {process.description && (
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    <Menu.Item key="5" title="opens a web browser with search result" onClick={() => whatIs(process.description!)}>
                        What is {process.description}?
                    </Menu.Item>
                )}
            </Menu>
        );
    };
    function whatIs(str: string) {
        openUrl(`https://www.google.com/search?q=${str.replace(" ", "+")}`);
    }

    function renderProcess(e: ParentChildModelDto): React.ReactNode {
        const returnValue: React.ReactNode[] = [];
        const childrenLength = Object.keys(e.children).length;
        const hasChildren = childrenLength > 0;
        if (hasChildren) hasChildrenRender();
        else noChildrenRender();
        return returnValue;
        function noChildrenRender() {
            returnValue.push(
                <Dropdown key={`dropdown - ${e.parent.id}`} overlay={contextMenu(e.parent)} trigger={["contextMenu"]}>
                    <tr className="process">
                        <td
                            style={childrenLength === 0 ? { paddingLeft: 40 } : { cursor: "pointer" }}
                            onClick={() => {
                                if (childrenLength === 0) return;
                                if (expandedIds.find(f => f === e.parent.id) === undefined) {
                                    const copy = { ...expandedIds };
                                    copy.push(e.parent.id);
                                } else {
                                    setExpandedIds(expandedIds.filter(g => g !== e.parent.id));
                                }
                            }}
                        >
                            <div>
                                <span>{e.parent.description ?? e.parent.processName}</span>
                            </div>
                        </td>
                        <td title={e.parent.processTitle ?? undefined} style={{ maxWidth: 250 }}>
                            <p style={{ margin: 0 }} className="cut-text">
                                {e.parent.processTitle}
                            </p>
                        </td>
                        <td title={e.parent.processName}>{e.parent.processName}</td>
                        <td>{e.parent.id}</td>
                        <td style={{ textAlign: "right", color: getProcessCPUPercentColor(valueOrZero(processCpuPercentage?.[e.parent.id]) ?? 0) }}>{valueOrZero(processCpuPercentage?.[e.parent.id]).toFixed(1)}%</td>
                        <td style={{ textAlign: "right", minWidth: 80 }}>{processRamBytes && getReadableBytesString(valueOrZero(processRamBytes[e.parent.id]))}</td>
                        <td style={{ textAlign: "right", minWidth: 80 }}>{processBytesPerSecActivity && getReadableBytesPerSecondString(processBytesPerSecActivity?.[e.parent.id], 1)}</td>
                        <td style={{ textAlign: "right", minWidth: 80 }}>{processGpuPercentage && processGpuPercentage?.[e.parent.id]}%</td>
                    </tr>
                </Dropdown>
            );
        }

        function hasChildrenRender() {
            const values = Object.values(e.children);
            const totalCpu = valueOrZero(processCpuPercentage?.[e.parent.id]) + values.map(e => valueOrZero(processCpuPercentage?.[e.id])).reduce((a, b) => a + b, 0);
            const totalRam = valueOrZero(processRamBytes?.[e.parent.id]) + values.map(e => valueOrZero(processRamBytes?.[e.id])).reduce((a, b) => a + b, 0);
            const diskBytesPerSecActivity = valueOrZero(processBytesPerSecActivity?.[e.parent.id]) + values.map(e => valueOrZero(processBytesPerSecActivity?.[e.id])).reduce((a, b) => a + b, 0);
            const gpuActivity = valueOrZero(processGpuPercentage?.[e.parent.id]) + values.map(e => valueOrZero(processGpuPercentage?.[e.id])).reduce((a, b) => a + b, 0);

            returnValue.push(
                <Dropdown key={`dropdown - ${e.parent.id}`} overlay={contextMenu(e.parent)} trigger={["contextMenu"]}>
                    <tr className="process">
                        <td
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (expandedIds.find(f => f === e.parent.id) === undefined) {
                                    const copy = _.cloneDeep(expandedIds);
                                    copy.push(e.parent.id);
                                    setExpandedIds(copy);
                                } else {
                                    setExpandedIds(expandedIds.filter(g => g !== e.parent.id));
                                }
                            }}
                        >
                            <div>
                                <span style={{ cursor: "pointer", height: 10, width: 10, padding: 2, marginRight: 8 }}>{expandedIds.find(f => f === e.parent.id) === undefined ? <CaretRightOutlined rev={""} /> : <CaretDownOutlined rev={""} />}</span>
                                <span>
                                    {e.parent.description ?? e.parent.processTitle ?? e.parent.processName} {`(+${childrenLength})`}
                                </span>
                            </div>
                        </td>
                        <td title={e.parent.processTitle ?? e.parent.processName} style={{ maxWidth: 250 }}>
                            <p style={{ margin: 0 }} className="cut-text">
                                {e.parent.processTitle ?? undefined}
                            </p>
                        </td>
                        <td title={e.parent.processName}>{e.parent.processName}</td>
                        <td>{e.parent.id}</td>
                        <td style={{ textAlign: "right", color: getProcessCPUPercentColor(totalCpu ?? 0) }}>{totalCpu?.toFixed(1)}%</td>
                        <td style={{ textAlign: "right" }}>{getReadableBytesString(totalRam)}</td>
                        <td style={{ textAlign: "right" }}>{getReadableBytesPerSecondString(diskBytesPerSecActivity, 1)}</td>
                        <td style={{ textAlign: "right" }}>{gpuActivity && gpuActivity}%</td>
                    </tr>
                </Dropdown>
            );

            if (expandedIds.find(f => f === e.parent.id) !== undefined) {
                const cpuPercentage = valueOrZero(processCpuPercentage?.[e.parent.id]);

                returnValue.push(
                    <Dropdown key={`dropdown - ${e.parent.id} child`} overlay={contextMenu(e.parent)} trigger={["contextMenu"]}>
                        <tr className="child process">
                            <td style={{ paddingLeft: 40, maxWidth: 250 }}>
                                <div>
                                    <span>{e.parent.description ?? e.parent.processName}</span>
                                </div>
                            </td>
                            <td title={e.parent.processTitle ?? e.parent.processName} style={{ maxWidth: 250 }}>
                                <p style={{ margin: 0 }} className="cut-text">
                                    {e.parent.processTitle}
                                </p>
                            </td>
                            <td title={e.parent.processName}>{e.parent.processName}</td>
                            <td>{e.parent.id}</td>
                            <td style={{ textAlign: "right", color: getProcessCPUPercentColor(cpuPercentage) }}>{cpuPercentage.toFixed(1)}%</td>
                            <td style={{ textAlign: "right" }}>{getReadableBytesString(valueOrZero(processRamBytes?.[e.parent.id]))}</td>
                            <td style={{ textAlign: "right" }}>{getReadableBytesPerSecondString(processBytesPerSecActivity?.[e.parent.id], 1)}</td>
                            <td style={{ textAlign: "right" }}>{processGpuPercentage && processGpuPercentage?.[e.parent.id]}%</td>
                        </tr>
                    </Dropdown>
                );
                returnValue.push(
                    values.map(c => {
                        const cpuPercentage = valueOrZero(processCpuPercentage?.[c.id]);
                        return (
                            <Dropdown key={`dropdown - ${c.id}`} overlay={contextMenu(c)} trigger={["contextMenu"]}>
                                <tr key={c.id} className="child process">
                                    <td style={{ paddingLeft: 70, maxWidth: 200 }}>{c.description || c.processName}</td>
                                    <td title={c.processTitle ?? c.processName} style={{ maxWidth: 250 }}>
                                        <p style={{ margin: 0 }} className="cut-text">
                                            {c.processTitle}
                                        </p>
                                    </td>
                                    <td>{c.processName}</td>
                                    <td>{c.id}</td>
                                    <td style={{ textAlign: "right", color: getProcessCPUPercentColor(cpuPercentage) }}>{cpuPercentage.toFixed(1)}%</td>
                                    <td style={{ textAlign: "right" }}>{getReadableBytesString(processRamBytes?.[c.id])}</td>
                                    <td style={{ textAlign: "right" }}>{getReadableBytesPerSecondString(processBytesPerSecActivity?.[c.id], 1)}</td>
                                    <td style={{ textAlign: "right" }}>{processGpuPercentage && processGpuPercentage?.[c.id]}%</td>
                                </tr>
                            </Dropdown>
                        );
                    })
                );
            }
        }
    }
    function sortDirectionRender() {
        return sortBy.descending ? <CaretDownOutlined rev={""} /> : <CaretUpOutlined rev={""} />;
    }

    function setSort(e: SortByEnum) {
        if (e === sortBy.sortBy) setSortBy({ ...sortBy, descending: !sortBy.descending });
        else if (e === SortByEnum.Cpu || e === SortByEnum.Ram || e === SortByEnum.DiskIO || e === SortByEnum.Gpu) setSortBy({ sortBy: e, descending: true });
        else setSortBy({ sortBy: e, descending: false });
    }
    return (
        <>
            <div id="view-header" className="view-header">
                <Input placeholder="Search" style={{ width: 200, marginRight: 20 }} value={filter_LowerCased} onChange={e => setFilter_LowerCased(e.target.value.toLowerCase())} />
                <Checkbox checked={showAllProcess} onChange={() => setShowAllProcess(!showAllProcess)}>
                    Show all Processes
                </Checkbox>
            </div>
            <Table>
                <thead>
                    <tr>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Description && "active"}`} style={{ minWidth: 100 }} onClick={() => setSort(SortByEnum.Description)}>
                            Name {sortBy.sortBy === SortByEnum.Description && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Title && "active"}`} style={{ width: 120 }} onClick={() => setSort(SortByEnum.Title)}>
                            Window Title {sortBy.sortBy === SortByEnum.Title && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.ProcessName && "active"}`} style={{ width: 120 }} onClick={() => setSort(SortByEnum.ProcessName)}>
                            Process {sortBy.sortBy === SortByEnum.ProcessName && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Pid && "active"}`} style={{ width: 80 }} onClick={() => setSort(SortByEnum.Pid)}>
                            Pid {sortBy.sortBy === SortByEnum.Pid && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Cpu && "active"}`} style={{ width: 80 }} onClick={() => setSort(SortByEnum.Cpu)}>
                            Cpu {sortBy.sortBy === SortByEnum.Cpu && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Ram && "active"}`} style={{ width: 100 }} onClick={() => setSort(SortByEnum.Ram)}>
                            Mem {sortBy.sortBy === SortByEnum.Ram && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.DiskIO && "active"}`} style={{ width: 100 }} onClick={() => setSort(SortByEnum.DiskIO)}>
                            Disk {sortBy.sortBy === SortByEnum.DiskIO && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Gpu && "active"}`} style={{ width: 100 }} onClick={() => setSort(SortByEnum.Gpu)}>
                            Gpu {sortBy.sortBy === SortByEnum.Gpu && sortDirectionRender()}
                        </th>
                    </tr>
                </thead>
                <tbody>{view.map(e => renderProcess(e))}</tbody>
            </Table>
        </>
    );
};

function openProcessPath(id: number) {
    processApi.openPath(id).catch(result => {
        console.error(result);
        notification.error({ message: String(result), duration: 2000 });
    });
}

function openProcessProperties(_id: number) {
    // Process properties is not available in the embedded backend
    notification.info({ message: "Process properties not available", duration: 2000 });
}
