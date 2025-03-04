import * as fc from 'fast-check';
import {
  failure,
  initial,
  merge,
  success,
  pending,
  Result,
  fromMaybe,
  fromEither,
  mergeInMany,
  fromTry,
  fromPromise,
  fromNullable,
  mergeWithConfig,
} from './ts-result';
import { just, none } from '@sweet-monads/maybe';
import { left, right } from '@sweet-monads/either';

describe('Result', () => {
  test.each([
    [initial, true, false, false, false],
    [pending, false, true, false, false],
    [success('s'), false, false, true, false],
    [failure('s'), false, false, false, true],
  ])(
    'Static constants initializing ',
    async (input, initial, pending, success, failure) => {
      expect(input.isInitial()).toBe(initial);
      expect(input.isPending()).toBe(pending);
      expect(input.isSuccess()).toBe(success);
      expect(input.isFailure()).toBe(failure);
    },
  );

  test('merge states', () =>
    fc.assert(
      fc.property(
        fc.subarray(['1', '2', '3']),
        fc.subarray(['4', '5', '6']),
        fc.subarray(['7', '8', '9']),
        fc.subarray(['0', 'x', 'y']),
        (i, p, f, s) => {
          const merged = merge([
            ...i.map(() => initial),
            ...p.map(() => pending),
            ...f.map((e) => failure<string, string>(e)),
            ...s.map((s) => success<string, string>(s)),
          ]);
          expect(merged.isInitial()).toBe(i.length > 0);
          expect(merged.isPending()).toBe(i.length === 0 && p.length > 0);
          expect(merged.isFailure()).toBe(
            i.length === 0 && p.length === 0 && f.length > 0,
          );
          expect(merged.isSuccess()).toBe(
            i.length === 0 && p.length === 0 && f.length === 0 && s.length >= 0,
          );
        },
      ),
    ));

  test('merge types', () =>
    fc.assert(
      fc.property(fc.integer(), fc.string(), (int, str) => {
        const v1 = initial;
        const v2 = pending;
        const v3 = success<TypeError, number>(int);
        const v4 = success<ReferenceError, string>(str);
        const v5 = failure<Error, boolean>(new Error());

        const r1 = merge([v1, v2]);
        const r2 = merge([v2, v5]);
        const r3 = merge([v3, v4]);
        const r4 = merge([v3, v4, v5]);

        expect(r1.isInitial()).toBe(true);
        expect(r2.isPending()).toBe(true);
        expect(r3.isSuccess()).toBe(true);
        if (r3.isSuccess()) {
          expect(r3.value).toStrictEqual([int, str]);
        }
        expect(r4.isFailure()).toBe(true);
      }),
    ));

  test('fromMaybe', () =>
    fc.assert(
      fc.property(fc.integer(), (int) => {
        const v1 = just(int);
        const v2 = none<number>();

        const r1 = fromMaybe(v1);
        expect(r1.isSuccess()).toBe(true);

        const r2 = fromMaybe(v2);
        expect(r2.isInitial()).toBe(true);
      }),
    ));

  test('success', () =>
    fc.assert(
      fc.property(fc.integer(), (int) => {
        const r1 = success(int);
        expect(r1.isSuccess()).toBe(true);

        expect(r1.value).toBe(int);
      }),
    ));

  test('fromTry', () =>
    fc.assert(
      fc.property(fc.integer(), fc.string(), (int, str) => {
        const error = new Error('test');

        const v1 = fromTry<number>(() => int);
        const v2 = fromTry<string>(() => str);
        const v3 = fromTry<string>(() => {
          throw error;
        });

        expect(v1.isSuccess()).toBe(true);
        expect(v2.isSuccess()).toBe(true);
        expect(v3.isFailure()).toBe(true);

        expect(v1.unwrap()).toBe(int);
        expect(v2.unwrap()).toBe(str);
        expect(v3.value).toBe(error);
      }),
    ));

  test('fromPromise', async () =>
    await fc.assert(
      fc.asyncProperty(fc.integer(), fc.string(), async (int, str) => {
        const error = new Error('test');

        const v1 = await fromPromise<Error, number>(Promise.resolve(int));
        const v2 = await fromPromise<Error, string>(Promise.resolve(str));
        const v3 = await fromPromise<Error, string>(Promise.reject(error));

        expect(v1.isSuccess()).toBe(true);
        expect(v2.isSuccess()).toBe(true);
        expect(v3.isFailure()).toBe(true);

        expect(v1.unwrap()).toBe(int);
        expect(v2.unwrap()).toBe(str);
        expect(v3.value).toBe(error);
      }),
    ));

  test('fromEither', () =>
    fc.assert(
      fc.property(fc.integer(), fc.string(), (int, str) => {
        const v1 = right<string, number>(int);
        const v2 = left<string, number>(str);

        const r1 = fromEither(v1);
        expect(r1.isSuccess()).toBe(true);

        const r2 = fromEither(v2);

        expect(r2.isFailure()).toBe(true);
      }),
    ));

  test('fromNullable', () =>
    fc.assert(
      fc.property(fc.integer(), fc.string(), fc.boolean(), (int, str, bool) => {
        const v1: number | undefined = int;
        const v2: string | undefined = str;
        const v3: boolean | undefined = bool;

        const r1 = fromNullable(v1);
        expect(r1.isSuccess()).toBe(true);

        const r2 = fromNullable(v2);
        expect(r2.isSuccess()).toBe(true);

        const r3 = fromNullable(v3);
        expect(r3.isSuccess()).toBe(true);

        const r4 = fromNullable<string | null>(null);
        const r5 = fromNullable<string | undefined>(undefined);

        expect(r4.isInitial()).toBe(true);
        expect(r5.isInitial()).toBe(true);
      }),
    ));

  test('identity', () =>
    fc.assert(
      fc.property(fc.integer(), fc.string(), fc.boolean(), (int, str, bool) => {
        const v1 = initial;
        const v2 = pending;
        const v3 = success<TypeError, number>(int);
        const v4 = success<ReferenceError, string>(str);
        const v5 = success<ReferenceError, boolean>(bool);
        const v6 = failure<Error, boolean>(new Error());

        expect(v1.isInitial()).toBe(true);
        expect(v2.isPending()).toBe(true);
        expect(v3.isSuccess()).toBe(true);
        expect(v4.isSuccess()).toBe(true);
        expect(v5.isSuccess()).toBe(true);

        if (v3.isSuccess()) {
          expect(v3.value).toBe(int);
        }
        if (v4.isSuccess()) {
          expect(v4.value).toBe(str);
        }
        if (v5.isSuccess()) {
          expect(v5.value).toBe(bool);
        }
        expect(v6.isFailure()).toBe(true);
      }),
    ));

  test('or', () =>
    fc.assert(
      fc.property(result(), result(), (x, y) => {
        const result = x.or(y);
        expect(result.isSuccess()).toBe(x.isSuccess() || y.isSuccess());
        expect(result).toBe(x.isSuccess() ? x : y);
      }),
    ));

  test('join', () => {
    const v1 = success(success(2));
    const v2 = success(failure(new Error()));
    const v3 = failure<Float32Array, Result<Error, number>>(new Float32Array());

    const r1 = v1.join(); // Result.Success with value 2
    const r2 = v2.join(); // Result.Failure with value new Error
    const r3 = v3.join(); // Result.Failure with value new TypeError

    expect(r1.isSuccess()).toBe(true);
    if (r1.isSuccess()) {
      expect(r1.value).toBe(2);
    }
    expect(r2.isFailure()).toBe(true);
    if (r2.isFailure()) {
      expect(r2.value).toBeInstanceOf(Error);
    }

    expect(r3.isFailure()).toBe(true);
    if (r3.isFailure()) {
      expect(r3.value).toBeInstanceOf(Float32Array);
    }
  });

  test('map', () => {
    const v1 = success<Error, number>(2);
    const v2 = failure<Error, number>(new Error());

    const newVal1 = v1.map((a) => a.toString()); // Result<Error, string>.Success with value "2"
    const newVal2 = v2.map((a) => a.toString()); // Result<Error, string>.Failure with value new Error()
    expect(newVal1.isSuccess()).toBe(true);
    if (newVal1.isSuccess()) {
      expect(newVal1.value).toBe('2');
    }
    expect(newVal2.isFailure()).toBe(true);
    if (newVal2.isFailure()) {
      expect(newVal2.value).toBeInstanceOf(Error);
    }
  });

  test('mapSuccess', () => {
    const v1 = success<Error, number>(2);
    const v2 = failure<Error, number>(new Error());

    const newVal1 = v1.mapSuccess((a) => a.toString()); // Result<Error, string>.Success with value "2"
    const newVal2 = v2.mapSuccess((a) => a.toString()); // Result<Error, string>.Failure with value new Error()
    expect(newVal1.isSuccess()).toBe(true);
    if (newVal1.isSuccess()) {
      expect(newVal1.value).toBe('2');
    }
    expect(newVal2.isFailure()).toBe(true);
    if (newVal2.isFailure()) {
      expect(newVal2.value).toBeInstanceOf(Error);
    }
  });

  test('mapFailure', () => {
    const v1 = success<Error, number>(2);
    const v2 = failure<Error, number>(new Error());

    const newVal1 = v1.mapFailure((a) => a.toString()); // Result<Error, string>.Success with value 2
    const newVal2 = v2.mapFailure((a) => a.toString()); // Result<Error, string>.Failure with value new Error()
    expect(newVal1.isSuccess()).toBe(true);
    if (newVal1.isSuccess()) {
      expect(newVal1.value).toBe(2);
    }
    expect(newVal2.isFailure()).toBe(true);
    if (newVal2.isFailure()) {
      expect(newVal2.value).toBe('Error');
    }
  });

  test('asyncMap', async () => {
    const v1 = success<Error, number>(2);
    const v2 = failure<Error, number>(new Error());

    const newVal1 = v1.asyncMap((a) => Promise.resolve(a.toString()));
    const newVal2 = v2.asyncMap((a) => Promise.resolve(a.toString()));

    expect(newVal1).toBeInstanceOf(Promise);
    const r1 = await newVal1;
    expect(r1.isSuccess()).toBe(true);

    expect(newVal2).toBeInstanceOf(Promise);
    const r2 = await newVal2;
    expect(r2.isFailure()).toBe(true);
  });
});

