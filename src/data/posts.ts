export type Post = {
  id: number
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
}

export const posts: Post[] = [
  {
    id: 1,
    title: 'The Case for Writing Things Down Slowly',
    excerpt: 'Note-taking apps have made capturing thoughts effortless. But effortless capture might be making us worse thinkers, not better ones.',
    category: 'Craft',
    date: 'Sep 24, 2026',
    readTime: '8 min',
  },
  {
    id: 2,
    title: 'On Building an Audience You Actually Like',
    excerpt: "Growth hacking your readership sounds appealing until you realise you've attracted the wrong people. Here's how to be selective from day one.",
    category: 'Strategy',
    date: 'Sep 18, 2026',
    readTime: '6 min',
  },
  {
    id: 3,
    title: 'Why Every Blog Post Needs a Villain',
    excerpt: 'The best essays create tension. They identify something worth resisting — an assumption, a convention, a lazy consensus — and push back against it.',
    category: 'Writing',
    date: 'Sep 11, 2026',
    readTime: '5 min',
  },
  {
    id: 4,
    title: 'The Underrated Power of the Boring Niche',
    excerpt: 'Concrete expertise in an unexciting subject beats vague thought leadership in a popular one. Specificity is your edge.',
    category: 'Ideas',
    date: 'Sep 4, 2026',
    readTime: '7 min',
  },
  {
    id: 5,
    title: 'How to Edit Yourself Without Losing Your Voice',
    excerpt: 'Heavy editing strips away roughness. But sometimes roughness is exactly what makes a post feel alive. Learning the difference is the whole game.',
    category: 'Craft',
    date: 'Aug 28, 2026',
    readTime: '9 min',
  },
  {
    id: 6,
    title: 'A Simple System for Never Running Out of Ideas',
    excerpt: "Writer's block is almost always an input problem, not an output problem. Build the right reading and noting habits and ideas start arriving uninvited.",
    category: 'Process',
    date: 'Aug 21, 2026',
    readTime: '6 min',
  },
]
