import { createCn } from "cn/config"

/*
  Tailwind class-merge configured for this project's custom typography scale.

  The design system defines font sizes as `--text-*` theme keys (`text-body`,
  `text-h1`, `text-price-l`, ...). The merger does not know these custom keys, so
  by default it lumps every `text-*` utility into one group and keeps only the
  last one. That silently strips a COLOR utility when a size class follows it in
  a merge (e.g. `primary` buttons combine `text-primary-foreground` with the
  size's `text-body`, and the colour was being dropped, leaving inherited dark
  text on the cobalt fill).

  Registering the size keys under the `font-size` group keeps font-size and
  text-colour in separate conflict groups, so both survive.
*/
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display-xl",
            "display-l",
            "h1",
            "h2",
            "h3",
            "h4",
            "body-l",
            "body",
            "body-s",
            "label",
            "price-xl",
            "price-l",
          ],
        },
      ],
    },
  },
})
