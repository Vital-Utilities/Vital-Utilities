import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse, TimeSeriesMachineMetricsResponse } from "@vital/vitalservice";
import { useLocalStorageState } from "ahooks";
import React from "react";
import { useSelector } from "react-redux";
import { ChartData } from "../../components/Charts/Shared";
import { getReadableBytesString, getReadableBitsPerSecondString } from "../../components/FormatUtils";
import { VitalState } from "../../Redux/States";
import { ClassicCpuChartView } from "./Classic/ClassicCpuView";
import { ClassicDiskView } from "./Classic/ClassicDiskView";
import { ClassicGpuView } from "./Classic/ClassicGpuView";
import { ClassicNetworkView } from "./Classic/ClassicNetworkView";
import { ClassicPowerView } from "./Classic/ClassicPowerView";
import { ClassicRamView } from "./Classic/ClassicRamView";
import "./performance.scss";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Time range options for time series data fetching (used by __root.tsx)
export type relativeTypeStringOptions = "Last 1 minute" | "Last 5 minutes" | "Last 15 minutes" | "Last 30 minutes" | "Last 1 hour";
export const relativeTimeOptions: Record<relativeTypeStringOptions, number> = {
    "Last 1 minute": -1,
    "Last 5 minutes": -5,
    "Last 15 minutes": -15,
    "Last 30 minutes": -30,
    "Last 1 hour": -60
};

export const PerformancePage: React.FunctionComponent = () => {
    const staticState = useSelector<VitalState, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const CurrentMetricState = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1];

    const gpuUsageData = dynamicState?.gpuUsageData;
    const networkAdapters = dynamicState?.networkUsageData?.adapters;
    const disks = dynamicState?.diskUsages?.disks;

    const [chartable, setChartable] = React.useState<ChartData>();
    const [classicCpuGraphView, setClassicCpuGraphView] = useLocalStorageState<"Overall" | "Logical">("classicCpuGraphView", { defaultValue: "Logical" });
    const [classicViewProps, setClassicViewProps] = React.useState<{ selectedKey: string; driveLetter?: string; macAddress?: string; gpuNumber?: number }>({ selectedKey: "CPU" });

    // Process time series metrics for classic views
    React.useEffect(() => {
        if (timeSeriesMetrics?.metrics && timeSeriesMetrics.requestRange) {
            const f = timeSeriesMetrics.metrics.map(e => ({
                cpuMetrics: (e.cpuUsageData ?? []).map(d => ({ ...d, dateTimeOffset: new Date(e.dateTimeOffset) })),
                gpuMetrics: (e.gpuUsageData ?? []).map(d => ({
                    ...d,
                    dateTimeOffset: new Date(e.dateTimeOffset),
                    vRamUsagePercentage: (((d.vramUsageBytes ?? 0) / (d.vramTotalBytes ?? 0)) * 100).toFixed(1)
                })),
                ramMetrics: (() => {
                    const d = e.ramUsageData;
                    if (!d) return { dateTimeOffset: new Date(e.dateTimeOffset), usedBytes: null, usedPercentage: 0, totalVisibleMemoryBytes: undefined, freePhysicalMemory: undefined, id: 0 };
                    const freeMemory = d.totalVisibleMemoryBytes && d.usedMemoryBytes && d.totalVisibleMemoryBytes - d.usedMemoryBytes;
                    return {
                        ...d,
                        dateTimeOffset: new Date(e.dateTimeOffset),
                        usedBytes: d.usedMemoryBytes ?? null,
                        usedPercentage: Number.parseFloat((((d?.usedMemoryBytes ?? 0) / (d?.totalVisibleMemoryBytes ?? 0)) * 100).toFixed(1)),
                        totalVisibleMemoryBytes: d.totalVisibleMemoryBytes ?? undefined,
                        freePhysicalMemory: freeMemory ?? undefined
                    };
                })(),
                networkMetrics: (e.networkUsageData ?? []).map(d => ({
                    dateTimeOffset: new Date(e.dateTimeOffset),
                    macAddress: d.uniqueIdentifier,
                    uploadSpeedBps: null,
                    downloadSpeedBps: null
                })),
                diskMetrics: (e.diskUsageData ?? []).map(d => ({ ...d, dateTimeOffset: e.dateTimeOffset }))
            }));
            setChartable({ requestRange: timeSeriesMetrics.requestRange, metrics: f });
        }
    }, [timeSeriesMetrics]);

    return classicView();

    function classicView() {
        return (
            <>
                <div className="container traditional" style={{ display: "grid", overflow: "hidden", gridTemplateColumns: "minmax(250px, 20%) 1fr", height: "100%", width: "100%" }}>
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
                            Object.keys(networkAdapters).length > 0 &&
                            (() => {
                                // Get only Wi-Fi and Ethernet adapters
                                const activeAdapters = Object.entries(networkAdapters).filter(([, adapter]) => {
                                    if (!adapter.properties.isUp) return false;
                                    const connType = adapter.properties.connectionType?.toLowerCase() ?? "";
                                    return connType === "wireless" || connType === "ethernet";
                                });
                                if (activeAdapters.length === 0) return null;
                                const totalDownload = activeAdapters.reduce((sum, [, adapter]) => sum + (adapter.usage?.recieveBps ?? 0), 0);
                                const totalUpload = activeAdapters.reduce((sum, [, adapter]) => sum + (adapter.usage?.sendBps ?? 0), 0);
                                return (
                                    <ClassicNavItem
                                        key="Network"
                                        Key="Network"
                                        selectedKey={classicViewProps.selectedKey}
                                        title="Network"
                                        detail={`${activeAdapters.length} active adapter${activeAdapters.length !== 1 ? "s" : ""}`}
                                        onClick={() => {
                                            setClassicViewProps({ ...classicViewProps, selectedKey: "Network" });
                                        }}
                                        stat={
                                            <>
                                                <ChevronDown className="inline h-4 w-4" /> {getReadableBitsPerSecondString(totalDownload)} <ChevronUp className="inline h-4 w-4" /> {getReadableBitsPerSecondString(totalUpload)}
                                            </>
                                        }
                                        type="network"
                                    />
                                );
                            })()}
                        {/* Power/Battery - only show on devices with battery */}
                        {dynamicState?.powerUsageData?.batteryInstalled && (
                            <ClassicNavItem
                                key="Power"
                                Key="Power"
                                title="Power"
                                selectedKey={classicViewProps.selectedKey}
                                onClick={() => {
                                    setClassicViewProps({ ...classicViewProps, selectedKey: "Power" });
                                }}
                                stat={dynamicState?.powerUsageData?.systemPowerWatts ? `${dynamicState.powerUsageData.systemPowerWatts.toFixed(1)}W ${dynamicState.powerUsageData.batteryPercentage?.toFixed(0) ?? "--"}%` : `${dynamicState?.powerUsageData?.batteryPercentage?.toFixed(0) ?? "--"}%`}
                                type="power"
                            />
                        )}
                    </div>

                    {getClassicContent()}
                </div>
            </>
        );
    }

    function getClassicContent() {
        if (!chartable) return;
        const showCpuContextMenu = classicViewProps.selectedKey === "CPU";

        const content = (
            <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "2rem", paddingLeft: "0.5rem", width: "100%", height: "100%" }}>
                {classicViewProps.selectedKey === "CPU" ? (
                    <ClassicCpuChartView {...chartable} graphView={classicCpuGraphView} />
                ) : classicViewProps.selectedKey.includes("GPU") ? (
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    <ClassicGpuView {...chartable} gpuNumber={classicViewProps.gpuNumber!} />
                ) : classicViewProps.selectedKey.includes("Memory") ? (
                    <ClassicRamView />
                ) : classicViewProps.selectedKey.includes("Disk") ? (
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    <ClassicDiskView {...chartable} driveLetter={classicViewProps.driveLetter!} />
                ) : classicViewProps.selectedKey === "Network" ? (
                    <ClassicNetworkView />
                ) : classicViewProps.selectedKey === "Power" ? (
                    <ClassicPowerView />
                ) : (
                    <></>
                )}
            </div>
        );

        if (showCpuContextMenu) {
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="cursor-context-menu">{content}</div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Change graph to</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setClassicCpuGraphView("Overall")}>Overall utilization</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setClassicCpuGraphView("Logical")}>Logical processors</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }

        return content;
    }
};

