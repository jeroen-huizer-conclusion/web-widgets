import { useOnResetValueEvent, useOnSetValueEvent } from "@mendix/widget-plugin-external-events/hooks";
import { NumberFilterController } from "@mendix/widget-plugin-filtering/controllers/input/NumberInputController";
import { FilterFnList, InputWithFilters } from "@mendix/widget-plugin-filtering/controls";
import { useBasicSync } from "@mendix/widget-plugin-filtering/helpers/useBasicSync";
import { Number_InputFilterInterface } from "@mendix/widget-plugin-filtering/typings/InputFilterInterface";
import { useSetup } from "@mendix/widget-plugin-mobx-kit/react/useSetup";
import { generateUUID } from "@mendix/widget-plugin-platform/framework/generate-uuid";
import { observer } from "mobx-react-lite";
import { createElement, useRef } from "react";
import { DatagridNumberFilterContainerProps, DefaultFilterEnum } from "../../typings/DatagridNumberFilterProps";

const filterDefs: Record<DefaultFilterEnum, string> = {
    greater: "Greater than",
    greaterEqual: "Greater than or equal",
    equal: "Equal",
    notEqual: "Not equal",
    smaller: "Smaller than",
    smallerEqual: "Smaller than or equal",
    empty: "Empty",
    notEmpty: "Not empty"
};

const filters: FilterFnList<DefaultFilterEnum> = Object.entries(filterDefs).map(
    ([value, label]: [DefaultFilterEnum, string]) => ({
        value,
        label
    })
);

export interface ContainerProps extends DatagridNumberFilterContainerProps {
    filterStore: Number_InputFilterInterface;
    parentChannelName?: string;
}

function Container(props: ContainerProps): React.ReactElement {
    const id = (useRef<string>().current ??= `NumberFilter${generateUUID()}`);

    const controller = useSetup(
        () =>
            new NumberFilterController({
                filter: props.filterStore,
                changeDelay: props.delay,
                defaultFilter: props.defaultFilter,
                adjustableFilterFunction: props.adjustable,
                defaultValue: props.defaultValue?.value,
                disableInputs: fn => fn === "empty" || fn === "notEmpty"
            })
    );

    useBasicSync(props, props.filterStore);

    useOnResetValueEvent({
        widgetName: props.name,
        parentChannelName: props.parentChannelName,
        listener: controller.handleResetValue
    });

    useOnSetValueEvent({ widgetName: props.name, listener: controller.handleSetValue });

    return (
        <InputWithFilters
            adjustable={props.adjustable}
            className={props.class}
            disableInputs={controller.disableInputs}
            filterFn={controller.selectedFn}
            filterFnList={filters}
            id={id}
            inputRef={controller.inputRef}
            inputStores={controller.inputs}
            name={props.name}
            onFilterChange={controller.handleFilterFnChange}
            placeholder={props.placeholder?.value}
            screenReaderButtonCaption={props.screenReaderButtonCaption?.value}
            screenReaderInputCaption={props.screenReaderInputCaption?.value}
            styles={props.style}
            tabIndex={props.tabIndex}
        />
    );
}

export const NumberFilterContainer = observer(Container);
