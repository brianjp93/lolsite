import * as React from 'react';
import { PropTypes } from '../PropTypes.d.ts'; import { StandardProps } from '../StandardProps.d.ts';
import { ButtonBaseProps } from '../ButtonBase';

export interface ButtonProps extends StandardProps<ButtonBaseProps, ButtonClassKey, 'component'> {
  color?: PropTypes.Color;
  component?: React.ReactType<ButtonProps>;
  disabled?: boolean;
  disableFocusRipple?: boolean;
  disableRipple?: boolean;
  fullWidth?: boolean;
  href?: string;
  mini?: boolean;
  size?: 'small' | 'medium' | 'large';
  type?: string;
  variant?: 'text' | 'flat' | 'outlined' | 'contained' | 'raised' | 'fab' | 'extendedFab';
}

export type ButtonClassKey =
  | 'root'
  | 'label'
  | 'text'
  | 'textPrimary'
  | 'textSecondary'
  | 'flat'
  | 'flatPrimary'
  | 'flatSecondary'
  | 'outlined'
  | 'outlinedPrimary'
  | 'outlinedSecondary'
  | 'colorInherit'
  | 'contained'
  | 'containedPrimary'
  | 'containedSecondary'
  | 'raised'
  | 'raisedPrimary'
  | 'raisedSecondary'
  | 'focusVisible'
  | 'disabled'
  | 'fab'
  | 'extendedFab'
  | 'mini'
  | 'sizeSmall'
  | 'sizeLarge'
  | 'fullWidth';

declare const Button: React.ComponentType<ButtonProps>;

export default Button;
