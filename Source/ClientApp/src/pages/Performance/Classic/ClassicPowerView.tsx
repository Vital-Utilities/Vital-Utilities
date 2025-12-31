import { GetMachineDynamicDataResponse } from "@vital/vitalservice";
import React, { useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { ClassicLayout, ItemOne, ItemTwo } from "../../../components/Charts/Shared";
import { VitalState } from "../../../Redux/States";
import { Plug } from "lucide-react";

export const ClassicPowerView: React.FunctionComponent = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const particlesRef = useRef<Particle[]>([]);
    const powerHistoryRef = useRef<number[]>([]);

    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const powerData = dynamicState?.powerUsageData;

    // Update power history
    useEffect(() => {
        if (powerData?.systemPowerWatts !== undefined) {
            powerHistoryRef.current.push(powerData.systemPowerWatts);
            if (powerHistoryRef.current.length > 60) {
                powerHistoryRef.current.shift();
            }
        }
    }, [powerData?.systemPowerWatts]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set canvas size with device pixel ratio for sharp rendering
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }

        const width = rect.width;
        const height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get current values
        const batteryPercent = powerData?.batteryPercentage ?? 0;
        const systemPower = powerData?.systemPowerWatts ?? 0;
        const isCharging = powerData?.externalConnected && !powerData?.fullyCharged;
        const isPluggedIn = powerData?.externalConnected ?? false;
        const batteryHealth = powerData?.batteryHealth ?? 100;

        // Draw battery visualization
        drawBattery(ctx, width, height, batteryPercent, isCharging ?? false, batteryHealth);

        // Draw power flow visualization
        drawPowerFlow(ctx, width, height, systemPower, isPluggedIn, isCharging ?? false);

        // Draw power graph at bottom
        drawPowerGraph(ctx, width, height, powerHistoryRef.current);

        // Update particles
        updateParticles(ctx, width, height, isCharging ?? false, isPluggedIn);

        animationRef.current = requestAnimationFrame(draw);
    }, [powerData]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationRef.current);
    }, [draw]);

    if (!powerData?.batteryInstalled) {
        return (
            <ClassicLayout
                header={{ title: "Power", deviceName: "No Battery Detected" }}
                graph={
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Plug className="w-8 h-8 mr-2" />
                        <span>Desktop system - no battery information available</span>
                    </div>
                }
                bottomItems={<></>}
            />
        );
    }

    return (
        <ClassicLayout
            header={{
                title: "Power",
                deviceName: powerData.externalConnected ? "Plugged In" : "On Battery"
            }}
            graph={<canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        {/* Power consumption */}
                        {powerData.systemPowerWatts !== undefined && <ItemOne color="#3b82f6" title="System Power" value={`${powerData.systemPowerWatts.toFixed(1)}W`} />}

                        {/* Adapter info */}
                        {powerData.externalConnected && powerData.adapterWatts && <ItemOne color="#22c55e" title="Adapter" value={`${powerData.adapterWatts}W ${powerData.adapterDescription ?? ""}`} />}

                        {/* Battery Health */}
                        {powerData.batteryHealth !== undefined && <ItemOne color={powerData.batteryHealth >= 90 ? "#22c55e" : powerData.batteryHealth >= 70 ? "#eab308" : "#ef4444"} title="Battery Health" value={`${powerData.batteryHealth.toFixed(1)}%`} />}

                        {/* Cycle Count */}
                        {powerData.cycleCount !== undefined && <ItemOne color="#94a3b8" title="Cycle Count" value={`${powerData.cycleCount}`} />}

                        {/* Battery Voltage */}
                        {powerData.batteryVoltage !== undefined && <ItemOne color="#94a3b8" title="Voltage" value={`${powerData.batteryVoltage.toFixed(2)}V`} />}

                        {/* Time Remaining */}
                        {powerData.timeRemainingMinutes !== undefined && powerData.timeRemainingMinutes > 0 && <ItemOne color="#06b6d4" title="Time Remaining" value={formatTimeRemaining(powerData.timeRemainingMinutes)} />}
                    </div>
                    <div>
                        <ItemTwo title="Capacity:" value={`${powerData.maxCapacityMah ?? "-"} / ${powerData.designCapacityMah ?? "-"} mAh`} />
                        {powerData.adapterVoltage && <ItemTwo title="Adapter Voltage:" value={`${powerData.adapterVoltage.toFixed(1)}V`} />}
                        <ItemTwo title="Status:" value={powerData.fullyCharged ? "Fully Charged" : powerData.externalConnected ? "Charging" : "Discharging"} />
                    </div>
                </>
            }
        />
    );
};

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

