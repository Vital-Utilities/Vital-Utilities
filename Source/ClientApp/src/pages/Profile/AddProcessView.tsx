import { Form, Input, Button } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import type { VitalState } from "../../Redux/States";
import { AffinityEditor } from "../../components/Affinity/AffinityEditor";
import { ProcessPriority } from "./ProcessPriority";
import {
	type AddProccessRequest,
	ProcessPriorityEnum,
} from "@vital/vitalservice";
import { profileApi } from "../../Redux/actions/api";

interface AddProcessViewProps {
	name: string;
	executionPath: string;
	assignedAffinity?: number[];
	profileId: number;
	onSuccess: () => void;
	onBack: () => void;
}

export const AddProcessView: React.FunctionComponent<AddProcessViewProps> = (
	props,
) => {
	const totalThreads = useSelector<VitalState, number | undefined>(
		(state) => state.machineState.static?.cpu.threadCount,
	);
	const [addProcessRequest, setAddProcessRequest] =
		React.useState<AddProccessRequest>({
			processName: props.name,
			executionPath: props.executionPath,
			alias: "",
			processPriority: ProcessPriorityEnum.DontOverride,
			affinity: generateDefaultAffinity(),
			profileId: props.profileId,
		});

	function generateDefaultAffinity() {
		if (!totalThreads) throw "totalThreads should not be undefined";
		let array: number[] = [];
		if (!props.assignedAffinity) {
			for (let index = 0; index < totalThreads; index++) {
				array.push(index);
			}
		} else {
			array = { ...props.assignedAffinity };
		}
		return array;
	}

	async function SendRequest() {
		profileApi
			.apiProfileAddProcessConfigPut(addProcessRequest)
			.then((result) => {
				if (result.status === 200) props.onSuccess();
			});
	}

	return (
		<div style={{ height: "100%" }}>
			<Form
				labelCol={{ span: 4 }}
				wrapperCol={{ span: 14 }}
				layout="horizontal"
			>
				<Form.Item label="Process Name">{props.name}</Form.Item>
				<Form.Item label="Alias">
					<Input
						value={addProcessRequest.alias}
						onChange={(e) =>
							setAddProcessRequest({
								...addProcessRequest,
								alias: e.target.value,
							})
						}
						placeholder="Give this an alias if the name is not friendly"
					/>
				</Form.Item>
				<ProcessPriority
					value={addProcessRequest.processPriority}
					onChange={(e) =>
						setAddProcessRequest({ ...addProcessRequest, processPriority: e })
					}
				/>
				<Form.Item label="Affinity">
					<AffinityEditor
						affinity={addProcessRequest.affinity}
						onChange={(e) =>
							setAddProcessRequest({ ...addProcessRequest, affinity: e })
						}
					/>
				</Form.Item>
				<div className="ant-modal-footer">
					<Button onClick={props.onBack}>Back</Button>
					<Button type="primary" onClick={SendRequest}>
						Add process to managed
					</Button>
				</div>
			</Form>
		</div>
	);
};