type ClassicNavItemType = "cpu" | "gpu" | "memory" | "network" | "disk" | "power";

const ClassicNavItem: React.FunctionComponent<{ selectedKey: string; Key: string; type: ClassicNavItemType; title: string; detail?: string; stat?: React.ReactNode; onClick?: () => void }> = props => {
    function getColor() {
        switch (props.type) {
            case "gpu":
                return "#a855f7"; // purple-500
            case "cpu":
                return "#3b82f6"; // blue-500
            case "memory":
                return "#ec4899"; // pink-500
            case "disk":
                return "#22c55e"; // green-500
            case "network":
                return "#f97316"; // orange-500
            case "power":
                return "#eab308"; // yellow-500
            default:
                return "#6b7280";
        }
    }

    const isSelected = props.selectedKey === props.Key;

    return (
        <div className={`nav-item${isSelected ? " selected" : ""}`} onClick={props.onClick}>
            <div className="nav-item-header">
                <div className="nav-item-icon" style={{ backgroundColor: getColor() }} />
                <span className="nav-item-title">{props.title}</span>
            </div>
            {props.detail && <div className="nav-item-detail">{props.detail}</div>}
            {props.stat && <div className="nav-item-stat">{props.stat}</div>}
        </div>
    );
};

interface CardProps {
    key?: string;
    title?: string;
    subTitle?: string | React.ReactNode;
    showExpand: boolean;
    children?: React.ReactNode;
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
