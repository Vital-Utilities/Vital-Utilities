import React from "react";
import "./Table.scss";

export const Table: React.FunctionComponent = props => {
    return (
        <div className="custom-table">
            <table id="table">{props.children}</table>
        </div>
    );
};
