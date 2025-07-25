import { Alert } from "@mendix/widget-plugin-component-kit/Alert";
import { ErrorBoundary } from "@mendix/widget-plugin-component-kit/ErrorBoundary";
import { observer } from "mobx-react-lite";
import { createElement, FC } from "react";
import { SortAPI, useLockSortAPI, useSortAPI } from "../context";

export function withSortAPI<P extends object>(Component: FC<P & { sortAPI: SortAPI }>): FC<P> {
    const SortAPIGuard = observer(function SortAPIGuard(props: P & { sortAPI: SortAPI }): React.ReactElement {
        const sortAPI = useLockSortAPI(props.sortAPI);

        if (sortAPI.hasError) {
            return <Alert bootstrapStyle="danger">{sortAPI.error.message}</Alert>;
        }

        return <Component {...props} sortAPI={sortAPI.value} />;
    });

    function SortAPIInjector(props: P): React.ReactElement {
        const sortAPI = useSortAPI();

        if (sortAPI.hasError) {
            return <Alert bootstrapStyle="danger">{sortAPI.error.message}</Alert>;
        }

        return <SortAPIGuard {...props} sortAPI={sortAPI.value} />;
    }

    return function (props): React.ReactElement {
        return (
            <ErrorBoundary>
                <SortAPIInjector {...props} />
            </ErrorBoundary>
        );
    };
}
