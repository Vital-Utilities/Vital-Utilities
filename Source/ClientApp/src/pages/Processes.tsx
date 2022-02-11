import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Checkbox, Dropdown, Input, Menu, notification } from "antd";
import { useEffect } from "react";
import "./home.scss";
import axios from "axios";
import _ from "lodash";
import { CaretRightOutlined, CaretUpOutlined, CaretDownOutlined } from "@ant-design/icons";
import { ProcessViewState, ProfileState, VitalState } from "../Redux/States";
import { fetchMachineDynamicDataAction } from "../Redux/actions/machineActions";
import { fetchRunningProcessesAction, recieveDeleteProcessViewAction } from "../Redux/actions/processViewActions";
import { useInterval } from "ahooks";
import { GetMachineDynamicDataResponse, ParentChildModelDto, ProcessViewDto } from "../Dtos/Dto";
import { getProcessCPUPercentColor } from "../components/PerfBadge";
import { getReadableBytesPerSecondString, getReadableBytesString } from "../components/FormatUtils";
import { openUrl } from "../Utilities/TauriCommands";
import { Table } from "../components/Table";

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
    const processRamGb = dynamicData?.processRamUsageGb;
    const processBytesPerSecActivity = dynamicData?.processDiskBytesPerSecActivity;
    const [expandedIds, setExpandedIds] = React.useState<number[]>([]);
    const [sortBy, setSortBy] = React.useState<{ sortBy: SortByEnum; descending: boolean }>({ sortBy: SortByEnum.Description, descending: false });
    const dispatch = useDispatch();

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
                default:
                    break;
            }
            setView(returnList);
        }
    }, [profileState, showAllProcess, processViewState, filter_LowerCased, processCpuThreadPercentage, processCpuPercentage, processRamGb, sortBy]);

    const totalRam = (dto: ParentChildModelDto) => valueOrZero(processRamGb?.[dto.parent.id]) + dto.children.flatMap(e => valueOrZero(processRamGb?.[e.id])).reduce((a, b) => a + b, 1);
    const totalCpu = (dto: ParentChildModelDto) => valueOrZero(processCpuPercentage?.[dto.parent.id]) + dto.children.flatMap(e => valueOrZero(processCpuPercentage?.[e.id])).reduce((a, b) => a + b, 1);
    const totalDiskActivity = (dto: ParentChildModelDto) => valueOrZero(processBytesPerSecActivity?.[dto.parent.id]) + dto.children.flatMap(e => valueOrZero(processBytesPerSecActivity?.[e.id])).reduce((a, b) => a + b, 1);

    useInterval(
        () => {
            dispatch(fetchMachineDynamicDataAction());
            dispatch(fetchRunningProcessesAction());
        },
        2000,
        { immediate: true }
    );

    function killProcess(id: number) {
        axios
            .post(`api/process/kill/${id}`)
            .then(() => dispatch(recieveDeleteProcessViewAction(id)))
            .catch(result => {
                console.error(result);
                notification.error({ message: result, duration: 2000 });
            });
    }
    function valueOrZero(value: undefined | never | number): number {
        return value || 0;
    }

    // parse string to number
    const parseNumber = (value: string | undefined): number => {
        const parsedValue = parseFloat(value ?? "");
        return isNaN(parsedValue) ? 0 : parsedValue;
    };

    // function converts gb to bytes and returns the value in bytes
    const convertGbToBytes = (value: number | undefined): number => {
        if (value === undefined) return 0;
        return value * 1024 * 1024 * 1024;
    };

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
        const hasChildren = e.children.length > 0;
        if (hasChildren) hasChildrenRender();
        else noChildrenRender();

        function noChildrenRender() {
            returnValue.push(
                <Dropdown key={`dropdown - ${e.parent.id}`} overlay={contextMenu(e.parent)} trigger={["contextMenu"]}>
                    <tr className="process">
                        <td
                            style={e.children.length === 0 ? { paddingLeft: 40 } : { cursor: "pointer" }}
                            onClick={() => {
                                if (e.children.length === 0) return;
                                if (expandedIds.find(f => f === e.parent.id) === undefined) {
                                    const copy = { ...expandedIds };
                                    copy.push(e.parent.id);
                                } else {
                                    setExpandedIds(expandedIds.filter(g => g !== e.parent.id));
                                }
                            }}
                        >
                            <div>
                                <span>{e.parent.description || e.parent.processName}</span>
                            </div>
                        </td>
                        <td title={e.parent.processTitle} style={{ maxWidth: 250 }}>
                            <p style={{ margin: 0 }} className="cut-text">
                                {e.parent.processTitle}
                            </p>
                        </td>
                        <td title={e.parent.processName}>{e.parent.processName}</td>
                        <td>{e.parent.id}</td>
                        <td style={{ textAlign: "right", color: getProcessCPUPercentColor(valueOrZero(processCpuPercentage?.[e.parent.id]) ?? 0) }}>{valueOrZero(processCpuPercentage?.[e.parent.id]).toFixed(1)}%</td>
                        <td style={{ textAlign: "right", minWidth: 80 }}>{processRamGb && getReadableBytesString(convertGbToBytes(valueOrZero(processRamGb[e.parent.id])), 1)}</td>
                        <td style={{ textAlign: "right", minWidth: 80 }}>{processRamGb && getReadableBytesPerSecondString(processBytesPerSecActivity?.[e.parent.id], 1)}</td>
                    </tr>
                </Dropdown>
            );
        }

        function hasChildrenRender() {
            const totalCpu = valueOrZero(processCpuPercentage?.[e.parent.id]) + e.children.map(e => valueOrZero(processCpuPercentage?.[e.id])).reduce((a, b) => a + b, 0);
            const totalRam = valueOrZero(processRamGb?.[e.parent.id]) + e.children.map(e => valueOrZero(processRamGb?.[e.id])).reduce((a, b) => a + b, 0);
            const diskBytesPerSecActivity = valueOrZero(processBytesPerSecActivity?.[e.parent.id]) + e.children.map(e => valueOrZero(processBytesPerSecActivity?.[e.id])).reduce((a, b) => a + b, 0);
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
                                <span style={{ cursor: "pointer", height: 10, width: 10, padding: 2, marginRight: 8 }}>{expandedIds.find(f => f === e.parent.id) === undefined ? <CaretRightOutlined /> : <CaretDownOutlined />}</span>
                                <span>
                                    {e.parent.description || e.parent.processName} {`(+${e.children.length})`}
                                </span>
                            </div>
                        </td>
                        <td title={e.parent.processTitle} style={{ maxWidth: 250 }}>
                            <p style={{ margin: 0 }} className="cut-text">
                                {e.parent.processTitle}
                            </p>
                        </td>
                        <td title={e.parent.processName}>{e.parent.processName}</td>
                        <td>{e.parent.id}</td>
                        <td style={{ textAlign: "right", color: getProcessCPUPercentColor(totalCpu ?? 0) }}>{totalCpu?.toFixed(1)}%</td>
                        <td style={{ textAlign: "right" }}>{getReadableBytesString(convertGbToBytes(totalRam), 1)}</td>
                        <td style={{ textAlign: "right" }}>{getReadableBytesPerSecondString(diskBytesPerSecActivity, 1)}</td>
                    </tr>
                </Dropdown>
            );

            if (expandedIds.find(f => f === e.parent.id) !== undefined) {
                const cpuPercentage = valueOrZero(processCpuPercentage?.[e.parent.id]);

                returnValue.push(
                    <Dropdown key={`dropdown - ${e.parent.id} child`} overlay={contextMenu(e.parent)} trigger={["contextMenu"]}>
                        <tr className="child process">
                            <td
                                style={{ paddingLeft: 40, maxWidth: 250 }}
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
                                    <span>{e.parent.description || e.parent.processName}</span>
                                </div>
                            </td>
                            <td title={e.parent.processTitle} style={{ maxWidth: 250 }}>
                                <p style={{ margin: 0 }} className="cut-text">
                                    {e.parent.processTitle}
                                </p>
                            </td>
                            <td title={e.parent.processName}>{e.parent.processName}</td>
                            <td>{e.parent.id}</td>
                            <td style={{ textAlign: "right", color: getProcessCPUPercentColor(cpuPercentage) }}>{cpuPercentage.toFixed(1)}%</td>
                            <td style={{ textAlign: "right" }}>{getReadableBytesString(convertGbToBytes(valueOrZero(processRamGb?.[e.parent.id])), 1)}</td>
                            <td style={{ textAlign: "right" }}>{getReadableBytesPerSecondString(processBytesPerSecActivity?.[e.parent.id], 1)}</td>
                        </tr>
                    </Dropdown>
                );
                returnValue.push(
                    e.children.map(c => {
                        const cpuPercentage = valueOrZero(processCpuPercentage?.[c.id]);
                        return (
                            <Dropdown key={`dropdown - ${c.id}`} overlay={contextMenu(c)} trigger={["contextMenu"]}>
                                <tr key={c.id} className="child process">
                                    <td style={{ paddingLeft: 70, maxWidth: 200 }}>{c.description || c.processName}</td>
                                    <td title={c.processTitle} style={{ maxWidth: 250 }}>
                                        <p style={{ margin: 0 }} className="cut-text">
                                            {c.processTitle}
                                        </p>
                                    </td>
                                    <td>{c.processName}</td>
                                    <td>{c.id}</td>
                                    <td style={{ textAlign: "right", color: getProcessCPUPercentColor(cpuPercentage) }}>{cpuPercentage.toFixed(1)}%</td>
                                    <td style={{ textAlign: "right" }}>{getReadableBytesString(convertGbToBytes(processRamGb?.[c.id]), 1)}</td>
                                    <td style={{ textAlign: "right" }}>{getReadableBytesPerSecondString(processBytesPerSecActivity?.[c.id], 1)}</td>
                                </tr>
                            </Dropdown>
                        );
                    })
                );
            }
        }
        return returnValue;
    }
    function sortDirectionRender() {
        return sortBy.descending ? <CaretDownOutlined /> : <CaretUpOutlined />;
    }

    function setSort(e: SortByEnum) {
        if (e === sortBy.sortBy) setSortBy({ ...sortBy, descending: !sortBy.descending });
        else if (e === SortByEnum.Cpu || e === SortByEnum.Ram || e === SortByEnum.DiskIO) setSortBy({ sortBy: e, descending: true });
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
                            CPU {sortBy.sortBy === SortByEnum.Cpu && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Ram && "active"}`} style={{ width: 100 }} onClick={() => setSort(SortByEnum.Ram)}>
                            Ram {sortBy.sortBy === SortByEnum.Ram && sortDirectionRender()}
                        </th>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.DiskIO && "active"}`} style={{ width: 100 }} onClick={() => setSort(SortByEnum.DiskIO)}>
                            Disk {sortBy.sortBy === SortByEnum.DiskIO && sortDirectionRender()}
                        </th>
                    </tr>
                </thead>
                <tbody>{view.map(e => renderProcess(e))}</tbody>
            </Table>
        </>
    );
};

function openProcessPath(id: number) {
    axios.post(`api/process/openpath/${id}`).catch(result => {
        console.error(result);
        notification.error({ message: result, duration: 2000 });
    });
}

function openProcessProperties(id: number) {
    axios.post(`api/process/openproperties/${id}`).catch(result => {
        console.error(result);
        notification.error({ message: result, duration: 2000 });
    });
}

function openSearchProcess(processName: string) {
    axios.post(`api/process/whatis?processName=${processName}`).catch(result => {
        console.error(result);
        notification.error({ message: result, duration: 2000 });
    });
}
