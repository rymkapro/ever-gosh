import React from "react";
import Editor from "@monaco-editor/react";


type TEditorPanelProps = {
    language?: string;
    value?: string;
    onChange?(value: string | undefined): void;
}

const EditorPanel = (props: TEditorPanelProps) => {
    const { onChange, ...rest } = props;

    return (
        <Editor
            className="min-h-[500px]"
            wrapperProps={{
                className: 'py-3'
            }}
            onChange={onChange}
            {...rest}
        />
    );
}

export default EditorPanel;
