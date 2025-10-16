---
title: "PSA: Design if-elses with priority"
date: 2025-10-15 18:00:00 -0400
---

_Public service announcement for 6.191 students struggling with lab 6 (and others)._

One thing consistently trips up students in lab 6 is the lack of understanding of logic. Actually, you might have already learned this before, but half of you will somehow forget about it in this lab. This post is a reminder.

Suppose you have a register `data`, input booleans `reset` and `enable` and input data `data_in`, and you want to write to a register only when `enable` is high, and you also want to zero out the register if `reset` is asserted. Here's one way you could write the code: 
```verilog
// GOOD
if (reset) begin
    data <= 0;
end else if (enable) begin
    data <= data_in;
end
```

This is _not_ the same as if you were to write:
```verilog
// WRONG
if (enable) begin
    data <= data_in;
end else if (reset) begin
    data <= 0;
end
```

In the first excerpt, if `reset` is asserted, then it doesn't matter what `enable` is; `data` will be zeored out. This is probably an acceptable behavior.

In the second excerpt, if `enable` is asserted, then an update always happens with no reset! This behavior _might_ make sense in some rare cases, but more likely than not, it's just a bug.

## Implicit conditions

Let's solidify this understanding with the idea of "implicit conditions." Every basic block in the code has a condition under which it will execute. Under an `else` block, the precise condition is the negation of its preceding `if` block.

Applying this concept to the first excerpt, you can think of it as having these three mutually exclusive branches:
- `reset`
- `!reset && enable`
- `!reset && !enable` (which does not update `data`)

You can think of the first branch as handling two possibilities at the same time: `reset && enable` and `reset && !enable`. So, in total, we have four possibilities, just like in a truth table.

The excerpt can then be re-written as:
```verilog
// correct but verbose
if (reset && enable) begin
  data <= 0;
end
if (reset && !enable) begin
  data <= 0;
end
if (!reset && enable) begin
  data <= data_in;
end
if (!reset && !enable) begin
  // do nothing
end
```
All four cases could be safely re-ordered, but this is unnecessarily verbose.

## Designing with priority

Design your if-else chains to reflect your priorities when making decisions.

Here's a good example of what **not** to do:
```verilog
// correct but unreadable
if (!reset && enable) begin
    data <= data_in;
end else if (reset) begin
    data <= 0;
end
```

**Exercise:** Convince yourself that it is equivalent to the first code excerpt using the idea of implicit conditions and some boolean properties. Or... just write out a truth table.

**Solution:** The three branches are
- `!reset && enable`
- `!(!reset && enable) && reset`
    - By De Morgan's law, we have `(reset || !enable) && reset`
    - By absorption, we have `reset`
- `!(!reset && enable) && !reset`
    - By De Morgan's law, we have `(reset || !enable) && !reset`
    - By distributivity, we have `reset && !reset || !enable && !reset`
    - Complement on the left branch gives us `False`, which is an identity for `||`, which means we simply ahve `!enable && !reset`
    - Or you can write this as `!reset && !enable`.
You can now see that the three branches' conditions agree with the previous analysis, but this is horrid. The first code excerpt was much better because it clearly showed that `reset` was prioritized.

**Exercise:** Convince yourself that this is not equivalent to the first code excerpt.
```verilog
if (!reset && enable) begin
    data <= data_in;
end else if (enable) begin
    data <= 0;
end
```

**Solution:** The second branch is essentially `reset && enable`. Therefore, the last branch is just `!enable` where we do not update `data` whether `reset` or `!reset`.

This might be a legit behavior in some circumstances, but it's hard to read. Can you find a way to write this in a more readable way?

**Solution**: The most important thing is whether the register is enabled or not. Then, we can decide whether to reset or not reset. This structure reflects our priority:
```verilog
if (enable) begin
    if (reset) begin
        data <= 0;
    else begin
        data <= data_in;
    end
end
```

In general, keep your conditions simple. Try not to combine `&&` and `||` with `else if` because that almost always means doing De Morgan's law in your head every time you read through the code.
