import { Button, Input, Popconfirm } from "antd";
import Modal from "antd/lib/modal/Modal";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreateProfile } from "./AddProfile";
import { fetchProfilesAction, recieveDeleteProfileAction } from "../../Redux/actions/profileActions";
import { VitalState, ProfileState } from "../../Redux/States";
import { Table } from "../../components/Table";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
import axios from "axios";
import { BsPencilFill, BsTrashFill } from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";
import { ProfileDto } from "@vital/vitalservice";

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
    const location = useLocation();
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
        return sortBy.descending ? <CaretDownOutlined /> : <CaretUpOutlined />;
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
                        <Link to={`profiles/${e.id}`}>
                            <BsPencilFill style={{ cursor: "pointer" }}></BsPencilFill>
                        </Link>
                        <Popconfirm
                            title="Are you sure you want to delete this profile?"
                            onConfirm={() => {
                                axios
                                    .delete(`api/profile/${e.id}`)
                                    .then(response => {
                                        if (response.status === 200) dispatch(recieveDeleteProfileAction(e.id));
                                    })
                                    .catch(result => console.error(result));
                            }}
                            okText="Yes"
                            cancelText="No"
                        >
                            <BsTrashFill className="danger" style={{ cursor: "pointer" }} />
                        </Popconfirm>
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
            {showAddModal && (
                <Modal width={600} visible={true} title="Add New Process" closable onCancel={() => setShowAddModal(false)} maskClosable={false} afterClose={onModalSubmit} footer={null}>
                    <CreateProfile onCancel={() => setShowAddModal(false)} onSubmit={onModalSubmit} />
                </Modal>
            )}
            <div className="view-header" style={{ gap: 20, display: "flex" }}>
                <Input placeholder="Search" style={{ width: 200 }} value={filter_LowerCased} onChange={e => setFilter_LowerCased(e.target.value.toLowerCase())} />
                <Button type="primary" onClick={() => setShowAddModal(true)}>
                    New Profile
                </Button>
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
