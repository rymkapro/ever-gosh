import React from "react";
import { DiffEditor } from "@monaco-editor/react";


type TBlobDiffPreviewProps = {
    originalLanguage?: string;
    original?: string;
    modifiedLanguage?: string;
    modified?: string;
    className?: string;
}

const BlobDiffPreview = (props: TBlobDiffPreviewProps) => {
    const { original, modified, originalLanguage, modifiedLanguage, className } = props;

    return (
        <DiffEditor
            wrapperProps={{
                className
            }}
            original={original}
            originalLanguage={originalLanguage}
            modified={modified}
            modifiedLanguage={modifiedLanguage}
            options={{
                enableSplitViewResizing: false,
                renderSideBySide: false,
                readOnly: true,
                renderLineHighlight: 'none',
                contextmenu: false,
                automaticLayout: true,
                renderOverviewRuler: false,
                scrollBeyondLastLine: false,
                scrollbar: {
                    vertical: 'hidden',
                    verticalScrollbarSize: 0,
                    handleMouseWheel: false
                },
            }}
            onMount={(editor) => {
                editor.onDidUpdateDiff(() => {
                    // Set diff editor dom element calculated real height
                    const changes = editor.getLineChanges();
                    let height = editor.getOriginalEditor().getContentHeight();
                    if (changes.length) height += editor.getModifiedEditor().getContentHeight();
                    editor._domElement.style.height = `${height}px`;
                });
            }}
        />
    );
}

export default BlobDiffPreview;