test('apply', () => {
  const v1 = success<Error, number>(2);
  const v2 = failure<Error, number>(new Error());
  const fn1 = success<Error, (a: number) => number>((a: number) => a * 2);
  const fn2 = failure<Error, (a: number) => number>(new Error());

  const newVal1 = fn1.apply(v1);
  expect(newVal1.isSuccess()).toBe(true);
  if (newVal1.isSuccess()) {
    expect(newVal1.value).toBe(4);
  }

  const newVal2 = fn1.apply(v2);
  expect(newVal2.isFailure()).toBe(true);
  expect(newVal2.value).toBeInstanceOf(Error);

  const newVal3 = fn2.apply(v1);
  expect(newVal3.isFailure()).toBe(true);
  expect(newVal3.value).toBeInstanceOf(Error);

  const newVal4 = fn2.apply(v2);
  expect(newVal4.isFailure()).toBe(true);
  expect(newVal4.value).toBeInstanceOf(Error);
});

test('asyncApply', () => {
  const v1 = success<Error, number>(2);
  const v2 = failure<Error, number>(new Error());
  const fn1 = success<Error, (a: number) => Promise<number>>((a: number) =>
    Promise.resolve(a * 2),
  );
  const fn2 = failure<Error, (a: number) => Promise<number>>(new Error());

  /*   const newVal1 = fn1.asyncApply(v1); // Promise<Either<Error, number>.Right> with value 4
  const newVal2 = fn1.asyncApply(v2); // Promise<Either<Error, number>.Left> with value new Error()
  const newVal3 = fn2.asyncApply(v1); // Promise<Either<Error, number>.Left> with value new Error()
  const newVal4 = fn2.asyncApply(v2); // Promise<Either<Error, number>.Left> with value new Error() */
});

