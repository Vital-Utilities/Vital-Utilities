import React, { PropsWithChildren } from "react";
import "./Table.scss";

export const Table: React.FunctionComponent<PropsWithChildren> = props => {
    return (
        <div className="custom-table">
            <table id="table">{props.children}</table>
        </div>
    );
};
