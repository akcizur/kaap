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
      <a className="post-link" href={`?post=${post.id}`} aria-label={`Read ${post.title}`}><article className={articleClassName} tabIndex={0}>
        <div className="compact-copy">
          <span className="post-category">{post.category}</span>
          <span className="compact-title">{post.title}</span>
        </div>
        <span className="compact-date post-date-text">{post.date}</span>
      </article></a>
    )
  }

  if (mode === 'magazine') {
    return (
      <a className="post-link" href={`?post=${post.id}`} aria-label={`Read ${post.title}`}><article
        className={`${articleClassName}${index === 0 ? ' is-featured' : ''}`}
        tabIndex={0}
      >
        <div className="post-kicker">{post.category} · <span className="post-kicker-date">{post.date}</span></div>
        <h4>{post.title}</h4>
        {index === 0 && <p>{post.excerpt}</p>}
      </article></a>
    )
  }

  if (mode === 'grid') {
    return (
      <a className="post-link" href={`?post=${post.id}`} aria-label={`Read ${post.title}`}><article className={articleClassName} tabIndex={0}>
        <div className="post-kicker">{post.category}</div>
        <h4>{post.title}</h4>
        <p>{post.excerpt}</p>
        <div className="post-date post-date-text">{post.date}</div>
      </article></a>
    )
  }

  return (
    <a className="post-link" href={`?post=${post.id}`} aria-label={`Read ${post.title}`}><article className={articleClassName} tabIndex={0}>
      <h4>{post.title}</h4>
      <p>{post.excerpt}</p>
      <div className="post-meta">
        <span>{post.category}</span>
        <span><span className="post-date-text">{post.date}</span> · {post.readTime}</span>
      </div>
    </article></a>
  )
}
