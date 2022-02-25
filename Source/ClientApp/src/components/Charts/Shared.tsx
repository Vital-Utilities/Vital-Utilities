import moment from "moment";
import React, { ReactNode } from "react";
import { TooltipProps } from "recharts";
import { DateRange } from "../../Dtos/ClientApiDto";
import { getReadableBitsPerSecondString, getReadableBytesPerSecondString, getReadableBytesString } from "../FormatUtils";
import { CpuMetricsModel } from "./CpuChartTimeSeries";
import { diskMetricsModel } from "./DiskMetricChart";
import { gpuMetricsModel } from "./GpuMetricChart";
import { networkMetricsModel } from "./NetworkAdapterMetricChart";
import { ramMetricsModel } from "./RamMetricChart";
export function formatXAxis(tickItem: Date) {
    // If using moment.js
    return moment(tickItem).format("hh:mm:ss");
}

export enum customUnitFlags {
    "#bps" = "#bps",
    "#Bps" = "#Bps",
    "#Bytes" = "#Bytes"
}
export interface ChartData {
    requestRange: DateRange;
    metrics: { cpuMetrics: CpuMetricsModel[]; gpuMetrics: gpuMetricsModel[]; ramMetrics: ramMetricsModel; networkMetrics: networkMetricsModel[]; diskMetrics: diskMetricsModel[] }[];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CustomTooltip: React.FunctionComponent<TooltipProps<any, any>> = props => {
    function dynamicUnit(value: unknown | undefined, unit: ReactNode): string | undefined {
        if (value === undefined) return "";
        switch (unit?.toString() as customUnitFlags) {
            case "#Bps":
                return getReadableBytesPerSecondString(value as number);
            case "#bps":
                return getReadableBitsPerSecondString(Math.abs(value as number));
            case "#Bytes":
                return getReadableBytesString(Math.abs(value as number));
            default:
                return `${value}${unit ?? ""}`;
        }
    }
    return (
        <>
            {props && props.payload && props.payload.length && (
                <div className="recharts-default-tooltip" style={{ padding: 5, opacity: 0.95, border: "1px solid white" }}>
                    <div>{props.label && new Date(props.label).toLocaleString()}</div>
                    {props.payload.map((e, i) => {
                        return <div key={i}>{`${e.name?.toString().split(" ")[0]} : ${dynamicUnit(e.value, e.unit)}`}</div>;
                    })}
                </div>
            )}
        </>
    );
};

export const ClassicLayout: React.FunctionComponent<{ header: { title: string; deviceName?: string }; graph: React.ReactNode; showRange?: boolean; bottomItems: React.ReactNode }> = props => {
    return (
        <>
            <div className="header" style={{ display: "flex", marginBottom: "0.5em", justifyContent: "space-between" }}>
                <h1>{props.header.title}</h1>
                <div style={{ fontSize: 16, alignSelf: "center", textOverflow: "scale" }}>{props.header.deviceName}</div>
                {/* {props.showExpand && <ArrowsAltOutlined style={{ float: "right", justifySelf: "right", cursor: "pointer" }} />} */}
            </div>
            {props.graph}
            <div style={{ display: "flex", marginBottom: "0.5em", justifyContent: "space-between", height: 50 }}>
                {props.showRange && (
                    <>
                        <div>60s</div>
                        <div>0</div>
                    </>
                )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 400px", paddingRight: 50 }}>{props.bottomItems}</div>
        </>
    );
};
export const ItemOne: React.FunctionComponent<{ color?: string; title: string; value?: string | number }> = props => {
    return (
        <div style={{ color: props.color, minWidth: 100 }}>
            <h4 style={{ color: "inherit" }}>{props.title}</h4>
            <h2 style={{ color: "inherit" }}>{props.value}</h2>
        </div>
    );
};
export const ItemTwo: React.FunctionComponent<{ title: string; value: string | number | undefined }> = props => {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "50% 50%" }}>
            <div>{props.title}</div>
            <div>{props.value}</div>
        </div>
    );
};
