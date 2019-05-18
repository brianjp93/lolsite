'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.styles = undefined;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _utils = require('@material-ui/utils');

var _withStyles = require('../styles/withStyles');

var _withStyles2 = _interopRequireDefault(_withStyles);

var _colorManipulator = require('../styles/colorManipulator');

var _ButtonBase = require('../ButtonBase');

var _ButtonBase2 = _interopRequireDefault(_ButtonBase);

var _helpers = require('../utils/helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } // @inheritedComponent ButtonBase

var styles = exports.styles = function styles(theme) {
  return {
    /* Styles applied to the root element. */
    root: Object.assign({
      lineHeight: 1.75 }, theme.typography.button, {
      boxSizing: 'border-box',
      minWidth: 64,
      padding: '6px 16px',
      borderRadius: theme.shape.borderRadius,
      color: theme.palette.text.primary,
      transition: theme.transitions.create(['background-color', 'box-shadow', 'border'], {
        duration: theme.transitions.duration.short
      }),
      '&:hover': {
        textDecoration: 'none',
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.text.primary, theme.palette.action.hoverOpacity),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: 'transparent'
        },
        '&$disabled': {
          backgroundColor: 'transparent'
        }
      },
      '&$disabled': {
        color: theme.palette.action.disabled
      }
    }),
    /* Styles applied to the span element that wraps the children. */
    label: {
      width: '100%', // assure the correct width for iOS Safari
      display: 'inherit',
      alignItems: 'inherit',
      justifyContent: 'inherit'
    },
    /* Styles applied to the root element if `variant="text"`. */
    text: {
      padding: '6px 8px'
    },
    /* Styles applied to the root element if `variant="text"` and `color="primary"`. */
    textPrimary: {
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.primary.main, theme.palette.action.hoverOpacity),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: 'transparent'
        }
      }
    },
    /* Styles applied to the root element if `variant="text"` and `color="secondary"`. */
    textSecondary: {
      color: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: 'transparent'
        }
      }
    },
    /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
    flat: {},
    /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
    flatPrimary: {},
    /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
    flatSecondary: {},
    /* Styles applied to the root element if `variant="outlined"`. */
    outlined: {
      padding: '5px 16px',
      border: '1px solid ' + (theme.palette.type === 'light' ? 'rgba(0, 0, 0, 0.23)' : 'rgba(255, 255, 255, 0.23)'),
      '&$disabled': {
        border: '1px solid ' + theme.palette.action.disabled
      }
    },
    /* Styles applied to the root element if `variant="outlined"` and `color="primary"`. */
    outlinedPrimary: {
      color: theme.palette.primary.main,
      border: '1px solid ' + (0, _colorManipulator.fade)(theme.palette.primary.main, 0.5),
      '&:hover': {
        border: '1px solid ' + theme.palette.primary.main,
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.primary.main, theme.palette.action.hoverOpacity),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: 'transparent'
        }
      }
    },
    /* Styles applied to the root element if `variant="outlined"` and `color="secondary"`. */
    outlinedSecondary: {
      color: theme.palette.secondary.main,
      border: '1px solid ' + (0, _colorManipulator.fade)(theme.palette.secondary.main, 0.5),
      '&:hover': {
        border: '1px solid ' + theme.palette.secondary.main,
        backgroundColor: (0, _colorManipulator.fade)(theme.palette.secondary.main, theme.palette.action.hoverOpacity),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: 'transparent'
        }
      },
      '&$disabled': {
        border: '1px solid ' + theme.palette.action.disabled
      }
    },
    /* Styles applied to the root element if `variant="[contained | fab]"`. */
    contained: {
      color: theme.palette.getContrastText(theme.palette.grey[300]),
      backgroundColor: theme.palette.grey[300],
      boxShadow: theme.shadows[2],
      '&$focusVisible': {
        boxShadow: theme.shadows[6]
      },
      '&:active': {
        boxShadow: theme.shadows[8]
      },
      '&$disabled': {
        color: theme.palette.action.disabled,
        boxShadow: theme.shadows[0],
        backgroundColor: theme.palette.action.disabledBackground
      },
      '&:hover': {
        backgroundColor: theme.palette.grey.A100,
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: theme.palette.grey[300]
        },
        '&$disabled': {
          backgroundColor: theme.palette.action.disabledBackground
        }
      }
    },
    /* Styles applied to the root element if `variant="[contained | fab]"` and `color="primary"`. */
    containedPrimary: {
      color: theme.palette.primary.contrastText,
      backgroundColor: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: theme.palette.primary.main
        }
      }
    },
    /* Styles applied to the root element if `variant="[contained | fab]"` and `color="secondary"`. */
    containedSecondary: {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.main,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: theme.palette.secondary.main
        }
      }
    },
    /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
    raised: {}, // legacy
    /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
    raisedPrimary: {}, // legacy
    /* Styles applied to the root element for backwards compatibility with legacy variant naming. */
    raisedSecondary: {}, // legacy
    /* Styles applied to the root element if `variant="[fab | extendedFab]"`. */
    fab: {
      borderRadius: '50%',
      padding: 0,
      minWidth: 0,
      width: 56,
      height: 56,
      boxShadow: theme.shadows[6],
      '&:active': {
        boxShadow: theme.shadows[12]
      }
    },
    /* Styles applied to the root element if `variant="extendedFab"`. */
    extendedFab: {
      borderRadius: 48 / 2,
      padding: '0 16px',
      width: 'auto',
      minWidth: 48,
      height: 48
    },
    /* Styles applied to the ButtonBase root element if the button is keyboard focused. */
    focusVisible: {},
    /* Styles applied to the root element if `disabled={true}`. */
    disabled: {},
    /* Styles applied to the root element if `color="inherit"`. */
    colorInherit: {
      color: 'inherit',
      borderColor: 'currentColor'
    },
    /* Styles applied to the root element if `mini={true}` & `variant="[fab | extendedFab]"`. */
    mini: {
      width: 40,
      height: 40
    },
    /* Styles applied to the root element if `size="small"`. */
    sizeSmall: {
      padding: '4px 8px',
      minWidth: 64,
      fontSize: theme.typography.pxToRem(13)
    },
    /* Styles applied to the root element if `size="large"`. */
    sizeLarge: {
      padding: '8px 24px',
      fontSize: theme.typography.pxToRem(15)
    },
    /* Styles applied to the root element if `fullWidth={true}`. */
    fullWidth: {
      width: '100%'
    }
  };
};