test('chain', () => {
  const v1 = success<Error, number>(2);
  const v2 = failure<Error, number>(new Error());
  const v3 = initial;

  // Result<Error | TypeError, string>.Success with value "2"
  const newVal1 = v1.chain((a) => success<TypeError, string>(a.toString()));
  // Result<Error | TypeError, string>.Failure with value new TypeError()
  const newVal2 = v1.chain((a) => failure<TypeError, string>(new TypeError()));
  // Result<Error | TypeError, string>.Failure with value new Error()
  const newVal3 = v2.chain((a) => success<TypeError, string>(a.toString()));
  // Result<Error | TypeError, string>.Failure with value new Error()
  const newVal4 = v2.chain((a) => failure<TypeError, string>(new TypeError()));
  // Result<TypeError, string>.Initial with no value
  const newVal5 = v3.chain((a) => failure<TypeError, string>(new TypeError()));

  expect(newVal1.isSuccess()).toBe(true);
  expect(newVal2.isFailure()).toBe(true);
  expect(newVal3.isFailure()).toBe(true);
  expect(newVal4.isFailure()).toBe(true);
  expect(newVal5.isInitial()).toBe(true);
});

test('asyncChain', async () => {
  const v1 = success<Error, number>(2);
  const v2 = failure<Error, number>(new Error());
  const v3 = initial;

  // Result<Error | TypeError, string>.Success with value "2"
  const newVal1 = v1.asyncChain((a) =>
    Promise.resolve(success<TypeError, string>(a.toString())),
  );
  // Result<Error | TypeError, string>.Failure with value new TypeError()
  const newVal2 = v1.asyncChain(() =>
    Promise.resolve(failure<TypeError, string>(new TypeError())),
  );
  // Result<Error | TypeError, string>.Failure with value new Error()
  const newVal3 = v2.asyncChain((a) =>
    Promise.resolve(success<TypeError, string>(a.toString())),
  );
  // Result<Error | TypeError, string>.Failure with value new Error()
  const newVal4 = v2.asyncChain(() =>
    Promise.resolve(failure<TypeError, string>(new TypeError())),
  );
  // Result<Error | TypeError, string>.Initial with no value
  const newVal5 = v3.asyncChain(() =>
    Promise.resolve(failure<TypeError, string>(new TypeError())),
  );

  expect((await newVal1).isSuccess()).toBe(true);
  expect((await newVal2).isFailure()).toBe(true);
  expect((await newVal3).isFailure()).toBe(true);
  expect((await newVal4).isFailure()).toBe(true);
  expect((await newVal5).isInitial()).toBe(true);
});

