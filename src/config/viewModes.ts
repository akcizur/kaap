export type ViewMode = 'list' | 'grid' | 'magazine' | 'compact'

export const VIEW_MODES: Record<ViewMode, {
  icon: string
  label: string
  containerClass: string
  articleClassName: string
}> = {
  list: {
    icon: '≡',
    label: 'List',
    containerClass: 'posts posts-list',
    articleClassName: 'post post-list',
  },
  grid: {
    icon: '⊞',
    label: 'Grid',
    containerClass: 'posts posts-grid',
    articleClassName: 'post post-grid',
  },
  magazine: {
    icon: '▦',
    label: 'Magazine',
    containerClass: 'posts posts-magazine',
    articleClassName: 'post post-magazine',
  },
  compact: {
    icon: '☰',
    label: 'Compact',
    containerClass: 'posts posts-compact',
    articleClassName: 'post post-compact',
  },
}
