import { float } from '@deepkit/type';

import { withDeepkit } from './validator';

describe('withDeepkit', () => {
  test('array with interface', async () => {
    interface Pet {
      readonly name: string;
      readonly active?: boolean;
    }

    interface Kennel {
      readonly pets: readonly Pet[];
    }

    const { validator } = withDeepkit<Kennel>();

    expect(
      await validator.validate({
        pets: [{ name: 'Aya', active: 'on' }],
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "pets": [
            {
              "active": true,
              "name": "Aya",
            },
          ],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "pets": [
            {
              "active": true,
              "name": "Aya",
            },
          ],
        },
      }
    `);
  });

  test('array with numbers', async () => {
    interface FormData {
      readonly values?: readonly number[];
    }

    const { validator } = withDeepkit<FormData>();

    expect(
      await validator.validate({
        values: '0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "values": [
            0,
          ],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": "0",
        },
      }
    `);

    expect(
      await validator.validate({
        values: '0,1',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "values": [
            0,
            1,
          ],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": "0,1",
        },
      }
    `);

    expect(
      await validator.validate({
        values: '',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {},
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": "",
        },
      }
    `);

    expect(
      await validator.validate({
        values: ',',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "values": [],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": ",",
        },
      }
    `);
  });

  test('array with strings', async () => {
    interface FormData {
      readonly values?: readonly string[];
    }

    const { validator } = withDeepkit<FormData>();

    expect(
      await validator.validate({
        values: 'hello',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "values": [
            "hello",
          ],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": "hello",
        },
      }
    `);

    expect(
      await validator.validate({
        values: 'hello,world',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "values": [
            "hello",
            "world",
          ],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": "hello,world",
        },
      }
    `);

    expect(
      await validator.validate({
        values: '',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {},
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": "",
        },
      }
    `);

    expect(
      await validator.validate({
        values: ',',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "values": [
            "",
            "",
          ],
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "values": ",",
        },
      }
    `);
  });

  test('array with enums', async () => {});

  test('enum with numbers', async () => {
    enum Test {
      ONE = 0,
    }

    interface FormData {
      readonly test?: Test;
    }

    const { validator } = withDeepkit<FormData>();

    expect(
      await validator.validate({
        test: '0',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "test": 0,
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "test": "0",
        },
      }
    `);
  });

  test('enum with strings', async () => {
    enum Test {
      ONE = 'ONE',
    }

    interface FormData {
      readonly test?: Test;
    }

    const { validator } = withDeepkit<FormData>();

    expect(
      await validator.validate({
        test: 'ONE',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "test": "ONE",
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "test": "ONE",
        },
      }
    `);
  });

  test('checkbox value', async () => {
    interface FormData {
      readonly active?: boolean;
    }

    const { validator } = withDeepkit<FormData>();

    expect(
      await validator.validate({
        active: 'on',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "active": true,
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "active": "on",
        },
      }
    `);

    expect(
      await validator.validate({
        active: 'off',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "active": false,
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "active": "off",
        },
      }
    `);

    expect(
      await validator.validate({
        active: '',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {},
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "active": "",
        },
      }
    `);
  });

  test('optional float', async () => {
    interface FormData {
      readonly price?: float;
    }

    const { validator } = withDeepkit<FormData>();
    expect(
      await validator.validate({
        price: '',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {},
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "price": "",
        },
      }
    `);

    expect(
      await validator.validate({
        price: '    ',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {},
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "price": "    ",
        },
      }
    `);

    expect(
      await validator.validate({
        price: '1.50',
      }),
    ).toMatchInlineSnapshot(`
      {
        "data": {
          "price": 1.5,
        },
        "error": undefined,
        "formId": undefined,
        "submittedData": {
          "price": "1.50",
        },
      }
    `);
  });
});
