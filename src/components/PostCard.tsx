import type { Post } from '../data/posts'
import type { ViewMode } from '../config/viewModes'

type PostCardProps = {
  post: Post
  mode: ViewMode
  index: number
  articleClassName: string
}

export function PostCard({ post, mode, index, articleClassName }: PostCardProps) {
  if (mode === 'compact') {
    return (
      <article className={articleClassName} tabIndex={0}>
        <div className="compact-copy">
          <span className="post-category">{post.category}</span>
          <span className="compact-title">{post.title}</span>
        </div>
        <span className="compact-date">{post.date}</span>
      </article>
    )
  }

  if (mode === 'magazine') {
    return (
      <article
        className={`${articleClassName}${index === 0 ? ' is-featured' : ''}`}
        tabIndex={0}
      >
        <div className="post-kicker">{post.category} · {post.date}</div>
        <h4>{post.title}</h4>
        {index === 0 && <p>{post.excerpt}</p>}
      </article>
    )
  }

  if (mode === 'grid') {
    return (
      <article className={articleClassName} tabIndex={0}>
        <div className="post-kicker">{post.category}</div>
        <h4>{post.title}</h4>
        <p>{post.excerpt}</p>
        <div className="post-date">{post.date}</div>
      </article>
    )
  }

  return (
    <article className={articleClassName} tabIndex={0}>
      <h4>{post.title}</h4>
      <p>{post.excerpt}</p>
      <div className="post-meta">
        <span>{post.category}</span>
        <span>{post.date} · {post.readTime}</span>
      </div>
    </article>
  )
}
