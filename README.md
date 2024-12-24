[Result Monad](https://en.wikibooks.org/wiki/Haskell/Understanding_monads) - monad represents some result in different states - Initial, Pending, Success and Failure. 

### Inspired by [RemoteData type](https://github.com/devexperts/remote-data-ts), but depends not on [fp-ts](https://github.com/gcanti/fp-ts) but on smaller [@sweet-monads](https://github.com/JSMonk/sweet-monads)

## Explanation
The problem it solving present is a very common one. You are loading a list of things but instead of showing a loading indicator you just see zero items. Same happens with actual data loading - sometimes you just do not think it will fail.

In my mental model, REST requests have one of four states:

* We haven't asked yet.
* We've asked, but we haven't got a response yet.
* We got a response, but it was an error.
* We got a response, and it was the data we wanted.

That is the purpose of this library - allow clean usage over this states.

Better explanation your can read in the artice [How Elm Slays a UI Antipattern](http://blog.jenkster.com/2016/06/how-elm-slays-a-ui-antipattern.html)

## Installation
> npm install @lonli-lokli/ts-result

## Usage
```typescript
import { Result, success } from "@lonli-lokli/ts-result";

class UserNotFoundError extends Error {
  name: "UserNotFoundError";
}
type User = { email: string; password: string };

function getUser(id: number): Result<UserNotFoundError, User> {
  return success({ email: "test@gmail.com", password: "test" });
}
// Result<UserNotFoundError, string>
const user = getUser(1).map(({ email }) => email);
```

## API

- [`chain`](#chain)
- [`merge`](#merge)
- [`mergeWithConfig`](#mergewithconfig)
- [`mergeInOne`](#mergeinone)
- [`mergeInMany`](#mergeinmany)
- [`initial`](#initial)
- [`pending`](#pending)
- [`failure`](#failure)
- [`success`](#success)
- [`from`](#from)
- [`fromPromise`](#fromPromise)
- [`fromTry`](#fromTry)
- [`fromMaybe`](#frommaybe)
- [`fromEither`](#fromeither)
- [`fromNullable`](#fromnullable)
- [`isResult`](#isresult)
- [`Result#isInitial`](#resultisinitial)
- [`Result#isPending`](#resultispending)
- [`Result#isFailure`](#resultisfailure)
- [`Result#isSuccess`](#resultissuccess)
- [`Result#or`](#resultor)
- [`Result#join`](#resultjoin)
- [`Result#map`](#resultmap)
- [`Result#mapSuccess`](#resultmapsuccess)
- [`Result#mapFailure`](#resultmapfailure)
- [`Result#asyncMap`](#resultasyncmap)
- [`Result#apply`](#resultapply)
- [`Result#asyncApply`](#resultasyncapply)
- [`Result#chain`](#resultchain)
- [`Result#asyncChain`](#resultasyncchain)
- [`Result#toEither`](#resulttoeither)
- [`Result#toMaybe`](#resulttomaybe)
- [`Result#toNullable`](#resulttonullable)
- [`Result#toUndefined`](#resulttoundefined)
- [`Result#unwrap`](#resultunwrap)
- [`Result#unwrapOr`](#resultunwrapor)
- [`Result#unwrapOrElse`](#resultunwraporelse)
- [`Result#fold`](#resultfold)
- [`Result#filter`](#resultfilter)
- [`Result#filtermap`](#resultfiltermap)
- [`Result#tap`](#resulttap)
- [`Result#tapFailure`](#resulttapfailure)
- [`Result#recover`](#resultrecover)
- [`Result#recoverWith`](#resultrecoverwith)
- [`Result#zip`](#resultzip)
- [`Result#zipWith`](#resultzipwith)
- [`Result#biMap`](#resultbimap)
- [`Helpers`](#helpers)

#### `chain`

```typescript
function chain<F, S, NF, NS>(fn: (val: S) => Result<NF, NS>): Result<F | NF, NS>;
```

- Returns a new Result by applying `fn` to the Success value of this Result
- State handling priority:
  1. If this Result is `Initial`, returns `Initial`
  2. If the next Result (returned by `fn`) is `Initial`, returns `Initial`
  3. If this Result is `Pending` or the next Result is `Pending`, returns `Pending`
  4. If this Result is `Failure`, returns `Failure` with current value
  5. If the next Result is `Failure`, returns `Failure` with next value
  6. Otherwise returns the next Result

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());
const v3 = initial;

// Result<Error | TypeError, string>.Success with value "2"
const newVal1 = v1.chain(a => success<TypeError, string>(a.toString()));

// Result<Error | TypeError, string>.Failure with value new TypeError()
const newVal2 = v1.chain(a => failure<TypeError, string>(new TypeError()));

// Result<Error | TypeError, string>.Failure with value new Error()
const newVal3 = v2.chain(a => success<TypeError, string>(a.toString()));

// Result<Error | TypeError, string>.Failure with value new Error()
const newVal4 = v2.chain(a => failure<TypeError, string>(new TypeError()));

// Result<TypeError, string>.Initial with no value
const newVal5 = v3.chain(a => failure<TypeError, string>(new TypeError()));
```

The chain method is particularly useful when you need to sequence operations that might fail or be in different states. It handles all possible state combinations according to the priority rules above.

#### `merge`

Alias for [`mergeInOne`](#mergeinone)

```typescript
function merge<F1, S1>(values: [Result<F1, S1>]): Result<F1, [S1]>;
function merge<F1, S1, F2, S2>(values: [Result<F1, S1>, Result<F2, S2>]): Result<F1 | F2, [S1, S2]>;
function merge<F1, S1, F2, S2, F3, S3>(
  values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>]
): Result<F1 | F2 | F3, [S1, S2, S3]>;
// ... until 10 elements
```

- `values: Array<Result<F, S>>` - Array of Result values which will be merged into Result of Array
- Returns `Result<F, Array<S>>` which will contain `Success<Array<S>>` if all of array elements was `Success<R>`, `Failure<F>`if all of array elements was `Failure<F>`, `Initial` if at least one `Initial`, otherwise `Pending`.

Example:

```typescript
const v1 = initial; // Result<never, never>.Initial
const v2 = pending; // Result<never, never>.Pending
const v3 = success<TypeError, number>(2); // Result<TypeError, number>.Success
const v4 = success<ReferenceError, string>("test"); // Result<ReferenceError, string>.Success
const v5 = failure<Error, boolean>(new Error()); // Result<Error, boolean>.Failure

const r1 = merge([v1, v2]); // Result<never, [number, number]>.Initial
const r2 = merge([v2, v5]); // Result<Error, [never, boolean]>.Pending
const r3 = merge([v3, v4]); // Result<TypeError | ReferenceError, [number, string]>.Success
const r4 = merge([v3, v4, v5]); // Result<TypeError | Error | ReferenceError, [number, string, boolean]>.Failure
```
#### `mergeWithConfig`

```typescript
function mergeWithConfig<F, S>(values: Result<F, S>[], config: { priority: 'failure' | 'pending' }): Result<F, S[]>;
```

Merges an array of Results with configurable priority between states.

Default behavior (priority: 'pending'):
1. Returns Initial if ANY Result is Initial
2. Returns Pending if ANY Result is Pending (and none are Initial)
3. Returns Failure if ANY Result is Failure (and none are Initial/Pending)
4. Returns Success only if ALL Results are Success

Failure priority (priority: 'failure'):
1. Returns Failure if ANY Result is Failure
2. Returns Initial if ANY Result is Initial
3. Returns Pending if ANY Result is Pending
4. Returns Success only if ALL Results are Success

```typescript
const v1 = success<string, number>(1);
const v2 = failure('error');
const v3 = pending as Result<string, number>;

// Default behavior - Pending takes precedence
mergeWithConfig([v1, v2, v3], { priority: 'pending' }); // Result.Pending

// Failure priority
mergeWithConfig([v1, v2, v3], { priority: 'failure' }); // Result.Failure('error')
```

#### `mergeInOne`

```typescript
function merge<F1, S1>(values: [Result<F1, S1>]): Result<F1, [S1]>;
function merge<F1, S1, F2, S2>(values: [Result<F1, S1>, Result<F2, S2>]): Result<F1 | F2, [S1, S2]>;
function merge<F1, S1, F2, S2, F3, S3>(
  values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>]
): Result<F1 | F2 | F3, [S1, S2, S3]>;
// ... until 10 elements
```

- `values: Array<Result<F, S>>` - Array of Result values which will be merged into Result of Array
- Returns `Result<F, Array<S>>` which will contain `Success<Array<S>>` if all of array elements was `Success<R>`, `Failure<F>`if all of array elements was `Failure<F>`, `Initial` if at least one `Initial`, otherwise `Pending`.

Example:

```typescript
const v1 = initial; // Result<TypeError, number>.Initial
const v2 = pending; // Result<TypeError, number>.Pending
const v3 = success<TypeError, number>(2); // Result<TypeError, number>.Success
const v4 = success<ReferenceError, string>("test"); // Result<ReferenceError, string>.Success
const v5 = failure<Error, boolean>(new Error()); // Result<Error, boolean>.Failure

const r1 = merge([v1, v2]); // Result<TypeError, [number, number]>.Initial
const r2 = merge([v2, v5]); // Result<TypeError | Error, [number, boolean]>.Pending
const r3 = merge([v3, v4]); // Result<TypeError | ReferenceError, [number, string]>.Success
const r4 = merge([v3, v4, v5]); // Result<TypeError | ReferenceError | Error, [number, string, boolean]>.Failure
```

#### `mergeInMany`

```typescript
static mergeInMany<F1, S1>(values: [Result<F1, S1>]): Result<Array<F1>, [S1]>;
static mergeInMany<F1, S1, F2, S2>(values: [Result<F1, S1>, Result<F2, S2>]): Result<Array<F1 | F2>, [S1, S2]>;
static mergeInMany<F1, S1, F2, S2, F3, S3>(
  values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>]
): Result<Array<F1 | F2 | F3>, [S1, S2, S3]>;
// ... until 10 elements
```

- `values: Array<Result<F, S>>` - Array of Result values which will be merged into Result of Array
- Returns `Result<Array<F>, Array<S>>` which will contain `Success<Array<S>>` if all of array elements was `Success<R>` otherwise array of all catched `Failure<F>` values.

Example:

```typescript
const v1 = success<TypeError, number>(2); // Result<TypeError, number>.Success
const v2 = failure<ReferenceError, string>("test"); // Result<ReferenceError, string>.Success
const v3 = failure<Error, boolean>(new Error()); // Result<Error, boolean>.Failure

merge([v1, v2]); // Result<Array<TypeError | ReferenceError>, [number, string]>.Success
merge([v1, v2, v3]); // Result<Array<TypeError | ReferenceError | Error>, [number, string, boolean]>.Failure
```

#### `initial`

```typescript
const initial: Result<never, never>;
```

- Returns `Result` with `Initial` state which does not contain value.

Example:

```typescript
const v1 = initial; // Result<undefined, never>.Initial
```

#### `pending`

```typescript
const pending: Result<F, S>;
```

- Returns `Result` with `Pending` state which does not contain value.

Example:

```typescript
const v1 = pending; // Result<never, never>.Initial
```

#### `failure`

```typescript
function failure<F, S>(value: F): Result<F, S>;
```

- Returns `Result` with `Failure` state which contain value with `F` type.

Example:

```typescript
const v1 = failure(new Error()); // Result<Error, never>.Failure
const v2 = failure<Error, number>(new Error()); // Result<Error, number>.Failure
```

#### `success`

```typescript
function success<F, S>(value: S): Result<F, S>;
```

- Returns `Result` with `Success` state which contain value with `S` type.

Example:

```typescript
const v1 = success(2); // Result<never, number>.Success
const v2 = success<Error, number>(2); // Result<Error, number>.Success
```

#### `from`

Alias for [`success`](#success)

```typescript
function from<S>(value: S): Result<never, S>;
```

- Returns `Result` with `Success` state which contain value with `S` type.

Example:

```typescript
from(2); // Result<never, number>.Success
```

#### `fromTry`

Returns `Success` with function result or `Failure` if function execution throws an error.

```typescript
function fromTry<L, R>(fn: () => R): Result<L, R>;
```

```typescript
fromTry(() => 2); // Result<unknown, number>.Success
fromTry(() => {
  throw new Error("test");
}); // Result<unknown, never>.Failure
```


#### `fromPromise`

Returns promise of `Success` if the provided promise fulfilled or `Failure` with the error value if the provided promise rejected.

```typescript
function fromPromise<F, S>(promise: Promise<S>): Promise<Result<F, S>>;
```

```typescript
fromPromise(Promise.resolve(2)); // Promise<Result<unknown, number>.Right>
fromPromise(Promise.reject(new Error("test"))); // Promise<Result<unknown, never>.Left>
```

#### `fromMaybe`

```typescript
function fromMaybe<never, S>(value: Maybe<S>): Result<never, S>;
```

- Creates `Result` from `Maybe` in `Initial` or `Success` state.

Example:

```typescript
fromMaybe(just(2)); // Result<never, number>.Success
fromMaybe(none()); // Result<never, number>.Initial
```

#### `fromEither`

```typescript
function fromEither<F, S>(value: Either<F, S>): Result<F, S>;
```

- Creates `Result` from `Either` in `Failure` or `Success` state.

Example:

```typescript
fromEither(right<string, number>(10)); // Result<string, number>.Success
```

#### `fromNullable`

```typescript
function fromNullable<T>(value: T): Result<unknown, NonNullable<T>>;
```

- Creates `Result` with `Success` state which contain value with `T` type if value is not null or undefined and `initial` otherwise.

Example:

```typescript
fromNullable(10); // Result<unknown, number>.Success
fromNullable(null as Nullable<number>); // Result<unknown, number>.Initial
```

#### `isResult`

```typescript
function isResult<F, S>(value: unknown | Result<F, S>): value is Result<F, S>;
```

- Returns `boolean` if given `value` is instance of Result constructor.

Example:

```typescript
const value: unknown = 2;
if (isResult(value)) {
  // ... value is Result<unknown, unknown> at this block
}
```

#### `Result#isInitial`

```typescript
function isInitial(): boolean;
```

- Returns `true` if state of `Result` is `Initial` otherwise `false`

Example:

```typescript
const v1 = success(2);
const v2 = failure(2);
const v3 = initial();

v1.isInitial(); // false
v2.isInitial(); // false
v3.isInitial(); // true
```

#### `Result#isPending`

```typescript
function isPending(): boolean;
```

- Returns `true` if state of `Result` is `Pending` otherwise `false`

Example:

```typescript
const v1 = success(2);
const v2 = failure(2);
const v3 = pending();

v1.isPending(); // false
v2.isPending(); // false
v3.isPending(); // true
```

#### `Result#isFailure`

```typescript
function isFailure(): boolean;
```

- Returns `true` if state of `Result` is `Failure` otherwise `false`

Example:

```typescript
const v1 = success(2);
const v2 = failure(2);

v1.isFailure(); // false
v2.isFailure(); // true
```

#### `Result#isSuccess`

```typescript
function isSuccess(): boolean;
```

- Returns `true` if state of `Result` is `Success` otherwise `false`

Example:

```typescript
const v1 = success(2);
const v2 = failure(2);

v1.isSuccess(); // true
v2.isSuccess(); // false
```

#### `Result#or`

```typescript
function or<F, S>(x: Result<F, S>): Result<F, S>;
```

- Returns `Result<F, S>`. If state of `this` is `Success` then `this` will be returned otherwise `x` argument will be returned

Example:

```typescript
const v1 = success<string, number>(2);
const v2 = failure<string, number>("Error 1");
const v3 = failure<string, number>("Error 2");
const v4 = success<string, number>(3);
const v5 = initial();

v1.or(v2); // v1 will be returned
v2.or(v1); // v1 will be returned
v2.or(v3); // v3 will be returned
v1.or(v4); // v1 will be returned
v5.or(v1); // v1 will be returned

v2.or(v3).or(v1); // v1 will be returned
v2.or(v1).or(v3); // v1 will be returned
v1.or(v2).or(v3); // v1 will be returned
v2.or(v5).or(v3); // v3 will be returned
```

#### `Result#join`

```typescript
function join<F1, F2, S>(this: Result<F1, Result<F2, S>>): Result<F1 | F2, S>;
```

- `this: Result<F1, Result<F2, R>>` - `Result` instance which contains other `Result` instance as `Success` value.
- Returns unwrapped `Result` - if current `Result` has `Success` state and inner `Result` has `Success` state then returns inner `Result` `Success`, if inner `Result` has `Failure` state then return inner `Result` `Failure` otherwise outer `Result` `Failure`.

Example:

```typescript
const v1 = success(success(2));
const v2 = success(failure(new Error()));
const v3 = failure<TypeError, Result<Error, number>>(new TypeError());

v1.join(); // Result.Success with value 2
v2.join(); // Result.Failure with value new Error
v3.join(); // Result.Failure with value new TypeError
```

#### `Result#map`

Alias for [`Result#mapSuccess`](#resultmapsuccess)

```typescript
function map<F, S, NewS>(fn: (val: S) => NewS): Result<F, NewS>;
```

- Returns mapped by `fn` function value wrapped by `Result` if `Result` is `Success` otherwise `Result` with current value

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());

const newVal1 = v1.map(a => a.toString()); // Result<Error, string>.Success with value "2"
const newVal2 = v2.map(a => a.toString()); // Result<Error, string>.Failure with value new Error()
```

#### `Result#mapSuccess`

```typescript
function mapSuccess<F, S, NewS>(fn: (val: S) => NewS): Result<F, NewS>;
```

- Returns mapped by `fn` function value wrapped by `Result` if `Result` is `Success` otherwise `Result` with current value

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());

const newVal1 = v1.mapSuccess(a => a.toString()); // Result<Error, string>.Success with value "2"
const newVal2 = v2.mapSuccess(a => a.toString()); // Result<Error, string>.Failure with value new Error()
```

#### `Result#mapLeft`

```typescript
function mapFailure<F, S, NewF>(fn: (val: F) => NewF): Result<NewF, S>;
```

- Returns mapped by `fn` function value wrapped by `Result` if `Result` is `Failure` otherwise `Result` with current value

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());

const newVal1 = v1.mapFailure(a => a.toString()); // Result<string, number>.Right with value 2
const newVal2 = v2.mapFailure(a => a.toString()); // Result<string, number>.Left with value "Error"
```

##### `Result#asyncMap`

```typescript
function asyncMap<F, S, NewS>(fn: (val: S) => Promise<NewS>): Promise<Result<F, NewS>>;
```

- Returns `Promise` with mapped by `fn` function value wrapped by `Result` if `Result` is `Success` otherwise `Result` with current value

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());

// Promise<Result<Error, string>.Success> with value "2"
const newVal1 = v1.asyncMap(a => Promise.resolve(a.toString()));
// Promise<Result<Error, string>.Failure> with value new Error()
const newVal2 = v2.asyncMap(a => Promise.resolve(a.toString()));
```

##### `Result#apply`

```typescript
function apply<F, S, B>(this: Result<F, (a: S) => B>, arg: Result<F, S>): Result<F, B>;
function apply<F, S, B>(this: Result<F, S>, fn: Result<F, (a: S) => B>): Result<F, B>;
```

- `this | fn` - function wrapped by Result, which should be applied to value `arg`
- `arg | this` - value which should be applied to `fn`
- Returns mapped by `fn` function value wrapped by `Result` if `Result` is `Success` otherwise `Result` with current value

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());
const fn1 = success<Error, (a: number) => number>((a: number) => a * 2);
const fn2 = failure<Error, (a: number) => number>(new Error());

const newVal1 = fn1.apply(v1); // Result<Error, number>.Right with value 4
const newVal2 = fn1.apply(v2); // Result<Error, number>.Left with value new Error()
const newVal3 = fn2.apply(v1); // Result<Error, number>.Left with value new Error()
const newVal4 = fn2.apply(v2); // Result<Error, number>.Left with value new Error()
```

##### `Result#asyncApply`

Async variant of [`Result#apply`](#resultapply)

```typescript
asyncApply<F, S, B>(
  this: Result<F, (a: Promise<S> | S) => Promise<B>>,
  arg: Result<F, Promise<S>>): Promise<Result<F, B>>;
asyncApply<F, S, B>(
  this: Result<F, Promise<S>>,
  fn: Result<F, Promise<(a: Promise<S> | S) => B>>): Promise<Result<F, B>>;
```

- `this | fn` - function wrapped by Result, which should be applied to value `arg`
- `arg | this` - value which should be applied to `fn`
- Returns `Promise` with mapped by `fn` function value wrapped by `Result` if `Result` is `Success` otherwise `Result` with current value

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());
const fn1 = success<Error, (a: number) => Promise<number>>((a: number) => Promise.resolve(a * 2));
const fn2 = failure<Error, (a: number) => Promise<number>>(new Error());

const newVal1 = fn1.asyncApply(v1); // Promise<Either<Error, number>.Right> with value 4
const newVal2 = fn1.asyncApply(v2); // Promise<Either<Error, number>.Left> with value new Error()
const newVal3 = fn2.asyncApply(v1); // Promise<Either<Error, number>.Left> with value new Error()
const newVal4 = fn2.asyncApply(v2); // Promise<Either<Error, number>.Left> with value new Error()
```

#### `Result#chain`

```typescript
function chain<F, S, NF, NS>(fn: (val: S) => Result<NF, NS>): Result<F | NF, NS>;
```

- Returns a new Result by applying `fn` to the Success value of this Result
- State handling priority:
  1. If this Result is `Initial`, returns `Initial`
  2. If the next Result (returned by `fn`) is `Initial`, returns `Initial`
  3. If this Result is `Pending` or the next Result is `Pending`, returns `Pending`
  4. If this Result is `Failure`, returns `Failure` with current value
  5. If the next Result is `Failure`, returns `Failure` with next value
  6. Otherwise returns the next Result

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());
const v3 = initial;

// Result<Error | TypeError, string>.Success with value "2"
const newVal1 = v1.chain(a => success<TypeError, string>(a.toString()));

// Result<Error | TypeError, string>.Failure with value new TypeError()
const newVal2 = v1.chain(a => failure<TypeError, string>(new TypeError()));

// Result<Error | TypeError, string>.Failure with value new Error()
const newVal3 = v2.chain(a => success<TypeError, string>(a.toString()));

// Result<Error | TypeError, string>.Failure with value new Error()
const newVal4 = v2.chain(a => failure<TypeError, string>(new TypeError()));

// Result<TypeError, string>.Initial with no value
const newVal5 = v3.chain(a => failure<TypeError, string>(new TypeError()));
```

The chain method is particularly useful when you need to sequence operations that might fail or be in different states. It handles all possible state combinations according to the priority rules above.

##### `Result#asyncChain`

```typescript
function asyncChain<F, S, NewF, NewS>(fn: (val: S) => Promise<Result<NewF, NewS>>): Promise<Result<F | NewF, NewS>>;
```

- Returns `Promise` with mapped by `fn` function value wrapped by `Result` if `Result` is `Success` and returned by `fn` value is `Success` too otherwise `Result` in other state, `Initial` pwns `Pending` and `Failure`.

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());
const v3 = initial;

// Promise<Result<Error | TypeError, string>.Success> with value "2"
const newVal1 = v1.asyncChain(a => Promise.resolve(right<TypeError, string>(a.toString())));
// Promise<Result<Error | TypeError, string>.Failure> with value new TypeError()
const newVal2 = v1.asyncChain(a => Promise.resolve(left<TypeError, string>(new TypeError()));
// Promise<Result<Error | TypeError, string>.Failure> with value new Error()
const newVal3 = v2.asyncChain(a => Promise.resolve(right<TypeError, string>(a.toString())));
// Promise<Result<Error | TypeError, string>.Failure> with value new Error()
const newVal4 = v2.asyncChain(a => Promise.resolve(left<TypeError, string>(new TypeError())));
// Promise<Result<Error | TypeError, string>.Initial> with no value
const newVal5 = v3.asyncChain(a => Promise.resolve(failure<TypeError, string>(new TypeError())));
```

#### `Result#toEither`

```typescript
function toEither<F, S>(onInitial: () => F, onPending: () => F): Either<F, S>;
```

- Converts `Result` into `Either` in `Left` or `Success` state with fallbacks for `Initial` and `Pending` states.

Example:

```typescript
success<string, number>(10).toEither(
  () => "initial state",
  () => "pending state"
); // Either<string, number>.Right
```

#### `Result#toMaybe`

```typescript
function toMaybe<S>(): Maybe<S>;
```

- Converts `Result` into `Maybe` in `Just` state if `Result` is in `Success` state or to `Maybe` in `None` state otherwise.

Example:

```typescript
success<string, number>(10).toMaybe(); // Maybe<number>.Just
```

#### `Result#toNullable`

```typescript
function toNullable<S>(): S | null;
```

- Returns S if `Result` is in `Success` state and null otherwise

Example:

```typescript
success<string, number>(10).toNullable(); // number | null
```

#### `Result#toUndefined`

```typescript
function toUndefined<S>(): S | undefined;
```

- Returns S if `Result` is in `Success` state and undefined otherwise

Example:

```typescript
success<string, number>(10).toUndefined(); // number | undefined
```

#### `Result#unwrap`

```typescript
function unwrap<S>(): S;
```

- Returns S if `Result` is in `Success` state and throws otherwise via provided factory or pure Error

Example:

```typescript
success<string, number>(10).unwrap(); // number
initial.unwrap(); // throws default (Error)
pending.unwrap({ failure: () => new Error('Custom')}); // throws  custom (Error)
```

#### `Result#unwrapOr`

```typescript
function unwrapOr<S>(s: S): S;
```

- Returns the success value if Result is Success, otherwise returns the provided default value.

Example:

```typescript
const v1 = success<Error, number>(2);
const v2 = failure<Error, number>(new Error());
v1.unwrapOr(3); // returns 2
v2.unwrapOr(3); // returns 3
```
#### `Result#unwrapOrElse`

```typescript
function unwrapOrElse(f: (l: F) => S): S;
```

- Returns the success value if Result is Success, otherwise returns the result of calling the provided function with the failure value.


Example:

```typescript
const v1 = success<number, number>(2);
const v2 = failure<number, number>(3);
v1.unwrapOrElse(x => x * 2); // returns 2
v2.unwrapOrElse(x => x *2); // returns 6
```

#### `Result#fold`

```typescript
function fold<D>(onInitial: () => D, onPending: () => D, onFailure: (failure: F) => D, onSuccess: (success: S) => D): D;
```

- Transforms the Result value into type D by providing handlers for all possible states
- Parameters:
  - `onInitial: () => D` - Handler for Initial state
  - `onPending: () => D` - Handler for Pending state
  - `onFailure: (failure: F) => D` - Handler for Failure state, receives the failure value
  - `onSuccess: (success: S) => D` - Handler for Success state, receives the success value
- Returns the result of calling the appropriate handler based on the Result state

Example:

```typescript
const onInitial = () => "it's initial"
const onPending = () => "it's pending"
const onFailure = (err) => "it's failure"
const onSuccess = (data) => `${data + 1}`

const v1 = initial;
const v2 = pending;
const v3 = failure<string, number>('error');
const v4 = success<string, number>(21);

v1.fold(onInitial, onPending, onFailure, onSuccess) // "it's initial"
v2.fold(onInitial, onPending, onFailure, onSuccess) // "it's pending"
v3.fold(onInitial, onPending, onFailure, onSuccess) // "it's failure"
v4.fold(onInitial, onPending, onFailure, onSuccess) // "22"
```

The fold method is particularly useful when you need to handle all possible states of a Result and transform them into a single type. This pattern is common when you need to:
- Display different UI states
- Convert Result states into a common format
- Handle all possible outcomes in a type-safe way

#### `Result#filter`

```typescript
function filter(predicate: (value: S) => boolean): Result<F | S, S>;
```

Validates a Success value using a predicate. If the predicate returns false, converts the Success to a Failure using the success value.

```typescript
// Age validation
const age = success<string, number>(15);
const isAdult = age.filter(age => age >= 18);
// Result<string | number, number>.Failure with value 15

// Chaining validations
const validAge = success<string, number>(25)
  .filter(age => age >= 0)    // minimum age
  .filter(age => age <= 120); // maximum age
// Result<string | number, number>.Success with value 25
```

#### `Result#filterMap`

```typescript
function filterMap<NS>(f: (value: S) => Result<S, NS>): Result<F | S, NS>;
```

Combines filtering and mapping in one operation. Useful for transformations that might fail.

```typescript
const parseIfPositive = (n: number) => 
  n > 0 ? success(n.toString()) : failure(n);

success(5).filterMap(parseIfPositive)
// Result<number, string>.Success with value "5"

success(-1).filterMap(parseIfPositive)
// Result<number, string>.Failure with value -1
```

```typescript
failure('error').filter(x => true)    // stays Failure
initial.filter(x => true)             // stays Initial
pending.filter(x => true)             // stays Pending

failure('error').filterMap(fn)        // stays Failure
initial.filterMap(fn)                 // stays Initial
pending.filterMap(fn)                 // stays Pending
```

#### `Result#tap`

```typescript
function tap(f: (value: S) => void): Result<F, S>;
```

Executes a side effect function if the Result is Success, then returns the original Result unchanged.
Useful for logging, debugging, or other side effects without modifying the Result chain.

```typescript
success(5)
  .tap(x => console.log('Value:', x)) // logs "Value: 5"
  .map(x => x * 2);                   // Result<never, number>.Success(10)

failure('error')
  .tap(x => console.log('Value:', x)) // nothing logged
  .map(x => x * 2);                   // Result<string, number>.Failure('error')
```

#### `Result#tapFailure`

```typescript
function tapFailure(f: (value: F) => void): Result<F, S>;
```

Executes a side effect function if the Result is Failure, then returns the original Result unchanged.
Useful for error logging or debugging without modifying the Result chain.

```typescript
success<Error, number>(5)
  .tapFailure(e => console.error(e)) // nothing logged
  .map(x => x * 2);                  // Result<Error, number>.Success(10)

failure(new Error('oops'))
  .tapFailure(e => console.error(e)) // logs Error: oops
  .map(x => x * 2);                  // Result<Error, number>.Failure(Error: oops)
```


#### `Result#recover`

```typescript
function recover(value: S): Result<F, S>;
```

Recovers from a Failure state by providing a default success value.

```typescript
const v1 = failure<string, number>('error');
const v2 = success<string, number>(5);

v1.recover(42);  // Result<string, number>.Success with value 42
v2.recover(42);  // Result<string, number>.Success with value 5 (unchanged)
```

#### `Result#recoverWith`

```typescript
function recoverWith<NF, NS>(f: (error: F) => Result<NF, NS>): Result<NF, NS | S>;
```

Recovers from a Failure state by applying a function that returns a new Result.
Useful for handling specific error cases differently or transforming errors.

```typescript
const handler = (error: string): Result<Error, number> => 
  error === 'known' ? success(42) : failure(new Error('still failed'));

failure('known').recoverWith(handler);     // Result<Error, number>.Success(42)
failure('unknown').recoverWith(handler);    // Result<Error, number>.Failure(Error: still failed)
success<string, number>(5).recoverWith(handler); // Result<Error, number>.Success(5)

// Initial and Pending states pass through
initial.recoverWith(handler);              // Result.Initial
pending.recoverWith(handler);              // Result.Pending
```


#### `Result#zip`

```typescript
function zip<F2, S2>(other: Result<F2, S2>): Result<F | F2, [S, S2]>;
```

Combines two Results into a Result containing a tuple of their success values.
Returns Failure if either Result is a Failure.

```typescript
const num = success<string, number>(2);
const str = success<Error, string>('test');

num.zip(str) // Result<string | Error, [number, string]>.Success([2, 'test'])
num.zip(failure('error')) // Result<string | Error, [number, string]>.Failure('error')
```

#### `Result#zipWith`

```typescript
function zipWith<F2, S2, R>(
  other: Result<F2, S2>,
  f: (a: S, b: S2) => R
): Result<F | F2, R>;
```

Combines two Results using a function. Returns Failure if either Result is a Failure.

```typescript
const num1 = success<string, number>(2);
const num2 = success<Error, number>(3);

num1.zipWith(num2, (a, b) => a + b) // Result<string | Error, number>.Success(5)
num1.zipWith(failure('error'), (a, b) => a + b) // Result<string | Error, number>.Failure('error')
```

#### `Result#bimap`

```typescript
function bimap<NF, NS>(
  failureMap: (f: F) => NF,
  successMap: (s: S) => NS
): Result<NF, NS>;
```

Maps both the Failure and Success values of a Result simultaneously. Useful for transforming both possible outcomes in one operation.

```typescript
const result = success<string, number>(42);

// Transform both success and failure values
const transformed = result.bimap(
  (error: string) => new Error(error), // transform failure
  (value: number) => value.toString()  // transform success
);
// Result<Error, string>.Success('42')

const failed = failure<string, number>('oops');
const transformedFailure = failed.bimap(
  (error: string) => new Error(error),
  (value: number) => value.toString()
);
// Result<Error, string>.Failure(Error: oops)

// Initial and Pending states pass through unchanged
initial.bimap(f, s)  // Result.Initial
pending.bimap(f, s)  // Result.Pending
```

#### Helpers

```typescript
// Value from Result instance
const { value } = success<Error, number>(2); // number | Error | undefined
const { value } = success(2); // number | undefined
const { value } = failure<Error, number>(new Error()); // number | Error | undefined
const { value } = failure(new Error()); // Error | undefined
```

## Development


## License

MIT (c)