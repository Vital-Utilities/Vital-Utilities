import { DateRange } from "@vital/vitalservice";
import moment from "moment";
import React, { ReactNode } from "react";
import { TooltipProps } from "recharts";
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ClassicTooltip: React.FunctionComponent<TooltipProps<any, any>> = props => {
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
                    <div>{props.label && new Date(props.label).toLocaleTimeString()}</div>
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
        <div style={{ display: "grid", gridTemplateRows: "1fr 180px", height: "100%", padding: "0.5rem 1rem", overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div className="header" style={{ display: "flex", marginBottom: "0.75rem", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ margin: 0 }}>{props.header.title}</h1>
                    <div style={{ fontSize: 14, color: "var(--muted-foreground)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{props.header.deviceName}</div>
                </div>
                <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                    {props.graph}
                    {props.showRange && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted-foreground)", padding: "0 0.25rem" }}>
                            <div>60s</div>
                            <div>0</div>
                        </div>
                    )}
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(200px, 400px)", gap: "1rem", paddingRight: "2rem", paddingTop: "1rem", overflowY: "auto" }}>{props.bottomItems}</div>
        </div>
    );
};
export const ItemOne: React.FunctionComponent<{ color?: string; title: string; value?: string | number }> = props => {
    return (
        <div style={{ minWidth: 100 }}>
            <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>{props.title}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 500, color: props.color ?? "var(--foreground)", fontFamily: "var(--font-mono)" }}>{props.value}</div>
        </div>
    );
};
export const ItemTwo: React.FunctionComponent<{ title: string; value: string | number | undefined }> = props => {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "50% 50%", fontSize: "0.75rem", padding: "0.125rem 0" }}>
            <div style={{ color: "var(--muted-foreground)" }}>{props.title}</div>
            <div style={{ color: "var(--foreground)", fontFamily: "var(--font-mono)" }}>{props.value}</div>
        </div>
    );
};
