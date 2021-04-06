# coc-pydocstring

[doq](https://pypi.org/project/doq/) (python docstring generator) extension for [coc.nvim](https://github.com/neoclide/coc.nvim)

<img width="780" alt="coc-pydocstring-demo" src="https://user-images.githubusercontent.com/188642/113700321-aac1d500-9711-11eb-8564-bae852b93fa3.gif">

## Install

**CocInstall**:

> TODO

**vim-plug**:

```vim
Plug 'yaegassy/coc-pydocstring', {'do': 'yarn install --frozen-lockfile'}
```

## Note

Quickly generate docstrings for python.

## Configuration options

- `pydocstring.enable`: Enable coc-pydocstring extension, default: `true`
- `pydocstring.doqPath`: (OPTIONAL) The path to the doq tool (Absolute path), default: `""`
- `pydocstring.formatter`: Docstring formatter, valid options `["sphinx", "google", "numpy"]`, default: `"sphinx"`
- `pydocstring.ignoreException`: Ignore exception statements, default: `false`
- `pydocstring.ignoreYield`: Ignore yield statements, default: `false`
- `pydocstring.enableFileAction`: Enable file-level code action, default: `false`

## Code Actions

- `Add docstirng for "Line" by pydocstring`
- `Add docstirng for "Range" by pydocstring`
- `Add docstirng for "File" by pydocstring`
  - File-level code actions are disabled (false) by default.

## Commands

- `pydocstring.install`: Install doq
- `pydocstring.run`: Run doq for file

## Similar plugins

- [vim-pydocstring](https://github.com/heavenshell/vim-pydocstring)
  - This is a vim plugin by the author of doq.

## Thanks

- [py-doq](https://github.com/heavenshell/py-doq) | [doq](https://pypi.org/project/doq/)

## License

MIT

---

> This extension is built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
