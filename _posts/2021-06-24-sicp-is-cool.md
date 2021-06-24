---
title: "Reading log: SICP (the wizard book) is cool"
tags:
  - Summer
  - Books
  - Reading logs
  - Programming
date: 2021-06-24 16:50:00 +0700
---

*In which I nerd about SICP.*

[Structure and Interpretation of Computer Programs][sicp] (SICP) is a very old, introductory programming book. It was written in 1985 and was subsequently edited in 1996.

It is based on a language called Scheme, a Lisp dialect which at first seems like a strange and impractical language.

Yet, apparently, many people consider SICP to be one of the best books ever written about computer programming.
Some people preach endlessly about how understanding Lisp is akin to attaining enlightenment, something that can change the way you think about programming forever.

{: .figure}
> ![](/post-extensions/sicp-is-cool/gabriel-wizard-book.jpg){:width="80%"}

I got curious, because last spring I wrote a Scheme interpreter for my Python class[^py] homework, and while that gave me a good overview of the language, I couldn't see how Lisps are special.

So, I decided to go down the rabbit hold and read SICP.
(This is partly because I have nothing better to do this summer.)

The result: I did not get that alleged "enlightenment" and 100x productivity boost but oh boy were there a lot of fascinating concepts and elegant explanations.

I'm writing this blog post to catalog some of the ideas I thought were really neat. Perhaps you might find them interesting too!

[sicp]: https://mitpress.mit.edu/sites/default/files/sicp/index.html
[^py]: 6.009 Fundamentals of Programming

{: .infobox .no_toc}
> **Table of Contents**
> - TOC
> {:toc}

---

## Syntactic uniformity and metaprogramming

Scheme's syntax is very simple.

Everything is an expression. Expressions (almost) always evaluate to a value.

There are numbers and strings, like `3` and `"hi"`. These evaluate to themselves.

There are symbols, like `x` and `sqrt`. These evaluate to some stored values or function objects.

Then, most importantly, there are S-expressions, which are basically a way to describe lists. They look like `(3 4 5 6)` or `(1 (2 3) () (()))`. Some S-expressions can be evaluated, and some can't.

When Scheme sees an S-expression, the following evaluation rule applies:
- First, evaluate the first item in the list. Hopefully you get a function object (otherwise Scheme complains).
- Then, evaluate the rest of the list (recursively) and call the function object using those items as arguments.

So, you can do something like `(+ 3 (* 5 5))`, which will evaluate to `28`.

Note that what are usually considered "operations" in other languages are pretty much the same as functions here, like `*`, `/`, `>=`, `=`, `<`.

There are "special forms" which are exceptions to the evaluation rule described earlier.
If the first element signals a special form, then the rest of the list are evaluated (or not) based on that form's special rules.
Special forms include:
- `(define <var> <expr>)` which assigns the value of `<expr>`, evaluated, to a variable named `<var>`. (Similarly, `set!` mutates a defined variable.)
- `(if <cond> <true-expr> <false-expr>)` which first evaluates `<cond>`; if it is true, then `<true-expr>` is evaluated and returned, otherwise `<false-expr>` is.
- `(lambda (<arg1> <arg2> <...>) <body>)` which creates a function object that whenever called, takes some number of arguments and evaluates `<body>`. The function is evaluated in an environment derived from the environment in which it was defined[^lexical].

[^lexical]: This is called lexical scoping. I won't describe it in details here.

Here is an example of how you would compute Fibonacci numbers.
```scheme
(define fib
  (lambda (n)
    (if (<= n 1)
        n
        (+ (fib (- n 1))
           (fib (- n 2))))))
; could evaluate to the anonymous function object or
; evaluate to nothing, depending on the implementation.

(fib 0) ; evaluates to 0 (and is displayed on the screen)
(fib 1) ; evaluates to 1
(fib 10) ; evaluates to 55
(fib (+ 1 (* 3 3))) ; evaluates to 55
```
We create an anonymous function object taking a single argument is defined using `lambda` special form, and then bind that to the name `fib`[^functionshorthand]. We call the function object with `(fib n)`.