test('toEither', () =>
  fc.assert(
    fc.property(result(), (r) => {
      const either = r.toEither(
        () => 'i',
        () => 'p',
      );
      expect(either.isLeft()).toBe(
        r.isInitial() || r.isPending() || r.isFailure(),
      );
      expect(either.isRight()).toBe(r.isSuccess());
      if (r.isInitial()) {
        expect(either.value).toBe('i');
      }

      if (r.isPending()) {
        expect(either.value).toBe('p');
      }
      if (r.isFailure()) {
        expect(either.value).toBe(r.value);
      }
    }),
  ));

test('toMaybe', () =>
  fc.assert(
    fc.property(result(), (r) => {
      const maybe = r.toMaybe();
      expect(maybe.isNone()).toBe(
        r.isInitial() || r.isPending() || r.isFailure(),
      );
      expect(maybe.isJust()).toBe(r.isSuccess());
      if (r.isSuccess()) {
        expect(maybe.value).toBe(r.value);
      }
    }),
  ));

test('toNullable', () =>
  fc.assert(
    fc.property(result(), (r) => {
      const nullable = r.toNullable();

      if (r.isInitial() || r.isPending() || r.isFailure()) {
        expect(nullable).toBeNull();
      } else {
        expect(nullable).not.toBeNull();
      }
    }),
  ));

test('toUndefined', () =>
  fc.assert(
    fc.property(result(), (r) => {
      const nullable = r.toUndefined();

      if (r.isInitial() || r.isPending() || r.isFailure()) {
        expect(nullable).toBeUndefined();
      } else {
        expect(nullable).not.toBeUndefined();
      }
    }),
  ));

test('mergeInMany', () =>
  fc.assert(
    fc.property(result(), result(), (x, y) => {
      const r1 = mergeInMany([x, y]);
      expect(r1.isSuccess()).toBe(x.isSuccess() && y.isSuccess());
      // expect(r1.isFailure()).toBe(x.isFailure() || y.isFailure());
    }),
  ));

test('unwrap', () => {
  expect(success(2).unwrap()).toBe(2);
  expect(() => failure(new TypeError()).unwrap()).toThrow(
    'Result state is not Right',
  );
  expect(() => failure(2).unwrap()).toThrow('Result state is not Right');
  expect(() => pending.unwrap({ pending: () => new Error('Custom') })).toThrow(
    'Custom',
  );
});

test('toString', () => {
  expect(success(1).toString()).toBe('[object Result]');
  expect(failure(1).toString()).toBe('[object Result]');
});

