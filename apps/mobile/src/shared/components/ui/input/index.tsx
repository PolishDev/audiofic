'use client';
import React, { createContext, useContext, useState } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';

interface InputContextValue {
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

const InputContext = createContext<InputContextValue>({
  isFocused: false,
  setIsFocused: () => {},
});

export interface InputProps extends ViewProps {
  isInvalid?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const Input = React.forwardRef<View, InputProps>(
  ({ className = '', isInvalid, isDisabled, children, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const borderStyle = isInvalid
      ? 'border-destructive'
      : isFocused
        ? 'border-primary'
        : 'border-border';

    const opacityStyle = isDisabled ? 'opacity-50' : 'opacity-100';

    return (
      <InputContext.Provider
        value={{ isFocused, setIsFocused, isInvalid, isDisabled }}>
        <View
          ref={ref}
          className={`flex-row items-center w-full min-h-[48px] px-3.5 bg-card rounded-xl border ${borderStyle} ${opacityStyle} ${className}`}
          {...props}>
          {children}
        </View>
      </InputContext.Provider>
    );
  },
);
Input.displayName = 'Input';

export interface InputFieldProps extends TextInputProps {
  className?: string;
}

export const InputField = React.forwardRef<TextInput, InputFieldProps>(
  ({ className = '', onFocus, onBlur, ...props }, ref) => {
    const { setIsFocused, isDisabled } = useContext(InputContext);

    return (
      <TextInput
        ref={ref}
        editable={!isDisabled}
        placeholderTextColor="#8E8E93"
        className={`flex-1 text-base text-foreground py-2.5 ${className}`}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    );
  },
);
InputField.displayName = 'InputField';

export interface InputSlotProps extends ViewProps {
  className?: string;
}

export const InputSlot = React.forwardRef<View, InputSlotProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={`justify-center items-center px-1.5 ${className}`}
        {...props}>
        {children}
      </View>
    );
  },
);
InputSlot.displayName = 'InputSlot';
