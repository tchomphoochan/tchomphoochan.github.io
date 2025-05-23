---
title: "How to derive the Y combinator"
tags:
  - Programming
  - Notes
date: 2021-12-30 1:20:00 -0500
---

I forgot my favorite method of deriving Y combinator for the n-th time, so this time I am forcing myself to write this up as a quick reminder.

For a proper tutorial, consider this:
<https://homes.cs.washington.edu/~sorawee/en/blog/2017/10-05-deriving-Y.html>.

For each example here, verify with `fact(10) == 3628800`.

---

## Version 0

This definition of `fact` requires that its body can look up the name `fact` in its parent environment, which is bad.
```py
fact = lambda n: 1 if n == 0 else n * fact(n-1)
```

We want to be able to write `fact` entirely in terms of anonymous functions which do not have free variables. These things have a fancy name: "combinators."

Y combinator, which we will eventually reinvent, is of interest because it provides us with a primitive for building recursive functions in languages that provide higher-order functions but not recursion by default.

---

## Version 1

The trick is to pass in the recursion as an argument instead.
```py
fact_base = lambda f: lambda n: 1 if n == 0 else n * f(f)(n-1)
fact = fact_base(fact_base) # this relies on currying/partial application
```

---

## Version 2

Because there are no circular dependencies, we can just inline everything. We can just stop here if we want.
```py
fact = (lambda f: lambda n: 1 if n == 0 else n * f(f)(n-1))(lambda f: lambda n: 1 if n == 0 else n * f(f)(n-1))
```

---

## Version 3

I hate code duplication, so I am writing a helper function to call the function on itself instead.
```py
fact = (lambda f: f(f))(lambda f: lambda n: 1 if n == 0 else n * f(f)(n-1))
```

Suppose I define `make_recur = lambda f: f(f)`, then the user could make their own recursive function just by writing a function that takes in `f`. To make a recursive call, write `f(f)(...)`. Here is an example of how to use it.
```py
make_recur = lambda f: f(f)
fib = make_recur(lambda f: lambda n: n if n <= 1 else f(f)(n-1)+f(f)(n-2))
# fib(10) == 55
```

---

## Version 4 (broken)

This is where I usually get stuck.

Right now, requiring the user to write `f(f)(...)` is disgusting. We want to allow the user to write `f(...)` instead.

```py
user_fact_base = lambda f: lambda n: 1 if n == 0 else n * f(n-1)
fact_base = ???
fact = fact_base(fact_base)
```

Our task is to figure out the definition of `fact_base` to wrap around `user_fact_base`. Recall, `fact_base` takes in a function `f` as its argument. It should call `user_fact_base` with `f(f)` already prepped in that argument slot. This should work:

```py
user_fact_base = lambda f: lambda n: 1 if n == 0 else n * f(n-1)
fact_base = lambda f: user_fact_base(f(f))
fact = fact_base(fact_base)
```

Actually, this results in stack overflow because Python uses strict evaluation.
```py
fact = fact_base(fact_base)
     = (lambda f: user_fact_base(f(f)))(lambda f: user_fact_base(f(f)))
     = user_fact_base( (lambda f: user_fact_base(f(f)))(lambda f: user_fact_base(f(f))) )
     = user_fact_base( user_fact_base( ... ) ) # infinite recursion
```

---

## Version 5

Realize that the issue is that Python evaluates `f(f)` before passing into `user_fact_base`. We do not want this to be evaluated unless it is necessary (i.e. when function body requires a recursive call). The trick is to simply wrap the expression `f(f)` in a somewhat redundant lambda expression (make the argument explicit).

```py
user_fact_base = lambda f: lambda n: 1 if n == 0 else n * f(n-1)
fact_base = lambda f: user_fact_base(lambda x: f(f)(x))
fact = fact_base(fact_base)
```

Now we can inline everything if we want.

---

## The Y combinator

What we discovered in version 4 was the Y combinator. Specifically:
```py
user_fact_base = lambda f: lambda n: 1 if n == 0 else n * f(n-1)
Y = lambda f: (lambda x: f(x(x)))(lambda x: f(x(x)))
# Y = lambda f: (lambda x: x(x))(lambda x: f(x(x)))
fact = Y(user_fact_base)
```

$Y = \lambda f. (\lambda x. f (x x))(\lambda x. f (x x))$.

Some people might like to write: $Y = \lambda f. (\lambda x. x x)(\lambda x. f (x x))$.

---

## The Z combinator

What we discovered in version 5 was the Z combinator. Specifically:

```py
user_fact_base = lambda f: lambda n: 1 if n == 0 else n * f(n-1)
Z = lambda f: (lambda x: f(lambda v: x(x)(v)))(lambda x: f(lambda v: x(x)(v)))
# Z = lambda f: (lambda x: x(x))(lambda x: f(lambda v: x(x)(v)))
fact = Z(user_fact_base)
```

$Y = \lambda f. (\lambda x. f (\lambda v. x x v))(\lambda x. f (\lambda v. x x v))$.

Again, you can condense this into $Y = \lambda f. (\lambda x. x x)(\lambda x. f (\lambda v. x x v))$.

This works in Python.

---


## Another way to derive the Y combinator

Here is another way I like to use to memorize how to write the Y combinator. This is probably not very understandable if you have not seen it before.

First, you need to know that $Y$ finds fixed point of a function, namely $Y f$ gives the input $x$ such that $f x = x$, i.e. $f (Y f) = Y f$.

We can repeatedly substitute $Y f$ with $f (Y f)$. So, $Y f = f (Y f) = f (f (Y f)) = f (f (f (f \dots)))$.

This equation, $Y f = f (f (f (f \dots)))$, is the goal we are trying to achieve. How do we apply $f$ repeatedly?

Well, let's answer a simpler question first: How do you make something run infinitely?

This works: $(\lambda x. x x)(\lambda x. x x)$.

Notice that if you keep simplifying the expression, you are always stuck at $(\lambda x. x x)(\lambda x. x x)$.

We just need to sneak $f$ in there: $(\lambda x. f (x x))(\lambda x. f (x x))$.

Observe $(\lambda x. f (x x))(\lambda x. f (x x)) = f (\lambda x. f (x x))(\lambda x. f (x x)) = f (f (\lambda x. f (x x))(\lambda x. f (x x))) = f (f (f \dots))$.

We are done! $Y = \lambda f. (\lambda x. f (x x))(\lambda x. f (x x))$.

To get the Z combinator, just add a redundant $v$:
$Z = \lambda f. (\lambda x. f (\lambda v. x x v))(\lambda x. f (\lambda v. x x v)) $.

Yay!