test('unwrapOr', () => {
  const v1 = success<Error, number>(2);
  const v2 = failure<Error, number>(new Error());

  expect(v1.unwrapOr(3)).toBe(2);
  expect(v2.unwrapOr(3)).toBe(3);
});

test('unwrapOrElse', () => {
  const v1 = success<number, number>(2);
  const v2 = failure<number, number>(3);

  expect(v1.unwrapOrElse((x) => x * 2)).toBe(2);
  expect(v2.unwrapOrElse((x) => x * 2)).toBe(6);
});

test('fold', () => {
  const v1 = initial;
  const v2 = pending;
  const v3 = failure<string, number>('');
  const v4 = success<string, number>(5);

  const or = success(10);

  const v1Result = v1.fold(
    () => or,
    () => or,
    () => or,
    (ok) => ok,
  );
  const v2Result = v2.fold(
    () => or,
    () => or,
    () => or,
    (ok) => ok,
  );
  const v3Result = v3.fold(
    () => or,
    () => or,
    () => or,
    (ok) => success(ok),
  );
  const v4Result = v4.fold(
    () => or,
    () => or,
    () => or,
    (ok) => success(ok),
  );
  expect(v1Result.value).toBe(10);
  expect(v2Result.value).toBe(10);
  expect(v3Result.value).toBe(10);
  expect(v4Result.value).toBe(5);
});

function result(): fc.Arbitrary<Result<string, number>> {
  return fc
    .integer({
      min: 0,
      max: 3,
    })
    .chain((v) => fc.tuple(fc.string(), fc.constant(v)))
    .map(([str, num]) => {
      switch (num) {
        case 0:
          return initial;
        case 1:
          return pending;
        case 2:
          return success<string, number>(num);
        case 3:
          return failure<string, number>(str);
        default:
          throw new Error('unexpected value for Result arb');
      }
    })
    .noBias();
}

describe('filter/filterMap', () => {
  test('filter', () => {
    // Basic filtering
    expect(
      success(5)
        .filter((x) => x > 3)
        .isSuccess(),
    ).toBe(true);
    expect(
      success(2)
        .filter((x) => x > 3)
        .isFailure(),
    ).toBe(true);

    // Non-success states pass through
    expect(
      failure<string, number>('error')
        .filter((x) => x > 3)
        .isFailure(),
    ).toBe(true);
    expect(initial.filter((x) => x > 3).isInitial()).toBe(true);
    expect(pending.filter((x) => x > 3).isPending()).toBe(true);

    // Failure contains the rejected value
    const result = success<string, number>(2).filter((x) => x > 3);
    expect(result.isFailure() && result.value).toBe(2);
  });

  test('filterMap', () => {
    const parseIfPositive = (n: number) =>
      n > 0 ? success(n.toString()) : failure(n);

    // Success case
    expect(success(5).filterMap(parseIfPositive).unwrapOr('')).toBe('5');

    // Failure case
    expect(success(-1).filterMap(parseIfPositive).isFailure()).toBe(true);

    // Non-success states pass through
    expect(
      failure<string, number>('error').filterMap(parseIfPositive).isFailure(),
    ).toBe(true);
    expect(initial.filterMap(parseIfPositive).isInitial()).toBe(true);
    expect(pending.filterMap(parseIfPositive).isPending()).toBe(true);
  });
});

describe('tap/tapFailure', () => {
  test('tap', () => {
    let sideEffect = 0;
    const tap = (x: number) => {
      sideEffect = x;
    };

    // Success executes side effect
    success(5).tap(tap);
    expect(sideEffect).toBe(5);

    // Other states don't execute side effect
    sideEffect = 0;
    failure<number, number>(3).tap(tap);
    expect(sideEffect).toBe(0);

    initial.tap(tap);
    expect(sideEffect).toBe(0);

    pending.tap(tap);
    expect(sideEffect).toBe(0);
  });

  test('tapFailure', () => {
    let sideEffect = 0;
    const tap = (x: number) => {
      sideEffect = x;
    };

    // Failure executes side effect
    failure(5).tapFailure(tap);
    expect(sideEffect).toBe(5);

    // Other states don't execute side effect
    sideEffect = 0;
    success<number, number>(3).tapFailure(tap);
    expect(sideEffect).toBe(0);

    initial.tapFailure(tap);
    expect(sideEffect).toBe(0);

    pending.tapFailure(tap);
    expect(sideEffect).toBe(0);
  });
});

