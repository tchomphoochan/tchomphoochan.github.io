---
title: "What the heck is going on with my Python versions?"
date: 2023-10-28 14:30:00 -0400
---

Many of you may have run into issues with juggling many Python versions on your computer. You might've had to install different versions of Python (newer or older), made Conda environments, and/or nuked your entire laptop, in order to run a program you found online, but you just couldn't get the correct thing to run.

This post dives into the core concepts behind shell and executables. It is quite long, but it will help you figure out what in the world is happening with your Python installations. This will be a useful knowledge to have in the long run, so invest five minutes to read through this.

## Core concept: PATH variable

Q: When you type `python3`, how do you know which `python3` executable is being run?

A: The shell searches through what we call a "PATH" variable, which is a list of folders the shell will look through when finding a program.

You can ask the shell where it is getting `python3` from by typing: `which python3` (For Windows, use `where python` instead.). My laptop outputs this:
```sh
$ which python3
/Library/Frameworks/Python.framework/Versions/3.10/bin/python3
```
This means, when I run `python3`, my shell is running the file at this location. This seems to be the one from the official installer.

To find out _all_ occurences of `python3` in the PATH folders, use `where python3`:
```sh
$ where python3
/Library/Frameworks/Python.framework/Versions/3.10/bin/python3
/usr/local/bin/python3
/usr/bin/python3
```

Fun fact: It turns out `/usr/local/bin/python3` and `
/Library/Frameworks/Python.framework/Versions/3.10/bin/python3` actually point to the same thing! Well, kinda. The former is a symbolic link to the latter, which is a symbolic link to many other links. If you keep following them, you'll find a single Python executable that's actually being run.

## Where does `pip3` install the libraries?

When you installed Python, the installer also tries to put PIP at the same location as the Python executable itself.
```sh
$ which pip3
/Library/Frameworks/Python.framework/Versions/3.10/bin/pip3
```
PIP is configured with a folder that is pre-negotiated with Python. That way, the Python executable knows where to look for packages.

You can check the negotiated location:
```sh
$ pip3 -V
pip 23.2.1 from /Library/Frameworks/Python.framework/Versions/3.10/lib/python3.10/site-packages/pip (python 3.10)
```
This means packages are installed at `/Library/Frameworks/Python.framework/Versions/3.10/lib/python3.10/site-packages`. Indeed you can check this folder and find a ton of packages in there!

## What does Conda do?

What Conda does, essentially, is make a folder with all the files you need for each environment. **When you activate a Conda environment, it prepends the correct folder of executables to your PATH.** (When you deactivate, it removes it.) The executables may include things like `python` and `pip` configured to work within this folder. That way, when you run Python, you actually get the intended version. When you install a package, it does not go into your system's default Python installation!

For example, on my machine, I have an environment named `fpga` (for my class 6.2050). I created it with `conda create -n fpga` and after activating it, I did `conda install python=3.11` to ensure I have the correct Python version, and also `pip install`'d a few things as well.

I can activate the environment and try to figure out where the environment folder is and what is in it!
```sh
$ conda activate fpga

(fpga) $ which python3
/Users/tcpc/opt/anaconda3/envs/fpga/bin/python3

(fpga) $ cd /Users/tcpc/opt/anaconda3/envs/fpga/
(fpga) $ ls
bin
conda-meta
include
lib
man
share
ssl

(fpga) $ cd bin  
(fpga) $ ls
2to3
2to3-3.11
bunzip2
bzcat
bzcmp
[... truncated ...]
```

## Piecing it all together: Solving a crisis

On VS Code, you can run Python directly from the terminal, or you can click "Run" on a file and VS Code will automatically figure that out for you. Well, you hope. You get a pretty perplexing behavior: your script tries to import a package that you just installed, but you get a `ModuleNotFoundError` error when clicking Run.

Of course, using what we know so far, we can explain why this happens! One explanation might be: your terminal has a Conda environment activated (which is where you installed your package), but VS Code's Run button tries to run the default Python which does not have the package. You can fix this by telling VS Code to use the correct version. (Open the command palette with Cmd+Shift+P, run the one that says "Python: Select Interpreter".)

Let's try another issue: You installed required packages for the program a while ago, but now you have your Conda environment activated and somehow you can't import those packages! Possible explanation: Maybe you forgot to activate your Conda environment before installing the packages, but then you activate your environment and try to run a Python script that imports those packages. It won't find the things you want in the package site, because now you are using your Conda environment's Python!

Another very weird case that happened to me: VS Code opens the terminal for me and automatically activates my `fpga` environment when I try to open the course folder, but when I try to run a Python script for the class, I get a `ModuleNotFoundError`.

Well, I investigated a little bit by running `which python3`. It gave me `/Library/Frameworks/Python.framework/Versions/3.10/bin/python3` (the default installation) which is definitely not what I expected!

It turns out when VS Code automatically activates the environment for me, the PATH didn't get updated properly. I can solve this by deactivating and then activating again. Now `which python3` gives me `/Users/tcpc/opt/anaconda3/envs/fpga/bin/python3` as expected. Now I have the packages I expected.

Hopefully, armed with all this knowledge, you will be able to perform some basic troubleshooting steps to get through this package/environment management hell. Good luck!
