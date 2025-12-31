import { CaretUpOutlined, CaretDownOutlined, CaretRightOutlined } from "@ant-design/icons";
import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse, TimeSeriesMachineMetricsResponse, TimeSeriesMachineMetricsModel } from "@vital/vitalservice";
import { useLocalStorageState } from "ahooks";
import { Form, Select, Checkbox, Radio, Menu, Dropdown } from "antd";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { CpuMetricsModel, CpuChartTimeSeries } from "../../components/Charts/CpuChartTimeSeries";
import { CpuThreadsChartTimeSeries } from "../../components/Charts/CpuThreadsChartTimeSeries";
import { diskMetricsModel, DiskMetricChart } from "../../components/Charts/DiskMetricChart";
import { DiskMetricHealthChart } from "../../components/Charts/DiskMetricHealthChart";
import { DiskMetricPercentageChart } from "../../components/Charts/DiskMetricPercentageChart";
import { gpuMetricsModel, GpuMetricChart } from "../../components/Charts/GpuMetricChart";
import { networkMetricsModel, NetworkAdapterMetricChart } from "../../components/Charts/NetworkAdapterMetricChart";
import { ramMetricsModel, RamMetricChart } from "../../components/Charts/RamMetricChart";
import { ChartData } from "../../components/Charts/Shared";
import { ByteToBits, getReadableBytesString, getReadableBitsPerSecondString, getReadableBytesPerSecondString } from "../../components/FormatUtils";
import { VitalState } from "../../Redux/States";
import { ClassicCpuChartView } from "./Classic/ClassicCpuView";
import { ClassicDiskView } from "./Classic/ClassicDiskView";
import { ClassicGpuView } from "./Classic/ClassicGpuView";
import { ClassicNetworkAdapterView } from "./Classic/ClassicNetworkAdapterView";
import { ClassicRamView } from "./Classic/ClassicRamView";
import "./performance.scss";
const { Option } = Select;

enum viewOptions {
    "Classic" = "Classic",
    "TimeSeries" = "TimeSeries",
    "Info" = "Info"
}
enum cpuMetricViewOptions {
    "General" = "General",
    "Detailed" = "Detailed"
}

export type relativeTypeStringOptions = "Last 1 minute" | "Last 5 minutes" | "Last 15 minutes" /* | "Last 30 minutes" | "Last 1 hour" | "Last 6 hours"  */ /* | "Last 12 hours" | "Last 24 hours" */ /* | "Last 7 days" */;

export const relativeTimeOptions: { [key: string]: number } = {
    "Last 1 minute": -1,
    "Last 5 minutes": -5,
    "Last 15 minutes": -15
    /*     "Last 30 minutes": { minutes: -30 },
    "Last 1 hour": { hours: -1 },
    "Last 6 hours": { hours: -6 } */
    /* "Last 12 hours": { hours: -12 },
    "Last 24 hours": { hours: -24 } */
    /*     "Last 7 days": { days: -7 } */
} as const;

