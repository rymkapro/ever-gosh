import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { IGoshSmvProposal, IGoshWallet } from "../../types/types";


type TVotingDialogProps = {
    goshWallet: IGoshWallet;
    goshProposal?: IGoshSmvProposal;
    isOpen: boolean;
    setIsOpen(isOpen: boolean): void;
}

const VotingDialog = (props: TVotingDialogProps) => {
    const { isOpen, setIsOpen } = props;

    useEffect(() => {
        console.log('Dialog effect', isOpen)
    }, [isOpen]);

    return (
        <Dialog
            className="fixed z-10 inset-0 overflow-y-auto"
            open={isOpen}
            onClose={() => setIsOpen(false)}
        >
            <div className="flex items-center justify-center min-h-screen">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded max-w-sm mx-auto">
                    <Dialog.Title>Deactivate account</Dialog.Title>
                    <Dialog.Description>
                        This will permanently deactivate your account
                    </Dialog.Description>

                    <p>
                        Are you sure you want to deactivate your account? All of your data will
                        be permanently removed. This action cannot be undone.
                    </p>

                    <button onClick={() => setIsOpen(false)}>Deactivate</button>
                    <button onClick={() => {
                        console.log('Modal set is open')
                        setIsOpen(false)
                    }}>Cancel</button>
                </div>
            </div>
        </Dialog>
    );
}

export default VotingDialog;