function Button(props) {
  var _classNames;

  var children = props.children,
      classes = props.classes,
      classNameProp = props.className,
      color = props.color,
      disabled = props.disabled,
      disableFocusRipple = props.disableFocusRipple,
      focusVisibleClassName = props.focusVisibleClassName,
      fullWidth = props.fullWidth,
      mini = props.mini,
      size = props.size,
      variant = props.variant,
      other = _objectWithoutProperties(props, ['children', 'classes', 'className', 'color', 'disabled', 'disableFocusRipple', 'focusVisibleClassName', 'fullWidth', 'mini', 'size', 'variant']);

  var fab = variant === 'fab' || variant === 'extendedFab';
  var contained = variant === 'contained' || variant === 'raised';
  var text = variant === 'text' || variant === 'flat';
  var className = (0, _classnames2.default)(classes.root, (_classNames = {}, _defineProperty(_classNames, classes.fab, fab), _defineProperty(_classNames, classes.mini, fab && mini), _defineProperty(_classNames, classes.extendedFab, variant === 'extendedFab'), _defineProperty(_classNames, classes.text, text), _defineProperty(_classNames, classes.textPrimary, text && color === 'primary'), _defineProperty(_classNames, classes.textSecondary, text && color === 'secondary'), _defineProperty(_classNames, classes.flat, text), _defineProperty(_classNames, classes.flatPrimary, text && color === 'primary'), _defineProperty(_classNames, classes.flatSecondary, text && color === 'secondary'), _defineProperty(_classNames, classes.contained, contained || fab), _defineProperty(_classNames, classes.containedPrimary, (contained || fab) && color === 'primary'), _defineProperty(_classNames, classes.containedSecondary, (contained || fab) && color === 'secondary'), _defineProperty(_classNames, classes.raised, contained || fab), _defineProperty(_classNames, classes.raisedPrimary, (contained || fab) && color === 'primary'), _defineProperty(_classNames, classes.raisedSecondary, (contained || fab) && color === 'secondary'), _defineProperty(_classNames, classes.outlined, variant === 'outlined'), _defineProperty(_classNames, classes.outlinedPrimary, variant === 'outlined' && color === 'primary'), _defineProperty(_classNames, classes.outlinedSecondary, variant === 'outlined' && color === 'secondary'), _defineProperty(_classNames, classes['size' + (0, _helpers.capitalize)(size)], size !== 'medium'), _defineProperty(_classNames, classes.disabled, disabled), _defineProperty(_classNames, classes.fullWidth, fullWidth), _defineProperty(_classNames, classes.colorInherit, color === 'inherit'), _classNames), classNameProp);

  return _react2.default.createElement(
    _ButtonBase2.default,
    Object.assign({
      className: className,
      disabled: disabled,
      focusRipple: !disableFocusRipple,
      focusVisibleClassName: (0, _classnames2.default)(classes.focusVisible, focusVisibleClassName)
    }, other),
    _react2.default.createElement(
      'span',
      { className: classes.label },
      children
    )
  );
}