describe('recover/recoverWith', () => {
  test('recover', () => {
    // Recovers from failure
    expect(failure<string, number>('error').recover(42).unwrapOr(0)).toBe(42);

    // Doesn't affect success
    expect(success<string, number>(5).recover(42).unwrapOr(0)).toBe(5);

    // Recovers from initial/pending
    expect(initial.recover(42).unwrapOr(0)).toBe(42);
    expect(pending.recover(42).unwrapOr(0)).toBe(42);
  });

  test('recoverWith', () => {
    const handler = (error: string): Result<string, number> =>
      error === 'known' ? success(42) : failure('still failed');

    // Recovers from known error
    expect(
      failure<string, number>('known').recoverWith(handler).unwrapOr(0),
    ).toBe(42);

    // Propagates new failure for unknown error
    expect(
      failure<string, number>('unknown').recoverWith(handler).isFailure(),
    ).toBe(true);

    // Doesn't affect success
    expect(success<string, number>(5).recoverWith(handler).unwrapOr(0)).toBe(5);

    // Doesn't affect initial/pending
    expect(initial.recoverWith(handler).isInitial()).toBe(true);
    expect(pending.recoverWith(handler).isPending()).toBe(true);
  });
});

describe('zip/zipWith', () => {
  test('zip', () => {
    const v1 = success<string, number>(2);
    const v2 = success<Error, string>('test');
    const v3 = failure<string, number>('error');

    // Success cases
    expect(v1.zip(v2).unwrapOr([0, ''])).toEqual([2, 'test']);

    // Failure cases
    expect(v1.zip(v3).isFailure()).toBe(true);
    expect(v3.zip(v2).isFailure()).toBe(true);

    // Initial/Pending cases
    expect(v1.zip(initial).isInitial()).toBe(true);
    expect(v1.zip(pending).isPending()).toBe(true);
    expect(initial.zip(v1).isInitial()).toBe(true);
    expect(pending.zip(v1).isPending()).toBe(true);
  });

  test('zipWith', () => {
    const v1 = success<string, number>(2);
    const v2 = success<Error, number>(3);
    const v3 = failure<string, number>('error');

    const add = (a: number, b: number) => a + b;

    // Success cases
    expect(v1.zipWith(v2, add).unwrapOr(0)).toBe(5);

    // Failure cases
    expect(v1.zipWith(v3, add).isFailure()).toBe(true);
    expect(v3.zipWith(v2, add).isFailure()).toBe(true);

    // Initial/Pending cases
    expect(v1.zipWith(initial, add).isInitial()).toBe(true);
    expect(v1.zipWith(pending, add).isPending()).toBe(true);
    expect(initial.zipWith(v1, add).isInitial()).toBe(true);
    expect(pending.zipWith(v1, add).isPending()).toBe(true);
  });
});

describe('bifunctor', () => {
  test('bimap', () => {
    const toString = (x: number) => x.toString();
    const toError = (s: string) => new Error(s);

    // Success case
    const v1 = success<string, number>(42);
    const r1 = v1.bimap(toError, toString);
    expect(r1.isSuccess()).toBe(true);
    expect(r1.unwrapOr('')).toBe('42');

    // Failure case
    const v2 = failure<string, number>('error');
    const r2 = v2.bimap(toError, toString);
    expect(r2.isFailure()).toBe(true);
    if (r2.isFailure()) {
      expect(r2.value).toBeInstanceOf(Error);
      expect(r2.value.message).toBe('error');
    }

    // Initial/Pending pass through
    expect(initial.bimap(toError, toString).isInitial()).toBe(true);
    expect(pending.bimap(toError, toString).isPending()).toBe(true);
  });
});