[^functionshorthand]: There is actually a shorthand for defining functions, which is `(define (<funcname> <arg1> <arg2> <...>) <body>)`.

---

This syntax, full of parentheses, might look offputting at first, but consider this code which reads from user input and mutates the value of `x` accordingly:
```scheme
(if (= (read) 42) (set! x "good") (set! x "bad"))
```
You can actually write this equivalently:
```scheme
(set! x (if (= (read) 42) "good" "bad"))
```

In Python, the first code would look like this:
```py
if int(input()) == 42:
    x = "good"
else:
    x = "bad"
```
The second code would look like this:
```py
x = "good" if int(input()) == 42 else "bad"
```
They look similar, but they rely on completely different syntaxes.
The first one uses an if-else control construct which requires the indented code inside to be statements.
The second one uses a ternary operator which only works with expressions and is much more limited in capability.
(Other languages like C use different symbols for the ternary operator altogether. Some languages don't even have the ternary operator.)

Here's another example involving arithmetic operators, in Scheme:
```scheme
; (define (fn args) body) is a shorthand for (define fn (lambda (args) body))
(define (a-plus-abs-b a b)
  (if (>= b 0) + -) a b)
```
There is no way to write this in Python, because Python does not provide operators as functions (unless you import or build them yourself). The closest approximation is:
```py
def a_plus_abs_b:
    add = lambda a, b: a+b
    sub = lambda a, b: a-b
    return (add if b >= 0 else sub)(a, b)
```

In a way, Lisp syntax is less arbitrary than that of any other languages. Some people consider this a "more mathematically pure" representation of a program. (Indeed, Lisp is modeled off lambda calculus.)

---

Now, let's go back to S-expressions. If you hand the source code above to the evaluator, you would think of it as code which is to be executed. However, you can probably make a case that this is simply a list of three items, two of which are symbols and the final one another list:
```scheme
(define fib (lambda (n) (if (<= n 1) n (+ (fib (- n 1)) (fib (- n 2))))))
```

Similarly, you can also claim that the following to-do list is not just data, but is also *code*[^defmacro]:
```scheme
(todo "housework"
    (item (priority high) "Clean the house.")
    (item (priority medium) "Wash the dishes.")
    (item (priority medium) "Buy more soap."))
```
[^defmacro]: This example was taken from [defmacro.org](https://www.defmacro.org/ramblings/lisp.html).

Why? Well, you can feed this into a custom evaluator built specifically for parsing to-do lists stored as S-expressions. (There are a lot of XML parsers around. S-expressions aren't that different.)

Or perhaps, even better, feed this into a Scheme interpreter that has special forms `todo` and `item` built in, and these special forms happen to transform this data into Scheme S-expressions that can actually be evaluated.

This is where Scheme's uniform syntax shines.

Like any other languages, Scheme provides functions that let you manipulate lists (and by extension, trees, because trees can be represented as nested lists). If Scheme's code is naturally a list, then that means you can manipulate the code pretty much directly.

Scheme also provides facilities for you to define your own special forms by specifying how the arguments are re-arranged. (These are called macros.)
For example, you can define a special form `(loop <var1> <var2> <...> from <begin-val> up to <end-val> <body>)` that lets you do nested loops with all variables ranging from `<begin-val>` to `<end-val>`. Wherever the compiler sees a `loop` form with one variable, it knows to substitute with this code for you[^hygiene]:
```scheme
; generate a recursive function to loop up from <begin> to <end>
(define (generated-loop-1 <var1>)
  <body> ; body will have access to the variable <var>
  (if (< <var> <end-val>)
      (generated-loop-1 (+ <var> 1))))
; then call it
(generated-loop-1 <begin-val>)
```
Or with this code if there are two variables:
```scheme
(define (generated-loop-1 <var1>)
  (define (generated-loop-2 <var2>)
    <body>
    (if (< <var2> <end-val>)
        (generated-loop-2 (+ <var2> 1))))
  (generated-loop-2 <begin-val>)
  (if (< <var1> <end-val>)
      (generated-loop-1 (+ <var1> 1))))
(generated-loop-1 <begin-val>)
```

[^hygiene]: Note that the example given here isn't very accurate of how macros are actually implemented. For one, note that the name `generated-loop-n` might be confused with user's own `generated-loop-n`.

This cannot be done with functions[^lambdasub]. Otherwise, Scheme would attempt to evaluate at runtime the symbols `from`, `up`, and `to` in the arguments, which are meaningless, and even worse, the body will be evaluated with variables that aren't even defined yet.

[^lambdasub]: A lot of the macros can be implemented with higher-order functions. However, that is much less powerful in two ways. One, the programmer needs to be aware that he must pass in a lambda expression instead of being able to use the macro as if it is part of the language's syntax. Two, the code is not expanded at compile time. Some macros can be really helpful in optimizing performance.

Macros exist in languages like C, but they work via text substitutions only.
Macros can be controlled through special keywords like `#define`, `#ifdef`, `#ifndef`, but that's about it.

Meanwhile, in Scheme, we can use Scheme's existing functionalities to manipulate the code however needed, like in the example earlier we might use recursion to recursively generate the code.

If it was possible to write macros in C using C's full functionalities, you would still have to manually write strings at character level, accounting for each original syntax you want to represent (like `if` and `for` with curly braces, and semicolons at the end of each statement).
In Scheme, you just have to find/insert/delete/edit/duplicate list elements and not worry about the code's textual representation.

I guess this is what people mean when they talk about the duality between code and data[^extrapolate].

[^extrapolate]: SICP did not explicitly teach how to write macros. However, they really emphasized the idea that "code is data" in chapter 4 where we have to write a metacircular evaluator (an evaluator for Scheme that is written in Scheme itself).

---

## Procedures enable storing data

The entire second chapter of SICP is about building abstractions.

The book emphasizes a sensible design of "abstraction barriers" or interfaces, which allow programmers to reason about the correctness of their code at each level separately and maintain modularity.

Even though Scheme does not have built-in support for object oriented programming, SICP went on to show multiple ways one could invent OOP, together with the motivation for each approach[^badoop].

[^badoop]: OOP can be taught really badly. It is possible to learn about OOP concepts and fail to understand what they are for at all. (See: exploiting inheritance to model an animal kingdom.) Some write object-oriented code that is so contrived and intertwined, OOP turns from a tool for managing complexity into a tool for *adding* unneeded complexity.)

While those concepts are important, what actually caught my attention was how powerful functions turn out to be.

---

Let's take `cons` for example. In Scheme, `cons` is the primary data structure for building any kind of compound data.

The function call `(cons a b)` creates a cons object with elements `a` and `b`. This is like a `pair` in C++ or a tuple with two elements in Python.

To access the first element, you use the function `car` on the cons object.
Likewise, `cdr` is for accessing the second element.[^carcdr]

[^carcdr]: There are some historical significances to these names you can probably Google. Some Lisp dialects change these to `first` and `rest`.

By chaining cons together, you can build a linked list where the first element of the list is in `car` and the rest of the list is `cdr`. An empty list is represented by `nil`.

For example, evaluating `(cons (cons 1 nil) (cons 2 (cons 3 nil)))` gives the list represented as `((1) 2 3)`. (The first element is a list with one element. The second and third elements are numbers.)
To get the third element, you write `(car (cdr (cdr x)))` where `x` is the list. This evaluates to `3`.

From here, you can implement plenty of abstract data structures, like sets and dictionaries, albeit very inefficient. You can also build trees. (In practice, you would use data structures provided as primitives, which are a lot more efficient.)

At this point, we have considered `cons` to be one of the language's primitives and treat it like magic. We don't really know how it's implemented.

For all we know, these are the only conditions we care about, "axioms" of some sort:
- `(car (cons a b))` evaluates to `a`.
- `(cdr (cons a b))` evaluates to `b`.

So, what if we redefine `cons`, `car`, `cdr` like this?
```scheme
(define (cons a b)
  (lambda (x)
    (if (= x 0) a b)))

(define (car x) (x 0))
(define (cdr x) (x 1))
```

Calling `(cons a b)` creates a function object which evaluates to the saved values `a` or `b` depending on the argument.
Then, `car` and `cdr` simply call the function object with the correct argument.
So, for all intents and purposes, this definition is perfectly valid.

The concept that procedures are like data, in the sense that they can be passed around, is already well-known.

This example takes it a step further. It shows that procedures *enable* storing of data.

We don't use any `define` to store values at all (except for the function names).
Yet, we can achieve the illusion of doing so by creating anonymous functions that are bound to specific contexts.[^acceptmodel]

[^acceptmodel]: Though, this requires us to accept the model of evaluation used in Scheme, and more generally, lambda calculus.

---

## Rediscovering church numerals

The book took this concept of encapsulation further by asking us to do this execise.

{: .infobox}
> **Exercise 2.6.** In case representing pairs as procedures wasn't mind-boggling enough, consider that, in a language that can manipulate procedures, we can get by without numbers (at least insofar as nonnegative integers are concerned) by implementing 0 and the operation of adding 1 as
>
> ```scheme
> (define zero (lambda (f) (lambda (x) x)))
> (define (add-1 n)
>   (lambda (f) (lambda (x) (f ((n f) x)))))
> ```
>
> This representation is known as Church numerals, after its inventor, Alonzo Church, the logician who invented the $\lambda$ calculus.
> 
> Define one and two directly (not in terms of `zero` and `add-1`). (Hint: Use substitution to evaluate `(add-1 zero)`). Give a direct definition of the addition procedure `+` (not in terms of repeated application of `add-1`).

This was the first time I had to interpret complicated nested lambda expressions myself without knowing beforehand the expected behavior. (Conditionals were much easier to invent.)

Slowly working through the substitutions until I saw the patterns did the trick.
It made me more comfortable with reading other lambda expressions, including understanding the Y-combinator I couldn't quite grasp before.

As it turns out, a number $n$ is represented by a function which takes in a function $f$ and outputs the function that represents composing $f$ for a total of $n$ times, namely $$f^{\circ n} = \underbrace{f \circ f \circ \cdots \circ f}_{n\text{ times}}$$.

So, zero simply takes $f$ to the identity function. One takes $f$ to itself. Two takes $f$ to $f \circ f$, and so on.

Then, the given definitions make sense. To add one to a number $n$ (which is a function), you create a new number (function) that maps each function $f$ to $f^{\circ (n+1)}$, which can be computed as $f \circ f^{\circ n}$.

To add $a$ and $b$ together, you create a new number (function) that maps each function $f$ to $f^{\circ(a+b)}$ which can be computed as $f^{\circ a} \circ f^{\circ b}$.

This is really powerful. You might have heard of Peano axioms. This feels like actually implementing those axioms[^recursiveaxioms], just like implementing `cons` earlier.

[^recursiveaxioms]: Of course, that means your axioms are now lambda calculus instead. I guess I should learn set theory at some point.

The Python code here illustrates the idea a bit more clearly, without using lambda expressions:
```py
def zero(fn):
  def identity(x):
    return x
  return identity

def addone(old_number):
  def new_number(f):
    def wrapped(x):
      f(old_number(f)(x))
    return wrapped
  return new_number

# so we have

def add(a, b):
  def new_number(fn):
    def wrapped(x):
      a(fn)(b(fn)(x))
    return wrapped
  return new_number

def one(fn):
  def wrapped(x):
    return fn(x)
  return wrapped

def two(fn):
  def wrapped(x):
    return fn(fn(x))
  return wrapped

def five(fn):
  def wrapped(x):
    return fn(fn(fn(fn(fn(x)))))
  return wrapped
```

---

## Infinite streams are trippy

The third chapter of the book focuses on the notion of states and mutability.

Interestingly, the book (and I guess, programmers in FP languages) considers mutability to be complicated: Mutability force us to think about *time* and reason through expression evaluations in a rather mechanistic manner.

(In a lot of introductory programming courses, variables and mutations are among the first few things taught. This really makes me think that maybe imperative programming isn't as intuitive as it seems to be. How would the programmer world be like if we teach functional before imperative?)

To cope with this complexity, the book introduces us to streams. Instead of focusing on a value of a variable and seeing it as changing, we consider the function of time representing the trajectory of that variable instead, which is unchanging.

Streams in Scheme are like linked lists but they are lazily evaluated and memoized. Specifically,
- `(cons-stream a b)` is a *special form* that gives a pair containing evaluated `a` and a promise to evaluate `b` at some point[^promise].
- `(stream-car x)` accesses the first element of the pair `x` as usual.
- `(stream-cdr x)` forces the evaluation of the second element, caches it, and returns it.

[^promise]: We can implement `cons-stream` as a macro that transforms `b` into `(lambda () b)`, then `(stream-cdr x)` is simply `((cdr x))` (take the `cdr` then call to force the evaluation). (Don't forget to add memoization too.)

We can have infinitely long streams. For example, this code generates a stream of positive integers, `integers`:
```scheme
(define (integers-starting-from n)
  (cons-stream n
               (integers-starting-from (+ n 1))))
(define integers (integers-starting-from 1))
```
This works because the second element of `integers`, namely `(integers-starting-from (+ n 1))` has not been evaluated yet. So, we aren't actually storing infinite amount of data in memory.

Only when we try to access the `i`-th element are we forcing the evaluation of all the necessary elements. For example, if we try to access the third element, `(stream-car (stream-cdr (stream-cdr integers)))`, we will have the following expansion:
```scheme
(stream-car (stream-cdr (stream-cdr integers)))
-> (stream-car (stream-cdr (stream-cdr (integers-starting-from 1))))
-> (stream-car (stream-cdr (stream-cdr (cons-stream 1 (integers-starting-from 2)))))
-> (stream-car (stream-cdr (integers-starting-from 2)))
-> (stream-car (stream-cdr (cons-stream 2 (integers-starting-from 3))))
-> (stream-car (integers-starting-from 3))
-> (stream-car (cons-stream 3 (integers-starting-from 4)))
-> 3
```

Other than that, we can treat streams as if they are lists. Most list functions have a stream equivalent you can use.

For example, `stream-filter` lazily constructs a new stream from a given stream which satisfies the predicate. Accessing the fourth element of `(stream-filter (lambda (x) (divisible? x 2)) integers)` (a stream of even numbers) will trigger the evaluation of the first eight elements of `integers`.

This is different from iterators in Python. In Python, you have an iterator object which stores where you are and how it will continue computing the next values. You must call `next` every time to access each new element (or use Python's `for` loop which is a syntactic sugar), and you can't go back without creating a new iterator which may require recomputing certain expressions.

If Python's iterators *do*, Scheme's streams *are*.

---

Infinite streams can do some really trippy things. Consider this:
```scheme
(define ones (cons-stream 1 ones))
```
We are defining `ones` in terms of itself: The sequence `ones` consists of `1`, followed by all elements of `ones`.

This works perfectly because when we try to access the second element of `ones`, it evaluates to the first element of `ones` which is known to be `1`. 
When we try to access the `i`-th element, it evaluates to the `(i-1)`-th element which can be computed (or memoized), and we eventually get to `1`.

So, if we have `(add-streams a b)` for lazily adding two streams `a` and `b` position-wise, we could do something like this:
```scheme
(define integers (cons-stream 1 (add-streams ones intgers)))
```
Then, the second element is simply the first element plus one, which is two. The third element is the second element (which we already know) plus one, which gives three, and so on.

Similarly, here's how we can define a stream of Fibonacci numbers:
```scheme
(define fibs
  (cons-stream 0
               (cons-stream 1
                            (add-streams (stream-cdr fibs)
                                         fibs))))
```
In a way, this is like writing `fib[n] = fib[n-1] + fib[n-2]` and the base cases `fib[0] = 0` and `fib[1] = 1` directly.
We don't have to write a function that can compute the `n`-th Fibonacci for us.
We just write what *all* Fibonacci numbers are, and let lazy evaluation do the magic. (We also get memoization for free!)

---

Here's another cool example.
```scheme
(define primes
  (cons-stream 2
               (stream-filter prime? (integers-starting-from 3))))
(define (prime? n)
  (define (iter ps)
    (cond ((> (square (stream-car ps)) n) true)
          ((divisible? n (stream-car ps)) false)
          (else (iter (stream-cdr ps)))))
  (iter primes))
```

We define `primes` to be a stream of primes, which consists of `2` and other integers that satisfy the `prime?` predicate[^efficientprime].

[^efficientprime]: There are much more efficient ways to compute primes, like the [incremental sieve][incrementalsieve].

[incrementalsieve]: https://en.wikipedia.org/wiki/Sieve_of_Eratosthenes#Incremental_sieve

But wait, the function `prime?` is actually defined in terms of `primes`! It checks whether `n` is divisible by any other prime numbers up to its square root.

This recursive definition works because at any point in the generation of `primes`, enough smaller numbers have been generated so `prime?` computations can succeed.

---

This final example blew my mind with its simplicity.

```scheme
; (a0, a1, a2, a3, ...) represents the power series a0 + a1*x + a2*x^2 + a3*x^3 + ...

(define (integrate-series s) ; constant coefficient omitted
  (stream-map / s integers))
(define exp-series ; integral of e^x is e^x
  (cons-stream 1 (integrate-series exp-series)))
(define cosine-series ; cos x = integral of -sin x with constant of integration 1
  (cons-stream 1 (scale-stream (integrate-series sine-series) -1)))
(define sine-series ; sin x = integral of cos x with constant of integration 0
  (cons-stream 0 (integrate-series cosine-series)))

(stream-take exp-series 10)
; outputs (1 1 1/2 1/6 1/24 1/120 1/720 1/5040 1/40320 1/362880)
(stream-take cosine-series 10)
; outputs (1 0 -1/2 0 1/24 0 -1/720 0 1/40320 0)
(stream-take sine-series 10)
; outputs (0 1 0 -1/6 0 1/120 0 -1/5040 0 1/362880)
```

A few things to notice: We are defining $\exp$ in terms of itself, integrated. We define $\cos$ in terms of the integral of $\sin$ and $\sin$ in terms of the integral of $\cos$.

It seems like we've only written down the properties of $\exp$, $\sin$, and $\cos$, not how to compute them.
Yet, if we reason through this like in the previous examples, these properties already describe unambiguously how to compute each term.

It's a dance between streams. To compute the fourth term of cosine series, you need to compute the integral of the third non-constant term of sine, flipping the sign. The integral of the third term is simply the third term of sine scaled. To know the third term of sine, you need to look at the second term of cosine, which can be deduced from the first term of sine, and eventually, we're back at the base case.

I don't think it's the programming that's interesting per se. Rather, I haven't seen this way of recursively computing power series before.

This is magical. Now I know why people talk so much about functional programming and why lazy evaluation seems to be such a big deal.

(Try implementing those examples in Python. It's a lot more annoying than you'd expect.[^ugly])

[^ugly]: Rather, you'll see a lot of lambdas that just don't belong there aesthetically.

---

That's it! I've only finished the first three chapters so far. The last two chapters focus on interpretation and compilation, which I might work through at some point. SICP is not a functional programming book per se, and I've barely scratched the surface, but dang, this is cool. Not to mention, this is still only the "mostly mathematical" side of things. There are still practical Lisp languages to learn, like [Common Lisp][gigamonkey].

[gigamonkey]: https://gigamonkeys.com/book/

If you're looking for something to read, SICP is a good choice.