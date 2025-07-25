import { Pagination } from "@mendix/widget-plugin-grid/components/Pagination";
import { KeyNavProvider } from "@mendix/widget-plugin-grid/keyboard-navigation/context";
import { FocusTargetController } from "@mendix/widget-plugin-grid/keyboard-navigation/FocusTargetController";
import { PositionInGrid, SelectActionHandler } from "@mendix/widget-plugin-grid/selection";
import { ObjectItem } from "mendix";
import { createElement, ReactElement, ReactNode } from "react";
import { GalleryItemHelper } from "../typings/GalleryItem";
import { GalleryContent } from "./GalleryContent";
import { GalleryFooter } from "./GalleryFooter";
import { GalleryHeader } from "./GalleryHeader";
import { GalleryRoot } from "./GalleryRoot";
import { GalleryTopBar } from "./GalleryTopBar";
import { ListBox } from "./ListBox";
import { ListItem } from "./ListItem";

import { PaginationEnum, ShowPagingButtonsEnum } from "typings/GalleryProps";
import { LoadMore, LoadMoreButton as LoadMorePreview } from "../components/LoadMore";
import { ItemEventsController } from "../typings/ItemEventsController";

export interface GalleryProps<T extends ObjectItem> {
    className?: string;
    desktopItems: number;
    emptyPlaceholderRenderer?: (renderWrapper: (children: ReactNode) => ReactElement) => ReactElement;
    emptyMessageTitle?: string;
    header?: ReactNode;
    headerTitle?: string;
    showHeader: boolean;
    hasMoreItems: boolean;
    items: T[];
    numberOfItems?: number;
    paging: boolean;
    page: number;
    pageSize: number;
    paginationPosition?: "top" | "bottom" | "both";
    paginationType: PaginationEnum;
    showPagingButtons: ShowPagingButtonsEnum;
    showEmptyStatePreview?: boolean;
    phoneItems: number;
    setPage?: (computePage: (prevPage: number) => number) => void;
    style?: React.CSSProperties;
    tabletItems: number;
    tabIndex?: number;
    ariaLabelListBox?: string;
    ariaLabelItem?: (item: T) => string | undefined;
    preview?: boolean;

    // Helpers
    focusController: FocusTargetController;
    itemEventsController: ItemEventsController;
    itemHelper: GalleryItemHelper;
    selectHelper: SelectActionHandler;
    getPosition: (index: number) => PositionInGrid;
    loadMoreButtonCaption?: string;
}

export function Gallery<T extends ObjectItem>(props: GalleryProps<T>): ReactElement {
    const { loadMoreButtonCaption = "Load more" } = props;
    const pagination = props.paging ? (
        <div className="widget-gallery-pagination">
            <Pagination
                canNextPage={props.hasMoreItems}
                canPreviousPage={props.page !== 0}
                gotoPage={(page: number) => props.setPage && props.setPage(() => page)}
                nextPage={() => props.setPage && props.setPage(prev => prev + 1)}
                numberOfItems={props.numberOfItems}
                page={props.page}
                pageSize={props.pageSize}
                previousPage={() => props.setPage && props.setPage(prev => prev - 1)}
                pagination={props.paginationType}
                showPagingButtons={props.showPagingButtons}
            />
        </div>
    ) : null;

    const showTopPagination =
        props.paging && (props.paginationPosition === "top" || props.paginationPosition === "both");
    const showBottomPagination =
        props.paging && (props.paginationPosition === "bottom" || props.paginationPosition === "both");

    return (
        <GalleryRoot
            className={props.className}
            style={props.style}
            selectable={false}
            data-focusindex={props.tabIndex || 0}
        >
            <GalleryTopBar>{showTopPagination && pagination}</GalleryTopBar>
            {props.showHeader && <GalleryHeader aria-label={props.headerTitle}>{props.header}</GalleryHeader>}
            <GalleryContent
                hasMoreItems={props.hasMoreItems}
                setPage={props.setPage}
                isInfinite={props.paginationType === "virtualScrolling"}
            >
                {props.items.length > 0 && (
                    <ListBox
                        lg={props.desktopItems}
                        md={props.tabletItems}
                        sm={props.phoneItems}
                        selectionType={props.selectHelper.selectionType}
                        aria-label={props.ariaLabelListBox}
                    >
                        <KeyNavProvider focusController={props.focusController}>
                            {props.items.map((item, index) => (
                                <ListItem
                                    preview={props.preview}
                                    key={`item_${item.id}`}
                                    helper={props.itemHelper}
                                    item={item}
                                    selectHelper={props.selectHelper}
                                    eventsController={props.itemEventsController}
                                    getPosition={props.getPosition}
                                    itemIndex={index}
                                    label={props.ariaLabelItem?.(item)}
                                />
                            ))}
                        </KeyNavProvider>
                    </ListBox>
                )}
            </GalleryContent>
            {(props.items.length === 0 || props.showEmptyStatePreview) &&
                props.emptyPlaceholderRenderer &&
                props.emptyPlaceholderRenderer(children => (
                    <section className="widget-gallery-empty" aria-label={props.emptyMessageTitle}>
                        <div className="empty-placeholder">{children}</div>
                    </section>
                ))}
            <GalleryFooter>
                {showBottomPagination && pagination}
                <div className="widget-gallery-load-more">
                    {props.preview && props.paginationType === "loadMore" && (
                        <LoadMorePreview>{loadMoreButtonCaption}</LoadMorePreview>
                    )}
                    {!props.preview && <LoadMore>{loadMoreButtonCaption}</LoadMore>}
                </div>
            </GalleryFooter>
        </GalleryRoot>
    );
}
