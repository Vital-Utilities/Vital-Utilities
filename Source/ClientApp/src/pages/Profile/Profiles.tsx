import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreateProfile } from "./AddProfile";
import { fetchProfilesAction, recieveDeleteProfileAction } from "../../Redux/actions/profileActions";
import { VitalState, ProfileState } from "../../Redux/States";
import { Table } from "../../components/Table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BsPencilFill, BsTrashFill } from "react-icons/bs";
import { Link } from "@tanstack/react-router";
import { ProfileDto } from "@vital/vitalservice";
import { profileApi } from "../../Redux/actions/tauriApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

enum SortByEnum {
    Name = "Name"
}

export const Profiles: React.FunctionComponent = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [view, setView] = React.useState<ProfileDto[]>([]);
    const [filter_LowerCased, setFilter_LowerCased] = React.useState<string>("");
    const [showAddModal, setShowAddModal] = React.useState<boolean>(false);
    const profileState = useSelector<VitalState, ProfileState>(state => state.profileState);
    const [sortBy, setSortBy] = React.useState<{ sortBy: SortByEnum; descending: boolean }>({ sortBy: SortByEnum.Name, descending: false });
    const dispatch = useDispatch();
    useEffect(() => {
        render();
    }, [profileState, filter_LowerCased, sortBy]);

    useEffect(() => {
        dispatch(fetchProfilesAction());
    }, []);

    function render() {
        let returnList = profileState.profiles;
        if (filter_LowerCased.length > 0) returnList = returnList.filter(e => e.name.toLowerCase().includes(filter_LowerCased));

        switch (sortBy.sortBy) {
            case SortByEnum.Name: {
                const toReturn = returnList.sort((a, b) => a.name.localeCompare(b.name));
                returnList = sortBy.descending ? toReturn.reverse() : toReturn;
                break;
            }
            default:
                break;
        }
        setView(returnList);
    }

    function onModalSubmit() {
        setShowAddModal(false);
    }

    function sortDirectionRender() {
        return sortBy.descending ? <ChevronDown className="h-4 w-4 inline" /> : <ChevronUp className="h-4 w-4 inline" />;
    }

    function setSort(e: SortByEnum) {
        if (e === sortBy.sortBy) setSortBy({ ...sortBy, descending: !sortBy.descending });
        else setSortBy({ sortBy: e, descending: false });
    }
    function renderRow(e: ProfileDto) {
        return (
            <tr key={e.id}>
                <td>
                    <span style={{ paddingRight: 20 }}>{e.name}</span>
                    <div className="actions">
                        <Link to="/profiles/$profileId" params={{ profileId: String(e.id) }}>
                            <BsPencilFill style={{ cursor: "pointer" }}></BsPencilFill>
                        </Link>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <BsTrashFill className="danger" style={{ cursor: "pointer" }} />
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this profile?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>No</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            profileApi
                                                .delete(e.id)
                                                .then(() => {
                                                    dispatch(recieveDeleteProfileAction(e.id));
                                                })
                                                .catch(result => console.error(result));
                                        }}
                                    >
                                        Yes
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </td>
                <td style={{ textAlign: "center" }}>{e.enabled ? "Enabled" : "Disabled"}</td>
                <td></td>
                <td></td>
            </tr>
        );
    }

    return (
        <>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New Profile</DialogTitle>
                    </DialogHeader>
                    <CreateProfile onCancel={() => setShowAddModal(false)} onSubmit={onModalSubmit} />
                </DialogContent>
            </Dialog>
            <div className="view-header" style={{ gap: 20, display: "flex" }}>
                <Input placeholder="Search" style={{ width: 200 }} value={filter_LowerCased} onChange={e => setFilter_LowerCased(e.target.value.toLowerCase())} />
                <Button onClick={() => setShowAddModal(true)}>New Profile</Button>
            </div>
            <Table>
                <thead>
                    <tr>
                        <th className={`sort ${sortBy.sortBy === SortByEnum.Name && "active"}`} style={{ minWidth: 100, width: 400 }} onClick={() => setSort(SortByEnum.Name)}>
                            Name {sortBy.sortBy === SortByEnum.Name && sortDirectionRender()}
                        </th>
                        <th style={{ width: 100 }}>Status</th>
                        <th style={{ width: 400 }}>Summary</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>{view.map(e => renderRow(e))}</tbody>
            </Table>
        </>
    );
};
