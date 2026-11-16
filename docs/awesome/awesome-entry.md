# awesome-deepseek-integration submission draft

Target file: `README.md`, section `Applications` (`<span id="applications">`).

Add these files to the awesome repository:

```text
docs/DSChat/README.md
docs/DSChat/assets/logo.png
```

Insert this row in the Applications table (alphabetical or near other chat clients is fine):

```html
<tr>
    <td><img src="docs/DSChat/assets/logo.png" alt="Icon" width="64" height="auto" /></td>
    <td><a href="docs/DSChat/README.md">DSChat</a></td>
    <td>DSChat is an open-source DeepSeek API chat client for Android and the web, built on DeepSeek's official open-source chat-demo framework. It supports conversation forking, pinned chats, message-level search, streaming chat, deep thinking, web search, attachments, Markdown/KaTeX/Mermaid, voice input, read-aloud, and BYOK. Built with React and Capacitor.</td>
</tr>
```

Before opening the PR:

- [ ] Publish `https://github.com/ADE150/deepseek-api-chat` with the MIT `LICENSE` and
      `NOTICE.md`.
- [ ] Publish a signed release APK and use that link in the project page.
- [ ] Copy `docs/awesome/DSChat/README.md` and `docs/awesome/DSChat/assets/logo.png`
      into a fork of `deepseek-ai/awesome-deepseek-integration`.
- [ ] Confirm the project is described as a community project built on DeepSeek's open
      framework, without implying official endorsement.
- [ ] Open a normal pull request; the awesome repository accepts community PRs.
