function tokenizeCommand(text) {
  const tokens = [];
  let current = '';
  let quote = null;
  let escaping = false;

  for (const char of text.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === '\\') {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaping) current += '\\';
  if (current) tokens.push(current);

  return tokens;
}

export class DeveloperConsole {
  constructor({
    root,
    output,
    input,
    prompt = '>',
    maxLines = 180,
    onOpen = null,
    onClose = null,
  }) {
    this.root = root;
    this.output = output;
    this.input = input;
    this.prompt = prompt;
    this.maxLines = maxLines;
    this.onOpen = onOpen;
    this.onClose = onClose;

    this.commands = new Map();
    this.history = [];
    this.historyIndex = 0;
    this.opened = false;
    this.pendingRequest = null;

    this.input?.addEventListener(
      'keydown',
      event => this.handleInputKey(event),
    );
  }

  get isOpen() {
    return this.opened;
  }

  register(name, {
    description = '',
    usage = name,
    execute,
  }) {
    if (
      !name ||
      typeof execute !== 'function'
    ) {
      throw new Error(
        'Console commands need a name and execute function.',
      );
    }

    this.commands.set(
      name.toLowerCase(),
      {
        name: name.toLowerCase(),
        description,
        usage,
        execute,
      },
    );

    return this;
  }

  open() {
    if (this.opened) {
      this.input?.focus();
      return;
    }

    this.opened = true;
    this.root?.classList.remove('hidden');
    this.onOpen?.();
    this.input?.focus();

    if (this.output?.children.length === 0) {
      this.print(
        'developer console ready. type "help" for commands.',
        'muted',
      );
    }
  }

  close() {
    if (!this.opened) return;

    this.cancelRequest();
    this.opened = false;
    this.root?.classList.add('hidden');
    this.input?.blur();
    this.onClose?.();
  }

  requestInput({
    message = 'input:',
    secret = false,
  } = {}) {
    if (this.pendingRequest) {
      throw new Error(
        'The console is already waiting for input.',
      );
    }

    this.print(message, 'muted');

    if (this.input) {
      this.input.value = '';
      this.input.type =
        secret ? 'password' : 'text';
      this.input.autocomplete = 'off';
      this.input.focus();
    }

    return new Promise(resolve => {
      this.pendingRequest = {
        resolve,
        secret,
      };
    });
  }

  requestSecret(message = 'password:') {
    return this.requestInput({
      message,
      secret: true,
    });
  }

  finishRequest(value) {
    const request =
      this.pendingRequest;

    if (!request) return false;

    this.pendingRequest = null;

    if (this.input) {
      this.input.type = 'text';
      this.input.value = '';
      this.input.focus();
    }

    request.resolve(value);
    return true;
  }

  cancelRequest() {
    if (!this.pendingRequest) return;

    const request =
      this.pendingRequest;

    this.pendingRequest = null;

    if (this.input) {
      this.input.type = 'text';
      this.input.value = '';
    }

    request.resolve(null);
  }

  toggle() {
    if (this.opened) this.close();
    else this.open();
  }

  clear() {
    if (this.output) {
      this.output.textContent = '';
    }
  }

  print(message, type = 'normal') {
    if (!this.output) return;

    const line =
      document.createElement('div');

    line.className =
      `console-line console-line-${type}`;

    line.textContent =
      String(message ?? '');

    this.output.appendChild(line);

    while (
      this.output.children.length >
      this.maxLines
    ) {
      this.output.firstElementChild?.remove();
    }

    this.output.scrollTop =
      this.output.scrollHeight;
  }

  printCommand(text) {
    this.print(
      `${this.prompt} ${text}`,
      'command',
    );
  }

  async execute(text) {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return;

    this.printCommand(trimmed);

    if (
      this.history[
        this.history.length - 1
      ] !== trimmed
    ) {
      this.history.push(trimmed);

      if (this.history.length > 80) {
        this.history.shift();
      }
    }

    this.historyIndex =
      this.history.length;

    const tokens =
      tokenizeCommand(trimmed);

    const commandName =
      tokens.shift()?.toLowerCase();

    const command =
      this.commands.get(commandName);

    if (!command) {
      this.print(
        `unknown command: ${commandName}. type "help".`,
        'error',
      );
      return;
    }

    try {
      const result =
        await command.execute({
          args: tokens,
          raw: trimmed,
          console: this,
        });

      if (result == null) return;

      if (Array.isArray(result)) {
        for (const line of result) {
          this.print(line);
        }
      } else {
        this.print(result);
      }
    } catch (error) {
      this.print(
        error?.message ??
        String(error),
        'error',
      );
    }
  }

  handleInputKey(event) {
    if (event.code === 'Backquote') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      if (this.pendingRequest) {
        this.cancelRequest();
        this.print('input cancelled.', 'muted');
        this.input?.focus();
      } else {
        this.close();
      }

      return;
    }

    if (event.code === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      if (this.pendingRequest) {
        const value =
          this.input?.value ?? '';

        this.finishRequest(value);
        return;
      }
      const value = this.input.value;
      this.input.value = '';
      this.execute(value);
      return;
    }

    if (
      this.pendingRequest &&
      (
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown'
      )
    ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.code === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();

      if (!this.history.length) return;

      this.historyIndex = Math.max(
        0,
        this.historyIndex - 1,
      );

      this.input.value =
        this.history[this.historyIndex] ?? '';

      this.input.setSelectionRange(
        this.input.value.length,
        this.input.value.length,
      );
      return;
    }

    if (event.code === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();

      if (!this.history.length) return;

      this.historyIndex = Math.min(
        this.history.length,
        this.historyIndex + 1,
      );

      this.input.value =
        this.historyIndex <
        this.history.length
          ? this.history[
              this.historyIndex
            ]
          : '';

      this.input.setSelectionRange(
        this.input.value.length,
        this.input.value.length,
      );
    }
  }

  listCommands() {
    return [...this.commands.values()]
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name),
      );
  }
}
