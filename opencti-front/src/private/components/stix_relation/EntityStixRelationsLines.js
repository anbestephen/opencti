/* eslint-disable no-underscore-dangle,no-nested-ternary */
// TODO Remove no-nested-ternary
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { createPaginationContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { pathOr } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import {
  AutoSizer, InfiniteLoader, List, WindowScroller,
} from 'react-virtualized';
import { EntityStixRelationLine, EntityStixRelationLineDummy } from './EntityStixRelationLine';

const styles = () => ({
  windowScrollerWrapper: {
    flex: '1 1 auto',
  },
  item: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  title: {
    float: 'left',
  },
  search: {
    float: 'right',
    marginTop: '-10px',
  },
});

class EntityStixRelationsLines extends Component {
  constructor(props) {
    super(props);
    this._isRowLoaded = this._isRowLoaded.bind(this);
    this._loadMore = this._loadMore.bind(this);
    this._rowRenderer = this._rowRenderer.bind(this);
    this._setRef = this._setRef.bind(this);
    this.state = {
      scrollToIndex: -1,
      showHeaderText: true,
    };
  }

  _setRef(windowScroller) {
    // noinspection JSUnusedGlobalSymbols
    this._windowScroller = windowScroller;
  }

  _loadMore() {
    if (!this.props.relay.hasMore() || this.props.relay.isLoading()) {
      return;
    }

    // Fetch the next 10 feed items
    this.props.relay.loadMore(25, () => {
      // console.log(error);
    });
  }

  _isRowLoaded({ index }) {
    if (this.props.dummy) {
      return true;
    }
    const list = pathOr([], ['stixRelations', 'edges'], this.props.data);
    return !this.props.relay.hasMore() || index < list.length;
  }

  _rowRenderer({ index, key, style }) {
    const { dummy, entityLink } = this.props;
    if (dummy) {
      return <div key={key} style={style}><EntityStixRelationLineDummy/></div>;
    }

    const list = pathOr([], ['stixRelations', 'edges'], this.props.data);
    if (!this._isRowLoaded({ index })) {
      return <div key={key} style={style}><EntityStixRelationLineDummy/></div>;
    }
    const stixRelationNode = list[index];
    if (!stixRelationNode) {
      return <div key={key}>&nbsp;</div>;
    }
    const stixRelation = stixRelationNode.node;
    const stixDomainEntity = stixRelationNode.to;
    return <div key={key} style={style}>
        <EntityStixRelationLine
          key={stixRelation.id}
          stixRelation={stixRelation}
          stixDomainEntity={stixDomainEntity}
          entityLink={entityLink}
          paginationOptions={this.props.paginationOptions}
        />
    </div>;
  }

  render() {
    const { dummy } = this.props;
    const { scrollToIndex } = this.state;
    const list = dummy ? [] : pathOr([], ['stixRelations', 'edges'], this.props.data);
    const rowCount = dummy ? 20 : this.props.relay.isLoading() ? list.length + 25 : list.length;
    return (
      <WindowScroller ref={this._setRef} scrollElement={window}>
        {({
          height, isScrolling, onChildScroll, scrollTop,
        }) => (
          <div className={styles.windowScrollerWrapper}>
            <InfiniteLoader isRowLoaded={this._isRowLoaded}
                            loadMoreRows={this._loadMore} rowCount={Number.MAX_SAFE_INTEGER}>
              {({ onRowsRendered }) => (
                <AutoSizer disableHeight>
                  {({ width }) => (
                    <List
                      ref={(el) => {
                        window.listEl = el;
                      }}
                      autoHeight
                      height={height}
                      onRowsRendered={onRowsRendered}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      overscanRowCount={2}
                      rowCount={rowCount}
                      rowHeight={50}
                      rowRenderer={this._rowRenderer}
                      scrollToIndex={scrollToIndex}
                      scrollTop={scrollTop}
                      width={width}
                    />
                  )}
                </AutoSizer>
              )}
            </InfiniteLoader>
          </div>
        )}
      </WindowScroller>
    );
  }
}

EntityStixRelationsLines.propTypes = {
  classes: PropTypes.object,
  paginationOptions: PropTypes.object,
  entityLink: PropTypes.string,
  data: PropTypes.object,
  relay: PropTypes.object,
  stixRelations: PropTypes.object,
  dummy: PropTypes.bool,
};

export const entityStixRelationsLinesQuery = graphql`
    query EntityStixRelationsLinesPaginationQuery($fromId: String, $toType: String, $relationType: String, $count: Int!, $cursor: ID, $orderBy: StixRelationsOrdering, $orderMode: OrderingMode) {
        ...EntityStixRelationsLines_data @arguments(fromId: $fromId, toType: $toType, relationType: $relationType, count: $count, cursor: $cursor, orderBy: $orderBy, orderMode: $orderMode)
    }
`;

export default withStyles(styles)(createPaginationContainer(
  EntityStixRelationsLines,
  {
    data: graphql`
        fragment EntityStixRelationsLines_data on Query @argumentDefinitions(
            fromId: {type: "String"},
            toType: {type: "String"},
            relationType: {type: "String"},
            count: {type: "Int", defaultValue: 25}
            cursor: {type: "ID"}
            orderBy: {type: "StixRelationsOrdering", defaultValue: ID}
            orderMode: {type: "OrderingMode", defaultValue: "asc"}
        ) {
            stixRelations(fromId: $fromId, toType: $toType relationType: $relationType, first: $count, after: $cursor, orderBy: $orderBy, orderMode: $orderMode) @connection(key: "Pagination_stixRelations") {
                edges {
                    node {
                        ...EntityStixRelationLine_stixRelation
                    }
                    to {
                        ...EntityStixRelationLine_stixDomainEntity
                    }
                }
            }
        }
    `,
  },
  {
    direction: 'forward',
    getConnectionFromProps(props) {
      return props.data && props.data.stixRelations;
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      };
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        fromId: fragmentVariables.fromId,
        toType: fragmentVariables.toType,
        relationType: fragmentVariables.relationType,
        count,
        cursor,
        orderBy: fragmentVariables.orderBy,
        orderMode: fragmentVariables.orderMode,
      };
    },
    query: entityStixRelationsLinesQuery,
  },
));