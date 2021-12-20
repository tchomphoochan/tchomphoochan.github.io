---
title: "Power tripping with infinite lists in Haskell"
tags:
  - Programming
date: 2021-12-20 17:37:00 -0500
---

Lately I have been forcing many of my friends to listen/watch this mini-lecture of mine about Haskell and infinite streams. I thought it was pretty cool, so I wanted to share it here too.

**Prerequisites**: about a year of programming experience? (College is fine.) Familiarity with basic algorithms and data structures (specifically linked list) and programming paradigms/concepts (OOP, generators, higher order functions, etc.) to appreciate this. Calculus, up to power series.

I will start with explaining how programming in Haskell works roughly, then dive into some toy examples using Haskell's lazy evaluation feature, and then end with something that hopefully blows your mind. (Please be kind to me if it doesn't.) There are small exercises along the way you should do (or check the solutions) **before** proceeding to the next session.

If you want to try running code, [download Haskell](https://www.haskell.org/downloads/). As far as I know there aren't really any good Haskell interactive interpreter online. [tryhaskell.org](https://tryhaskell.org/) only lets you try simple expressions. You can't do definitions.

Ready, set, go!

{: .figure}
> ![](/post-extensions/lazy-power-series-integration/haskellanime.png){:width="80%"}
> Because anime girls holding programming books is always the best cover for a blog post.

---

## Haskell

Haskell is a functional programming language. What that means is a lot of what you write in Haskell are based on functions and how they compose. Specifically, you write pure functions: no mutating states like setting `x = 5` then `x = 10` after, and no producing side effects like modifying an array outside the function.

This style of programming seems unnecessarily restrictive to the unfamiliar. However, its constraints open up a whole new level of expressivity (at least for some kind of problems). This is most easily seen at first glance from Haskell's syntax. See this Fibonacci function definition.

```haskell
fib 0 = 0
fib 1 = 1
fib n = fib (n-1) + fib (n-2)
```

Haskell's function definitions feel almost like mathematics. You are not defining `fib` to be a function that computes this and that and returns the combination. You are defining what `fib` evaluated at some value should _be_.

Here's another example. This defines what it means for `a` to divide `b`, for `n` to be a prime number, and what the list of prime numbers should contain. Pretty cool. (We're not focusing too much on the syntax itself here.)
```haskell
a `divides` b = b `rem` a == 0                     -- a divides b if remainder of b divided by a is zero
                                                   -- note that haskell allows infix notation for binary operators, using backticks (`)
