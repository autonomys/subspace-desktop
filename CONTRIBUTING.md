## How to Create an Issue (first iteration):
# ![Subspace](subspace-cover.jpg)

## Contributing to Subspace

Thank you for considering to help out with the source code! Subspace welcomes help in many forms including development, code review, documentation improvements, and outreach. We are grateful for even the smallest of improvements!

> [I don't want to contribute, I just have some questions?](#I-dont-want-to-contribute-I-just-have-some-questions)

We have a [Code of Conduct](./CODE_OF_CONDUCT.md), please follow it in all interactions with project maintainers and fellow users :)

## Issues

You want to write an issue if you have a
- feature request
- bug report
- technical question

### How to Create an Issue?

- Summarize the issue briefly in the issue title
- If it is a bug:
    - Explain, what is the expected behavior
    - Explain, what happened instead
    - Submit the log file
- If it is a feature request:
    - Clearly explain the feature that is being requested
    - Explain why do you think we need this feature / how would it enhance the application

**Where is my log file?**
Below are the `log` file locations (replace `alice` with your username)
- windows: `C:\Users\Alice\AppData\Roaming\com.subspace.desktop`
- macos: `/Users/Alice/Library/Logs/com.subspace.desktop`
- linux: `/home/alice/.config/com.subspace.desktop`


> Please use GitHub's search functionality to see if the question has already been asked, the feature has already been proposed or the bug has already been reported.

### Pull Requests

Subspace primarily uses GitHub Pull Requests to coordinate code changes. If you wish to propose a contribution, open a pull request and review the template, which explains how to document your proposal. Simply put:

1. fork the repository.
2. create or assign an existing issue/feature to yourself.
3. make your changes.
4. Make a pull request.

*Before working on a pull request please make sure that the work has not already been made, e.g. by another pull request solving the same thing.*

*For complex implementations you are advised to first discuss the feature implementation or bug fix using an issue.*


## Development

### Code style

Subspace is following the
[Substrate code style](https://github.com/paritytech/substrate/blob/master/docs/STYLE_GUIDE.md).

In addition, we incorporate several tools to improve code quality. These are integrated into our CI and are expected to pass before a PR is considered mergeable. They can also be run locally.

* [clippy](https://github.com/rust-lang/rust-clippy) - run with `cargo clippy --release --workspace`
* [rustfmt](https://github.com/rust-lang/rustfmt) - run with `cargo fmt -- --check`
* [lint](https://github.com/lint-dev/lint) - run with `yarn lint`
* and obviously: all the tests must pass (both in debug and release mode)


## I don't want to contribute, I just have some questions

For questions about Subspace Network or general technical related questions you are welcome to contact us by joining our [Discord server](https://discord.gg/qe9sVc2a).




