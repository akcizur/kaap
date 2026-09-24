import { ArrowLeft } from 'lucide-react'
import type { Post } from '../data/posts'

type PostPageProps = {
  post: Post
}

export function PostPage({ post }: PostPageProps) {
  return (
    <main className="main-content post-page">
      <a className="back-link" href="./" aria-label="Back to posts">
        <ArrowLeft className="ui-icon" size={16} strokeWidth={2} aria-hidden="true" />
        <span>Back to posts</span>
      </a>

      <article className="post-detail">
        <div className="post-detail-kicker">
          <span>{post.category}</span>
          <span>·</span>
          <span className="post-date-text">{post.date}</span>
        </div>

        <h1 className="post-detail-title">{post.title}</h1>

        <div className="post-detail-meta">
          <span className="post-detail-readtime">{post.readTime}</span>
        </div>

        <div className="post-detail-rule" />

        <p className="post-detail-excerpt">{post.excerpt}</p>
      </article>
    </main>
  )
}
