/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import React from "react";
import { Button, Input, Modal } from "antd";
import _ from "lodash";
import { AddProcessView } from "./AddProcessView";
import { useSelector } from "react-redux";
import { VitalState, MachineState } from "../../Redux/States";
import axios from "axios";
import { GetProcessesToAddResponse, ManagedModelDto, ProcessToAddDto, ProfileDto } from "../../Dtos/ClientApiDto";
import { Table } from "../../components/Table";

enum Pages {
    Select,
    Add
}
interface AddProcessProps {
    profile: ProfileDto;
    managedModels: ManagedModelDto[];
    onClose: () => void;
    onSubmit: () => void;
}
export const AddProcess: React.FunctionComponent<AddProcessProps> = props => {
    const [data, setData] = React.useState<
        {
            key: string;
            values: [ProcessToAddDto, ...ProcessToAddDto[]];
        }[]
    >([]);
    const [unManagedProcesses, setUnManagedProcesses] = React.useState<ProcessToAddDto[]>();
    const [filter_LowerCased, setFilter_LowerCased] = React.useState<string>("");
    const [isFetching, setIsFetching] = React.useState<boolean>(false);
    const [currentPage, setCurrentPage] = React.useState<Pages>(Pages.Select);

    const machineState = useSelector<VitalState, MachineState>(state => state.machineState);

    const [selectedProcess, setSelectedProcess] = React.useState<{
        processName: string;
        totalThreads: number;
    }>();

    useEffect(() => {
        render();
    }, [unManagedProcesses, filter_LowerCased]);

    useEffect(() => {
        getUnmanagedProcesses();
        render();
    }, []);

    function OnAddProcessClick(processName: string, totalThreads: number) {
        setSelectedProcess({
            processName: processName,
            totalThreads: totalThreads
        });
        setCurrentPage(Pages.Add);
    }

    function getUnmanagedProcesses() {
        setIsFetching(true);
        axios
            .get<GetProcessesToAddResponse>("api/process/ProcessesToAdd", { timeout: 20000 })
            .then(response => {
                setUnManagedProcesses(response.data.processes);
            })
            .finally(() => setIsFetching(false));
    }

    function render() {
        let filteredUnManaged = unManagedProcesses;
        if (filter_LowerCased.length > 0) filteredUnManaged = filteredUnManaged?.filter(e => e.processName.toLowerCase().includes(filter_LowerCased) || e.mainWindowTitle.toLowerCase().includes(filter_LowerCased) || e.pid.toString().includes(filter_LowerCased) || e.pid.toString().includes(filter_LowerCased));

        const grouped = _.groupBy(filteredUnManaged, e => e.processName);
        const groupedArray = _.toArray(
            _.map(grouped, (values, key) => {
                return { key: key, values: values };
            })
        );

        setData(groupedArray);
    }
    function selectView() {
        return (
            <div style={{ height: "100%", width: "100%" }}>
                <div className="header" style={{ gap: 10 }}>
                    <Input placeholder="Search" style={{ width: 200 }} value={filter_LowerCased} onChange={e => setFilter_LowerCased(e.target.value.toLowerCase())} />
                    <Button onClick={() => getUnmanagedProcesses()}>Refresh</Button>
                </div>
                <div style={{ height: 400 }}>
                    <Table>
                        <thead>
                            <th style={{ width: 70 }}>Process Name</th>
                            <th style={{ width: 120 }}>Title</th>
                            <th style={{ width: 400 }}>Pids</th>
                            <th style={{ width: 120 }}>Action</th>
                        </thead>
                        <tbody>
                            {data.map(e => {
                                return (
                                    <tr>
                                        <td>{e.values[0].processName}</td>
                                        <td>{e.values[0].mainWindowTitle}</td>
                                        <td style={{ width: 100 }}>
                                            {e.values
                                                .map(f => f.pid)
                                                .toString()
                                                .replace(/,/g, ", ")}
                                        </td>
                                        <td>
                                            {e.values.some(f => props.managedModels.some(g => f.processName === g.processName)) ? (
                                                <div>This process is already being handled in this profile</div>
                                            ) : e.values.some(x => x.canModify) ? (
                                                <Button onClick={() => OnAddProcessClick(e.key, machineState.static?.cpu.threadCount ?? 0)}>Add Process</Button>
                                            ) : (
                                                <div>This process cannot be managed. This may be due to Vital Service not having Administrator Privileges or it is just not possible.</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
                <div className="ant-modal-footer">{currentPage === Pages.Select && <Button onClick={props.onClose}>Cancel</Button>}</div>
            </div>
        );
    }

    function addView() {
        return (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            <AddProcessView name={selectedProcess!.processName} executionPath={""} profileId={props.profile.id} onBack={() => setCurrentPage(Pages.Select)} onSubmit={props.onSubmit}></AddProcessView>
        );
    }

    return (
        <Modal width={"80%"} visible={true} title="Add New Process" closable onCancel={props.onClose} maskClosable={false} afterClose={props.onClose} footer={null}>
            {currentPage === Pages.Select && selectView()}
            {currentPage === Pages.Add && addView()}
        </Modal>
    );
};

function canModifySorter(a: boolean, b: boolean) {
    return Number(a) - Number(b);
}
