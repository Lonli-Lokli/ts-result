import { type Either, left, right } from '@sweet-monads/either';
import type {
  Alternative,
  AsyncMonad,
  Container,
} from '@sweet-monads/interfaces';
import { just, type Maybe, none } from '@sweet-monads/maybe';

const enum ResultType {
  Initial = 'Initial',
  Pending = 'Pending',
  Success = 'Success',
  Failure = 'Failure',
}

function isWrappedFunction<A, B, L>(
  m: Result<L, A | Promise<A>> | Result<L, (a: A) => B>,
): m is Result<L, (a: A) => B> {
  return !m.isInitial() && !m.isPending() && typeof m.value === 'function';
}

class ResultConstructor<F, S, T extends ResultType = ResultType>
  implements AsyncMonad<S>, Alternative<T>, Container<S>
{
  static chain<F, S, NR>(
    f: (v: S) => Promise<Result<never, NR>>,
  ): (m: Result<F, S>) => Promise<Result<F, NR>>;
  static chain<F, S, NF>(
    f: (v: S) => Promise<Result<NF, never>>,
  ): (m: Result<F, S>) => Promise<Result<NF | F, S>>;
  static chain<F, S, NL, NR>(
    f: (v: S) => Promise<Result<NL, NR>>,
  ): (m: Result<F, S>) => Promise<Result<NL | F, NR>>;
  static chain<F = never, S = never, NF = never, NS = never>(
    f: (v: S) => Promise<Result<NF, NS>>,
  ) {
    return (m: Result<F, S>): Promise<Result<F | NF, NS>> => m.asyncChain(f);
  }

  static mergeInOne<F1, S1>(values: [Result<F1, S1>]): Result<F1, [S1]>;
  static mergeInOne<F1, S1, F2, S2>(
    values: [Result<F1, S1>, Result<F2, S2>],
  ): Result<F1 | F2, [S1, S2]>;
  static mergeInOne<F1, S1, F2, S2, F3, S3>(
    values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>],
  ): Result<F1 | F2 | F3, [S1, S2, S3]>;
  static mergeInOne<F1, S1, F2, S2, F3, S3, F4, S4>(
    values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>, Result<F4, S4>],
  ): Result<F1 | F2 | F3 | F4, [S1, S2, S3, S4]>;
  static mergeInOne<F1, S1, F2, S2, F3, S3, F4, S4, F5, S5>(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
    ],
  ): Result<F1 | F2 | F3 | F4 | F5, [S1, S2, S3, S4, S5]>;
  static mergeInOne<F1, S1, F2, S2, F3, S3, F4, S4, F5, S5, F6, S6>(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
    ],
  ): Result<F1 | F2 | F3 | F4 | F5 | F6, [S1, S2, S3, S4, S5, S6]>;
  static mergeInOne<F1, S1, F2, S2, F3, S3, F4, S4, F5, S5, F6, S6, F7, S7>(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
    ],
  ): Result<F1 | F2 | F3 | F4 | F5 | F6 | F7, [S1, S2, S3, S4, S5, S6, S7]>;
  static mergeInOne<
    F1,
    S1,
    F2,
    S2,
    F3,
    S3,
    F4,
    S4,
    F5,
    S5,
    F6,
    S6,
    F7,
    S7,
    F8,
    S8,
  >(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
      Result<F8, S8>,
    ],
  ): Result<
    F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8,
    [S1, S2, S3, S4, S5, S6, S7, S8]
  >;
  static mergeInOne<
    F1,
    S1,
    F2,
    S2,
    F3,
    S3,
    F4,
    S4,
    F5,
    S5,
    F6,
    S6,
    F7,
    S7,
    F8,
    S8,
    F9,
    S9,
  >(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
      Result<F8, S8>,
      Result<F9, S9>,
    ],
  ): Result<
    F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9,
    [S1, S2, S3, S4, S5, S6, S7, S8, S9]
  >;
  static mergeInOne<
    F1,
    S1,
    F2,
    S2,
    F3,
    S3,
    F4,
    S4,
    F5,
    S5,
    F6,
    S6,
    F7,
    S7,
    F8,
    S8,
    F9,
    S9,
    F10,
    S10,
  >(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
      Result<F8, S8>,
      Result<F9, S9>,
      Result<F10, S10>,
    ],
  ): Result<
    F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9 | F10,
    [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10]
  >;
  static mergeInOne<F, S>(result: Array<Result<F, S>>): Result<F, S[]>;
  static mergeInOne(results: Array<Result<unknown, unknown>>) {
    return results.reduce(
      (acc: Result<unknown, Array<unknown>>, curr) =>
        curr.chain((v) => acc.map((arr) => arr.concat([v]))),
      ResultConstructor.success<unknown, Array<unknown>>([]),
    );
  }

  static merge = ResultConstructor.mergeInOne;

  static mergeWithConfig<F, S>(
    values: Result<F, S>[],
    config: { priority: 'failure' | 'pending' },
  ): Result<F, S[]> {
    if (config.priority === 'failure') {
      const failures = values.filter((r) => r.isFailure());
      if (failures.length > 0) {
        return failure(failures[0]!.value as F);
      }
    }

    const initials = values.filter((r) => r.isInitial());
    if (initials.length > 0) {
      return initial;
    }

    const pendings = values.filter((r) => r.isPending());
    if (pendings.length > 0) {
      return pending;
    }

    const failures = values.filter((r) => r.isFailure());
    if (failures.length > 0) {
      return failure(failures[0]!.value as F);
    }

    const successes = values.filter((r) => r.isSuccess());
    if (successes.length === values.length) {
      return success(successes.map((r) => r.value as S));
    }

    return initial;
  }

  static mergeInMany<F1, S1>(values: [Result<F1, S1>]): Result<Array<F1>, [S1]>;
  static mergeInMany<F1, S1, F2, S2>(
    values: [Result<F1, S1>, Result<F2, S2>],
  ): Result<Array<F1 | F2>, [S1, S2]>;
  static mergeInMany<F1, S1, F2, S2, F3, S3>(
    values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>],
  ): Result<Array<F1 | F2 | F3>, [S1, S2, S3]>;
  static mergeInMany<F1, S1, F2, S2, F3, S3, F4, S4>(
    values: [Result<F1, S1>, Result<F2, S2>, Result<F3, S3>, Result<F4, S4>],
  ): Result<Array<F1 | F2 | F3 | F4>, [S1, S2, S3, S4]>;
  static mergeInMany<F1, S1, F2, S2, F3, S3, F4, S4, F5, S5>(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
    ],
  ): ResultConstructor<Array<F1 | F2 | F3 | F4 | F5>, [S1, S2, S3, S4, S5]>;
  static mergeInMany<F1, S1, F2, S2, F3, S3, F4, S4, F5, S5, F6, S6>(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
    ],
  ): Result<Array<F1 | F2 | F3 | F4 | F5 | F6>, [S1, S2, S3, S4, S5, S6]>;
  static mergeInMany<F1, S1, F2, S2, F3, S3, F4, S4, F5, S5, F6, S6, F7, S7>(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
    ],
  ): Result<
    Array<F1 | F2 | F3 | F4 | F5 | F6 | F7>,
    [S1, S2, S3, S4, S5, S6, S7]
  >;
  static mergeInMany<
    F1,
    S1,
    F2,
    S2,
    F3,
    S3,
    F4,
    S4,
    F5,
    S5,
    F6,
    S6,
    F7,
    S7,
    F8,
    S8,
  >(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
      Result<F8, S8>,
    ],
  ): ResultConstructor<
    Array<F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8>,
    [S1, S2, S3, S4, S5, S6, S7, S8]
  >;
  static mergeInMany<
    F1,
    S1,
    F2,
    S2,
    F3,
    S3,
    F4,
    S4,
    F5,
    S5,
    F6,
    S6,
    F7,
    S7,
    F8,
    S8,
    F9,
    S9,
  >(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
      Result<F8, S8>,
      Result<F9, S9>,
    ],
  ): Result<
    Array<F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9>,
    [S1, S2, S3, S4, S5, S6, S7, S8, S9]
  >;
  static mergeInMany<
    F1,
    S1,
    F2,
    S2,
    F3,
    S3,
    F4,
    S4,
    F5,
    S5,
    F6,
    S6,
    F7,
    S7,
    F8,
    S8,
    F9,
    S9,
    F10,
    S10,
  >(
    values: [
      Result<F1, S1>,
      Result<F2, S2>,
      Result<F3, S3>,
      Result<F4, S4>,
      Result<F5, S5>,
      Result<F6, S6>,
      Result<F7, S7>,
      Result<F8, S8>,
      Result<F9, S9>,
      Result<F10, S10>,
    ],
  ): Result<
    Array<F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9 | F10>,
    [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10]
  >;
  static mergeInMany<F, S>(Result: Array<Result<F, S>>): Result<F[], S[]>;
  static mergeInMany(results: Array<Result<unknown, unknown>>) {
    return results.reduce(
      (
        res: ResultConstructor<Array<unknown>, Array<unknown>>,
        v,
      ): ResultConstructor<Array<unknown>, Array<unknown>> => {
        return v.isFailure()
          ? ResultConstructor.failure([v.value])
          : (v.chain((v) => res.map((res) => [...res, v])) as ResultConstructor<
              Array<unknown>,
              Array<unknown>
            >);
      },
      ResultConstructor.success<Array<unknown>, Array<unknown>>([]),
    );
  }

  static from<T>(v: T) {
    return success(v);
  }

  static fromTry<R>(fn: () => R): Result<unknown, R> {
    try {
      return ResultConstructor.success(fn());
    } catch (e) {
      return ResultConstructor.failure(e);
    }
  }

  static fromPromise<L, R>(promise: Promise<R>): Promise<Result<L, R>> {
    return promise
      .then(ResultConstructor.success)
      .catch(ResultConstructor.failure);
  }

  static fromMaybe<T>(v: Maybe<T>) {
    return v.isJust() ? success(v.value) : initial;
  }

  static fromEither<L, R>(v: Either<L, R>) {
    return v.isRight() ? success<L, R>(v.value) : failure<L, R>(v.value);
  }

  static success<F = never, T = never>(v: T): Result<F, T> {
    return new ResultConstructor<F, T, ResultType.Success>(
      ResultType.Success,
      v,
    );
  }

  static failure<T = never, R = never>(v: T): Result<T, R> {
    return new ResultConstructor<T, R, ResultType.Failure>(
      ResultType.Failure,
      v,
    );
  }

  static fromNullable<T>(v: T): Result<unknown, NonNullable<T>> {
    return v === null || v === undefined ? initial : success(v);
  }

  private static _initialInstance: ResultConstructor<
    never,
    never,
    ResultType.Initial
  >;
  static initial(): Result<never, never> {
    if (ResultConstructor._initialInstance === undefined) {
      ResultConstructor._initialInstance = new ResultConstructor<
        never,
        never,
        ResultType.Initial
      >(ResultType.Initial, undefined);
    }
    return ResultConstructor._initialInstance;
  }

  private static _pendingInstance: ResultConstructor<
    never,
    never,
    ResultType.Pending
  >;
  static pending(): Result<never, never> {
    if (ResultConstructor._pendingInstance === undefined) {
      ResultConstructor._pendingInstance = new ResultConstructor<
        never,
        never,
        ResultType.Pending
      >(ResultType.Pending, undefined);
    }
    return ResultConstructor._pendingInstance;
  }

  private constructor(
    private readonly type: T,
    public readonly value: T extends ResultType.Failure
      ? F
      : T extends ResultType.Success
        ? S
        : undefined,
  ) {}
  isFailure(): this is ResultConstructor<F, S, ResultType.Failure> {
    return this.type === ResultType.Failure;
  }

  isSuccess(): this is ResultConstructor<F, S, ResultType.Success> {
    return this.type === ResultType.Success;
  }

  isInitial(): this is ResultConstructor<F, S, ResultType.Initial> {
    return this.type === ResultType.Initial;
  }

  isPending(): this is ResultConstructor<F, S, ResultType.Pending> {
    return this.type === ResultType.Pending;
  }

  fold<D>(
    onInitial: () => D,
    onPending: () => D,
    onFailure: (failure: F) => D,
    onSuccess: (success: S) => D,
  ): D {
    if (this.isInitial()) {
      return onInitial();
    }
    if (this.isPending()) {
      return onPending();
    }
    if (this.isFailure()) {
      return onFailure(this.value as F);
    }
    return onSuccess(this.value as S);
  }

  join<F1, F2, S>(this: Result<F1, Result<F2, S>>): Result<F1 | F2, S> {
    return this.chain((x) => x);
  }

  mapSuccess<T>(f: (r: S) => T): Result<F, T> {
    return this.map(f);
  }

  mapFailure<T>(f: (l: F) => T): Result<T, S> {
    if (this.isFailure()) {
      return ResultConstructor.failure<T, S>(f(this.value as F));
    }
    if (this.isInitial()) {
      return new ResultConstructor<T, S, ResultType.Initial>(
        ResultType.Initial,
        undefined,
      );
    }
    if (this.isPending()) {
      return new ResultConstructor<T, S, ResultType.Pending>(
        ResultType.Pending,
        undefined,
      );
    }
    return ResultConstructor.success<T, S>(this.value as S);
  }

  map<T>(f: (r: S) => T): Result<F, T> {
    if (this.isInitial()) {
      return ResultConstructor.initial();
    }
    if (this.isPending()) {
      return ResultConstructor.pending();
    }
    if (this.isFailure()) {
      return ResultConstructor.failure<F, T>(this.value as F);
    }
    return ResultConstructor.success<F, T>(f(this.value as S));
  }

  asyncMap<T>(f: (r: S) => Promise<T>): Promise<Result<F, T>> {
    if (this.isFailure()) {
      return Promise.resolve(ResultConstructor.failure<F, T>(this.value as F));
    }
    return f(this.value as S).then((v) => ResultConstructor.success<F, T>(v));
  }

  apply<A, B>(this: Result<F, (a: A) => B>, arg: Result<F, A>): Result<F, B>;
  apply<A, B>(this: Result<F, A>, fn: Result<F, (a: A) => B>): Result<F, B>;
  apply<A, B>(
    this: Result<F, A> | Result<F, (a: A) => B>,
    argOrFn: Result<F, A> | Result<F, (a: A) => B>,
  ): ResultConstructor<F, B> {
    if (this.isFailure()) {
      return ResultConstructor.failure<F, B>(this.value as F);
    }
    if (argOrFn.isFailure()) {
      return ResultConstructor.failure<F, B>(argOrFn.value as F);
    }
    if (isWrappedFunction(this)) {
      return (argOrFn as Result<F, A>).map(this.value as (a: A) => B);
    }
    if (isWrappedFunction(argOrFn)) {
      return (argOrFn as Result<F, (a: A) => B>).apply(this as Result<F, A>);
    }
    throw new Error('Some of the arguments should be a function');
  }

  asyncApply<A, B>(
    this: Result<F, (a: A) => Promise<B>>,
    arg: Result<F, Promise<A> | A>,
  ): Promise<Result<F, B>>;
  asyncApply<A, B>(
    this: Result<F, Promise<A> | A>,
    fn: Result<F, Promise<(a: A) => B>>,
  ): Promise<Result<F, B>>;
  asyncApply<A, B>(
    this: Result<F, Promise<A> | A> | Result<F, (a: A) => Promise<B>>,
    argOrFn: Result<F, Promise<A> | A> | Result<F, (a: A) => Promise<B>>,
  ): Promise<Result<F, B>> {
    if (this.isFailure()) {
      return Promise.resolve(ResultConstructor.failure<F, B>(this.value as F));
    }
    if (argOrFn.isFailure()) {
      return Promise.resolve(
        ResultConstructor.failure<F, B>(argOrFn.value as F),
      );
    }
    if (isWrappedFunction(this)) {
      return (argOrFn as Result<F, Promise<A> | A>)
        .map((a) => Promise.resolve(a))
        .asyncMap((pa) => pa.then(this.value as (a: A) => Promise<B>));
    }
    if (isWrappedFunction(argOrFn)) {
      return (
        argOrFn as Result<F, (a: Promise<A> | A) => Promise<B>>
      ).asyncApply(this as Result<F, Promise<A>>);
    }
    throw new Error('Some of the arguments should be a function');
  }

  chain<A, B>(f: (r: S) => Result<A, B>): Result<A | F, B> {
    if (this.isInitial()) {
      return ResultConstructor.initial();
    }
    const next = f(this.value as S);
    if (isResult(next) && next.isInitial()) {
      return ResultConstructor.initial();
    }

    if (this.isPending() || (isResult(next) && next.isPending())) {
      return ResultConstructor.pending();
    }
    if (this.isFailure()) {
      return ResultConstructor.failure<F, B>(this.value as F);
    }
    if (isResult(next) && next.isFailure()) {
      return ResultConstructor.failure<A, B>(next.value as A);
    }
    return next;
  }

  asyncChain<A, B>(
    f: (r: S) => Promise<Result<A, B>>,
  ): Promise<Result<A | F, B>> {
    if (this.isInitial()) {
      return Promise.resolve(ResultConstructor.initial());
    }
    return f(this.value as S).then((p) => {
      if (p.isInitial()) {
        return ResultConstructor.initial();
      }

      if (this.isPending() || p.isPending()) {
        return ResultConstructor.pending();
      }

      if (this.isFailure() || p.isFailure()) {
        return ResultConstructor.failure<F, B>(this.value as F);
      }

      return p;
    });
  }

  equal(x: Result<any, S>, fieldExtractor?: (item: S) => unknown): boolean {
    const extractor = fieldExtractor ?? ((item: S) => item as unknown);
    if (this.isInitial()) return x.isInitial();
    if (this.isPending()) return x.isPending();

    if (this.isFailure()) return x.isFailure() && this.value === x.value;

    return x.isSuccess() && extractor(this.value as S) === extractor(x.value);
  }

  or(x: Result<F, S>): Result<F, S> {
    if (this.isSuccess()) {
      return this as Result<F, S>;
    }
    return x;
  }

  toEither(i: () => F, p: () => F): Either<F, S> {
    if (this.isSuccess()) {
      return right<F, S>(this.value as S);
    }
    if (this.isInitial()) {
      return left<F, S>(i());
    }
    if (this.isPending()) {
      return left<F, S>(p());
    }
    return left<F, S>(this.value as F);
  }

  toMaybe(): Maybe<S> {
    return this.isSuccess() ? just<S>(this.value as S) : none<S>();
  }

  toNullable(): S | null {
    return this.isSuccess() ? this.value : null;
  }

  toUndefined(): S | undefined {
    return this.isSuccess() ? this.value : undefined;
  }

  unwrap(factory?: {
    initial?: () => unknown;
    pending?: () => unknown;
    failure?: (left: F) => unknown;
  }): S {
    if (this.isSuccess()) return this.value;
    if (this.isInitial() && typeof factory?.initial === 'function')
      throw factory.initial();
    if (this.isPending() && typeof factory?.pending === 'function')
      throw factory.pending();
    if (this.isFailure() && typeof factory?.failure === 'function')
      throw factory.failure(this.value);

    throw new Error('Result state is not Right');
  }

  unwrapOr(x: S): S {
    return this.isSuccess() ? this.value : x;
  }

  unwrapOrElse(f: (l: F) => S): S {
    return this.isSuccess() ? this.value : f(this.value as F);
  }

  get [Symbol.toStringTag]() {
    return 'Result';
  }

  filter(predicate: (value: S) => boolean): Result<F | S, S> {
    if (!this.isSuccess()) {
      return this as Result<F | S, S>;
    }
    return predicate(this.value)
      ? (this as Result<F | S, S>)
      : ResultConstructor.failure<F | S, S>(this.value);
  }

  filterMap<NF, NS>(f: (value: S) => Result<NF, NS>): Result<F | NF, NS> {
    return this.chain(f);
  }

  tap(f: (value: S) => void): Result<F, S> {
    if (this.isSuccess()) {
      f(this.value);
    }
    return this as Result<F, S>;
  }

  tapFailure(f: (value: F) => void): Result<F, S> {
    if (this.isFailure()) {
      f(this.value);
    }
    return this as Result<F, S>;
  }

  recover<NS>(value: NS): Result<F, NS | S> {
    return this.isSuccess() ? (this as Result<F, NS | S>) : success(value);
  }

  recoverWith<NF, NS>(f: (error: F) => Result<NF, NS>): Result<NF, NS | S> {
    return this.isFailure()
      ? f(this.value)
      : (this as unknown as Result<NF, NS | S>);
  }

  zip<F2, S2>(other: Result<F2, S2>): Result<F | F2, [S, S2]> {
    return this.chain((a) => other.map((b) => [a, b] as [S, S2]));
  }

  zipWith<F2, S2, R>(
    other: Result<F2, S2>,
    f: (a: S, b: S2) => R,
  ): Result<F | F2, R> {
    return this.chain((a) => other.map((b) => f(a, b)));
  }

  bimap<NF, NS>(
    failureMap: (f: F) => NF,
    successMap: (s: S) => NS,
  ): Result<NF, NS> {
    if (this.isSuccess()) {
      return success(successMap(this.value));
    }
    if (this.isFailure()) {
      return failure(failureMap(this.value));
    }
    return this as unknown as Result<NF, NS>;
  }
}