Button.propTypes = {
  /**
   * The content of the button.
   */
  children: _propTypes2.default.node.isRequired,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: _propTypes2.default.object.isRequired,
  /**
   * @ignore
   */
  className: _propTypes2.default.string,
  /**
   * The color of the component. It supports those theme colors that make sense for this component.
   */
  color: _propTypes2.default.oneOf(['default', 'inherit', 'primary', 'secondary']),
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: _utils.componentPropType,
  /**
   * If `true`, the button will be disabled.
   */
  disabled: _propTypes2.default.bool,
  /**
   * If `true`, the  keyboard focus ripple will be disabled.
   * `disableRipple` must also be true.
   */
  disableFocusRipple: _propTypes2.default.bool,
  /**
   * If `true`, the ripple effect will be disabled.
   */
  disableRipple: _propTypes2.default.bool,
  /**
   * @ignore
   */
  focusVisibleClassName: _propTypes2.default.string,
  /**
   * If `true`, the button will take up the full width of its container.
   */
  fullWidth: _propTypes2.default.bool,
  /**
   * The URL to link to when the button is clicked.
   * If defined, an `a` element will be used as the root node.
   */
  href: _propTypes2.default.string,
  /**
   * If `true`, and `variant` is `'fab'`, will use mini floating action button styling.
   */
  mini: _propTypes2.default.bool,
  /**
   * The size of the button.
   * `small` is equivalent to the dense button styling.
   */
  size: _propTypes2.default.oneOf(['small', 'medium', 'large']),
  /**
   * @ignore
   */
  type: _propTypes2.default.string,
  /**
   * The variant to use.
   * __WARNING__: `flat` and `raised` are deprecated.
   * Instead use `text` and `contained` respectively.
   * `fab` and `extendedFab` are deprecated.
   * Instead use `<Fab>` and `<Fab variant="extended">`
   */
  variant: (0, _utils.chainPropTypes)(_propTypes2.default.oneOf(['text', 'outlined', 'contained', 'fab', 'extendedFab', 'flat', 'raised']), function (props) {
    if (props.variant === 'flat') {
      return new Error('Material-UI: the `flat` variant will be removed in the next major release. ' + '`text` is equivalent and should be used instead.');
    }
    if (props.variant === 'raised') {
      return new Error('Material-UI: the `raised` variant will be removed in the next major release. ' + '`contained` is equivalent and should be used instead.');
    }
    if (props.variant === 'fab') {
      return new Error('Material-UI: the `fab` variant will be removed in the next major release. ' + 'The `<Fab>` component is equivalent and should be used instead.');
    }
    if (props.variant === 'extendedFab') {
      return new Error('Material-UI: the `fab` variant will be removed in the next major release. ' + 'The `<Fab>` component with `variant="extended"` is equivalent ' + 'and should be used instead.');
    }

    return null;
  })
};

Button.defaultProps = {
  color: 'default',
  component: 'button',
  disabled: false,
  disableFocusRipple: false,
  fullWidth: false,
  mini: false,
  size: 'medium',
  type: 'button',
  variant: 'text'
};

exports.default = (0, _withStyles2.default)(styles, { name: 'MuiButton' })(Button);

//# sourceMappingURL=Button.js.map