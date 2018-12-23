import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { commitMutation, QueryRenderer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import { Formik, Field, Form } from 'formik';
import {
  compose, find, insert, pick, propEq,
} from 'ramda';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import * as Yup from 'yup';
import * as rxjs from 'rxjs/index';
import { debounceTime } from 'rxjs/operators/index';
import { SubscriptionFocus } from '../../components/Subscription';
import environment from '../../relay/environment';
import inject18n from '../../components/i18n';
import TextField from '../../components/TextField';
import Select from '../../components/Select';
import Switch from '../../components/Switch';

const styles = theme => ({
  paper: {
    width: '100%',
    height: '100%',
    padding: '20px 20px 30px 20px',
    textAlign: 'left',
    backgroundColor: theme.palette.paper.background,
    color: theme.palette.text.main,
    borderRadius: 6,
  },
  button: {
    float: 'right',
    margin: '20px 0 0 0',
  },
});

const settingsQuery = graphql`
    query SettingsQuery {
        settings {
            id,
            platform_title
            platform_email
            platform_url
            platform_language
            platform_external_auth
            platform_registration
            editContext {
                username,
                focusOn
            }
        }
        me {
            email
        }
    }
`;

const settingsMutationFieldPatch = graphql`
    mutation SettingsFieldPatchMutation($id: ID!, $input: EditInput!) {
        settingsEdit(id: $id) {
            fieldPatch(input: $input) {
                id,
                platform_title
                platform_email
                platform_url
                platform_language
                platform_external_auth
                platform_registration
            }
        }
    }
`;

const settingsFocus = graphql`
    mutation SettingsFocusMutation($id: ID!, $input: EditContext!) {
        settingsEdit(id: $id) {
            contextPatch(input : $input) {
                id,
                platform_title
                platform_email
                platform_url
                platform_language
                platform_external_auth
                platform_registration
            }
        }
    }
`;


const settingsValidation = t => Yup.object().shape({
  platform_title: Yup.string()
    .required(t('This field is required')),
  platform_email: Yup.string()
    .required(t('This field is required'))
    .email(t('The value must be an email address')),
  platform_url: Yup.string()
    .required(t('This field is required'))
    .url(t('The value must be an URL')),
});

// We wait 0.5 sec of interruption before saving.
const onFormChange$ = new rxjs.Subject().pipe(
  debounceTime(500),
);

class Settings extends Component {
  componentDidMount() {
    this.subscription = onFormChange$.subscribe(
      (data) => {
        commitMutation(environment, {
          mutation: settingsMutationFieldPatch,
          variables: {
            id: data.id,
            input: data.input,
          },
        });
      },
    );
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  handleChangeField(id, name, value) {
    // Validate the field first, if field is valid, debounce then save.
    settingsValidation(this.props.t).validateAt(name, { [name]: value }).then(() => {
      onFormChange$.next({ id, input: { key: name, value } });
    });
  }

  handleChangeFocus(id, name) {
    commitMutation(environment, {
      mutation: settingsFocus,
      variables: {
        id,
        input: {
          focusOn: name,
        },
      },
    });
  }

  render() {
    const { t, classes } = this.props;
    return (
      <QueryRenderer
        environment={environment}
        query={settingsQuery}
        render={({ props }) => {
          if (props && props.settings && props.me) {
            const { settings, me } = props;
            const { id, editContext } = settings;
            // Add current group to the context if is not available yet.
            const missingMe = find(propEq('username', me.email))(editContext) === undefined;
            const editUsers = missingMe ? insert(0, { username: me.email }, editContext) : editContext;
            const initialValues = pick(['platform_title', 'platform_email', 'platform_url', 'platform_language', 'platform_external_auth', 'platform_registration'], settings);
            return (
              <Formik
                enableReinitialize={true}
                initialValues={initialValues}
                validationSchema={settingsValidation(t)}
                render={({ submitForm, isSubmitting }) => (
                  <Form>
                    <Grid container={true} spacing={32}>
                      <Grid item={true} xs={9}>
                        <Paper classes={{ root: classes.paper }} elevation={2}>
                          <Typography variant='h1' gutterBottom={true}>
                            {t('Global')}
                          </Typography>
                          <Field name='platform_title' component={TextField} label={t('Name')} fullWidth={true}
                                 onFocus={this.handleChangeFocus.bind(this, id)}
                                 onChange={this.handleChangeField.bind(this, id)}
                                 helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='platform_title'/>}/>
                          <Field name='platform_email' component={TextField} label={t('Sender email address')}
                                 fullWidth={true} style={{ marginTop: 10 }}
                                 onFocus={this.handleChangeFocus.bind(this, id)}
                                 onChange={this.handleChangeField.bind(this, id)}
                                 helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='platform_email'/>}/>
                          <Field name='platform_url' component={TextField} label={t('Base URL')}
                                 fullWidth={true} style={{ marginTop: 10 }}
                                 onFocus={this.handleChangeFocus.bind(this, id)}
                                 onChange={this.handleChangeField.bind(this, id)}
                                 helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='platform_email'/>}/>
                          <Field
                            name='platform_language'
                            label={t('Language')}
                            component={Select}
                            fullWidth={true}
                            inputProps={{
                              name: 'platform_language',
                              id: 'platform-language',
                            }}
                            containerstyle={{ marginTop: 20, width: '100%' }}
                          >
                            <MenuItem value='auto'><em>{t('Automatic')}</em></MenuItem>
                            <MenuItem value='en'>English</MenuItem>
                            <MenuItem value='fr'>Français</MenuItem>
                          </Field>
                        </Paper>
                      </Grid>
                      <Grid item={true} xs={3}>
                        <Paper classes={{ root: classes.paper }} elevation={2}>
                          <Typography variant='h1' gutterBottom={true}>
                            {t('Options')}
                          </Typography>
                          <Field name='platform_external_auth' component={Switch} label={t('External authentication')}/>
                          <Field name='platform_registration' component={Switch} label={t('Registration')}/>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Button variant='contained' color='primary' onClick={submitForm} disabled={isSubmitting} classes={{ root: classes.button }}>
                      {t('Update')}
                    </Button>
                  </Form>
                )}
              />
            );
          }
          return <div> &nbsp; </div>;
        }}
      />
    );
  }
}

Settings.propTypes = {
  classes: PropTypes.object,
  t: PropTypes.func,
  nsd: PropTypes.func,
  history: PropTypes.object,
};

export default compose(
  inject18n,
  withStyles(styles),
)(Settings);