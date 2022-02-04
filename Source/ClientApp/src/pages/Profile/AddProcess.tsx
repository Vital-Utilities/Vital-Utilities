/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, ReactNode } from "react";
import React from "react";
import { Button, Input, Modal } from "antd";
import Table, { ColumnsType } from "antd/lib/table";
import _ from "lodash";
import { AddProcessView } from "./AddProcessView";
import { useSelector } from "react-redux";
import { State, MachineState } from "../../Redux/States";
import axios from "axios";
import { GetProcessesToAddResponse, ManagedModelDto, ProcessToAddDto, ProfileDto } from "../../Dtos/Dto";

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
    const [data, setData] = React.useState<ReactNode[]>([]);
    const [unManagedProcesses, setUnManagedProcesses] = React.useState<ProcessToAddDto[]>();
    const [filter_LowerCased, setFilter_LowerCased] = React.useState<string>("");
    const [isFetching, setIsFetching] = React.useState<boolean>(false);
    const [currentPage, setCurrentPage] = React.useState<Pages>(Pages.Select);

    const machineState = useSelector<State, MachineState>(state => state.machineState);

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
        if (filter_LowerCased.length > 0) filteredUnManaged = filteredUnManaged?.filter(e => e.processName.toLowerCase().includes(filter_LowerCased) || e.pid.toString().includes(filter_LowerCased));

        const grouped = _.groupBy(filteredUnManaged, e => e.processName);
        const groupedArray = _.toArray(
            _.map(grouped, (values, key) => {
                return { key: key, values: values };
            })
        );
        const list = groupedArray.map(e => {
            let action: any;

            if (e.values.some(f => props.managedModels.some(g => f.processName === g.processName))) {
                action = <div>This process is already being handled in this profile</div>;
            } else if (e.values.some(x => x.canModify)) {
                action = <Button onClick={() => OnAddProcessClick(e.key, machineState.static?.cpu.threadCount ?? 0)}>Add Process</Button>;
            } else {
                action = <div>This process cannot be managed. This may be due to Vital Service not having Administrator Privileges or it is just not possible.</div>;
            }
            return {
                key: e.key,
                name: e.key,
                description: `Active pid(s) with this process name: ${e.values.map(f => f.pid)}`,
                action: action
            };
        });
        setData(list);
    }
    function selectView() {
        return (
            <div style={{ height: "100%" }}>
                <div className="header" style={{ gap: 10 }}>
                    <Input placeholder="Filter name or PID" style={{ width: 200, float: "right" }} value={filter_LowerCased} onChange={e => setFilter_LowerCased(e.target.value.toLowerCase())} />
                    <Button onClick={() => getUnmanagedProcesses()}>Refresh</Button>
                </div>

                <Table<any>
                    expandable={{
                        expandedRowRender: record => <p style={{ margin: 0 }}>{record.description}</p>,
                        rowExpandable: record => record.name !== "Not Expandable"
                    }}
                    sticky
                    size={"middle"}
                    scroll={{ y: "300px" }}
                    columns={columns}
                    dataSource={isFetching ? [] : data}
                    pagination={false}
                    bordered
                    loading={isFetching}
                />

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
        <Modal width={1000} visible={true} title="Add New Process" closable onCancel={props.onClose} maskClosable={false} afterClose={props.onClose} footer={null}>
            {currentPage === Pages.Select && selectView()}
            {currentPage === Pages.Add && addView()}
        </Modal>
    );
};

const columns: ColumnsType<ProcessToAddDto> = [
    {
        title: "Process name",
        dataIndex: "name"
    },
    {
        title: "Action",
        dataIndex: "action",
        width: 200
    }
];

function canModifySorter(a: boolean, b: boolean) {
    return Number(a) - Number(b);
}
