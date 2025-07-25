import { inputStateFromCond } from "@mendix/filter-commons/condition-utils";
import {
    FilterFunctionBinary,
    FilterFunctionGeneric,
    FilterFunctionNonValue
} from "@mendix/filter-commons/typings/FilterFunctions";
import { FilterData, InputData } from "@mendix/filter-commons/typings/settings";
import { Big } from "big.js";
import { AttributeMetaData, ListAttributeValue, SimpleFormatter } from "mendix";
import { FilterCondition } from "mendix/filters";
import { action, comparer, makeObservable } from "mobx";
import { Number_InputFilterInterface } from "../../typings/InputFilterInterface";
import { NumberArgument } from "./Argument";
import { BaseInputFilterStore } from "./BaseInputFilterStore";
import { baseNames } from "./fn-mappers";

type NumFns = FilterFunctionGeneric | FilterFunctionNonValue | FilterFunctionBinary;
type Formatter = SimpleFormatter<Big>;
type AttrMeta = AttributeMetaData<Big> & { formatter?: SimpleFormatter<Big> };

export class NumberInputFilterStore
    extends BaseInputFilterStore<NumberArgument, NumFns>
    implements Number_InputFilterInterface
{
    readonly storeType = "input";
    readonly type = "number";

    constructor(attributes: AttrMeta[], initCond: FilterCondition | null) {
        const formatter = formatterFix(attributes[0].formatter);
        super(new NumberArgument(formatter), new NumberArgument(formatter), "equal", attributes);
        makeObservable(this, {
            updateProps: action,
            fromJSON: action,
            fromViewState: action
        });
        if (initCond) {
            this.fromViewState(initCond);
        }
    }

    updateProps(attributes: ListAttributeValue[]): void {
        if (!comparer.shallow(this._attributes, attributes)) {
            this._attributes = attributes;
        }
    }

    toJSON(): InputData | undefined {
        if (!this.isInitialized) {
            return undefined;
        }
        return [
            this.filterFunction,
            this.arg1.value ? this.arg1.value.toJSON() : null,
            this.arg2.value ? this.arg2.value.toJSON() : null
        ];
    }

    fromJSON(data: FilterData): void {
        const inputData = this.unpackJsonData(data);
        if (!inputData) {
            return;
        }

        const [fn, val1, val2] = inputData;

        this.setState([fn, asBig(val1), asBig(val2)]);
        this.isInitialized = true;
    }

    fromViewState(cond: FilterCondition): void {
        const initState = inputStateFromCond(
            cond,
            (fn): NumFns => baseNames(fn),
            exp => (exp.valueType === "Numeric" ? exp.value : undefined)
        );

        if (!initState) {
            return;
        }

        this.setState(initState);
        this.isInitialized = true;
    }
}

function formatterFix(formatter: Formatter | undefined): Formatter {
    // Check formatter.parse to see if it is a valid formatter.
    if (formatter && formatter.parse("none")?.valid === false) {
        return formatter;
    }

    // Create a new formatter that will handle the autonumber values.
    return {
        format: (value: Big) => {
            return value ? value.toString() : value;
        },
        parse: (value: string) => {
            try {
                return { valid: true, value: new Big(value) };
            } catch {
                return value === "" ? { valid: true, value: undefined } : { valid: false };
            }
        }
    };
}

function asBig(val: string | null): Big | undefined {
    try {
        return new Big(val ?? "");
    } catch {
        return undefined;
    }
}