function drawBattery(ctx: CanvasRenderingContext2D, width: number, height: number, percent: number, isCharging: boolean, health: number) {
    const centerX = width / 2;
    const centerY = height * 0.35;

    // Battery dimensions
    const batteryWidth = Math.min(width * 0.35, 180);
    const batteryHeight = batteryWidth * 0.5;
    const cornerRadius = 8;
    const tipWidth = 8;
    const tipHeight = batteryHeight * 0.4;

    const batteryX = centerX - batteryWidth / 2;
    const batteryY = centerY - batteryHeight / 2;

    // Battery outline with glow
    ctx.save();
    if (isCharging) {
        ctx.shadowColor = "#22c55e";
        ctx.shadowBlur = 20;
    } else if (percent < 20) {
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 15 + Math.sin(Date.now() / 200) * 5;
    }

    // Main battery body outline
    ctx.beginPath();
    ctx.roundRect(batteryX, batteryY, batteryWidth, batteryHeight, cornerRadius);
    ctx.strokeStyle = percent < 20 ? "#ef4444" : isCharging ? "#22c55e" : "#64748b";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Battery tip (positive terminal)
    ctx.beginPath();
    ctx.roundRect(batteryX + batteryWidth, centerY - tipHeight / 2, tipWidth, tipHeight, [0, 4, 4, 0]);
    ctx.fillStyle = "#64748b";
    ctx.fill();

    // Fill level with gradient
    const fillPadding = 4;
    const fillWidth = (batteryWidth - fillPadding * 2) * (percent / 100);
    const fillHeight = batteryHeight - fillPadding * 2;

    if (percent > 0) {
        const gradient = ctx.createLinearGradient(batteryX + fillPadding, 0, batteryX + fillPadding + fillWidth, 0);

        if (percent < 20) {
            gradient.addColorStop(0, "#dc2626");
            gradient.addColorStop(1, "#ef4444");
        } else if (percent < 50) {
            gradient.addColorStop(0, "#d97706");
            gradient.addColorStop(1, "#f59e0b");
        } else {
            gradient.addColorStop(0, "#16a34a");
            gradient.addColorStop(1, "#22c55e");
        }

        ctx.beginPath();
        ctx.roundRect(batteryX + fillPadding, batteryY + fillPadding, fillWidth, fillHeight, cornerRadius - 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Animated wave effect when charging
        if (isCharging) {
            const waveOffset = (Date.now() / 50) % (batteryWidth * 2);
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(batteryX + fillPadding, batteryY + fillPadding, fillWidth, fillHeight, cornerRadius - 2);
            ctx.clip();

            ctx.globalAlpha = 0.3;
            for (let i = -1; i < 3; i++) {
                const x = batteryX + fillPadding + waveOffset + i * 40 - 80;
                ctx.beginPath();
                ctx.moveTo(x, batteryY);
                ctx.lineTo(x + 20, batteryY + batteryHeight);
                ctx.lineTo(x + 30, batteryY + batteryHeight);
                ctx.lineTo(x + 10, batteryY);
                ctx.closePath();
                ctx.fillStyle = "#ffffff";
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // Percentage text
    ctx.font = `bold ${batteryHeight * 0.4}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = percent > 50 ? "#ffffff" : percent < 20 ? "#ef4444" : "#f8fafc";
    ctx.fillText(`${Math.round(percent)}%`, centerX, centerY);

    // Charging bolt icon
    if (isCharging) {
        const boltSize = batteryHeight * 0.25;
        const boltX = centerX + batteryWidth * 0.25;
        const boltY = centerY;

        ctx.save();
        ctx.translate(boltX, boltY);
        ctx.beginPath();
        ctx.moveTo(0, -boltSize);
        ctx.lineTo(-boltSize * 0.6, boltSize * 0.1);
        ctx.lineTo(-boltSize * 0.1, boltSize * 0.1);
        ctx.lineTo(-boltSize * 0.2, boltSize);
        ctx.lineTo(boltSize * 0.4, -boltSize * 0.1);
        ctx.lineTo(-boltSize * 0.1, -boltSize * 0.1);
        ctx.closePath();
        ctx.fillStyle = "#fbbf24";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }

    // Health indicator arc
    const arcRadius = batteryWidth * 0.45;
    const arcWidth = 4;
    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const healthAngle = startAngle + (endAngle - startAngle) * (health / 100);

    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, startAngle, endAngle);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = arcWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Health arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, arcRadius, startAngle, healthAngle);
    ctx.strokeStyle = health >= 90 ? "#22c55e" : health >= 70 ? "#eab308" : "#ef4444";
    ctx.lineWidth = arcWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Health label
    ctx.font = "11px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "center";
    ctx.fillText(`Health: ${health.toFixed(0)}%`, centerX, centerY + arcRadius + 15);
}

function drawPowerFlow(ctx: CanvasRenderingContext2D, width: number, height: number, systemPower: number, isPluggedIn: boolean, isCharging: boolean) {
    const flowY = height * 0.7;
    const nodeRadius = 24;
    const flowWidth = Math.min(width * 0.7, 350);
    const startX = (width - flowWidth) / 2;

    // Node positions
    const adapterX = startX;
    const batteryX = startX + flowWidth / 2;
    const systemX = startX + flowWidth;

    // Draw connection lines
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Adapter to Battery line
    if (isPluggedIn) {
        const gradient = ctx.createLinearGradient(adapterX, 0, batteryX, 0);
        gradient.addColorStop(0, "#22c55e");
        gradient.addColorStop(1, isCharging ? "#22c55e" : "#334155");
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(adapterX + nodeRadius, flowY);
        ctx.lineTo(batteryX - nodeRadius, flowY);
        ctx.stroke();
    }

    // Battery to System line
    const sysGradient = ctx.createLinearGradient(batteryX, 0, systemX, 0);
    sysGradient.addColorStop(0, "#3b82f6");
    sysGradient.addColorStop(1, "#3b82f6");
    ctx.strokeStyle = sysGradient;
    ctx.beginPath();
    ctx.moveTo(batteryX + nodeRadius, flowY);
    ctx.lineTo(systemX - nodeRadius, flowY);
    ctx.stroke();

    // Draw nodes
    // Adapter node
    if (isPluggedIn) {
        ctx.beginPath();
        ctx.arc(adapterX, flowY, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Plug icon
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#22c55e";
        ctx.fillText("\u26A1", adapterX, flowY);

        ctx.font = "10px system-ui";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("AC", adapterX, flowY + nodeRadius + 12);
    }

    // Battery node
    ctx.beginPath();
    ctx.arc(batteryX, flowY, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = isCharging ? "#22c55e" : "#64748b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Battery icon
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#64748b";
    ctx.fillText("\u{1F50B}", batteryX, flowY);

    ctx.font = "10px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Battery", batteryX, flowY + nodeRadius + 12);

    // System node
    ctx.beginPath();
    ctx.arc(systemX, flowY, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // System icon and power value
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3b82f6";
    ctx.fillText(`${systemPower.toFixed(1)}W`, systemX, flowY);

    ctx.font = "10px system-ui";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("System", systemX, flowY + nodeRadius + 12);
}

function drawPowerGraph(ctx: CanvasRenderingContext2D, width: number, height: number, history: number[]) {
    if (history.length < 2) return;

    const graphHeight = height * 0.12;
    const graphY = height * 0.88;
    const graphWidth = width * 0.8;
    const graphX = (width - graphWidth) / 2;

    // Find max for scaling
    const maxPower = Math.max(...history, 20);

    // Draw graph background
    ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
    ctx.beginPath();
    ctx.roundRect(graphX - 10, graphY - graphHeight - 5, graphWidth + 20, graphHeight + 15, 6);
    ctx.fill();

    // Draw graph line
    ctx.beginPath();
    ctx.moveTo(graphX, graphY - (history[0] / maxPower) * graphHeight);

    for (let i = 1; i < history.length; i++) {
        const x = graphX + (i / (history.length - 1)) * graphWidth;
        const y = graphY - (history[i] / maxPower) * graphHeight;
        ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill under the line
    ctx.lineTo(graphX + graphWidth, graphY);
    ctx.lineTo(graphX, graphY);
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.fill();

    // Label
    ctx.font = "10px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText("Power (1 min)", graphX, graphY + 12);
}

let particles: Particle[] = [];

function updateParticles(ctx: CanvasRenderingContext2D, width: number, height: number, isCharging: boolean, isPluggedIn: boolean) {
    const flowY = height * 0.7;
    const flowWidth = Math.min(width * 0.7, 350);
    const startX = (width - flowWidth) / 2;

    // Add new particles
    if (isPluggedIn && Math.random() < 0.3) {
        particles.push({
            x: startX,
            y: flowY + (Math.random() - 0.5) * 10,
            vx: 2 + Math.random() * 2,
            vy: 0,
            life: 1,
            maxLife: 1,
            size: 3 + Math.random() * 2,
            color: isCharging ? "#22c55e" : "#3b82f6"
        });
    }

    // Always have particles flowing to system
    if (Math.random() < 0.2) {
        particles.push({
            x: startX + flowWidth / 2 + 30,
            y: flowY + (Math.random() - 0.5) * 10,
            vx: 2 + Math.random() * 2,
            vy: 0,
            life: 1,
            maxLife: 1,
            size: 3 + Math.random() * 2,
            color: "#3b82f6"
        });
    }

    // Update and draw particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.life -= 0.02;

        if (p.life <= 0 || p.x > startX + flowWidth + 30) return false;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;

        return true;
    });

    // Limit particles
    if (particles.length > 50) {
        particles = particles.slice(-50);
    }
}

function formatTimeRemaining(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
