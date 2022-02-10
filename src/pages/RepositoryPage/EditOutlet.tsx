import React, { useEffect, useState } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { useOutletContext, useParams } from "react-router-dom";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faEye } from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import "github-markdown-css";

import { IRepository, TRepositoryTreeItem } from "../../types";
import RepositoryNav from "../../components/RepositoryNav";


const EditOutlet = () => {
    const { branch = 'master', '*': path = '' } = useParams();
    const { repository } = useOutletContext<{ repository: IRepository }>();
    const [blob, setBlob] = useState<TRepositoryTreeItem>();
    const [changed, setChanged] = useState<string>();

    useEffect(() => {
        repository.getBlob(branch, path).then((response) => {
            setBlob(response);
            setChanged(response?.content);
        });
    }, [path, branch, repository])

    return (
        <div className="pagerepo__edit repoedit">
            <RepositoryNav
                section="blob"
                showBranches={false}
                pathLastItem={(item) => (
                    <input type={'text'} defaultValue={item} className="repoedit__filename" />
                )}
            />

            <Tabs className="repoedit__editor react-tabs">
                <TabList>
                    <Tab>
                        <FontAwesomeIcon icon={faCode} className="--fa-before" />
                        Edit
                    </Tab>
                    <Tab>
                        <FontAwesomeIcon icon={faEye} className="--fa-before" />
                        Preview
                    </Tab>
                </TabList>

                <TabPanel>
                    <Editor
                        className="repoedit__code"
                        height="646px"
                        language={blob?.language}
                        defaultValue={blob?.content}
                        value={changed}
                        options={{
                            padding: {
                                top: 10
                            },
                            wordWrap: 'on'
                        }}
                        onChange={(value) => {
                            setChanged(value);
                        }}
                    />
                </TabPanel>
                <TabPanel>
                    {blob?.language === 'markdown'
                        ? (
                            <ReactMarkdown
                                children={changed ?? ''}
                                className="repoedit__diff markdown-body"
                            />
                        )
                        : (
                            <DiffEditor
                                className="repoedit__diff"
                                original={blob?.content}
                                modified={changed}
                                language={blob?.language}
                                height="646px"
                                options={{
                                    renderSideBySide: false,
                                    readOnly: true,
                                    domReadOnly: true,
                                    renderOverviewRuler: false,
                                    padding: {
                                        top: 10
                                    },
                                    contextmenu: false
                                }}
                            />
                        )
                    }
                </TabPanel>
            </Tabs>
        </div>
    );
}

export default EditOutlet;
