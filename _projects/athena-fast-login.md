---
title: "How to log into Athena Dialup without a password"
date: 2023-10-28 14:30:00 -0400
---

## Context

Normally, when you want to SSH into Athena Dialup from your laptop, you are prompted to enter your password then complete Duo two-factor authentication. This can be quite annoying, especially if you have to do it frequently, e.g. while you are figuring what files to [SCP][scp].

This post describes how to make Athena "remember" you, so you don't have to type in passwords.

Note that I have only done this on Macbook. Something might be different if you are on Windows or Linux.

[scp]: https://www.man7.org/linux/man-pages/man1/scp.1.html


---

Usually, you would generate a public key locally, then put your public key in `~/.ssh/authorized_keys` on Athena. This doesn't work because Athena doesn't care.

Athena looks for SSH keys at `~/Public/.ssh/athena_dialup_authorized_kys`. If you put your key there, you _can_ log into Athena but you won't be able to access any files because of how IS&T handles file permissions. (They need renewable Kerberos tickets or something.)

## How to do it

First, you need to make sure you have a program to manage Kerberos tickets. The program is a command line utility. It comes with [commands like `kinit`, `klist`, `kpasswd`][doc].

I don't remember where I got the program from, but I have a feeling it comes pre-installed with newer versions of Mac OS. (Fun fact: Kerberos isn't an MIT-only thing!) Type `which kinit` on your terminal to check. If you need to download, [official Kerberos distribution page][dist] seems reasonable.

Then, you need to download some extra plugins from IS&T to make it work with MIT Athena Dialup. [Download from here.][plugin]

The part that ties it all together: Download a program that automatically manages and renews Kerberos tickets for you.
For Macbook users, [Kerberos Ticket Autorenewal on App Store][autorenew] works really well.

[doc]: https://web.mit.edu/kerberos/krb5-devel/doc/user/index.html
[dist]: https://web.mit.edu/kerberos/dist/
[plugin]: https://ist.mit.edu/software-hardware?type=All&platform=All&users=All&field_a_k_a_value=Kerberos&recommended_only=All
[autorenew]: https://apps.apple.com/us/app/kerberos-ticket-autorenewal/id1246781916?mt=12

Finally, make sure your SSH config file (`~/.ssh/config`) makes use of the Kerberos tickets. My config looks like this:
```
Host athena
  User tcpc
  HostName athena.dialup.mit.edu
  GSSAPIAuthentication yes  # 
  GSSAPIDelegateCredentials yes
```
Then I can just type `ssh athena` whenever I want to log in.

## Two-factor authentication

There is no way to bypass the two factor authentication.

The fastest and safest way I have found so far: [Request a Yubikey hardware token from IS&T][request]. You can claim that you are using it for [6.1600][6.1600] or [6.5660][6.5660]. Once you get the token, follow instructions to register the token with Duo. From then on, you can just tap the key whenever you need the passcode. The hardware will automatically type in the key for you.[^notwebauthn]

This not only works in the terminal, but also on the website as well. Either choose the "Token" device, or click "Enter the Passcode".

![](/assets/img/touchstone-login.png)

Do yourself a favor and get a Yubikey. It's pretty convenient. Many modern websites support [WebAuthn][webauthn], so you can use this to fast-track through many two-factor authentication systems.

[request]: https://ist.mit.edu/duo/token-request
[6.1600]: https://61600.csail.mit.edu/
[6.5660]: https://css.csail.mit.edu/6.5660

[^notwebauthn]: Note, unfortunately this is not [WebAuthn][webauthn].

[webauthn]: https://webauthn.guide/