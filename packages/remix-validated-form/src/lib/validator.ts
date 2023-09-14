import {
  createValidator,
  FieldErrors,
  GenericObject,
  Validator,
} from 'remix-validated-form';
import {
  deserialize,
  ReceiveType,
  ReflectionClass,
  ReflectionKind,
  resolveReceiveType,
  serializer,
  validate,
  ValidationError,
  ValidationErrorItem,
} from '@deepkit/type';

function getError(error: ValidationErrorItem): string {
  // code or message ?
  return error.message;
}

const DOTTED_INDEX_FORMAT_REGEX = /(\w+)\.(\d+)\.(\w+)/g;

const convertDottedIndexFieldPathToBracketedNotation = (path: string): string =>
  path.replace(DOTTED_INDEX_FORMAT_REGEX, '$1[$2].$3');

const isDottedIndexFormat = (input: string): boolean =>
  DOTTED_INDEX_FORMAT_REGEX.test(input);

function validationErrorsToFieldErrors(
  errors: readonly ValidationErrorItem[],
): FieldErrors {
  return errors
    .map(error =>
      isDottedIndexFormat(error.path)
        ? convertFieldPathValidationErrorItem(error)
        : error,
    )
    .reduce<FieldErrors>(
      (fieldErrors, error) => ({
        ...fieldErrors,
        [error.path]: getError(error),
      }),
      {},
    );
}

export function sanitizeFieldData<T extends GenericObject>(
  reflection: ReflectionClass<T>,
  // eslint-disable-next-line
  data: Record<string, any>,
  field: string,
): void {
  const property = reflection.getProperty(field);

  const parseNumber = (value: string | number): number | string =>
    isNaN(value as number) ? value : Number(value);

  if (
    property.type.kind !== ReflectionKind.string &&
    property.isOptional() &&
    typeof data[field] === 'string' &&
    data[field].trim() === ''
  ) {
    delete data[field];
    return;
  }

  if (property.isArray()) {
    const subType = property.getSubType();

    // TODO: test me
    if (
      subType.kind === ReflectionKind.class ||
      subType.kind === ReflectionKind.object ||
      subType.kind === ReflectionKind.objectLiteral
    ) {
      const subReflection = ReflectionClass.from(subType);
      for (const subFieldData of data[field]) {
        for (const subField of subReflection.getPropertyNames()) {
          sanitizeFieldData(subReflection, subFieldData, subField as string);
        }
      }
      return;
    }

    data[field] = data[field].split(',');

    if (
      (subType.kind !== ReflectionKind.string &&
        subType.kind !== ReflectionKind.union) ||
      (subType.kind === ReflectionKind.union &&
        !subType.types.some(type => type.kind === ReflectionKind.string))
    ) {
      data[field] = data[field].filter((value: string) => value.trim() !== '');
    }

    if (
      subType.kind === ReflectionKind.enum ||
      subType.kind === ReflectionKind.number
    ) {
      data[field] = data[field].map(parseNumber);
    }
  } else if (data[field] != null) {
    if (property.type.kind === ReflectionKind.boolean) {
      if (data[field] === 'on') {
        data[field] = true;
      } else if (data[field] === 'off') {
        data[field] = false;
      } else if (data[field] === '') {
        delete data[field];
      }
    } else if (
      property.type.kind === ReflectionKind.number ||
      property.type.kind === ReflectionKind.enum
    ) {
      data[field] = parseNumber(data[field]);
    }
  }
}

function convertFieldPathValidationErrorItem(
  error: ValidationErrorItem,
): ValidationErrorItem {
  return new ValidationErrorItem(
    convertDottedIndexFieldPathToBracketedNotation(error.path),
    error.code,
    error.message,
    error.value,
  );
}

export interface DeepkitFormValidator<T> {
  readonly reflection: ReflectionClass<T>;
  readonly validator: Validator<T>;
}

export function withDeepkit<T extends GenericObject>(
  type?: ReceiveType<T>,
): DeepkitFormValidator<T> {
  type = resolveReceiveType(type);

  const reflection = ReflectionClass.from(type);

  const validator = createValidator({
    validate: async incomingData => {
      for (const field of Object.keys(incomingData)) {
        sanitizeFieldData(reflection, incomingData, field);
      }

      const errors = validate(incomingData, type);

      if (errors.length) {
        console.error(errors);
        const error = validationErrorsToFieldErrors(errors);
        return { error, data: undefined };
      }

      try {
        const data = deserialize(
          incomingData,
          undefined,
          serializer,
          undefined,
          type,
        );

        return { data, error: undefined };
      } catch (err) {
        if (err instanceof ValidationError) {
          const error = validationErrorsToFieldErrors(err.errors);
          return { error, data: undefined };
        }

        throw err;
      }
    },
    validateField: async (incomingData, field) => {
      sanitizeFieldData(reflection, incomingData, field);

      const errors = validate(incomingData, type);

      let error = errors.find(error => error.path === field);
      error =
        error && isDottedIndexFormat(error.path)
          ? convertFieldPathValidationErrorItem(error)
          : error;
      console.error(errors);

      return { error: error ? getError(error) : undefined };
    },
  });

  return { reflection, validator };
}
