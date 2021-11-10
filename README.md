# coc-pydocstring

[doq](https://pypi.org/project/doq/) (python docstring generator) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

<img width="780" alt="coc-pydocstring-demo" src="https://user-images.githubusercontent.com/188642/113700321-aac1d500-9711-11eb-8564-bae852b93fa3.gif">

## Install

**CocInstall**:

```vim
:CocInstall coc-pydocstring
```

**vim-plug**:

```vim
Plug 'yaegassy/coc-pydocstring', {'do': 'yarn install --frozen-lockfile'}
```

## Feature

Quickly generate docstrings for python.

- Code Action
- Command
- Built-in installer

## Configuration options

- `pydocstring.enable`: Enable coc-pydocstring extension, default: `true`
- `pydocstring.doqPath`: The path to the doq tool (Absolute path), default: `""`
- `pydocstring.builtin.pythonPath`: Python 3.x path (Absolute path) to be used for built-in install, default: `""`
- `pydocstring.enableInstallPrompt`: Prompt the user before install, default: `true`
- `pydocstring.formatter`: Docstring formatter (--formatter), valid options `["sphinx", "google", "numpy"]`, default: `"sphinx"`
- `pydocstring.templatePath`: Path to template directory (--template_path), default: `""`
- `pydocstring.ignoreException`: Ignore exception statements (--ignore_exception), default: `false`
- `pydocstring.ignoreYield`: Ignore yield statements (--ignore_yield), default: `false`
- `pydocstring.ignoreInit`: Ignore generate docstring to __init__ method (--ignore_init). This option only available at `:CocCommand pydocstring.runFile`, default: `false`
- `pydocstring.enableFileAction`: Enable file-level code action, default: `false`

## Code Actions

**Example key mapping (Code Action related)**:

```vim
nmap <silent> ga <Plug>(coc-codeaction-line)
xmap <silent> ga <Plug>(coc-codeaction-selected)
nmap <silent> gA <Plug>(coc-codeaction)
```

**Usage**:

In a "line" or "selection" containing `def`, `async def`, or `class`, enter the mapped key (e.g. `ga`) and display a list of code actions that can be performed.

- `Add docstring for "Line or Selected" by pydocstring`
- `Add docstring for "File" by pydocstring`
  - File-level code actions are disabled (`false`) by default.
  - If you want to use it, set `pydocstring.enableFileAction` to `true` in "coc-settings.json".

## Commands

- `pydocstring.runFile`: Run doq for file
- `pydocstring.install`: Install doq
  - It will be installed in this path:
    - Mac/Linux: `~/.config/coc/extensions/coc-pydocstring-data/doq/venv/bin/doq`
    - Windows: `~/AppData/Local/coc/extensions/coc-pydocstring-data/doq/venv/Scripts/doq.exe`

## Similar plugins

- [heavenshell/vim-pydocstring](https://github.com/heavenshell/vim-pydocstring)
  - This is a vim plugin by the author of doq.

## Thanks

- [heavenshell/py-doq](https://github.com/heavenshell/py-doq) | [doq](https://pypi.org/project/doq/)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
