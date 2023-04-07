Require Import List Lia Arith.
Import ListNotations.

Fixpoint prefix_sum (l : list nat) :=
  match l with
  | nil => nil
  | cons d l' => cons d (map (fun x => x+d) (prefix_sum l'))
  end.

Goal prefix_sum [3; 2; 7; 6; 8] = [3; 5; 12; 18; 26].
Proof. reflexivity. Qed.

Fixpoint prefix_sum_acc' (l : list nat) (a : nat) :=
  match l with
  | nil => nil
  | cons d l' => cons (a+d) (prefix_sum_acc' l' (a+d))
  end.
Definition prefix_sum_acc l := prefix_sum_acc' l 0.

Goal prefix_sum_acc [3; 2; 7; 6; 8] = [3; 5; 12; 18; 26].
Proof. reflexivity. Qed.

Lemma prefix_sum_equiv':
  forall l d, (map (fun x => d+x) (prefix_sum l)) = prefix_sum_acc' l d.
Proof.
  induction l; intros; simpl; try reflexivity.
  f_equal.
  rewrite map_map.
  rewrite map_ext_in with (g := (fun x => (d + a) + x)).
  apply IHl.
  intros.
  rewrite Nat.add_comm with (n := a0) (m := a).
  rewrite Nat.add_assoc.
  reflexivity.
Qed.

Lemma identity_map:
  forall {A:Type} (l:list A), map (fun x => x) l = l.
Proof.
  induction l; try reflexivity.
  simpl.
  f_equal.
  assumption.
Qed.

Theorem prefix_sum_equiv:
  forall l, prefix_sum l = prefix_sum_acc l.
Proof.
  intros.
  unfold prefix_sum_acc.
  rewrite <- identity_map at 1.
  apply prefix_sum_equiv' with (d := 0).
Qed.