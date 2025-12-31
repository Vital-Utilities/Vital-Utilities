import React, { ReactNode } from "react";
import { useSelector } from "react-redux";
import { VitalState, MachineState } from "../../Redux/States";
import "./affinity.scss";
import { Checkbox } from "@/components/ui/checkbox";

interface props {
    affinity: number[];
    onChange?: (value: number[]) => void;
}

export const AffinityRenderer: React.FunctionComponent<props> = ({ affinity, onChange }) => {
    const machineState = useSelector<VitalState, MachineState>(e => e.machineState);
    function updateAffinity(value: number, add: boolean) {
        let newAffinity = Array.from(affinity);
        if (add) {
            newAffinity.push(value);
        } else {
            newAffinity = newAffinity.filter(e => e !== value);
        }
        onChange && onChange(newAffinity);
    }
    function renderAffinity(affinity: number[]): ReactNode {
        const returnElements: ReactNode[] = [];
        for (let i = 0; i < (machineState.static?.cpu.threadCount ?? 0); i++) {
            const included = affinity.includes(i);
            returnElements.push(
                <div key={i} className="w-15 flex items-center justify-end gap-1">
                    <span>{`${i}:`}</span>
                    <Checkbox checked={affinity.includes(i)} onCheckedChange={() => updateAffinity(i, !included)} />
                </div>
            );
        }
        return returnElements;
    }
    return (
        <div className="affinityRenderer" style={{ gridTemplateColumns: `repeat(${(machineState.static?.cpu.threadCount ?? 0) / 4}, 1fr)` }}>
            {renderAffinity(affinity)}
        </div>
    );
};

export const MiniAffinityRenderer: React.FunctionComponent<{ affinity: number[] }> = ({ affinity }) => {
    const machineState = useSelector<VitalState, MachineState>(e => e.machineState);
    const renderedAffinity = renderAffinity(affinity);
    function renderAffinity(affinity: number[]): ReactNode {
        const returnElements: ReactNode[] = [];
        for (let i = 0; i < (machineState.static?.cpu.threadCount ?? 0); i++) {
            const included = affinity.includes(i);
            returnElements.push(
                <div key={i} className="w-2.5">
                    <div className={included ? "activeAffinity" : "inactiveAffinity"} />
                </div>
            );
        }
        return returnElements;
    }
    return (
        <>
            <div style={{ gridTemplateColumns: `repeat(${machineState.static?.cpu.threadCount ?? 0 / 4}, 1fr)` }} className="affinityRenderer">
                {renderedAffinity}
            </div>
        </>
    );
};
