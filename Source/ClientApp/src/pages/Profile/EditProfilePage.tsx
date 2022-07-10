/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Breadcrumb, Button, Input, notification, Popconfirm } from "antd";
import { useEffect } from "react";
import { EditProcess } from "./EditProcess";
import "../home.scss";
import { AffinityRenderer } from "../../components/Affinity/AffinityRenderer";
import Checkbox from "antd/lib/checkbox/Checkbox";
import { useParams } from "react-router";
import { ProfileFilled } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { AddProcess } from "./AddProcess";
import { VitalState, ManagedState, MachineState } from "../../Redux/States";
import { recieveDeleteManagedProcessAction as recieveDeleteManagedProcessAction } from "../../Redux/actions/managedModelActions";
import { Table } from "../../components/Table";
import { ProfileDto, ManagedModelDto, ProcessPriorityEnum, UpdateProfileRequest } from "@vital/vitalservice";
import { profileApi } from "../../Redux/actions/api";

export const EditProfilePage: React.FunctionComponent = () => {
    // @ts-ignore
    const { profileId } = useParams();

    const [profile, setProfile] = React.useState<ProfileDto>();
    const dispatch = useDispatch();
    const [view, setView] = React.useState<ManagedModelDto[]>([]);
    const managedState = useSelector<VitalState, ManagedState>(state => state.managedState);
    const machineState = useSelector<VitalState, MachineState>(state => state.machineState);
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

            setView(list);
        }
    }, [managedState, profile, filter_LowerCased, profileId]);

    useEffect(() => {
        GetProfile();
    }, []);

    async function GetProfile() {
        profileApi.apiProfileIdGet(profileId).then(response => {
            setProfile(response.data);
        });
    }
    function updateProcessModel(managedModel: ManagedModelDto) {
        setSelectedModel(managedModel);
        setShowEditModal(true);
    }

    function renderRow(e: ManagedModelDto) {
        return (
            <tr key={e.id}>
                <td>{e.processName + (e.alias ? ` (${e.alias})` : "")}</td>
                <td>
                    {e.processPriority !== ProcessPriorityEnum.DontOverride && (
                        <p>
                            Process Priority Overriden: <b>{e.processPriority}</b>
                        </p>
                    )}
                </td>
                <td>
                    <OverlayContent
                        content={
                            <div className="button-row center">
                                <Button onClick={() => updateProcessModel(e)}>Edit Affinity</Button>
                                <Popconfirm
                                    title="Are you sure you want to delete this configuration?"
                                    onConfirm={() => {
                                        profileApi
                                            .apiProfileDeleteProcessConfigIdDelete(e.id)
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
                        }
                    >
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
                    </OverlayContent>
                </td>
                <td />
            </tr>
        );
    }

    if (!profile) {
        return <>profile not found</>;
    } else
        return (
            <>
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
                                        profileApi
                                            .apiProfileUpdatePut(data)
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
                            profileApi
                                .apiProfileUpdatePut({ profile: { ...profile, enabled: !profile.enabled } } as UpdateProfileRequest, {
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
                <Table>
                    <thead>
                        <tr>
                            <th style={{ minWidth: 100, width: 200 }}>Name</th>
                            <th>Priority</th>
                            <th>Affinity</th>
                            <th>Thread Usage</th>
                        </tr>
                    </thead>
                    <tbody>{view.map(e => renderRow(e))}</tbody>
                </Table>
            </>
        );
};

const OverlayContent: React.FunctionComponent<{ show?: boolean; content: React.ReactNode }> = props => {
    const [show, setShow] = React.useState<boolean>(props.show ?? false);

    function OverlayBehaviour(): React.CSSProperties | undefined {
        if (show) return { opacity: "1" };
        else return { opacity: "0" };
    }

    return (
        <div className="overlay-container">
            {props.children}

            {props.show === undefined ? (
                <div className="overlayFilter overlay" style={OverlayBehaviour()} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
                    {props.content}
                </div>
            ) : (
                <div className="overlayFilter overlay" style={OverlayBehaviour()}>
                    {props.content}
                </div>
            )}
        </div>
    );
};
