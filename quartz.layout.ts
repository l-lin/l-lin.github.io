import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      "Subscribe (RSS)": {link: "https://l-lin.github.io/index.xml", icon: "fa-solid fa-square-rss", iconcolor: "orange"},
      GitHub: {link: "https://github.com/l-lin", icon: "fa-brands fa-github", iconcolor: "black"},
      LinkedIn: {link: "https://www.linkedin.com/in/lin-louis/", icon: "fa-brands fa-linkedin", iconcolor: "#0A66C2"}
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs({ showCurrentPage: false }),
    Component.ArticleTitle(),
    Component.ContentMeta({ showReadingTime: false }),
    Component.TagList(),
  ],
  afterBody: [
    Component.RecentNotes({ limit: 5 }),
    Component.MobileOnly(Component.Explorer()),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs({ showCurrentPage: false }),
    Component.ArticleTitle(),
    Component.ContentMeta({ showReadingTime: false }),
  ],
  afterBody: [
    Component.RecentNotes({ limit: 5 }),
    Component.MobileOnly(Component.Explorer()),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
