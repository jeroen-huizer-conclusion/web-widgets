import Quill, { Range } from "quill";
import { Dispatch, MutableRefObject, SetStateAction, useState } from "react";
import {
    imageConfigType,
    viewCodeConfigType,
    type linkConfigType,
    type videoConfigType,
    type videoEmbedConfigType
} from "../../utils/formats";
import { type ChildDialogProps } from "../ModalDialog/Dialog";
import { type VideoFormType } from "../ModalDialog/VideoDialog";
import { Delta } from "quill/core";
import { IMG_MIME_TYPES } from "./constants";
import Emitter from "quill/core/emitter";

type ModalReturnType = {
    showDialog: boolean;
    setShowDialog: Dispatch<SetStateAction<boolean>>;
    dialogConfig: ChildDialogProps;
    customLinkHandler(value: any): void;
    customVideoHandler(value: any): void;
    customViewCodeHandler(value: any): void;
    customImageUploadHandler(value: any): void;
};

export function useEmbedModal(ref: MutableRefObject<Quill | null>): ModalReturnType {
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [dialogConfig, setDialogConfig] = useState<ChildDialogProps>({});
    const openDialog = (): void => {
        setShowDialog(true);
    };
    const closeDialog = (): void => {
        setShowDialog(false);
        setTimeout(() => ref.current?.focus(), 50);
    };
    const customLinkHandler = (value: any): void => {
        const selection = ref.current?.getSelection();
        const text = selection ? ref.current?.getText(selection.index, selection.length) : "";
        if (value) {
            setDialogConfig({
                dialogType: "link",
                config: {
                    onSubmit: (value: linkConfigType) => {
                        const index = selection?.index ?? 0;
                        const length = selection?.length ?? 0;
                        const textToDisplay = value.text ?? value.href;
                        const linkDelta = new Delta().retain(index).insert(textToDisplay).delete(length);
                        ref.current?.updateContents(linkDelta);
                        ref.current?.setSelection(index, textToDisplay.length);
                        ref.current?.format("link", value);
                        closeDialog();
                    },
                    onClose: closeDialog,
                    defaultValue: { ...value, text }
                }
            });
            openDialog();
        } else {
            ref.current?.format("link", false);
            closeDialog();
        }
    };

    const customVideoHandler = (value: any): void => {
        const selection = ref.current?.getSelection();
        if (value === true || value.type === "video") {
            setDialogConfig({
                dialogType: "video",
                config: {
                    onSubmit: (submittedValue: VideoFormType) => {
                        if (
                            Object.hasOwn(submittedValue, "src") &&
                            (submittedValue as videoConfigType).src !== undefined
                        ) {
                            const currentValue = submittedValue as videoConfigType;
                            if (value.type === "video") {
                                const index = selection?.index ?? 0;
                                const length = selection?.length ?? 1;
                                const videoConfig = {
                                    width: currentValue.width,
                                    height: currentValue.height
                                };
                                // update existing video value
                                const delta = new Delta().retain(index).retain(length, videoConfig);
                                ref.current?.updateContents(delta, Emitter.sources.USER);
                            } else {
                                // insert new video
                                const delta = new Delta()
                                    .retain(selection?.index ?? 0)
                                    .delete(selection?.length ?? 0)
                                    .insert(
                                        { video: currentValue },
                                        { width: currentValue.width, height: currentValue.height }
                                    );
                                ref.current?.updateContents(delta, Emitter.sources.USER);
                            }
                        } else {
                            const currentValue = submittedValue as videoEmbedConfigType;
                            const res = ref.current?.clipboard.convert({
                                html: currentValue.embedcode
                            });
                            if (res) {
                                // insert video via embed code;
                                const delta = new Delta()
                                    .retain(selection?.index ?? 0)
                                    .delete(selection?.length ?? 0)
                                    .concat(res);
                                ref.current?.updateContents(delta, Emitter.sources.USER);
                            }
                        }

                        closeDialog();
                    },
                    onClose: closeDialog,
                    selection: ref.current?.getSelection(),
                    defaultValue: { ...value }
                }
            });
            openDialog();
        } else {
            ref.current?.format("link", false);
            closeDialog();
        }
    };

    const customViewCodeHandler = (value: any): void => {
        if (value === true) {
            setDialogConfig({
                dialogType: "view-code",
                config: {
                    currentCode: ref.current?.getSemanticHTML(),
                    onSubmit: (value: viewCodeConfigType) => {
                        const newDelta = ref.current?.clipboard.convert({ html: value.src });
                        if (newDelta) {
                            ref.current?.setContents(newDelta, Emitter.sources.USER);
                        }
                        closeDialog();
                    },
                    onClose: closeDialog
                }
            });
            openDialog();
        } else {
            ref.current?.format("link", false);
            closeDialog();
        }
    };

    const customImageUploadHandler = (value: any): void => {
        const selection = ref.current?.getSelection(true);
        setDialogConfig({
            dialogType: "image",
            config: {
                onSubmit: (value: imageConfigType) => {
                    const defaultImageConfig = {
                        alt: value.alt,
                        width: value.width,
                        height: value.keepAspectRatio ? undefined : value.height
                    };

                    if (value.src) {
                        const index = selection?.index ?? 0;
                        const length = 1;
                        const imageConfig = defaultImageConfig;
                        // update existing image attribute
                        const imageUpdateDelta = new Delta().retain(index).retain(length, imageConfig);
                        ref.current?.updateContents(imageUpdateDelta, Emitter.sources.USER);
                    } else {
                        // upload new image
                        if (selection) {
                            if (value.files) {
                                uploadImage(ref, selection, value);
                            } else if (value.entityGuid) {
                                const imageConfig = {
                                    ...defaultImageConfig,
                                    "data-src": value.entityGuid
                                };
                                const delta = new Delta()
                                    .retain(selection.index)
                                    .delete(selection.length)
                                    .insert({ image: value.entityGuid }, imageConfig);
                                ref.current?.updateContents(delta, Emitter.sources.USER);
                            }
                        }
                    }
                    closeDialog();
                },
                onClose: closeDialog,
                defaultValue: { ...value }
            }
        });
        openDialog();
    };

    return {
        showDialog,
        setShowDialog,
        dialogConfig,
        customLinkHandler,
        customVideoHandler,
        customViewCodeHandler,
        customImageUploadHandler
    };
}

function uploadImage(ref: MutableRefObject<Quill | null>, range: Range, options: imageConfigType): void {
    const uploads: File[] = [];
    const { files } = options;
    if (files) {
        Array.from(files).forEach(file => {
            if (file && IMG_MIME_TYPES.includes(file.type)) {
                uploads.push(file);
            }
        });
        if (uploads.length > 0) {
            if (!ref.current?.scroll.query("image")) {
                return;
            }
            const promises = uploads.map<Promise<string>>(file => {
                return new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        resolve(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                });
            });
            Promise.all(promises).then(images => {
                const update = images.reduce((delta: Delta, image) => {
                    return delta.insert(
                        { image },
                        {
                            alt: options.alt,
                            width: options.width,
                            height: options.height
                        }
                    );
                }, new Delta().retain(range.index).delete(range.length)) as Delta;
                ref.current?.updateContents(update, Emitter.sources.USER);
                ref.current?.setSelection(range.index + images.length, Emitter.sources.SILENT);
            });
        }
    }
}
