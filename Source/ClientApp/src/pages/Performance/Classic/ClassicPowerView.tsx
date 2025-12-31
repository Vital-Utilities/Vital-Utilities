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

        // Get current values (cap health at 100% for display)
        const batteryPercent = powerData?.batteryPercentage ?? 0;
        const systemPower = powerData?.systemPowerWatts ?? 0;
        const isCharging = powerData?.externalConnected && !powerData?.fullyCharged;
        const isPluggedIn = powerData?.externalConnected ?? false;
        const batteryHealth = Math.min(powerData?.batteryHealth ?? 100, 100);
        const rawHealth = powerData?.batteryHealth ?? 100;

        // Draw battery visualization
        drawBattery(ctx, width, height, batteryPercent, isCharging ?? false, batteryHealth, rawHealth);

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

    const healthColor = (powerData.batteryHealth ?? 100) >= 80 ? "#22c55e" : (powerData.batteryHealth ?? 100) >= 50 ? "#eab308" : "#ef4444";

    return (
        <ClassicLayout
            header={{
                title: "Power",
                deviceName: powerData.externalConnected ? "Plugged In" : "On Battery"
            }}
            graph={<canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />}
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        {/* Power consumption */}
                        {powerData.systemPowerWatts !== undefined && <ItemOne color="#3b82f6" title="System Power" value={`${powerData.systemPowerWatts.toFixed(1)}W`} />}

                        {/* Adapter info */}
                        {powerData.externalConnected && powerData.adapterWatts && <ItemOne color="#22c55e" title="Adapter" value={`${powerData.adapterWatts}W ${powerData.adapterDescription ?? ""}`} />}

                        {/* Battery Health */}
                        {powerData.batteryHealth !== undefined && <ItemOne color={healthColor} title="Battery Health" value={`${powerData.batteryHealth.toFixed(1)}%`} />}

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

function drawBattery(ctx: CanvasRenderingContext2D, width: number, height: number, percent: number, isCharging: boolean, health: number, rawHealth: number) {
    const centerX = width / 2;
    const centerY = height * 0.32;
    const time = Date.now();

    // Battery dimensions - larger for liquid glass effect
    const batteryWidth = Math.min(width * 0.4, 200);
    const batteryHeight = batteryWidth * 0.55;
    const cornerRadius = 12;
    const tipWidth = 10;
    const tipHeight = batteryHeight * 0.35;

    const batteryX = centerX - batteryWidth / 2;
    const batteryY = centerY - batteryHeight / 2;

    // Outer glow based on state
    ctx.save();
    if (isCharging) {
        ctx.shadowColor = "rgba(34, 197, 94, 0.6)";
        ctx.shadowBlur = 30;
    } else if (percent < 20) {
        ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
        ctx.shadowBlur = 20 + Math.sin(time / 200) * 8;
    } else {
        ctx.shadowColor = "rgba(59, 130, 246, 0.3)";
        ctx.shadowBlur = 15;
    }

    // Glass outer shell - dark tinted glass
    ctx.beginPath();
    ctx.roundRect(batteryX, batteryY, batteryWidth, batteryHeight, cornerRadius);
    const shellGradient = ctx.createLinearGradient(batteryX, batteryY, batteryX, batteryY + batteryHeight);
    shellGradient.addColorStop(0, "rgba(40, 40, 55, 0.9)");
    shellGradient.addColorStop(0.5, "rgba(25, 25, 35, 0.95)");
    shellGradient.addColorStop(1, "rgba(35, 35, 50, 0.9)");
    ctx.fillStyle = shellGradient;
    ctx.fill();
    ctx.restore();

    // Glass border with subtle highlight
    ctx.beginPath();
    ctx.roundRect(batteryX, batteryY, batteryWidth, batteryHeight, cornerRadius);
    const borderGradient = ctx.createLinearGradient(batteryX, batteryY, batteryX, batteryY + batteryHeight);
    borderGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    borderGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
    borderGradient.addColorStop(1, "rgba(255, 255, 255, 0.15)");
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Battery tip with glass effect
    ctx.beginPath();
    ctx.roundRect(batteryX + batteryWidth - 1, centerY - tipHeight / 2, tipWidth, tipHeight, [0, 6, 6, 0]);
    const tipGradient = ctx.createLinearGradient(batteryX + batteryWidth, centerY - tipHeight / 2, batteryX + batteryWidth, centerY + tipHeight / 2);
    tipGradient.addColorStop(0, "rgba(80, 80, 100, 0.9)");
    tipGradient.addColorStop(0.5, "rgba(50, 50, 70, 0.9)");
    tipGradient.addColorStop(1, "rgba(70, 70, 90, 0.9)");
    ctx.fillStyle = tipGradient;
    ctx.fill();

    // Liquid fill area
    const fillPadding = 6;
    const maxFillWidth = batteryWidth - fillPadding * 2;
    const fillWidth = maxFillWidth * (percent / 100);
    const fillHeight = batteryHeight - fillPadding * 2;
    const fillX = batteryX + fillPadding;
    const fillY = batteryY + fillPadding;

    if (percent > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(fillX, fillY, maxFillWidth, fillHeight, cornerRadius - 4);
        ctx.clip();

        // Animated liquid wave surface
        const waveAmplitude = isCharging ? 4 : 2;
        const waveFrequency = 0.03;
        const waveSpeed = isCharging ? 0.003 : 0.001;

        ctx.beginPath();
        ctx.moveTo(fillX, fillY + fillHeight);

        // Draw wavy top edge of liquid
        for (let x = 0; x <= fillWidth; x += 2) {
            const waveY = Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude;
            const waveY2 = Math.sin(x * waveFrequency * 1.5 + time * waveSpeed * 1.3) * (waveAmplitude * 0.5);
            ctx.lineTo(fillX + x, fillY + waveY + waveY2);
        }

        ctx.lineTo(fillX + fillWidth, fillY + fillHeight);
        ctx.closePath();

        // Liquid gradient based on charge level
        const liquidGradient = ctx.createLinearGradient(fillX, fillY, fillX, fillY + fillHeight);
        if (percent < 20) {
            liquidGradient.addColorStop(0, "rgba(239, 68, 68, 0.95)");
            liquidGradient.addColorStop(0.3, "rgba(220, 38, 38, 0.9)");
            liquidGradient.addColorStop(0.7, "rgba(185, 28, 28, 0.85)");
            liquidGradient.addColorStop(1, "rgba(153, 27, 27, 0.9)");
        } else if (percent < 50) {
            liquidGradient.addColorStop(0, "rgba(251, 191, 36, 0.95)");
            liquidGradient.addColorStop(0.3, "rgba(245, 158, 11, 0.9)");
            liquidGradient.addColorStop(0.7, "rgba(217, 119, 6, 0.85)");
            liquidGradient.addColorStop(1, "rgba(180, 83, 9, 0.9)");
        } else {
            liquidGradient.addColorStop(0, "rgba(74, 222, 128, 0.95)");
            liquidGradient.addColorStop(0.3, "rgba(34, 197, 94, 0.9)");
            liquidGradient.addColorStop(0.7, "rgba(22, 163, 74, 0.85)");
            liquidGradient.addColorStop(1, "rgba(21, 128, 61, 0.9)");
        }
        ctx.fillStyle = liquidGradient;
        ctx.fill();

        // Liquid surface shine/reflection
        ctx.beginPath();
        for (let x = 0; x <= fillWidth; x += 2) {
            const waveY = Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude;
            const waveY2 = Math.sin(x * waveFrequency * 1.5 + time * waveSpeed * 1.3) * (waveAmplitude * 0.5);
            if (x === 0) {
                ctx.moveTo(fillX + x, fillY + waveY + waveY2);
            } else {
                ctx.lineTo(fillX + x, fillY + waveY + waveY2);
            }
        }
        const shineGradient = ctx.createLinearGradient(fillX, fillY, fillX + fillWidth, fillY);
        shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        shineGradient.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
        shineGradient.addColorStop(0.7, "rgba(255, 255, 255, 0.2)");
        shineGradient.addColorStop(1, "rgba(255, 255, 255, 0.3)");
        ctx.strokeStyle = shineGradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated bubbles when charging
        if (isCharging) {
            const bubbleCount = 5;
            for (let i = 0; i < bubbleCount; i++) {
                const bubbleX = fillX + 20 + (i * (fillWidth - 40)) / bubbleCount;
                const bubblePhase = (time / 1000 + i * 0.7) % 2;
                const bubbleY = fillY + fillHeight - bubblePhase * fillHeight * 0.8;
                const bubbleSize = 3 + Math.sin(time / 300 + i) * 1.5;
                const bubbleAlpha = Math.max(0, 1 - bubblePhase * 0.8);

                ctx.beginPath();
                ctx.arc(bubbleX + Math.sin(time / 500 + i) * 5, bubbleY, bubbleSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${bubbleAlpha * 0.5})`;
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // Glass reflection overlay on top of battery
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(batteryX + 4, batteryY + 4, batteryWidth - 8, batteryHeight * 0.4, [cornerRadius - 2, cornerRadius - 2, 0, 0]);
    const reflectionGradient = ctx.createLinearGradient(batteryX, batteryY, batteryX, batteryY + batteryHeight * 0.5);
    reflectionGradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
    reflectionGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
    reflectionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = reflectionGradient;
    ctx.fill();
    ctx.restore();

    // Percentage text with shadow for depth
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.font = `bold ${batteryHeight * 0.38}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${Math.round(percent)}%`, centerX, centerY);
    ctx.restore();

    // Charging bolt icon with glow
    if (isCharging) {
        const boltSize = batteryHeight * 0.22;
        const boltX = centerX + batteryWidth * 0.28;
        const boltY = centerY;

        ctx.save();
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 15;
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
        ctx.fill();
        ctx.restore();
    }
}

function drawPowerFlow(ctx: CanvasRenderingContext2D, width: number, height: number, systemPower: number, isPluggedIn: boolean, isCharging: boolean) {
    const flowY = height * 0.62;
    const nodeRadius = 22;
    const flowWidth = Math.min(width * 0.75, 400);
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

    const graphHeight = height * 0.18;
    const graphY = height * 0.92;
    const graphWidth = width * 0.85;
    const graphX = (width - graphWidth) / 2;

    // Find min/max for scaling with some padding
    const minPower = Math.min(...history) * 0.9;
    const maxPower = Math.max(...history, 10) * 1.1;
    const range = maxPower - minPower || 1;

    // Draw graph background
    ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    ctx.beginPath();
    ctx.roundRect(graphX - 15, graphY - graphHeight - 10, graphWidth + 30, graphHeight + 25, 8);
    ctx.fill();

    // Draw subtle grid lines
    ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = graphY - (i / 3) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(graphX, y);
        ctx.lineTo(graphX + graphWidth, y);
        ctx.stroke();
    }

    // Draw graph line with smooth curve
    ctx.beginPath();
    ctx.moveTo(graphX, graphY - ((history[0] - minPower) / range) * graphHeight);

    for (let i = 1; i < history.length; i++) {
        const x = graphX + (i / (history.length - 1)) * graphWidth;
        const y = graphY - ((history[i] - minPower) / range) * graphHeight;
        ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Fill under the line with gradient
    const lastX = graphX + graphWidth;
    const gradient = ctx.createLinearGradient(0, graphY - graphHeight, 0, graphY);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.05)");

    ctx.lineTo(lastX, graphY);
    ctx.lineTo(graphX, graphY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current value indicator (dot at end)
    const currentY = graphY - ((history[history.length - 1] - minPower) / range) * graphHeight;
    ctx.beginPath();
    ctx.arc(lastX, currentY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = "10px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText(`${maxPower.toFixed(0)}W`, graphX - 12, graphY - graphHeight + 4);
    ctx.fillText(`${minPower.toFixed(0)}W`, graphX - 12, graphY + 4);

    // Title on right
    ctx.textAlign = "right";
    ctx.fillText("Power (60s)", graphX + graphWidth + 12, graphY - graphHeight + 4);
}

let particles: Particle[] = [];

function updateParticles(ctx: CanvasRenderingContext2D, width: number, height: number, isCharging: boolean, isPluggedIn: boolean) {
    const flowY = height * 0.62;
    const flowWidth = Math.min(width * 0.75, 400);
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
