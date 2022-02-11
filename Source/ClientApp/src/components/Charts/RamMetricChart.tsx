import React from "react";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GetMachineDynamicDataResponse, GetMachineStaticDataResponse } from "../../Dtos/Dto";
import { VitalState } from "../../Redux/States";
import { getReadableBytesString } from "../FormatUtils";
import { ChartData, ClassicLayout, CustomTooltip, customUnitFlags, formatXAxis, ItemOne, ItemTwo } from "./Shared";
export type ramMetricsModel = {
    dateTimeOffset: Date;
    usedBytes: number | null;
    usedPercentage: number | null | undefined;
    freePhysicalMemory?: number;
    totalVisibleMemoryBytes?: number;
    id: number;
    uniqueIdentifier?: string;
};

function bytesToGb(bytes: number) {
    return bytes / 1024 / 1024 / 1024;
}

export const RamMetricChart: React.FunctionComponent<ChartData> = props => {
    const { ref, inView } = useInView();

    const [ordered, setOrdered] = React.useState<ramMetricsModel[]>();

    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        const f = props.metrics.map(e => e.ramMetrics);
        setOrdered(f ?? []);
    }, [props.metrics, inView]);
    const current = ordered?.[ordered.length - 1];
    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ordered}>
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis domain={[0, current?.totalVisibleMemoryBytes ?? 0]} tickFormatter={e => getReadableBytesString(e)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type={"monotone"} unit={customUnitFlags["#Bytes"]} dataKey="usedBytes" name={`Used ${getReadableBytesString(current?.usedBytes)} (${current?.usedPercentage}%)`} fillOpacity={0.1} activeDot={{ r: 4 }} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
export const ClassicRamMetricView: React.FunctionComponent<ChartData> = props => {
    const [ordered, setOrdered] = React.useState<ramMetricsModel[]>();
    const staticState = useSelector<VitalState, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);

    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const thisRamStatic = staticState?.ram;
    React.useEffect(() => {
        if (!props.metrics) return;
        const f = props.metrics.map(e => e.ramMetrics);
        setOrdered(f ?? []);
    }, [props.metrics]);
    const current = ordered?.[ordered.length - 1];

    function getGraphView() {
        return (
            <>
                <ResponsiveContainer width="100%">
                    <AreaChart data={ordered}>
                        <XAxis hide dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                        <YAxis hide yAxisId="left" domain={[0, current?.totalVisibleMemoryBytes ?? 0]} tickFormatter={e => getReadableBytesString(e)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area yAxisId="left" type={"monotone"} unit={customUnitFlags["#Bytes"]} dataKey="usedBytes" name={"Used"} fillOpacity={0.1} activeDot={{ r: 4 }} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </>
        );
    }

    return (
        <ClassicLayout
            header={{ title: "Memory" }}
            graph={getGraphView()}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 30 }}>
                        {current?.usedPercentage && current?.usedBytes && <ItemOne color="#3182bd" title="Utilization" value={`${getReadableBytesString(current?.usedBytes)} (${current?.usedPercentage}%)`} />}
                        {current?.freePhysicalMemory && <ItemOne color="lightgray" title="Available" value={`${getReadableBytesString(current?.freePhysicalMemory)}`} />}
                    </div>
                    <div>
                        {thisRamStatic && <ItemTwo title="Slots Used" value={`${thisRamStatic.length}`} />}
                        {dynamicState && <ItemTwo title="Total Visible Memory" value={`${getReadableBytesString(current?.totalVisibleMemoryBytes)}`} />}
                    </div>
                </>
            }
        />
    );
};