export const PerformancePage: React.FunctionComponent = props => {
    const [cpuMetricView, setCpuMetricView] = React.useState<cpuMetricViewOptions>(cpuMetricViewOptions.General);
    const [view, setView] = React.useState<viewOptions>(viewOptions.Classic);
    const staticState = useSelector<VitalState, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const CurrentMetricState = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1];

    const [relativeTimeOption, setRelativeTimeOption] = useLocalStorageState<relativeTypeStringOptions>("relativeTimeOption", { defaultValue: "Last 1 minute" });
    const [hideVirtualAdapters, setHideVirtualAdapters] = useLocalStorageState("hideVirtualAdapters", { defaultValue: false });

    const gpuUsageData = dynamicState?.gpuUsageData;
    const networkAdapters = { ...dynamicState?.networkUsageData?.adapters };

    if (hideVirtualAdapters && networkAdapters) {
        Object.entries(networkAdapters).forEach(([adapterName, adapter]) => {
            if (adapter.properties.name.toLowerCase().includes("virtual") || adapter.properties.name?.startsWith("v") || adapter.properties.description?.toLowerCase().includes("virtual")) {
                delete networkAdapters?.[adapterName];
            }
        });
    }

    const disks = dynamicState?.diskUsages?.disks;
    const [pauseTime, setPauseTime] = React.useState(false);
    const [updateRate, setUpdateRate] = React.useState<number>(0);
    const [chartable, setChartable] = React.useState<ChartData>();
    const [classicCpuGraphView, setClassicCpuGraphView] = useLocalStorageState<"Overall" | "Logical">("classicCpuGraphView", { defaultValue: "Overall" });
    const [classicViewProps, setClassicViewProps] = React.useState<{ selectedKey: string; driveLetter?: string; macAddress?: string; gpuNumber?: number }>({ selectedKey: "CPU" });

    useEffect(() => {
        const getUpdateRate = (time: relativeTypeStringOptions) => {
            switch (time) {
                case "Last 1 minute":
                case "Last 5 minutes":
                case "Last 15 minutes":
                    return 2000;
                /*                 case "Last 30 minutes":
                case "Last 1 hour":
                case "Last 6 hours":
                    return 10000; */
                default:
                    return 10000;
            }
        };

        setUpdateRate(!pauseTime ? getUpdateRate(relativeTimeOption) : 0);
    }, [relativeTimeOption, pauseTime]);

    /*     useInterval(
        () => {
            if (!pauseTime) getData();
        },
        updateRate,
        { immediate: true }
    );

    async function getData() {
        dispatch(
            fetchMachineTimeSeriesDataAction({
                latest: moment().add(1, "minutes").utc().toDate(),
                earliest: moment().add(relativeTimeOptions[relativeTimeOption], "minutes").utc().toDate()
            })
        );
    } */

    function getRamUsageData(e: TimeSeriesMachineMetricsModel): ramMetricsModel {
        const d = e.ramUsageData;
        if (!d) {
            return { dateTimeOffset: new Date(e.dateTimeOffset), usedBytes: null, usedPercentage: 0, totalVisibleMemoryBytes: undefined, freePhysicalMemory: undefined, id: 0 };
        }
        const freeMemory = d.totalVisibleMemoryBytes && d.usedMemoryBytes && d.totalVisibleMemoryBytes - d.usedMemoryBytes;
        return { ...d, dateTimeOffset: new Date(e.dateTimeOffset), usedBytes: d.usedMemoryBytes ?? null, usedPercentage: Number.parseFloat((((d?.usedMemoryBytes ?? 0) / (d?.totalVisibleMemoryBytes ?? 0)) * 100).toFixed(1)), totalVisibleMemoryBytes: d.totalVisibleMemoryBytes ?? undefined, freePhysicalMemory: freeMemory ?? undefined };
    }
    useEffect(() => {
        if (timeSeriesMetrics?.metrics && timeSeriesMetrics.requestRange) {
            console.log("Performance.tsx: Processing timeSeriesMetrics, count:", timeSeriesMetrics.metrics.length);
            if (timeSeriesMetrics.metrics[0]) {
                console.log("  First metric cpuUsageData:", timeSeriesMetrics.metrics[0].cpuUsageData);
                console.log("  First metric cpuUsageData type:", typeof timeSeriesMetrics.metrics[0].cpuUsageData);
            }
            const f = timeSeriesMetrics?.metrics?.map(e => {
                return {
                    cpuMetrics: (e.cpuUsageData ?? []).map(d => {
                        return { ...d, dateTimeOffset: new Date(e.dateTimeOffset) };
                    }) as CpuMetricsModel[],
                    gpuMetrics: (e.gpuUsageData ?? []).map(d => {
                        return { ...d, dateTimeOffset: new Date(e.dateTimeOffset), vRamUsagePercentage: (((d.vramUsageBytes ?? 0) / (d.vramTotalBytes ?? 0)) * 100).toFixed(1) };
                    }) as gpuMetricsModel[],
                    ramMetrics: getRamUsageData(e),
                    networkMetrics: (e.networkUsageData ?? []).map(d => {
                        return { dateTimeOffset: new Date(e.dateTimeOffset), macAddress: d.uniqueIdentifier, uploadSpeedBps: (d.uploadSpeedBps && -ByteToBits(d.uploadSpeedBps)) ?? null, downloadSpeedBps: (d.downloadSpeedBps && ByteToBits(d.downloadSpeedBps)) ?? null };
                    }) as networkMetricsModel[],
                    diskMetrics: (e.diskUsageData ?? []).map(d => {
                        return { ...d, dateTimeOffset: e.dateTimeOffset };
                    }) as diskMetricsModel[]
                };
            }) ?? { requestRange: timeSeriesMetrics?.requestRange, cpuMetrics: [], gpuMetrics: [] };
            console.log("Performance.tsx: Processed metrics f:", f?.length, "first cpuMetrics:", f?.[0]?.cpuMetrics);
            setChartable({ requestRange: timeSeriesMetrics.requestRange, metrics: f });
        }
    }, [timeSeriesMetrics]);

    switch (view) {
        case viewOptions.Classic:
            if (relativeTimeOption !== "Last 1 minute") setRelativeTimeOption("Last 1 minute");

            return classicView();
        case viewOptions.TimeSeries:
        case viewOptions.Info:
            return customView();
    }

    function topControlBar() {
        return (
            <div style={{ display: "grid", padding: 20 }}>
                <div style={{ display: "flex", gap: "20px", justifySelf: "right" }}>
                    {view === viewOptions.TimeSeries && (
                        <>
                            <div style={{ alignSelf: "center" }}>Update rate: {updateRate}ms</div>
                            {/*                             <div style={{ fontSize: 14, border: "1px solid white", background: "#333", padding: "4px 10px 4px 7px", userSelect: "none", cursor: "pointer" }} onClick={() => setPauseTime(!pauseTime)}>
                                {pauseTime ? (
                                    <div style={{ color: "white", display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                                        <PlayCircleOutlined key={"1"} /> Resume
                                    </div>
                                ) : (
                                    <div style={{ color: "white", display: "flex", flexWrap: "nowrap", alignItems: "center" }}>
                                        <PauseOutlined key={"2"} /> Pause
                                    </div>
                                )}
                            </div> */}

                            <Form.Item label="Time" style={{ marginBottom: "0", width: "200px" }}>
                                <Select onChange={e => setRelativeTimeOption(e)} value={relativeTimeOption}>
                                    {Object.keys(relativeTimeOptions).map(key => {
                                        return (
                                            <Option key={key} value={key}>
                                                {key}
                                            </Option>
                                        );
                                    })}
                                </Select>
                            </Form.Item>
                        </>
                    )}
                    <Form.Item label="Hide Virtual Adapters" style={{ marginBottom: "0" }}>
                        <Checkbox onChange={() => setHideVirtualAdapters(!hideVirtualAdapters)} checked={hideVirtualAdapters} />
                    </Form.Item>
                    <Form.Item label="View" style={{ marginBottom: "0", width: "300px" }}>
                        <Radio.Group options={Object.keys(viewOptions)} onChange={e => setView(e.target.value)} value={view} optionType="button" />
                    </Form.Item>
                </div>
            </div>
        );
    }

    function classicView() {
        return (
            <>
                {topControlBar()}
                <div className="container traditional" style={{ display: "grid", overflow: "hidden", gridTemplateColumns: "300px auto", height: "100%", width: "100%" }}>
                    <div style={{ display: "flex", flexDirection: "column", overflowY: "scroll" }}>
                        {staticState?.cpu && (
                            <ClassicNavItem
                                key="CPU"
                                Key="CPU"
                                title="CPU"
                                selectedKey={classicViewProps.selectedKey}
                                onClick={() => {
                                    setClassicViewProps({ ...classicViewProps, selectedKey: "CPU" });
                                }}
                                stat={`${CurrentMetricState?.cpuUsageData?.[0]?.totalCoreUsagePercentage ?? 0}% (${CurrentMetricState?.cpuUsageData?.[0]?.packageTemperature?.toFixed(0) ?? "--"}°C)`}
                                type="cpu"
                            />
                        )}
                        {staticState?.ram && (
                            <ClassicNavItem
                                key="Memory"
                                Key="Memory"
                                title="Memory"
                                selectedKey={classicViewProps.selectedKey}
                                onClick={() => {
                                    setClassicViewProps({ ...classicViewProps, selectedKey: "Memory" });
                                }}
                                stat={`${getReadableBytesString(dynamicState?.ramUsagesData?.usedMemoryBytes)}/${getReadableBytesString(dynamicState?.ramUsagesData?.totalVisibleMemoryBytes)} (${dynamicState?.ramUsagesData?.totalVisibleMemoryBytes && ((dynamicState?.ramUsagesData?.usedMemoryBytes / dynamicState?.ramUsagesData?.totalVisibleMemoryBytes) * 100).toFixed(1)}%)`}
                                type="memory"
                            />
                        )}
                        {CurrentMetricState?.gpuUsageData?.map((gpu, index) => {
                            const d = dynamicState?.gpuUsageData?.[index];
                            return (
                                <ClassicNavItem
                                    key={`GPU ${index}`}
                                    Key={`GPU ${index}`}
                                    selectedKey={classicViewProps.selectedKey}
                                    onClick={() => {
                                        setClassicViewProps({ ...classicViewProps, selectedKey: `GPU ${index}`, gpuNumber: index });
                                    }}
                                    title={`GPU ${index}`}
                                    detail={d?.name}
                                    stat={`${gpu.coreUsagePercentage}% ${getReadableBytesString(gpu.vramUsageBytes ?? 0)} (${gpu.coreTemperature}°C)`}
                                    type="gpu"
                                />
                            );
                        })}
                        {disks &&
                            Object.entries(disks)
                                .sort((a, b) => b[0].localeCompare(a[0]))
                                .map((value, index) => {
                                    const otherData = CurrentMetricState?.diskUsageData && Object.entries(CurrentMetricState?.diskUsageData).find(d => d[1].driveLetter === value[1].letter);
                                    return (
                                        <ClassicNavItem
                                            key={`Disk ${index}`}
                                            Key={`Disk ${index}`}
                                            selectedKey={classicViewProps.selectedKey}
                                            type="disk"
                                            title={`Disk (${value[1].letter})`}
                                            onClick={() => {
                                                setClassicViewProps({ ...classicViewProps, selectedKey: `Disk ${index}`, driveLetter: value[1].letter });
                                            }}
                                            detail={`${value[0]}`}
                                            stat={`${getReadableBytesString(otherData?.[1].usedSpaceBytes ?? 0)} / ${getReadableBytesString(otherData?.[1].totalSpaceBytes ?? 0)} (${otherData?.[1].usedSpacePercentage?.toFixed(1) ?? 0}%)`}
                                        />
                                    );
                                })}
                        {networkAdapters &&
                            Object.entries(networkAdapters)
                                .filter(e => e[1].properties.isUp === true)
                                .map((value, index) => {
                                    return (
                                        <ClassicNavItem
                                            key={`NetAdapter ${index}`}
                                            Key={`NetAdapter ${index}`}
                                            selectedKey={classicViewProps.selectedKey}
                                            title={`${value[1].properties.connectionType} (${value[1].properties.name})`}
                                            detail={`${value[1].properties.description}`}
                                            onClick={() => {
                                                setClassicViewProps({ ...classicViewProps, selectedKey: `NetAdapter ${index}`, macAddress: value[1].properties.macAddress });
                                            }}
                                            stat={
                                                <>
                                                    <CaretDownOutlined rev={""} /> {getReadableBitsPerSecondString(value[1].usage?.recieveBps ?? 0)} <CaretUpOutlined rev={""} /> {getReadableBitsPerSecondString(value[1].usage?.sendBps ?? 0)}
                                                </>
                                            }
                                            type="network"
                                        />
                                    );
                                })}
                    </div>

                    {getClassicContent()}
                </div>
            </>
        );
    }

    function cpuActivityMenu() {
        return (
            <Menu>
                <Menu.ItemGroup title="Change graph to">
                    <Menu.Item key={"overall"} onClick={() => setClassicCpuGraphView("Overall")}>
                        Overall utilization
                    </Menu.Item>
                    <Menu.Item key={"logical"} onClick={() => setClassicCpuGraphView("Logical")}>
                        Logical processors
                    </Menu.Item>
                </Menu.ItemGroup>
            </Menu>
        );
    }
    function getClassicContent() {
        if (!chartable) return;
        const contextMenu = classicViewProps.selectedKey === "CPU" ? cpuActivityMenu() : null;
        return (
            <Dropdown key={"dropdown"} overlay={contextMenu ? contextMenu : <></>} trigger={contextMenu ? ["contextMenu"] : undefined}>
                <div style={{ display: "grid", gridTemplateRows: "60px auto 50px 250px", overflowY: "scroll", paddingBottom: 50, paddingLeft: 10, width: "100%" }}>
                    {classicViewProps.selectedKey === "CPU" ? (
                        <ClassicCpuChartView {...chartable} graphView={classicCpuGraphView} />
                    ) : classicViewProps.selectedKey.includes("GPU") ? (
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        <ClassicGpuView {...chartable} gpuNumber={classicViewProps.gpuNumber!} />
                    ) : classicViewProps.selectedKey.includes("Memory") ? (
                        <ClassicRamView {...chartable} />
                    ) : classicViewProps.selectedKey.includes("Disk") ? (
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        <ClassicDiskView {...chartable} driveLetter={classicViewProps.driveLetter!} />
                    ) : classicViewProps.selectedKey.includes("NetAdapter") && classicViewProps.macAddress ? (
                        <ClassicNetworkAdapterView {...chartable} macAddress={classicViewProps.macAddress} />
                    ) : (
                        <></>
                    )}
                </div>
            </Dropdown>
        );
    }

    function customView() {
        return (
            <>
                {topControlBar()}
                {CurrentMetricState && (
                    <div className="container custom scrollY ">
                        <h1 id={"Core"} style={{ width: 100, display: "inline-flex", justifyItems: "center", margin: 0, marginLeft: 20 }}>
                            Core
                        </h1>
                        <div className="category">
                            <Card
                                title="CPU"
                                subTitle={
                                    <div style={{ display: "flex", flexDirection: "row", gap: 20 }}>
                                        <div>{staticState?.cpu.name}</div>
                                        <Radio.Group options={Object.keys(cpuMetricViewOptions)} onChange={e => setCpuMetricView(e.target.value)} value={cpuMetricView} />
                                    </div>
                                }
                                showExpand
                            >
                                {view === viewOptions.Info ? (
                                    <InterfaceDetails>
                                        <div>
                                            <h4 style={{ borderBottom: "1px solid" }}>Thermals</h4>
                                            <div>Package Temp {CurrentMetricState?.cpuUsageData[0]?.packageTemperature?.toFixed(2)}°C</div>
                                            <div>Power Draw: {CurrentMetricState?.cpuUsageData[0]?.powerDrawWattage?.toFixed(2)}w</div>
                                        </div>
                                        <div>
                                            <h4 style={{ borderBottom: "1px solid" }}>Package</h4>
                                            <div style={{ display: "flex", flexDirection: "row", gap: 30 }}>
                                                <div>
                                                    <div>Cores: {staticState?.cpu.numberOfCores}</div>
                                                    <div>Enabled Cores: {staticState?.cpu.numberOfEnabledCore}</div>
                                                    <div>Threads: {staticState?.cpu.threadCount}</div>
                                                </div>
                                                <div>
                                                    <div>L1 Cache: {staticState?.cpu.l1CacheSize} KB</div>
                                                    <div>L2 Cache: {staticState?.cpu.l2CacheSize ?? 0 / 1024} MB</div>
                                                    <div>L3 Cache: {staticState?.cpu.l3CacheSize ?? 0 / 1024} MB</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ borderBottom: "1px solid" }}>Features</h4>
                                            <div>Virtualization: {staticState?.cpu.virtualizationFirmwareEnabled ? "Enabled" : "Disabled"}</div>
                                        </div>
                                    </InterfaceDetails>
                                ) : cpuMetricView === cpuMetricViewOptions.General ? (
                                    <div style={{ height: 150 }}>{chartable && <CpuChartTimeSeries {...chartable} />}</div>
                                ) : (
                                    <div>
                                        <CpuThreadsChartTimeSeries />
                                    </div>
                                )}
                            </Card>

                            {staticState?.gpu?.map((gpu, index) => {
                                return (
                                    <Card key={`gpu${gpu}`} title="GPU" subTitle={gpu.name} showExpand>
                                        {view === viewOptions.Info ? (
                                            <div style={{ display: "flex", flexDirection: "row", gap: 60, marginBottom: 20 }}>
                                                <InterfaceDetails>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid" }}>Thermals</h4>
                                                        {gpuUsageData &&
                                                            Object.entries(gpuUsageData[index]?.temperatureReadings).map(e => {
                                                                return (
                                                                    <div key={`temp ${e[0]}`}>
                                                                        {e[0]}: {e[1]?.toFixed(1)} °C
                                                                    </div>
                                                                );
                                                            })}
                                                        <div>
                                                            {gpuUsageData?.[index]?.fanPercentage &&
                                                                Object.keys(gpuUsageData[index].fanPercentage ?? []).map(key => {
                                                                    // eslint-disable-next-line security/detect-object-injection
                                                                    return (
                                                                        <div key={`fan${key}`}>
                                                                            Fan {key} : {`${gpuUsageData[index].fanPercentage?.[key]} %`}
                                                                        </div>
                                                                    );
                                                                })}

                                                            <div>Power Draw: {gpuUsageData && `${gpuUsageData[index]?.powerDrawWatt?.toFixed(0)}w`}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid" }}>Load</h4>
                                                        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 30 }}>
                                                            <div>
                                                                <div>Core: {`${gpuUsageData?.[index]?.load?.corePercentage?.toFixed(0)}%`}</div>
                                                                <div>Bus: {`${gpuUsageData?.[index]?.load?.busInterfacePercentage?.toFixed(0)}%`}</div>
                                                                <div>Video Engine: {`${gpuUsageData?.[index]?.load?.videoEnginePercentage?.toFixed(0)}%`}</div>
                                                                {gpuUsageData?.[index]?.load?.frameBufferPercentage && <div>Frame Buffer: {`${gpuUsageData?.[index]?.load?.frameBufferPercentage?.toFixed(1)}%`}</div>}
                                                                <div>Memory Controller: {`${gpuUsageData?.[index]?.load?.memoryControllerPercentage?.toFixed(0)}%`}</div>
                                                            </div>
                                                            <div>
                                                                <div>PCIe Rx: {`${gpuUsageData && getReadableBytesPerSecondString(gpuUsageData?.[index]?.pcIe?.pcIe_RxBytesPerSecond)}`}</div>
                                                                <div>PCIe Tx: {`${gpuUsageData && getReadableBytesPerSecondString(gpuUsageData?.[index]?.pcIe?.pcIe_TxBytesPerSecond)}`}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid" }}>Memory</h4>
                                                        <div>DRAM Used: {`${getReadableBytesString(gpuUsageData?.[index]?.memoryUsedBytes)}/${getReadableBytesString(staticState?.gpu?.[index]?.memoryTotalBytes)}`}</div>
                                                        {/* <div>Free Memory: {`${gpuUsageData?.memoryFreeGB.value.toFixed(0)} GB`}</div> */}
                                                    </div>

                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid" }}>Clocks</h4>
                                                        <div>Graphics: {`${gpuUsageData?.[index]?.clockSpeeds?.graphicsClockMhz?.toFixed(0)} Mhz`}</div>
                                                        <div>Compute: {`${gpuUsageData?.[index]?.clockSpeeds?.computeClockMhz?.toFixed(0)} Mhz`}</div>
                                                        <div>Video: {`${gpuUsageData?.[index]?.clockSpeeds?.videoClockMhz?.toFixed(0)} Mhz`}</div>
                                                        <div>Memory: {`${gpuUsageData?.[index]?.clockSpeeds?.memoryClockMhz?.toFixed(0)} Mhz`}</div>
                                                    </div>
                                                </InterfaceDetails>
                                            </div>
                                        ) : (
                                            <div style={{ height: 150 }}>{chartable && <GpuMetricChart gpuNumber={index.toString()} {...chartable} />}</div>
                                        )}
                                    </Card>
                                );
                            })}
                            <Card title="Memory" showExpand>
                                {view === viewOptions.Info ? (
                                    <InterfaceDetails>
                                        <div>
                                            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 30 }}>
                                                {staticState?.ram?.map(e => {
                                                    return (
                                                        <div key={`${e.slotNumber} ${e.slotChannel} `}>
                                                            <h4 style={{ borderBottom: "1px solid" }}>DIMM: {e.slotNumber}</h4>
                                                            <div>Channel: {e.slotChannel}</div>
                                                            <div>SKU: {e.partNumber}</div>
                                                            <div>Type: {e.type}</div>
                                                            <div>Capacity: {getReadableBytesString(e.capacity)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </InterfaceDetails>
                                ) : (
                                    <div style={{ height: 150 }}>{chartable && <RamMetricChart {...chartable} />}</div>
                                )}
                            </Card>
                            {/*  <Card title="Motherboard" showExpand>
                    {view === viewOptions.Info ? (
                        <InterfaceDetails>
                            <div>
                                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 30 }}>
                                    {staticState?.ram?.map(e => {
                                        return (
                                            <div key={`${e.slotNumber} ${e.slotChannel} `}>
                                                <div>DIMM: {e.slotNumber}</div>
                                                <div>Channel: {e.slotChannel}</div>
                                                <div>SKU: {e.partNumber}</div>
                                                <div>Type: {e.type}</div>
                                                <div>Capacity: {getReadableBytesString(e.capacity)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </InterfaceDetails>
                    ) : (
                        <div style={{ height: 150 }}></div>
                    )}
                </Card> */}
                        </div>
                        <h1 id={"Network"} style={{ width: 100, margin: 0, marginLeft: 20 }}>
                            Network
                        </h1>
                        <div className="category">
                            {networkAdapters &&
                                Object.entries(networkAdapters).map(([key, value]) => {
                                    return (
                                        <Card key={key} title={value.properties.name} subTitle={value.properties.description} showExpand>
                                            <div>
                                                {view === viewOptions.Info ? (
                                                    <InterfaceDetails>
                                                        <div>
                                                            <h4 style={{ borderBottom: "1px solid", fontWeight: "bold" }}>Network</h4>
                                                            <div>
                                                                {value.properties?.ipInterfaceProperties?.dnsSuffix && <div>DNS Name: {value.properties.ipInterfaceProperties.dnsSuffix}</div>}
                                                                {value.properties?.ipInterfaceProperties?.iPv4Address && <div>IPv4 Address: {value.properties.ipInterfaceProperties.iPv4Address}</div>}
                                                                {value.properties?.ipInterfaceProperties?.iPv6Address && <div>IPv6 Address: {value.properties.ipInterfaceProperties.iPv6Address}</div>}
                                                            </div>
                                                            <div>
                                                                <div>MAC Address: {value.properties.macAddress}</div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 style={{ borderBottom: "1px solid" }}>Properties</h4>
                                                            <div>
                                                                <div>Speed: {getReadableBitsPerSecondString(value.properties.speedBps)}</div>
                                                                <div>Connection Type: {value.properties.connectionType}</div>
                                                            </div>
                                                        </div>
                                                    </InterfaceDetails>
                                                ) : (
                                                    <div style={{ height: 150 }}>{chartable && value.properties.macAddress && <NetworkAdapterMetricChart macAddress={value.properties.macAddress} {...chartable} />}</div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                        </div>
                        <h1 id={"Disks"} style={{ width: 100, margin: 0, marginLeft: 20 }}>
                            Disk
                        </h1>
                        <div className="category">
                            {disks &&
                                Object.entries(disks).map(([key, value]) => {
                                    const info = CurrentMetricState?.diskUsageData?.find(e => e.name === key);
                                    return (
                                        <Card key={key} title={"Drive"} subTitle={key} showExpand>
                                            {view === viewOptions.Info ? (
                                                <InterfaceDetails>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid" }}>Thermals</h4>
                                                        {value &&
                                                            Object.entries(value.temperatures).map(e => {
                                                                return (
                                                                    <div key={`temp ${e[0]}`}>
                                                                        {e[0]}: {e[1]?.toFixed(1)}°C
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid", fontWeight: "bold" }}>Throughput</h4>
                                                        <div>Read rate: {getReadableBytesPerSecondString(value.throughput?.readRateBytesPerSecond)}</div>
                                                        <div>Write rate: {getReadableBytesPerSecondString(value.throughput?.writeRateBytesPerSecond)}</div>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid", fontWeight: "bold" }}>Health</h4>
                                                        <div>
                                                            <div>Data written: {getReadableBytesString(value.diskHealth?.totalBytesRead)}</div>
                                                            <div>Data read: {getReadableBytesString(value.diskHealth?.totalBytesWritten)}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 style={{ borderBottom: "1px solid" }}>Properties</h4>
                                                        <div>S/N: {info?.serial}</div>
                                                    </div>
                                                </InterfaceDetails>
                                            ) : (
                                                <div style={{}}>
                                                    {chartable && (
                                                        <>
                                                            <DiskMetricChart {...chartable} uniqueIdentifier={info?.uniqueIdentifier ?? ""} />
                                                            <DiskMetricPercentageChart {...chartable} uniqueIdentifier={info?.uniqueIdentifier ?? ""} />
                                                            <DiskMetricHealthChart {...chartable} uniqueIdentifier={info?.uniqueIdentifier ?? ""} />
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </>
        );
    }
};

type InterfaceDetailsProps = "cpu" | "gpu" | "memory" | "network" | "disk";

const InterfaceDetails: React.FunctionComponent = props => {
    return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: 20, marginBottom: 20 }}>{props.children}</div>;
};

const ClassicNavItem: React.FunctionComponent<{ selectedKey: string; Key: string; type: InterfaceDetailsProps; title: string; detail?: string; stat?: React.ReactNode; onClick?: () => void }> = props => {
    function getRender() {
        switch (props.type) {
            case "cpu":
            case "memory":
            case "gpu":
            case "disk":
            case "network":
                return (
                    <>
                        <div>
                            <h4>{props.title}</h4>
                            {props.detail && <div style={{ fontSize: "90%" }}>{props.detail}</div>}
                            {props.stat && <div style={{ fontSize: "90%" }}>{props.stat}</div>}
                        </div>
                    </>
                );
            default:
                return null;
        }
    }
    function getColor() {
        switch (props.type) {
            case "gpu":
                return "#bf82d3";
            case "cpu":
                return "lightBlue";
            case "memory":
                return "pink";
            case "disk":
                return "green";
            case "network":
                return "orange";
            default:
                return "black";
        }
    }
    <div style={{ width: "20%" }}></div>;
    return (
        <div className={`category${props.selectedKey === props.Key ? " selected" : ""}`} onClick={props.onClick}>
            <div style={{ display: "grid", placeContent: "center" }}>
                <CaretRightOutlined rev={""} key={"1"} style={{ color: getColor() }} />
            </div>
            {getRender()}
        </div>
    );
};

interface CardProps {
    key?: string;
    title?: string;
    subTitle?: string | React.ReactNode;
    showExpand: boolean;
}
const Card: React.FunctionComponent<CardProps> = props => {
    return (
        <div key={props.key} className="section">
            <div className="header" style={{ display: "grid", gridTemplateColumns: "auto 1fr 15px", marginBottom: "0.5em", alignItems: "initial", gap: 20 }}>
                <h2>{props.title}</h2>
                <div style={{ alignSelf: "center", textOverflow: "scale" }}>{props.subTitle && props.subTitle}</div>
                {/* {props.showExpand && <ArrowsAltOutlined style={{ float: "right", justifySelf: "right", cursor: "pointer" }} />} */}
            </div>
            <div className="card-block">{props.children}</div>
        </div>
    );
};
