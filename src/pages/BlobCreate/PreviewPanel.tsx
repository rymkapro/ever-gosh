import React from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";


type TPreviewPanelProps = {
    language?: string;
    value?: string;
}

const PreviewPanel = (props: TPreviewPanelProps) => {
    const { language, value } = props;

    if (language === 'markdown') return (
        <div className="markdown-body px-4 py-4">
            <ReactMarkdown>{value || ''}</ReactMarkdown>
        </div>
    );
    return (
        <Editor
            wrapperProps={{
                className: 'py-3'
            }}
            language={language}
            value={value}
            options={{
                readOnly: true,
                renderLineHighlight: 'none',
                contextmenu: false,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                minimap: {
                    enabled: false
                },
                scrollbar: {
                    vertical: 'hidden',
                    verticalScrollbarSize: 0,
                    handleMouseWheel: false
                },
            }}
            onMount={(editor) => {
                // Set diff editor dom element calculated real height
                editor._domElement.style.height = `${editor.getContentHeight()}px`;
            }}
        />
    );
}

export default PreviewPanel;
