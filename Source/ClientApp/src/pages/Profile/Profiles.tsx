import { Button, Input, Popconfirm, Table } from "antd";
import Modal from "antd/lib/modal/Modal";
import { ColumnsType } from "antd/lib/table";
import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CreateProfile } from "./AddProfile";
import { fetchProfilesAction, recieveDeleteProfileAction } from "../../Redux/actions/profileActions";
import { State, ProfileState } from "../../Redux/States";

export const Profiles: React.FunctionComponent = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [data, setData] = React.useState<any>();
    const [filter_LowerCased, setFilter_LowerCased] = React.useState<string>("");
    const [showAddModal, setShowAddModal] = React.useState<boolean>(false);
    const profileState = useSelector<State, ProfileState>(state => state.profileState);
    const dispatch = useDispatch();

    useEffect(() => {
        render();
    }, [profileState, filter_LowerCased]);

    useEffect(() => {
        dispatch(fetchProfilesAction());
    }, []);

    function render() {
        let list = profileState.profiles;
        if (filter_LowerCased.length > 0) list = list.filter(e => e.name.toLowerCase().includes(filter_LowerCased));

        const returnList = list.map(e => {
            return {
                key: e.id,
                name: e.name,
                actions: (
                    <div>
                        <div className="button-row center">
                            <Button>
                                <Link to={`profiles/${e.id}`}>Edit</Link>
                            </Button>
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
                                <Button danger>Delete</Button>
                            </Popconfirm>
                        </div>
                    </div>
                )
            };
        });
        setData(returnList);
    }

    function onModalSubmit() {
        setShowAddModal(false);
    }

    return (
        <div style={{ height: "100%", width: "100vw" }}>
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
            <div className="table-container">
                <Table columns={columns} showHeader dataSource={data} scroll={{ y: "calc(100vh - 200px)" }} sticky pagination={false} bordered />
            </div>
        </div>
    );
};

const columns: ColumnsType<never> = [
    {
        title: "Name",
        dataIndex: "name",
        width: 250
    },
    {
        title: "Summary",
        dataIndex: "summary",
        width: 250
    },
    {
        title: "Actions",
        dataIndex: "actions",
        width: 200
    }
];
