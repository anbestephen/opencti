/* eslint-disable no-nested-ternary */
// TODO Remove no-nested-ternary
import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import Slider from '@material-ui/lab/Slider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { ArrowDropDown, ArrowDropUp } from '@material-ui/icons';
import { QueryRenderer, fetchQuery } from '../../../relay/environment';
import EntityStixRelationsLines, { entityStixRelationsLinesQuery } from './EntityStixRelationsLines';
import inject18n from '../../../components/i18n';

const styles = () => ({
  container: {
    position: 'relative',
  },
  filters: {
    position: 'absolute',
    top: -10,
    right: 0,
  },
  linesContainer: {
    marginTop: 20,
    paddingTop: 0,
  },
  item: {
    paddingLeft: 10,
    textTransform: 'uppercase',
    cursor: 'pointer',
  },
  inputLabel: {
    float: 'left',
  },
  sortIcon: {
    float: 'left',
    margin: '-5px 0 0 15px',
  },
});

const inlineStyles = {
  iconSort: {
    position: 'absolute',
    margin: '-3px 0 0 5px',
    padding: 0,
    top: '0px',
  },
  name: {
    float: 'left',
    width: '30%',
    fontSize: 12,
    fontWeight: '700',
  },
  type: {
    float: 'left',
    width: '20%',
    fontSize: 12,
    fontWeight: '700',
  },
  first_seen: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  last_seen: {
    float: 'left',
    width: '15%',
    fontSize: 12,
    fontWeight: '700',
  },
  weight: {
    float: 'left',
    fontSize: 12,
    fontWeight: '700',
  },
};

const firstStixRelationQuery = graphql`
    query EntityStixRelationfirstStixRelationQuery($first: Int, $orderBy: String, $orderMode: String) {
        stixRelations(first: $first, orderBy: $orderBy, orderMode: $orderMode) {
            edges {
                node {
                    id
                }
            }
        }
    }
`;

class EntityStixRelations extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: 'first_seen',
      orderAsc: false,
      firstSeenStart: null,
      firstSeenStop: null,
      weight: null,
    };
  }

  componentDidMount() {
    fetchQuery(firstStixRelationQuery, { first: 1, orderBy: 'first_seen', orderMode: 'asc' })
      .then((data) => {
        console.log(data);
      });
  }

  reverseBy(field) {
    this.setState({ sortBy: field, orderAsc: !this.state.orderAsc });
  }

  SortHeader(field, label, isSortable) {
    const { t } = this.props;
    if (isSortable) {
      return (
        <div style={inlineStyles[field]} onClick={this.reverseBy.bind(this, field)}>
          <span>{t(label)}</span>
          {this.state.sortBy === field ? this.state.orderAsc ? <ArrowDropDown style={inlineStyles.iconSort}/> : <ArrowDropUp style={inlineStyles.iconSort}/> : ''}
        </div>
      );
    }
    return (
        <div style={inlineStyles[field]}>
          <span>{t(label)}</span>
        </div>
    );
  }

  render() {
    const {
      classes, entityId, relationType, entityLink, targetEntityType,
    } = this.props;
    const paginationOptions = {
      toType: targetEntityType || '',
      fromId: entityId,
      relationType,
      firstSeenStart: this.state.firstSeenStart || '',
      firstSeenStop: this.state.firstSeenStop || '',
      weight: this.state.weight || '',
      orderBy: this.state.sortBy,
      orderMode: this.state.orderAsc ? 'asc' : 'desc',
    };
    return (
      <div className={classes.container}>
        <div className={classes.filters}>
          <Slider
            classes={{ container: classes.slider }}
            value={value}
            min={0}
            max={6}
            step={1}
            onChange={this.handleChange}
          />
        </div>
        <List classes={{ root: classes.linesContainer }}>
          <ListItem classes={{ default: classes.item }} divider={false} style={{ paddingTop: 0 }}>
            <ListItemIcon>
              <span style={{ padding: '0 8px 0 8px', fontWeight: 700, fontSize: 12 }}>#</span>
            </ListItemIcon>
            <ListItemText primary={
              <div>
                {this.SortHeader('name', 'Name', false)}
                {this.SortHeader('type', 'Entity type', false)}
                {this.SortHeader('first_seen', 'First obs.', true)}
                {this.SortHeader('last_seen', 'Last obs.', true)}
                {this.SortHeader('weight', 'Confidence level', true)}
              </div>
            }/>
            <ListItemSecondaryAction>
              &nbsp;
            </ListItemSecondaryAction>
          </ListItem>
          <QueryRenderer
            query={entityStixRelationsLinesQuery}
            variables={{ count: 25, ...paginationOptions }}
            render={({ props }) => {
              if (props) { // Done
                return <EntityStixRelationsLines data={props} paginationOptions={paginationOptions} entityLink={entityLink}/>;
              }
              // Loading
              return <EntityStixRelationsLines data={null} dummy={true}/>;
            }}
          />
        </List>
      </div>
    );
  }
}

EntityStixRelations.propTypes = {
  entityId: PropTypes.string,
  targetEntityType: PropTypes.string,
  entityLink: PropTypes.string,
  relationType: PropTypes.string,
  classes: PropTypes.object,
  reportClass: PropTypes.string,
  t: PropTypes.func,
  history: PropTypes.object,
};

export default compose(
  inject18n,
  withStyles(styles),
)(EntityStixRelations);