isPrime n = (not . any (`divides` n)) [2..(n-1)]   -- n is prime number if none of 2 to n-1 divides n
primes = filter isPrime [2..]                      -- primes is a list of numbers from 2 onward that satisfies isPrime
```

Note the `primes` is an infinite list. Haskell can run these definitions just fine because the list is (to some degree of oversimplification) lazily evaluated. Only when you try to, say, request the fifth element of `primes`, it bothers looking at numbers starting from 2 to see which ones are primes. As soon as it finds what the fifth prime is, it stops.
If you write something like `take 10 primes` in the interactive console, you will see `[2,3,5,7,11,13,17,19,23,29]` (It takes the first ten elements.). If you just write `primes`, then it will keep printing `[2,3,5,7,...` indefinitely, because Haskell does not really know that the list is infinite. It just keeps evaluating and printing until it gets to the end (It won't.).

---

## Linked lists

In Haskell, lists are better thought of as linked lists rather than dynamically sized arrays. Namely:
1. There is an empty list `[]`.
2. Other lists consist of an element as its head and another linked list as its tail, representing the rest of the list. This is denoted using `:` operator. (In Scheme, this is called `cons`.)

For example, the list `[1,2,3,4,5]` is equivalent to `1:[2,3,4,5]`, which is equivalent to `1:2:3:4:5:[]`. Note that `[1,2]:[3,4,5]` does not really make sense here. That would mean `[1,2]` is the first element and the rest of the elements are `3`, `4` and `5`. So, the list would be `[[1,2],3,4,5]` which is not allowed in Haskell because all elements of the list should be of the same type.

When viewed this way, lazy evaluation is a bit easier to grasp. If you only ever need the first element of `x:xs`, you only have to evaluate `x`. There is no point in evaluating `xs`. So, `[1,2..]` which is basically just `1:<something I don't care until I need it>` can be defined just fine. (`x` and `xs` are conventional names used to denote head and tail of a list.)

Now, let's try to define some simple lists by ourselves. The first one is list of positive integers (equivalent to `[1,2..]`).

```haskell
integersFrom n = n : integersFrom (n+1)
integers = integersFrom 1
```

This says: `integersFrom n` is a list consisting of `n` as its first element and the rest is the list `integersFrom (n+1)`, i.e. `integersFrom n` is `[n,n+1,n+2..]`. Then, `integers` is just `integersFrom 1`. Nice.

{: .figure}
> ![](https://i.imgflip.com/2kaaae.jpg){:width="80%"}
> People who aren't functional programmers.

---

## Recursively defined lists

To be honest, that one was kinda boring. Let's try another approach. First, I'm going to define an infinite list of repeating ones.
```haskell
ones = 1 : ones
```
Woah---`ones` is defined in terms of itself and it is not even a function! This is usually not allowed in other languages. However, `ones` can be thought of as a function with zero arguments. Its body is lazily evaluated wherever possible. So, if you are just accessing the first element (`head ones`) which is just `1`, you are fine. If you are trying to access the second element---Well, the second element of `ones` is the first element of the rest of the list, which is `ones`, and we know the first element of `ones` is `1`, so the second element of `ones` overall is `1`!

Now, we can redefine `integers` without needing `integersFrom n` at all.
```haskell
integers = 1 : zipWith (+) ones integers
```
This says: `integers` is a list that starts with `1`, and the rest of the elements are the lists `ones` and `integers` added coordinate-wise (That's what `zipWith (+)` means). **Verify for yourself that `integers` is indeed `[1,2...].** Again, see that we are defining `integers` in terms of itself without taking in any arguments at all. We are not modifying any external variables either.

Here's another exercise: **Define `powersOfTwo`.** You should get `[1,2,4,8,16,32,64,128]` when you execute `take 8 powersOfTwo` (take first eight elements). See footnote for solution[^powers] (Please try not to).

Another one to try: **Define `fibs` recursively (without using `fib` from earlier).** The output of `take 9 fibs` should look like `[0,1,1,2,3,5,8,13,21]`. As a hint, `tail li` gives you the tail of `li` (everything but the head). You will probably also need two head elements (base case) rather than just one. See footnote for solution[^fib] (Please do if you're stuck).

[^powers]: `powersOfTwo = 1 : zipWith (+) powersOfTwo powersOfTwo`.
[^fib]: `fibs = 0 : 1 : (zipWith (+) fibs (tail fibs))`

As a fun side note, it is also possible to define `primes` recursively (instead of checking for division by all positive integers except `1` and `n`). Though, this is more complicated than it seems at first glance because your definition can be end up being "so lazy that it ends up biting its own tail" (see: https://stackoverflow.com/a/25819438). I'm leaving the code here for people who are curious.

```haskell
a `divides` b = b `rem` a == 0
isPrime n = not . any (`divides` n) $ takeWhile (<= (floor . sqrt . fromIntegral $ n)) primes  -- filter doesn't know when to stop, so need to use takeWhile instead
primes = 2 : filter isPrime [3..]  -- primes have to be primed (ha) with 2 as its first element or takeWhile doesn't know when to stop
```

---

## Infinite series and integration

This is where things get fun. Let's consider an arbitrary infinite power series $p(x) = a_0 + a_1 x + a_2 x^2 + a_3 x^3 + \cdots $ where $a_0, a_1, a_2, \cdots$ are constants. We will try to represent this series with an infinite list of integers `[a0, a1, a2, ...]`.

As a concrete example, the exponential series $e^x = \sum_{n=1}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2} + \frac{x^3}{6} + \frac{x^4}{24}$ would be represented as `[1, 1, 1/2, 1/6, 1/24, ...]`.

Adding two power series up is easy: just add coordinate-wise. Multiplying two power series is a bit more difficult. (Try!) We'll focus on integration instead. Note that when you integrate $p(x)$ you get

$\int p(x) \, dx = c + \frac{a_0}{1}x + \frac{a_1}{2}x^2 + \frac{a_2}{3}x^3 + \frac{a_3}{4}x^4 + \cdots$

where $c$ is the constant of integration. This looks like dividing the list `[a0, a1, a2, ...]` by `[1, 2, 3, ...]` and prepending the constant `c` to the front so the exponentials are increased accordingly. So, I will define integration like this.
```haskell
integrate p = zipWith (/) p integers
```
Note that the constant has _not_ been prepended yet, so the correct way to integrate `p` would be to write `c : integrate p` where `c` is the constant.

As you might recall, the derivative of $e^x$ is $e^x$ itself. In other word, $e^x$ is $e^x$ integrated, with the constant of integration set so that $e^0 = 1$. Namely, $e^x = 1 + \int_0^{x} e^{x'} \, dx'$.

We can write this in Haskell.
```haskell
expSeries = 1 : integrate expSeries

take 5 expSeries
-- outputs: [1.0,1.0,0.5,0.16666666666666666,4.1666666666666664e-2]
-- matches [1, 1, 1/2, 1/6, 1/24]
```

**Let that sink in for a moment.** We defined `expSeries` in terms of the integral of _itself_. We did not give Haskell any other information at all (aside from how integration works, in `integrate`). Yet, Haskell handles this definition with grace and gives us the correct answer when we try to inspect.

If you try to evaluate the first 100 terms of the series for $x=10$, the answer is pretty close:
```haskell
series `evalAt` x = foldr (\a acc -> a + acc*x) 0 (take nTerms series)
  where nTerms = 100  -- This just means "evaluate the first n terms." Won't explain how this works today.

expSeries `evalAt` 10
-- outputs: 22026.465794806714
-- compare that to:
exp 10
-- outputs: 22026.465794806718
```

Damn.

{: .figure}
> ![](https://i.redd.it/9vfjzu7pbt801.png){:width="80%"}
> I've been trying to find a meme about infinite series online but I couldn't find a good one.

---

## The final blow

This is around the point where I desperately look at you and ask for your validation: Is your mind blown yet? If not, please pretend it is anyway so I don't get sad. 🥺

We'll finish with one last example. Remember how the derivative of $\sin x$ is $\cos x$ and the derivative of $\cos x$ is $-\sin x$?. About that...

```haskell
sineSeries = 0 : integrate cosineSeries               -- sin 0 == 0
cosineSeries = 1 : map negate (integrate sineSeries)  -- cos 0 == 1

take 10 sineSeries
-- outputs: [0.0,1.0,-0.0,-0.16666666666666666,0.0,8.333333333333333e-3,-0.0,-1.984126984126984e-4,0.0,2.7557319223985893e-6]
take 10 cosineSeries
-- outputs: [1.0,-0.0,-0.5,0.0,4.1666666666666664e-2,-0.0,-1.388888888888889e-3,0.0,2.48015873015873e-5,-0.0]
```

Check.

$\sin x =  x - \frac{x^3}{3} + \frac{x^5}{5} + \cdots$

$\cos x = 1 - \frac{x^2}{2} + \frac{x^4}{4} + \cdots$

Have a good day.

{: .figure}
> ![](https://i.kym-cdn.com/photos/images/original/002/128/164/13b.png){:width="70%"}
> Don't you wish Haskell uses actual fractions by default like Scheme does?