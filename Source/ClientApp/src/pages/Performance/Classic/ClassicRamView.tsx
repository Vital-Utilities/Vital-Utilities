import React from "react";
import { useSelector } from "react-redux";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, Tooltip } from "recharts";
import { ramMetricsModel } from "../../../components/Charts/RamMetricChart";
import { ChartData, formatXAxis, CustomTooltip, customUnitFlags, ClassicLayout, ItemOne, ItemTwo } from "../../../components/Charts/Shared";
import { getReadableBytesString } from "../../../components/FormatUtils";
import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse } from "../../../Dtos/ClientApiDto";
import { VitalState } from "../../../Redux/States";

export const ClassicRamView: React.FunctionComponent<ChartData> = props => {
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
