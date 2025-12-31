/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { EditProcess } from "./EditProcess";
import "../home.scss";
import { AffinityRenderer } from "../../components/Affinity/AffinityRenderer";
import { User, ChevronRight } from "lucide-react";
import { Link, useParams } from "@tanstack/react-router";
import { AddProcess } from "./AddProcess";
import { VitalState, ManagedState, MachineState } from "../../Redux/States";
import { recieveDeleteManagedProcessAction as recieveDeleteManagedProcessAction } from "../../Redux/actions/managedModelActions";
import { Table } from "../../components/Table";
import { ProfileDto, ManagedModelDto, ProcessPriorityEnum, UpdateProfileRequest } from "@vital/vitalservice";
import { profileApi } from "../../Redux/actions/tauriApi";
import { OverlayContentOnHover } from "../../components/OverlayContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import toast from "react-hot-toast";

export const EditProfilePage: React.FunctionComponent = () => {
    const { profileId } = useParams({ from: "/profiles/$profileId" });

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
        profileApi.getById(Number.parseInt(profileId)).then(response => {
            setProfile(response);
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
                    <OverlayContentOnHover
                        blur
                        content={
                            <div className="button-row center">
                                <Button variant="secondary" onClick={() => updateProcessModel(e)}>
                                    Edit Affinity
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">Delete</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
                                            <AlertDialogDescription>Are you sure you want to delete this configuration?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>No</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => {
                                                    profileApi
                                                        .deleteProcessConfig(e.id)
                                                        .then(() => {
                                                            dispatch(recieveDeleteManagedProcessAction(e.id));
                                                        })
                                                        .catch(result => {
                                                            toast.error(String(result));
                                                            console.error(result);
                                                        });
                                                }}
                                            >
                                                Yes
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
                    </OverlayContentOnHover>
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
                <Breadcrumb className="p-4">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/profiles" className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>Profiles</span>
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <span className="flex items-center gap-2">
                                <Input style={{ width: 150 }} className="text-white" disabled value={profileNameInput} onChange={e => setProfileNameInput(e.target.value)} />
                                {profileNameInput !== profile.name && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            const data: UpdateProfileRequest = { profile: { ...profile, name: profileNameInput! } };
                                            profileApi
                                                .update(data)
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
                        </BreadcrumbItem>
                    </BreadcrumbList>
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
                    <Button onClick={() => setShowAddModal(true)}>Add</Button>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="profile-enabled"
                            checked={profile.enabled}
                            onCheckedChange={() => {
                                profileApi
                                    .update({ profile: { ...profile, enabled: !profile.enabled } } as UpdateProfileRequest)
                                    .then(() => GetProfile())
                                    .catch(error => console.error(error));
                            }}
                        />
                        <Label htmlFor="profile-enabled">Enabled</Label>
                    </div>
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