describe('Result combining methods', () => {
  const results = [
    success<string, number>(1),
    failure('error'),
    initial as Result<string, number>,
    pending as Result<string, number>,
  ];

  describe('mergeWithPriority', () => {
    test('default behavior prioritizes Initial/Pending over Failure', () => {
      // Initial takes precedence
      expect(
        mergeWithConfig(results, { priority: 'pending' }).isInitial(),
      ).toBe(true);

      // Pending takes precedence if no Initial
      const withoutInitial = results.filter((r) => !r.isInitial());
      expect(
        mergeWithConfig(withoutInitial, { priority: 'pending' }).isPending(),
      ).toBe(true);

      // Failure only if no Initial/Pending
      const onlySuccessAndFailure = [success(1), failure('error')];
      expect(
        mergeWithConfig(onlySuccessAndFailure, {
          priority: 'pending',
        }).isFailure(),
      ).toBe(true);
    });

    test('strict mode prioritizes Failures over Initial/Pending', () => {
      // Failure takes precedence in strict mode
      const merged = mergeWithConfig(results, { priority: 'failure' });
      expect(merged.isFailure()).toBe(true);
      if (merged.isFailure()) {
        expect(merged.value).toBe('error');
      }
    });

    test('success case works the same in both modes', () => {
      const successResults = [success(1), success(2)];
      const defaultMerge = mergeWithConfig(successResults, {
        priority: 'pending',
      });
      const strictMerge = mergeWithConfig(successResults, {
        priority: 'failure',
      });

      expect(defaultMerge.unwrapOr([])).toEqual([1, 2]);
      expect(strictMerge.unwrapOr([])).toEqual([1, 2]);
    });
  });

  describe('merge/mergeInOne', () => {
    test('combines success values in order', () => {
      const successResults = [success(1), success(2)];
      expect(merge(successResults).unwrapOr([])).toEqual([1, 2]);
    });

    test('returns first failure encountered', () => {
      const withFailure = [success(1), failure('error'), success(2)];
      expect(merge(withFailure).isFailure()).toBe(true);
    });

    test('preserves initial state', () => {
      const withInitial = [success(1), initial, success(2)];
      expect(merge(withInitial).isInitial()).toBe(true);
    });

    test('preserves pending state', () => {
      const withPending = [success(1), pending, success(2)];
      expect(merge(withPending).isPending()).toBe(true);
    });
  });
});

describe('equal method', () => {
  test('comparing success results with primitive values', () => {
    const v1 = success(10);
    const v2 = success(10);
    const v3 = success(20);

    expect(v1.equal(v2)).toBe(true);
    expect(v1.equal(v3)).toBe(false);
  });

  test('comparing success results with object values', () => {
    interface User {
      id: number;
      name: string;
    }

    const user1 = success<any, User>({ id: 1, name: 'Alice' });
    const user2 = success<any, User>({ id: 1, name: 'Bob' });
    const user3 = success<any, User>({ id: 2, name: 'Alice' });

    // Comparing entire objects
    expect(user1.equal(user1)).toBe(true);
    expect(user1.equal(user2)).toBe(false);

    // Comparing with field extractor
    expect(user1.equal(user2, (user) => user.id)).toBe(true);
    expect(user1.equal(user3, (user) => user.id)).toBe(false);
  });

  test('comparing initial states', () => {
    const a: Result<any, number> = initial;
    expect(a.equal(initial)).toBe(true);
    expect(a.equal(success<any, number>(10))).toBe(false);
  });

  test('comparing pending states', () => {
    const a: Result<any, number> = pending;
    expect(a.equal(pending)).toBe(true);
    expect(a.equal(success(10))).toBe(false);
  });

  test('comparing failure results', () => {
    const err1 = new Error('Test error');
    const err2 = new Error('Test error');
    const err3 = new Error('Different error');

    const f1 = failure(err1);
    const f2 = failure(err1);
    const f3 = failure(err2);
    const f4 = failure(err3);

    expect(f1.equal(f2)).toBe(true);
    expect(f1.equal(f3)).toBe(true); // Same error object
    expect(f1.equal(f4)).toBe(false);
  });

  test('comparing mixed states', () => {
    const s = success(10);
    const f = failure(new Error());
    const i = initial;
    const p = pending;

    expect(s.equal(f)).toBe(false);
    expect(i.equal(p)).toBe(false);
    expect(s.equal(i)).toBe(false);
    expect(f.equal(p)).toBe(false);
  });

  test('custom field extractor with complex objects', () => {
    interface Complex {
      nested: {
        value: number;
        name: string;
      };
    }

    const obj1 = success<Error, Complex>({
      nested: { value: 42, name: 'Test' },
    });
    const obj2 = success<Error, Complex>({
      nested: { value: 42, name: 'Different' },
    });

    expect(obj1.equal(obj2, (complex) => complex.nested.value)).toBe(true);
    expect(obj1.equal(obj2, (complex) => complex.nested.name)).toBe(false);
  });
});
