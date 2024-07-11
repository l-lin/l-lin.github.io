import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  // const title = fileData.frontmatter?.title
  // if (title) {
  //   return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  // } else {
  //   return null
  // }
  // NOTE: No need to display the title, I always put a h1 on all notes.
  return null
}

ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
