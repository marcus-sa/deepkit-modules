import { createContext, useContext, useEffect, useMemo } from 'react';
import { ReflectionClass, ReflectionKind } from '@deepkit/type';
import {
  FieldArray,
  FieldArrayProps,
  FieldProps as RvfUseFieldProps,
  FormProps,
  useField as rvfUseField,
  ValidatedForm,
} from 'remix-validated-form';

import { DeepkitFormValidator } from './validator.js';

export interface DeepkitValidatedFormProps<T>
  extends Omit<FormProps<T, undefined>, 'validator'> {
  readonly validator: DeepkitFormValidator<T>;
}

const DeepkitValidatedFormContext =
  createContext<DeepkitFormValidator<unknown> | null>(null);

export const DeepkitFieldArrayContext =
  createContext<DeepkitFieldArrayContextType<unknown> | null>(null);

export const useDeepkitValidatedFormContext = () =>
  useContext(DeepkitValidatedFormContext)!;

export const useDeepkitFieldArrayContext = () =>
  useContext(DeepkitFieldArrayContext)!;

export interface FieldProps extends RvfUseFieldProps {
  readonly required: boolean;
}

export type UseFieldOptions = Parameters<typeof rvfUseField>[1];

export function useField(name: string, options?: UseFieldOptions): FieldProps {
  const validatedFormContext = useDeepkitValidatedFormContext();
  const fieldArrayContext = useDeepkitFieldArrayContext();
  const fieldName = useMemo(
    () =>
      fieldArrayContext
        ? `${fieldArrayContext.name}[${fieldArrayContext.currentItemIndex}].${name}`
        : name,
    [fieldArrayContext, name],
  );
  const field = rvfUseField(fieldName, options);

  useEffect(() => {
    if (fieldArrayContext?.lastFieldName === name) {
      // eslint-disable-next-line functional/immutable-data
      fieldArrayContext.currentItemIndex += 1;
    }
  }, []);

  const required = useMemo(() => {
    const property = fieldArrayContext
      ? fieldArrayContext.reflection.getProperty(name)
      : validatedFormContext.reflection.getProperty(name);

    return !property.isOptional();
  }, [validatedFormContext, fieldArrayContext]);

  return { ...field, required };
}

export interface DeepkitFieldArrayContextType<T> {
  readonly name: string;
  readonly reflection: ReflectionClass<T>;
  readonly lastFieldName: string;
  // eslint-disable-next-line functional/prefer-readonly-type
  currentItemIndex: number;
}

export function DeepkitFieldArray<T>({
                                       name,
                                       children,
                                       ...props
                                     }: FieldArrayProps<T>) {
  const { reflection: formReflection } = useDeepkitValidatedFormContext();

  const fieldArrayReflection = useMemo(() => {
    const property = formReflection.getProperty(name);

    if (!property.isArray()) {
      throw new Error('Not an array');
    }

    const subType = property.getSubType();

    if (
      subType.kind !== ReflectionKind.class &&
      subType.kind !== ReflectionKind.object &&
      subType.kind !== ReflectionKind.objectLiteral
    ) {
      throw new Error('Unsupported sub type');
    }

    return ReflectionClass.from(subType);
  }, [formReflection, name]);

  const lastFieldName = useMemo(
    () => fieldArrayReflection.getPropertyNames().at(-1) as string,
    [fieldArrayReflection],
  );

  return (
    <DeepkitFieldArrayContext.Provider
      value={{
        name,
        reflection: fieldArrayReflection,
        lastFieldName,
        currentItemIndex: 0,
      }}
    >
      <FieldArray name={name} {...props}>
        {children}
      </FieldArray>
    </DeepkitFieldArrayContext.Provider>
  );
}

export function DeepkitValidatedForm<T extends Record<string, any>>({
                                                                      validator,
                                                                      children,
                                                                      ...props
                                                                    }: DeepkitValidatedFormProps<T>) {
  return (
    <DeepkitValidatedFormContext.Provider value={validator}>
      <ValidatedForm validator={validator.validator} {...props}>
        {children}
      </ValidatedForm>
    </DeepkitValidatedFormContext.Provider>
  );
}
