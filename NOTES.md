# Notes

Login:

```sh
vsce login my-publisher-name
```

Release command:

```sh
vsce publish x -m "Release \`vx\`"
```

Custom version without publish:

```sh
npm version x -m "Release \`vx\`"
```

Push local Git tags

```sh
git push --follow-tags
```

Remove local Git tag

```sh
git tag -d v0.0.1
```
