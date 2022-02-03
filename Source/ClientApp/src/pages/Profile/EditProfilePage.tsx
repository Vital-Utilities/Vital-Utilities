/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Breadcrumb, Button, Input, notification, Popconfirm } from "antd";
import { Table } from "antd";
import { useEffect, ReactNode } from "react";
import { ColumnsType } from "antd/lib/table";
import { ManagedModelDto, ProcessPriorityEnum, ProfileDto, UpdateProfileRequest } from "../../Dtos/Dto";
import { EditProcess } from "./EditProcess";
import "../home.scss";
import { ProcessorThreadPerfBadge } from "../../components/PerfBadge";
import { AffinityRenderer } from "../../components/Affinity/AffinityRenderer";
import Checkbox from "antd/lib/checkbox/Checkbox";
import { useParams } from "react-router";
import { ProfileFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { AddProcess } from "./AddProcess";
import { State, ManagedState, MachineState } from "../../Redux/States";
import axios from "axios";
import { recieveDeleteManagedProcessAction as recieveDeleteManagedProcessAction } from "../../Redux/actions/managedModelActions";

export const EditProfilePage: React.FunctionComponent = () => {
    // @ts-ignore
    const { profileId } = useParams();

    const [profile, setProfile] = React.useState<ProfileDto>();
    const dispatch = useDispatch();
    const [data, setData] = React.useState<ReactNode[]>();
    const managedState = useSelector<State, ManagedState>(state => state.managedState);
    const machineState = useSelector<State, MachineState>(state => state.machineState);
    const [showAddModal, setShowAddModal] = React.useState<boolean>(false);
    const [showEditModal, setShowEditModal] = React.useState<boolean>(false);
    const [selectedModel, setSelectedModel] = React.useState<ManagedModelDto | undefined>();
    const [filter_LowerCased, setFilter_LowerCased] = React.useState<string>("");
    const [profileNameInput, setProfileNameInput] = React.useState<string>();
    useEffect(() => {
        render();
        function render() {
            if (!profile) {
                console.error(`no profile found with id: ${profileId}`);
                return <></>;
            }
            setProfileNameInput(profile.name);
            let list: ManagedModelDto[] = managedState.managed.filter(e => e.parentProfileId === Number.parseInt(profileId));

            if (filter_LowerCased.length > 0) list = list.filter(e => e.processName.toLowerCase().includes(filter_LowerCased) || e.alias.toLowerCase().includes(filter_LowerCased));

            const returnList = list.map(e => {
                return {
                    key: e.id,
                    name: e.processName + (e.alias ? ` (${e.alias})` : ""),
                    cpu: (
                        <div>
                            {/* <ThreadCountBadge processName={e.processName} /> */}
                            <ProcessorThreadPerfBadge processName={e.processName} />
                        </div>
                    ),
                    affinity: (
                        <div>
                            {e.processPriority !== ProcessPriorityEnum.DontOverride && (
                                <p>
                                    Process Priority Overriden: <b>{e.processPriority}</b>
                                </p>
                            )}
                            <div
                                style={{
                                    width: "auto",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    pointerEvents: "none"
                                }}
                            >
                                <AffinityRenderer affinity={e.affinity} />
                            </div>
                            <ShowOnHover>
                                <div className="button-row center">
                                    <Button onClick={() => updateProcessModel(e)}>Edit Affinity</Button>
                                    <Popconfirm
                                        title="Are you sure you want to delete this configuration?"
                                        onConfirm={() => {
                                            axios
                                                .delete(`api/profile/process/${e.id}`)
                                                .then(result => {
                                                    if (result.status === 200) {
                                                        dispatch(recieveDeleteManagedProcessAction(e.id));
                                                    }
                                                })
                                                .catch(result => {
                                                    notification.error({ duration: null, message: result });
                                                    console.error(result);
                                                });
                                        }}
                                        okText="Yes"
                                        cancelText="No"
                                    >
                                        <Button danger>Delete</Button>
                                    </Popconfirm>
                                </div>
                            </ShowOnHover>
                        </div>
                    )
                };
            });
            setData(returnList);
        }
    }, [managedState, profile, filter_LowerCased, profileId]);

    useEffect(() => {
        GetProfile();
    }, []);

    async function GetProfile() {
        axios.get<ProfileDto>(`api/profile/${profileId}`).then(response => {
            setProfile(response.data);
        });
    }
    function updateProcessModel(managedModel: ManagedModelDto) {
        setSelectedModel(managedModel);
        setShowEditModal(true);
    }
    if (!profile) {
        return <>profile not found</>;
    } else
        return (
            <div style={{ height: "100%", width: "100vw" }}>
                <Breadcrumb separator=">" style={{ padding: 15 }}>
                    <Breadcrumb.Item>
                        <Link to="/profiles">
                            <ProfileFilled />
                            <span>Profiles</span>
                        </Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <span>
                            <Input style={{ width: 150, marginRight: 10, color: "white" }} disabled bordered={false} value={profileNameInput} onChange={e => setProfileNameInput(e.target.value)} />
                            {profileNameInput !== profile.name && (
                                <Button
                                    onClick={() => {
                                        const data: UpdateProfileRequest = { profile: { ...profile, name: profileNameInput! } };
                                        axios
                                            .put(`api/profile/${profileId}`, data)
                                            .then(() => {
                                                GetProfile();
                                            })
                                            .catch(error => console.error(error));
                                    }}
                                >
                                    Apply Rename
                                </Button>
                            )}
                        </span>
                    </Breadcrumb.Item>
                </Breadcrumb>

                {showAddModal && (
                    <AddProcess
                        managedModels={managedState.managed.filter(e => e.parentProfileId === profile.id)}
                        profile={profile}
                        onClose={() => {
                            setShowAddModal(false);
                            setSelectedModel(undefined);
                        }}
                        onSubmit={() => {
                            setShowAddModal(false);
                            setSelectedModel(undefined);
                        }}
                    />
                )}
                {showEditModal && selectedModel && machineState.static?.cpu.threadCount && (
                    <EditProcess
                        model={selectedModel}
                        onCancel={() => {
                            setShowEditModal(false);
                            setSelectedModel(undefined);
                        }}
                        onSubmit={() => {
                            GetProfile();
                            setShowEditModal(false);
                            setSelectedModel(undefined);
                        }}
                    />
                )}
                <div className="view-header" style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <Input placeholder="Filter name" style={{ width: 200 }} value={filter_LowerCased} onChange={e => setFilter_LowerCased(e.target.value.toLowerCase())} />
                    {/* <Checkbox style={{ float: "right" }}>Lock threads to specified apps</Checkbox> */}
                    <Button type="primary" onClick={() => setShowAddModal(true)}>
                        Add
                    </Button>
                    <Checkbox
                        checked={profile.enabled}
                        onChange={() => {
                            axios
                                .put("api/profile", { profile: { ...profile, enabled: !profile.enabled } } as UpdateProfileRequest, {
                                    headers: {
                                        "Content-Type": "application/json"
                                    }
                                })
                                .then(() => GetProfile())
                                .catch(error => console.error(error));
                        }}
                    >
                        Enabled
                    </Checkbox>
                    <div>
                        <div style={{ gap: 10 }}></div>
                    </div>
                </div>
                <div className="table-container">
                    <Table<any> columns={columns} showHeader dataSource={data} scroll={{ y: "calc(100vh - 200px)" }} sticky pagination={false} bordered />
                </div>
            </div>
        );
};
const columns: ColumnsType<any> = [
    {
        title: "Name",
        dataIndex: "name",
        sorter: (a: string, b: string) => a.length - b.length,
        width: 300
    },
    /*     {
        title: "CPU",
        dataIndex: "cpu",
        width: 250
    }, */
    {
        title: "Affinity",
        dataIndex: "affinity"
    }
];
const ShowOnHover: React.FunctionComponent = props => {
    const [show, setShow] = React.useState<boolean>();

    function OverlayBehaviour(): React.CSSProperties | undefined {
        if (show) return { opacity: "1" };
        else return { opacity: "0" };
    }

    return (
        <div className="overlayFilter overlay" style={OverlayBehaviour()} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {props.children}
        </div>
    );
};