export type Result<F, S> =
  | ResultConstructor<F, S, ResultType.Initial>
  | ResultConstructor<F, S, ResultType.Pending>
  | ResultConstructor<F, S, ResultType.Success>
  | ResultConstructor<F, S, ResultType.Failure>;

export const {
  merge,
  mergeWithConfig,
  mergeInOne,
  mergeInMany,
  failure,
  success,
  from,
  fromTry,
  fromPromise,
  fromMaybe,
  fromEither,
  fromNullable,
  chain,
} = ResultConstructor;

export const initial = ResultConstructor.initial();
export const pending = ResultConstructor.pending();

export const isResult = <F, S>(
  value: unknown | Result<F, S>,
): value is Result<F, S> => value instanceof ResultConstructor;

export const isInitial = <F, S>(
  value: unknown | Result<F, S>,
): value is ResultConstructor<F, S, ResultType.Initial> =>
  isResult(value) && value.isInitial();

export const isPending = <F, S>(
  value: unknown | Result<F, S>,
): value is ResultConstructor<F, S, ResultType.Pending> =>
  isResult(value) && value.isPending();

export const isSuccess = <F, S>(
  value: unknown | Result<F, S>,
): value is ResultConstructor<F, S, ResultType.Success> =>
  isResult(value) && value.isSuccess();

export const isFailure = <F, S>(
  value: unknown | Result<F, S>,
): value is ResultConstructor<F, S, ResultType.Failure> =>
  isResult(value) && value.isFailure();

// Helper type to extract the Success type from a Result
export type Success<T> = T extends Result<any, infer S> ? S : never;

// Helper type to extract the Failure type from a Result
export type Failure<T> = T extends Result<infer F, any> ? F : never;
